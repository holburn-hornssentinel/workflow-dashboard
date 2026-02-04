'use client';

import { useBuilderStore } from '@/stores/builderStore';
import { Box, LayoutGrid } from 'lucide-react';

export function ViewToggle() {
  const { viewMode, setViewMode } = useBuilderStore();

  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => setViewMode('2d')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
          viewMode === '2d'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
        title="2D View"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="text-sm font-medium">2D</span>
      </button>
      <button
        onClick={() => setViewMode('3d')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
          viewMode === '3d'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
        title="3D View"
      >
        <Box className="w-4 h-4" />
        <span className="text-sm font-medium">3D</span>
      </button>
    </div>
  );
}
