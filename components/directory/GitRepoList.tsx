'use client';

import { useEffect, useState } from 'react';
import { GitRepo } from '@/types/workflow';

interface GitRepoListProps {
  onSelect: (path: string) => void;
  selectedPath?: string;
}

export default function GitRepoList({ onSelect, selectedPath }: GitRepoListProps) {
  const [repos, setRepos] = useState<GitRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGitRepos();
  }, []);

  const loadGitRepos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/directories/git-repos');
      if (!response.ok) {
        throw new Error('Failed to load git repositories');
      }

      const data = await response.json();
      setRepos(data.repos || []);
    } catch (err) {
      console.error('Error loading git repos:', err);
      setError('Failed to load git repositories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-400">Scanning for git repositories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="text-red-400 text-sm">{error}</div>
          <button
            onClick={loadGitRepos}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300 active:scale-[0.98]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-4">📁</div>
        <div className="text-slate-400 text-sm mb-2">No git repositories found</div>
        <button
          onClick={loadGitRepos}
          className="text-sm text-blue-400 hover:text-blue-300 active:scale-[0.98]"
        >
          Scan again
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-96">
      <div className="p-2 space-y-1">
        {repos.map((repo) => (
          <button
            key={repo.path}
            onClick={() => onSelect(repo.path)}
            className={`
              w-full text-left px-3 py-2 rounded-lg transition-colors
              ${
                selectedPath === repo.path
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-700 text-slate-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📂</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{repo.name}</div>
                <div className="text-xs opacity-70 truncate">{repo.path}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Refresh button */}
      <div className="p-2 border-t border-white/[0.06]">
        <button
          onClick={loadGitRepos}
          className="w-full py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors active:scale-[0.98]"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}
