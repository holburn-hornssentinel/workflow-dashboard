'use client';

import Link from 'next/link';
import ToolBrowser from '@/components/tools/ToolBrowser';

export default function ToolsPage() {
  const handleSelectTool = (tool: any) => {
    console.log('Selected tool:', tool);
    // Could open a modal with tool details, or add to workflow
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-white">MCP Tool Browser</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              75+ tools via Model Context Protocol
            </span>
          </div>
        </div>
      </div>

      {/* Tool Browser */}
      <div className="flex-1 overflow-hidden">
        <ToolBrowser onSelectTool={handleSelectTool} />
      </div>
    </div>
  );
}
