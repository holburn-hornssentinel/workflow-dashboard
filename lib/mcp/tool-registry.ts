import { MCPServer } from './client';

// Pre-configured MCP servers
export const DEFAULT_MCP_SERVERS: MCPServer[] = [
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    enabled: true,
  },
  {
    name: 'github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || '',
    },
    enabled: !!process.env.GITHUB_TOKEN,
  },
  {
    name: 'git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    enabled: true,
  },
  {
    name: 'fetch',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    enabled: true,
  },
  {
    name: 'brave-search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: {
      BRAVE_API_KEY: process.env.BRAVE_API_KEY || '',
    },
    enabled: !!process.env.BRAVE_API_KEY,
  },
  {
    name: 'slack',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: {
      SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
      SLACK_TEAM_ID: process.env.SLACK_TEAM_ID || '',
    },
    enabled: !!process.env.SLACK_BOT_TOKEN,
  },
];

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'filesystem',
    name: 'File System',
    description: 'Read, write, and manage local files',
    icon: 'folder',
    color: 'blue',
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Git operations and version control',
    icon: 'git-branch',
    color: 'orange',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub API operations',
    icon: 'github',
    color: 'purple',
  },
  {
    id: 'fetch',
    name: 'Web Fetch',
    description: 'Fetch content from URLs',
    icon: 'globe',
    color: 'green',
  },
  {
    id: 'brave-search',
    name: 'Web Search',
    description: 'Search the web with Brave',
    icon: 'search',
    color: 'yellow',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages and interact with Slack',
    icon: 'message-square',
    color: 'pink',
  },
];

export function getToolCategory(categoryId: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find((cat) => cat.id === categoryId);
}

export function getEnabledServers(): MCPServer[] {
  return DEFAULT_MCP_SERVERS.filter((server) => server.enabled);
}

export function getServerByName(name: string): MCPServer | undefined {
  return DEFAULT_MCP_SERVERS.find((server) => server.name === name);
}

export function validateServerConfig(server: MCPServer): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!server.command) {
    errors.push('Command is required');
  }

  if (!server.args || server.args.length === 0) {
    errors.push('Args are required');
  }

  // Check for required environment variables
  if (server.env) {
    for (const [key, value] of Object.entries(server.env)) {
      if (!value && server.enabled) {
        errors.push(`Missing required environment variable: ${key}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
