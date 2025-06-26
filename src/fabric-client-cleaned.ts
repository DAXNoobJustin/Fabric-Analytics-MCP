// Configuration and types
export interface FabricConfig {
  apiBaseUrl: string;
  version: string;
  userAgent: string;
  timeout: number;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface JobExecutionResult {
  id: string;
  status: string;
  createdDateTime: string;
  completedDateTime?: string;
  error?: string;
}

// Default configuration
export const DEFAULT_CONFIG: FabricConfig = {
  apiBaseUrl: "https://api.fabric.microsoft.com/v1",
  version: "1.0.0",
  userAgent: "Fabric-DAX-Optimizer-MCP-Server/1.0.0",
  timeout: 30000
};

/**
 * API Client for Microsoft Fabric DAX optimization operations.
 * Provides methods for CRUD operations on Fabric items and semantic model interactions.
 */
export class FabricApiClient {
  constructor(
    private bearerToken: string,
    private workspaceId: string,
    private config: FabricConfig = DEFAULT_CONFIG
  ) {}

  /**
   * Make an HTTP request to the Fabric API.
   * @param endpoint - API endpoint (relative to workspace)
   * @param options - Request options
   * @returns Promise resolving to API response
   */
  async makeRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      queryParams?: Record<string, any>;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, queryParams } = options;
    const url = new URL(`${this.config.apiBaseUrl}/workspaces/${this.workspaceId}/${endpoint}`);

    if (queryParams) {
      Object.keys(queryParams).forEach(key => url.searchParams.append(key, String(queryParams[key])));
    }

    const requestHeaders: Record<string, string> = {
      "Authorization": `Bearer ${this.bearerToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": this.config.userAgent,
      ...headers
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url.toString(), {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          status: 'error',
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const data = await response.json();
      return {
        status: 'success',
        data
      };
    } catch (error) {
      return {
        status: 'error',
        error: `Request failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * List items in the workspace.
   * @param itemType - Optional filter by item type
   * @returns Promise resolving to list of items
   */
  async listItems(itemType?: string): Promise<ApiResponse> {
    const endpoint = itemType ? `items?type=${itemType}` : "items";
    return this.makeRequest(endpoint);
  }

  /**
   * Create a new item in the workspace.
   * @param itemType - Type of item to create
   * @param displayName - Display name for the item
   * @param description - Optional description
   * @returns Promise resolving to created item
   */
  async createItem(itemType: string, displayName: string, description?: string): Promise<ApiResponse> {
    const body = {
      displayName,
      type: itemType,
      ...(description && { description })
    };
    return this.makeRequest("items", { method: "POST", body });
  }

  /**
   * Get details of a specific item.
   * @param itemId - ID of the item to retrieve
   * @returns Promise resolving to item details
   */
  async getItem(itemId: string): Promise<ApiResponse> {
    return this.makeRequest(`items/${itemId}`);
  }

  /**
   * Update an existing item.
   * @param itemId - ID of the item to update
   * @param updates - Updates to apply
   * @returns Promise resolving to updated item
   */
  async updateItem(itemId: string, updates: { displayName?: string; description?: string }): Promise<ApiResponse> {
    return this.makeRequest(`items/${itemId}`, { method: "PATCH", body: updates });
  }

  /**
   * Delete an item from the workspace.
   * @param itemId - ID of the item to delete
   * @returns Promise resolving to deletion confirmation
   */
  async deleteItem(itemId: string): Promise<ApiResponse> {
    return this.makeRequest(`items/${itemId}`, { method: "DELETE" });
  }

  /**
   * Execute a notebook with optional parameters.
   * @param notebookId - ID of the notebook to execute
   * @param parameters - Optional parameters to pass to the notebook
   * @returns Promise resolving to job execution result
   */
  async executeNotebook(notebookId: string, parameters?: Record<string, any>): Promise<ApiResponse<JobExecutionResult>> {
    const body = parameters ? { parameters } : {};
    return this.makeRequest(`items/${notebookId}/jobs/instances`, { method: "POST", body });
  }

  /**
   * Get the status of a job.
   * @param jobId - ID of the job to check
   * @returns Promise resolving to job status
   */
  async getJobStatus(jobId: string): Promise<ApiResponse<JobExecutionResult>> {
    return this.makeRequest(`items/jobs/instances/${jobId}`);
  }
}
