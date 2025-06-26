#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FabricApiClient, ApiResponse, JobExecutionResult } from './fabric-client-cleaned.js';
import { MicrosoftAuthClient, AuthMethod, AuthResult } from './auth-client.js';

// Enhanced Authentication Configuration
interface AuthConfig {
  method: AuthMethod;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  defaultWorkspaceId?: string;
}

/**
 * Load authentication configuration from environment variables
 */
function loadAuthConfig(): AuthConfig {
  const method = (process.env.FABRIC_AUTH_METHOD as AuthMethod) || AuthMethod.BEARER_TOKEN;
  
  return {
    method,
    clientId: process.env.FABRIC_CLIENT_ID,
    clientSecret: process.env.FABRIC_CLIENT_SECRET,
    tenantId: process.env.FABRIC_TENANT_ID,
    defaultWorkspaceId: process.env.FABRIC_DEFAULT_WORKSPACE_ID
  };
}

// Global auth configuration
const authConfig = loadAuthConfig();
let cachedAuthResult: AuthResult | null = null;
let authClient: MicrosoftAuthClient | null = null;

/**
 * Initialize authentication client if needed
 */
function initializeAuthClient(): void {
  if (!authClient && authConfig.clientId && authConfig.method !== AuthMethod.BEARER_TOKEN) {
    authClient = new MicrosoftAuthClient({
      clientId: authConfig.clientId,
      clientSecret: authConfig.clientSecret,
      authority: authConfig.tenantId ? `https://login.microsoftonline.com/${authConfig.tenantId}` : undefined
    });
  }
}

/**
 * Get or refresh authentication token
 */
async function getAuthToken(): Promise<string | null> {
  // If using bearer token method or no auth configured, return null (use simulation)
  if (authConfig.method === AuthMethod.BEARER_TOKEN || !authConfig.clientId) {
    return null;
  }

  // Check if we have a valid cached token
  if (cachedAuthResult && cachedAuthResult.expiresOn > new Date()) {
    return cachedAuthResult.accessToken;
  }

  // Initialize auth client if needed
  initializeAuthClient();
  if (!authClient) {
    console.error("Authentication client not initialized");
    return null;
  }

  try {
    switch (authConfig.method) {
      case AuthMethod.SERVICE_PRINCIPAL:
        if (!authConfig.clientSecret || !authConfig.tenantId) {
          throw new Error("Service Principal requires CLIENT_SECRET and TENANT_ID");
        }
        cachedAuthResult = await authClient.authenticateWithServicePrincipal(
          authConfig.clientId!,
          authConfig.clientSecret,
          authConfig.tenantId
        );
        break;

      case AuthMethod.DEVICE_CODE:
        cachedAuthResult = await authClient.authenticateWithDeviceCode(
          authConfig.clientId!,
          authConfig.tenantId
        );
        break;

      case AuthMethod.INTERACTIVE:
        cachedAuthResult = await authClient.authenticateInteractively(
          authConfig.clientId!,
          authConfig.tenantId
        );
        break;

      default:
        throw new Error(`Unsupported authentication method: ${authConfig.method}`);
    }

    return cachedAuthResult.accessToken;
  } catch (error) {
    console.error("Authentication failed:", error);
    return null;
  }
}

