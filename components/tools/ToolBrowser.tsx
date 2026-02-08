'use client';

import { useState, useEffect } from 'react';
import { TOOL_CATEGORIES, getToolCategory } from '@/lib/mcp/tool-registry';

interface Tool {
  name: string;
  description: string;
  category?: string;
  inputSchema?: any;
}

interface ToolBrowserProps {
  onSelectTool?: (tool: Tool) => void;
}

export default function ToolBrowser({ onSelectTool }: ToolBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectedServers, setConnectedServers] = useState<string[]>([]);

  useEffect(() => {
    fetchConnectedServers();
  }, []);

  const fetchConnectedServers = async () => {
    try {
      const response = await fetch('/api/mcp/servers');
      if (response.ok) {
        const data = await response.json();
        setConnectedServers(data.servers || []);
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    }
  };

  const fetchTools = async (category: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mcp/tools?category=${category}`);
      if (response.ok) {
        const data = await response.json();
        setTools(data.tools || []);
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    fetchTools(categoryId);
  };

  const handleConnectServer = async (categoryId: string) => {
    try {
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName: categoryId }),
      });

      if (response.ok) {
        fetchConnectedServers();
        handleCategoryClick(categoryId);
      }
    } catch (error) {
      console.error('Failed to connect server:', error);
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
                  <div className="text-2xl">{category.icon}</div>
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
        {!selectedCategory ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-6xl mb-4">🔧</div>
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
            <div className="text-white">Loading tools...</div>
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
                <div className="text-4xl mb-2">📭</div>
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
