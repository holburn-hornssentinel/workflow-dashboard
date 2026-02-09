'use client';

import Link from 'next/link';
import { useState } from 'react';
import ToolBrowser from '@/components/tools/ToolBrowser';
import { X, Code, FileText, List } from 'lucide-react';

interface Tool {
  name: string;
  description: string;
  category?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export default function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const handleSelectTool = (tool: Tool) => {
    setSelectedTool(tool);
  };

  const handleCloseTool = () => {
    setSelectedTool(null);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-slate-900/50 backdrop-blur p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-lg font-medium text-white">MCP Tool Browser</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              Model Context Protocol Tools
            </span>
          </div>
        </div>
      </div>

      {/* Tool Browser */}
      <div className="flex-1 overflow-hidden">
        <ToolBrowser onSelectTool={handleSelectTool} />
      </div>

      {/* Tool Detail Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/[0.06] rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg">
                  <Code className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedTool.name}</h2>
                  {selectedTool.category && (
                    <span className="text-sm text-slate-400">{selectedTool.category}</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleCloseTool}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
                aria-label="Close tool details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-medium text-slate-300">Description</h3>
                </div>
                <p className="text-white leading-relaxed">{selectedTool.description}</p>
              </div>

              {/* Input Schema */}
              {selectedTool.inputSchema && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <List className="h-4 w-4 text-slate-400" />
                    <h3 className="text-sm font-medium text-slate-300">Parameters</h3>
                  </div>

                  {selectedTool.inputSchema.properties &&
                   Object.keys(selectedTool.inputSchema.properties).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(selectedTool.inputSchema.properties).map(([key, schema]: [string, any]) => {
                        const isRequired = selectedTool.inputSchema?.required?.includes(key);
                        return (
                          <div
                            key={key}
                            className="bg-slate-900/50 border border-white/[0.06] rounded-lg p-4"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-blue-400 font-mono text-sm">{key}</code>
                              {isRequired && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                                  required
                                </span>
                              )}
                              {schema.type && (
                                <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                                  {schema.type}
                                </span>
                              )}
                            </div>
                            {schema.description && (
                              <p className="text-slate-400 text-sm">{schema.description}</p>
                            )}
                            {schema.enum && (
                              <div className="mt-2">
                                <span className="text-xs text-slate-500">Allowed values: </span>
                                <code className="text-xs text-slate-400">
                                  {schema.enum.join(', ')}
                                </code>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No parameters required</p>
                  )}
                </div>
              )}

              {/* Schema JSON (collapsed) */}
              {selectedTool.inputSchema && (
                <details className="bg-slate-900/50 border border-white/[0.06] rounded-lg">
                  <summary className="cursor-pointer p-4 text-sm font-medium text-slate-300 hover:text-white">
                    View Full Schema (JSON)
                  </summary>
                  <div className="p-4 pt-0">
                    <pre className="text-xs text-slate-400 overflow-x-auto">
                      {JSON.stringify(selectedTool.inputSchema, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/[0.06] p-4 flex justify-end">
              <button
                onClick={handleCloseTool}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
