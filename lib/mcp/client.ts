import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  category?: string;
}

export interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
}

export class MCPClient {
  private clients: Map<string, Client> = new Map();
  private tools: Map<string, MCPTool> = new Map();

  async connectToServer(server: MCPServer): Promise<void> {
    try {
      const transport = new StdioClientTransport({
        command: server.command,
        args: server.args,
        env: server.env,
      });

      const client = new Client(
        {
          name: 'workflow-dashboard',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);
      this.clients.set(server.name, client);

      // List available tools
      const toolsResult = await client.listTools();

      if (toolsResult.tools) {
        toolsResult.tools.forEach((tool: any) => {
          this.tools.set(`${server.name}:${tool.name}`, {
            name: tool.name,
            description: tool.description || '',
            inputSchema: tool.inputSchema || {},
            category: server.name,
          });
        });
      }

      console.log(`[MCP] Connected to ${server.name}, found ${toolsResult.tools?.length || 0} tools`);
    } catch (error) {
      console.error(`[MCP] Failed to connect to ${server.name}:`, error);
      throw error;
    }
  }

  async disconnectFromServer(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      await client.close();
      this.clients.delete(serverName);

      // Remove tools from this server
      const toolsToRemove: string[] = [];
      this.tools.forEach((tool, key) => {
        if (tool.category === serverName) {
          toolsToRemove.push(key);
        }
      });
      toolsToRemove.forEach((key) => this.tools.delete(key));
    }
  }

  async callTool(toolId: string, args: any): Promise<any> {
    const [serverName, toolName] = toolId.split(':');
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`Server ${serverName} not connected`);
    }

    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });

      return result;
    } catch (error) {
      console.error(`[MCP] Tool call failed for ${toolId}:`, error);
      throw error;
    }
  }

  getTools(): MCPTool[] {
    const tools: MCPTool[] = [];
    this.tools.forEach((tool) => tools.push(tool));
    return tools;
  }

  getToolsByCategory(category: string): MCPTool[] {
    const tools: MCPTool[] = [];
    this.tools.forEach((tool) => {
      if (tool.category === category) {
        tools.push(tool);
      }
    });
    return tools;
  }

  getTool(toolId: string): MCPTool | undefined {
    return this.tools.get(toolId);
  }

  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }

  getConnectedServers(): string[] {
    const servers: string[] = [];
    this.clients.forEach((_, name) => servers.push(name));
    return servers;
  }

  async disconnectAll(): Promise<void> {
    const serverNames: string[] = [];
    this.clients.forEach((_, name) => serverNames.push(name));
    const disconnectPromises = serverNames.map((name) =>
      this.disconnectFromServer(name)
    );
    await Promise.all(disconnectPromises);
  }
}

// Global MCP client instance
let mcpClientInstance: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
  }
  return mcpClientInstance;
}
