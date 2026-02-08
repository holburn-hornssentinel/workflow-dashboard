'use client';

import { useEffect, useState } from 'react';
import { DirectoryEntry } from '@/types/workflow';

interface FolderBrowserProps {
  onSelect: (path: string) => void;
  selectedPath?: string;
}

export default function FolderBrowser({ onSelect, selectedPath }: FolderBrowserProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [parentPath, setParentPath] = useState<string>('');
  const [canGoUp, setCanGoUp] = useState(false);
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load home directory on mount
    loadDirectory();
  }, []);

  const loadDirectory = async (path?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = path
        ? `/api/directories?path=${encodeURIComponent(path)}`
        : '/api/directories';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load directory');
      }

      const data = await response.json();
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setCanGoUp(data.canGoUp);
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Error loading directory:', err);
      setError('Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateUp = () => {
    if (canGoUp) {
      loadDirectory(parentPath);
    }
  };

  const handleNavigateInto = (path: string) => {
    loadDirectory(path);
  };

  const handleSelectCurrent = () => {
    onSelect(currentPath);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-400">Loading directory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="text-red-400 text-sm">{error}</div>
          <button
            onClick={() => loadDirectory()}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Go to home directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Current Path Header */}
      <div className="border-b border-white/[0.06] p-3 bg-slate-800/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            onClick={handleNavigateUp}
            disabled={!canGoUp}
            className={`
              px-3 py-1 rounded text-sm transition-colors
              ${
                canGoUp
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }
            `}
          >
            ⬆️ Up
          </button>
          <button
            onClick={handleSelectCurrent}
            className="px-3 py-1 rounded text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors active:scale-[0.98]"
          >
            ✓ Select This Folder
          </button>
        </div>
        <div className="text-xs text-slate-400 truncate" title={currentPath}>
          {currentPath}
        </div>
      </div>

      {/* Directory Listing */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-4xl mb-4">📂</div>
            <div className="text-slate-400 text-sm">No subdirectories</div>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {entries.map((entry) => (
              <button
                key={entry.path}
                onClick={() => handleNavigateInto(entry.path)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg transition-colors
                  flex items-center gap-2
                  ${
                    selectedPath === entry.path
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }
                `}
              >
                <span className="text-lg">
                  {entry.isGitRepo ? '📂' : '📁'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{entry.name}</div>
                  {entry.isGitRepo && (
                    <div className="text-xs opacity-70">Git Repository</div>
                  )}
                </div>
                <span className="text-slate-500">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