// Initialize MCP Server
const server = new McpServer(
  {
    name: "fabric-dax-optimizer",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Zod schemas for input validation
const BaseWorkspaceSchema = z.object({
  bearerToken: z.string().optional().describe("Microsoft Fabric bearer token (optional - uses environment auth if not provided)"),
  workspaceId: z.string().min(1).describe("Microsoft Fabric workspace ID")
});

const ListItemsSchema = BaseWorkspaceSchema.extend({
  itemType: z.enum(["All", "Lakehouse", "Notebook", "SemanticModel", "Dataset", "Report", "Dashboard", "Dataflow", "Datamart", "MLModel", "MLExperiment", "KQLDatabase", "KQLQueryset", "Eventhouse", "Eventstream", "DataPipeline", "SparkJobDefinition", "Warehouse", "MirroredDatabase", "MirroredWarehouse", "SQLEndpoint", "PaginatedReport"])
    .optional()
    .describe("Filter by item type (optional)")
});

const CreateItemSchema = BaseWorkspaceSchema.extend({
  itemType: z.enum(["SemanticModel", "Dataset", "Report", "Dashboard", "Notebook", "Lakehouse"]).describe("Type of item to create"),
  displayName: z.string().min(1).describe("Display name for the new item"),
  description: z.string().optional().describe("Optional description for the item")
});

const GetItemSchema = BaseWorkspaceSchema.extend({
  itemId: z.string().min(1).describe("ID of the item to retrieve")
});

const UpdateItemSchema = BaseWorkspaceSchema.extend({
  itemId: z.string().min(1).describe("ID of the item to update"),
  displayName: z.string().optional().describe("New display name (optional)"),
  description: z.string().optional().describe("New description (optional)")
});

const DeleteItemSchema = BaseWorkspaceSchema.extend({
  itemId: z.string().min(1).describe("ID of the item to delete")
});

const QueryDatasetSchema = BaseWorkspaceSchema.extend({
  datasetName: z.string().min(1).describe("Name of the dataset to query"),
  query: z.string().min(1).describe("SQL or KQL query to execute")
});

const ExecuteNotebookSchema = BaseWorkspaceSchema.extend({
  notebookId: z.string().min(1).describe("ID of the notebook to execute"),
  parameters: z.record(z.any()).optional().describe("Optional parameters to pass to the notebook")
});

// Authentication status tool
server.tool(
  "get-auth-status",
  "Get current authentication status and configuration",
  z.object({}).shape,
  async () => {
    try {
      const token = await getAuthToken();
      const hasValidToken = token !== null;
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            authMethod: authConfig.method,
            hasValidToken,
            clientId: authConfig.clientId ? `${authConfig.clientId.substring(0, 8)}...` : "Not configured",
            tenantId: authConfig.tenantId ? `${authConfig.tenantId.substring(0, 8)}...` : "Not configured",
            defaultWorkspace: authConfig.defaultWorkspaceId || "Not configured",
            tokenExpiry: cachedAuthResult?.expiresOn?.toISOString() || "Not available"
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error checking authentication status: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

/**
 * Generic API call executor with authentication and error handling
 */
async function executeApiCall<T>(
  bearerToken: string | undefined,
  workspaceId: string,
  operation: string,
  apiCall: (client: FabricApiClient) => Promise<ApiResponse<T>>,
  simulationParams?: any
): Promise<ApiResponse<T>> {
  let tokenToUse = bearerToken;

  // If no bearer token provided, try to get one from environment auth
  if (!tokenToUse || tokenToUse === "test-token" || tokenToUse === "simulation") {
    const envToken = await getAuthToken();
    if (envToken) {
      tokenToUse = envToken;
    }
  }

  // Use default workspace if none provided and configured
  const workspaceToUse = workspaceId || authConfig.defaultWorkspaceId || workspaceId;

  if (tokenToUse && tokenToUse !== "test-token" && tokenToUse !== "simulation") {
    try {
      const client = new FabricApiClient(tokenToUse, workspaceToUse);
      return await apiCall(client);
    } catch (error) {
      return {
        status: 'error',
        error: `API call failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  } else {
    // Return a simulation response for development/testing
    return {
      status: 'success',
      data: { message: `Simulation: ${operation} completed successfully`, params: simulationParams } as T
    };
  }
}

// Basic CRUD Operations for Fabric Items
server.tool(
  "list-fabric-items",
  "List items in a Microsoft Fabric workspace",
  ListItemsSchema.shape,
  async ({ bearerToken, workspaceId, itemType }) => {
    const result = await executeApiCall(
      bearerToken,
      workspaceId,
      "list-items",
      (client) => client.listItems(itemType && itemType !== "All" ? itemType : undefined),
      { itemType }
    );

    if (result.status === 'error') {
      return {
        content: [{ type: "text", text: `Error listing items: ${result.error}` }]
      };
    }

    const items = result.data;
    if (!items || (Array.isArray(items) && items.length === 0)) {
      return {
        content: [{ type: "text", text: "No items found in the workspace." }]
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }]
    };
  }
);

server.tool(
  "get-fabric-item",
  "Get detailed information about a specific Microsoft Fabric item",
  GetItemSchema.shape,
  async ({ bearerToken, workspaceId, itemId }) => {
    const result = await executeApiCall(
      bearerToken,
      workspaceId,
      "get-item",
      (client) => client.getItem(itemId),
      { itemId }
    );

    if (result.status === 'error') {
      return {
        content: [{ type: "text", text: `Error getting item: ${result.error}` }]
      };
    }

    const item = result.data;
    if (!item) {
      return {
        content: [{ type: "text", text: "Item not found." }]
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(item, null, 2) }]
    };
  }
);

server.tool(
  "query-fabric-dataset",
  "Execute SQL or KQL queries against Microsoft Fabric datasets",
  QueryDatasetSchema.shape,
  async ({ bearerToken, workspaceId, datasetName, query }) => {
    // This is a placeholder - will be implemented with DAX execution in future steps
    return {
      content: [{ 
        type: "text", 
        text: `Query execution placeholder: Dataset: ${datasetName}, Query: ${query}\nThis will be implemented with DAX query execution and optimization features.` 
      }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Microsoft Fabric DAX Optimizer MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
