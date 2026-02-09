'use client';

import { useState, useEffect } from 'react';
import { TOOL_CATEGORIES, getToolCategory } from '@/lib/mcp/tool-registry';
import { Folder, GitBranch, Globe, Search, MessageSquare, Box, Wrench, Github } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Tool {
  name: string;
  description: string;
  category?: string;
  inputSchema?: any;
}

interface ToolBrowserProps {
  onSelectTool?: (tool: Tool) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'folder': Folder,
  'git-branch': GitBranch,
  'globe': Globe,
  'search': Search,
  'message-square': MessageSquare,
  'github': Github,
};

export default function ToolBrowser({ onSelectTool }: ToolBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectedServers, setConnectedServers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectingServer, setConnectingServer] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectedServers();
  }, []);

  const fetchConnectedServers = async () => {
    try {
      const response = await fetch('/api/mcp/servers');
      if (response.ok) {
        const data = await response.json();
        setConnectedServers(data.servers || []);
        setError(null);
      } else {
        setError('Failed to fetch MCP servers');
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error);
      setError('Unable to connect to MCP servers. Check if the service is running.');
    }
  };

  const fetchTools = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/mcp/tools?category=${category}`);
      if (response.ok) {
        const data = await response.json();
        setTools(data.tools || []);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch tools');
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      setError('Unable to load tools. Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    fetchTools(categoryId);
  };

  const handleConnectServer = async (categoryId: string) => {
    setConnectingServer(categoryId);
    setError(null);
    try {
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName: categoryId }),
      });

      if (response.ok) {
        fetchConnectedServers();
        handleCategoryClick(categoryId);
      } else {
        const data = await response.json();
        setError(data.error || `Failed to connect to ${categoryId} server. This may take 10-30 seconds for first connection.`);
      }
    } catch (error) {
      console.error('Failed to connect server:', error);
      setError(`Connection to ${categoryId} failed. Check API keys in settings.`);
    } finally {
      setConnectingServer(null);
    }
  };

  return (
    <div className="flex h-full bg-slate-900">
      {/* Left Sidebar: Categories */}
      <div className="w-64 border-r border-white/[0.06] p-4 overflow-y-auto">
        <h3 className="text-base font-medium text-white mb-4">Tool Categories</h3>
        <div className="space-y-2">
          {TOOL_CATEGORIES.map((category) => {
            const isConnected = connectedServers.includes(category.id);
            const isSelected = selectedCategory === category.id;
            const Icon = ICON_MAP[category.icon] || Box;

            return (
              <div
                key={category.id}
                className={`
                  cursor-pointer rounded-lg p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10
                  ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300'
                  }
                `}
                onClick={() =>
                  isConnected
                    ? handleCategoryClick(category.id)
                    : handleConnectServer(category.id)
                }
              >
                <div className="flex items-center gap-3">
                  <div className={isSelected ? 'text-white' : 'text-slate-400'}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{category.name}</div>
                    <div className="text-xs opacity-75 line-clamp-1">
                      {category.description}
                    </div>
                  </div>
                  {isConnected && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Content: Tools */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start justify-between">
              <span className="text-red-400 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 text-sm font-medium ml-4"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Connecting Indicator */}
        {connectingServer && (
          <div className="mb-4 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <span className="text-blue-400 text-sm">
              Connecting to {connectingServer}... This may take 10-30 seconds for first connection.
            </span>
          </div>
        )}

        {!selectedCategory ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="flex justify-center mb-4">
                <Wrench className="h-16 w-16 text-slate-600" />
              </div>
              <h3 className="text-base font-medium text-white mb-2">
                Select a Tool Category
              </h3>
              <p className="text-slate-400">
                Choose a category from the left to browse available tools
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner message="Loading tools..." />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-white mb-2">
                {getToolCategory(selectedCategory)?.name} Tools
              </h2>
              <p className="text-slate-400">
                {getToolCategory(selectedCategory)?.description}
              </p>
            </div>

            {tools.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-2">
                  <Box className="h-12 w-12 text-slate-600" />
                </div>
                <p className="text-slate-400">No tools available in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectTool?.(tool)}
                    className="bg-slate-800/50 hover:bg-slate-800 border border-white/[0.06] hover:border-slate-600 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <h4 className="text-white font-medium mb-2">{tool.name}</h4>
                    <p className="text-slate-400 text-sm line-clamp-3">
                      {tool.description}
                    </p>
                    {tool.inputSchema && (
                      <div className="mt-3 text-xs text-slate-500">
                        {Object.keys(tool.inputSchema.properties || {}).length}{' '}
                        parameters
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
