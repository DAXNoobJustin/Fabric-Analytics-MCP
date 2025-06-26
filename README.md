# Microsoft Fabric DAX Optimizer MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

A specialized Model Context Protocol (MCP) server focused on DAX optimization for Microsoft Fabric semantic models. This server enables AI assistants like Claude to analyze, optimize, and improve DAX queries through standardized MCP protocols, bringing intelligent DAX optimization directly to your AI conversations.

## 📋 **Table of Contents**

- [🌟 Key Features](#-key-features)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Tools & Capabilities](#️-tools--capabilities)
- [🧪 Development & Testing](#-development--testing)
- [💬 Example Queries](#-example-queries)
- [🔐 Authentication](#-authentication)
- [🏗️ Architecture](#️-architecture)
- [⚙️ Configuration](#️-configuration)
- [🤝 Contributing](#-contributing)
- [🔒 Security](#-security)
- [📝 License](#-license)
- [📞 Support](#-support)

## 🌟 **Key Features**

- **🧠 DAX Query Optimization** - Analyze and optimize DAX queries for better performance
- **📊 Semantic Model Analysis** - Deep analysis of semantic model structure and relationships
- **� Performance Diagnostics** - Identify bottlenecks and optimization opportunities
- **🤖 Claude Desktop Ready** - Plug-and-play integration with Claude Desktop
- **🔐 Enterprise Authentication** - Multiple auth methods (Bearer, Service Principal, Device Code, Interactive)
- **🛡️ MSAL Integration** - Microsoft Authentication Library for secure enterprise access
- **📈 Query Insights** - Generate comprehensive DAX performance insights
- **🔄 Token Management** - Automatic token validation and expiration handling

## 🛠️ **Tools & Capabilities**

### 🔍 **Basic Fabric Operations**
- **Tool**: `list-fabric-items`
- **Description**: List items in a Microsoft Fabric workspace (focus on semantic models)
- **Parameters**:
  - `bearerToken`: Microsoft Fabric bearer token
  - `workspaceId`: Microsoft Fabric workspace ID
  - `itemType`: Filter by item type (optional, defaults to semantic models)

- **Tool**: `get-fabric-item`
- **Description**: Get detailed information about a specific Microsoft Fabric item
- **Parameters**:
  - `bearerToken`: Microsoft Fabric bearer token
  - `workspaceId`: Microsoft Fabric workspace ID
  - `itemId`: ID of the item to retrieve

- **Tool**: `get-auth-status`
- **Description**: Check current authentication status and configuration
- **Parameters**: None

### � **DAX Optimization Tools** (Coming Soon)
*The following tools will be implemented in future releases:*

- **DAX Query Analysis** - Analyze DAX queries for performance bottlenecks
- **Query Optimization** - Suggest optimized versions of DAX queries
- **Semantic Model Insights** - Analyze model structure and relationships
- **Performance Tracing** - Execute queries with performance traces enabled
- **Best Practices Validation** - Check DAX queries against best practices

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- Microsoft Fabric workspace access
- Claude Desktop (for AI integration)

### **Installation & Setup**

1. **Clone and Install**
   ```bash
   git clone https://github.com/santhoshravindran7/Fabric-Analytics-MCP.git
   cd Fabric-Analytics-MCP
   npm install
   npm run build
   ```

2. **Configure Claude Desktop**
   
   Add to your Claude Desktop config:
   
   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   
   ```json
   {
     "mcpServers": {
       "fabric-dax-optimizer": {
         "command": "node",
         "args": ["/ABSOLUTE/PATH/TO/PROJECT/build/index.js"]
       }
     }
   }
   ```

3. **Start Using**
   
   Restart Claude Desktop and try these queries:
   - *"List all semantic models in my Fabric workspace [your-workspace-id]"*
   - *"Check my authentication status"*
   - *"Show me details of semantic model [model-id]"*

## 🧪 **Development & Testing**

### **Running the Server**
```bash
npm start        # Production mode
npm run dev      # Development mode with auto-reload
```

### **Claude Desktop Integration**

Add this configuration to your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fabric-dax-optimizer": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/PROJECT/build/index.js"]
    }
  }
}
```

**🎉 You're ready!** Restart Claude Desktop and start asking questions about your Microsoft Fabric semantic models!

## 💬 **Example Queries**

Once connected to Claude Desktop, you can ask natural language questions like:

### **Authentication & Setup:**
- "Check my Fabric authentication status"
- "What authentication method am I using?"

### **Basic Operations:**
- "List all semantic models in my workspace"
- "Show me details of semantic model [model-id]"
- "Get information about workspace [workspace-id]"

### **DAX Optimization (Coming Soon):**
- "Analyze this DAX query for performance issues"
- "Optimize my DAX measure for better performance"
- "Check this DAX formula against best practices"
- "Generate performance trace for this DAX query"

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fabric-dax-optimizer": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/PROJECT/build/index.js"]
    }
  }
}
```

### **🔐 Authentication**

This MCP server supports **multiple authentication methods** powered by Microsoft Authentication Library (MSAL):

#### **🎫 1. Bearer Token Authentication**
Provide your own Microsoft Fabric bearer token:
```bash
# All test scripts will prompt for authentication method
python enhanced_auth_test.py
```

#### **🤖 2. Service Principal Authentication** (Recommended for Production)
Use Azure AD application credentials:
- **Client ID** (Application ID)
- **Client Secret** 
- **Tenant ID** (Directory ID)

**Environment Variables Setup**:
```bash
export FABRIC_AUTH_METHOD="service_principal"
export FABRIC_CLIENT_ID="your-app-client-id"
export FABRIC_CLIENT_SECRET="your-app-client-secret"
export FABRIC_TENANT_ID="your-tenant-id"
export FABRIC_DEFAULT_WORKSPACE_ID="your-workspace-id"
```

**Claude Desktop Configuration**:
```json
{
  "mcpServers": {
    "fabric-dax-optimizer": {
      "command": "node",
      "args": ["/path/to/build/index.js"],
      "env": {
        "FABRIC_AUTH_METHOD": "service_principal",
        "FABRIC_CLIENT_ID": "your-client-id",
        "FABRIC_CLIENT_SECRET": "your-client-secret",
        "FABRIC_TENANT_ID": "your-tenant-id"
      }
    }
  }
}
```

#### **📱 3. Device Code Authentication**
Sign in with browser on another device (great for headless environments):
```bash
export FABRIC_AUTH_METHOD="device_code"
export FABRIC_CLIENT_ID="your-client-id"
export FABRIC_TENANT_ID="your-tenant-id"
```

#### **🌐 4. Interactive Authentication**
Automatic browser-based authentication:
```bash
export FABRIC_AUTH_METHOD="interactive"
export FABRIC_CLIENT_ID="your-client-id"
export FABRIC_TENANT_ID="your-tenant-id"
```

#### **🔧 Complete Authentication Setup**

📚 **Detailed Guides**:
- **[Authentication Setup Guide](AUTHENTICATION_SETUP.md)** - Complete Azure AD setup
- **[Claude Desktop Config Examples](CLAUDE_DESKTOP_CONFIG_EXAMPLES.md)** - Ready-to-use configurations

#### **🔍 Authentication Testing**

Check your authentication status:
```
"Check my Fabric authentication status"
"What authentication method am I using?"
"Test my Microsoft Fabric authentication setup"
```

#### **🔒 Security Best Practices**

- **Never commit authentication tokens** to version control
- Use **Service Principal** authentication for production deployments
- **Device Code** flow is perfect for CI/CD and headless environments
- **Interactive** authentication is ideal for development and testing
- All tokens are automatically validated and include expiration checking

**Note**: The MCP server seamlessly handles token validation and provides clear error messages for authentication issues.

## 🏗️ **Architecture**

This MCP server is built with:
- **TypeScript** for type-safe development
- **MCP SDK** for Model Context Protocol implementation
- **Zod** for schema validation and input sanitization
- **Node.js** runtime environment

## ⚙️ **Configuration**

The server uses the following configuration files:
- `tsconfig.json` - TypeScript compiler configuration
- `package.json` - Node.js package configuration
- `.vscode/mcp.json` - MCP server configuration for VS Code

## 🔧 **Development**

### **Project Structure**
```
├── src/
│   ├── index.ts              # Main MCP server implementation
│   └── fabric-client.ts      # Microsoft Fabric API client
├── build/                    # Compiled JavaScript output
├── tests/                    # Test scripts and notebooks
├── .vscode/                  # VS Code configuration
├── package.json
├── tsconfig.json
└── README.md
```

### **Adding New Tools**

To add new tools to the server:

1. Define the input schema using Zod
2. Implement the tool using `server.tool()`
3. Add error handling and validation
4. Update documentation

### **API Integration**

This server includes:

**✅ Production Ready:**
- Full Microsoft Fabric API integration
- Authentication and token management
- Basic CRUD operations for semantic models
- Comprehensive error handling and retry logic

**🚀 Future DAX Features:**
- DAX query execution with traces
- Query optimization recommendations
- Performance analysis and insights
- Best practices validation

## 🧪 **Testing**

### **Quick Testing**

1. **Build and run the server**:
   ```bash
   npm run build
   npm start
   ```

2. **Test with Claude Desktop**:
   Add the server to your Claude Desktop configuration and test basic operations.

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and add tests if applicable
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Add JSDoc comments for new functions
- Update tests for any new functionality
- Update documentation as needed
- See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines

## 🔒 **Security**

- **Never commit authentication tokens** to version control
- Use environment variables for sensitive configuration
- Follow Microsoft Fabric security best practices
- Report security issues privately via [GitHub security advisories](https://github.com/santhoshravindran7/Fabric-Analytics-MCP/security/advisories)
- See [SECURITY.md](SECURITY.md) for our full security policy

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  **Support**

For issues and questions:
- 📖 Check the [MCP documentation](https://modelcontextprotocol.io/)
- 📚 Review [Microsoft Fabric API documentation](https://docs.microsoft.com/en-us/fabric/)
- 🐛 [Open an issue](https://github.com/santhoshravindran7/Fabric-Analytics-MCP/issues) in this repository
- 💬 Join the community discussions

##  **Acknowledgments**

- **Microsoft Fabric Analytics team** for the comprehensive data platform and analytics capabilities
- **Microsoft Fabric Platform teams** for the robust API platform and infrastructure
- **Bogdan Crivat** and **Chris Finlan** for the inspiring brainstorming conversation that gave me the idea to open-source this project
- **Anthropic** for the Model Context Protocol specification

*This project began as my weekend hack project exploring AI integration with Microsoft Fabric. During a casual conversation with Chris and Bogdan about making AI tooling more accessible. What started as a personal experiment over a weekend is now available for everyone to build upon.*
