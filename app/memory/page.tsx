'use client';

import Link from 'next/link';
import MemoryBrowser from '@/components/memory/MemoryBrowser';

export default function MemoryPage() {
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
            <h1 className="text-lg font-medium text-white">Persistent Memory</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded">
              Local (LanceDB)
            </div>
          </div>
        </div>
      </div>

      {/* Memory Browser */}
      <div className="flex-1 overflow-hidden">
        <MemoryBrowser />
      </div>
    </div>
  );
}
