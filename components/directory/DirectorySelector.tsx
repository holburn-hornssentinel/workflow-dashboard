'use client';

import { useState } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import GitRepoList from './GitRepoList';
import FolderBrowser from './FolderBrowser';
import { Folder, FolderOpen, ChevronDown } from 'lucide-react';

type TabType = 'git' | 'browse';

export default function DirectorySelector() {
  const [activeTab, setActiveTab] = useState<TabType>('git');
  const [isOpen, setIsOpen] = useState(false);
  const workingDirectory = useWorkflowStore((state) => state.workingDirectory);
  const setWorkingDirectory = useWorkflowStore((state) => state.setWorkingDirectory);

  const handleSelect = (path: string) => {
    setWorkingDirectory(path);
    setIsOpen(false);
  };

  // Get just the directory name for display
  const displayName = workingDirectory
    ? (workingDirectory.split('/').filter(Boolean).pop() || workingDirectory)
    : 'Select Directory';

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
      >
        <Folder className="h-4 w-4 text-slate-400" />
        <div className="text-left">
          <div className="text-xs text-slate-400">Working Directory:</div>
          <div className="text-sm font-medium text-white truncate max-w-xs" title={workingDirectory}>
            {displayName}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute top-full right-0 mt-2 w-96 bg-slate-900 border border-white/[0.06] rounded-lg shadow-2xl z-50">
            {/* Tabs */}
            <div className="flex border-b border-white/[0.06]">
              <button
                onClick={() => setActiveTab('git')}
                className={`
                  flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2
                  ${
                    activeTab === 'git'
                      ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-slate-300'
                  }
                `}
              >
                <FolderOpen className="h-4 w-4" />
                Git Repositories
              </button>
              <button
                onClick={() => setActiveTab('browse')}
                className={`
                  flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2
                  ${
                    activeTab === 'browse'
                      ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-slate-300'
                  }
                `}
              >
                <Folder className="h-4 w-4" />
                Browse Folders
              </button>
            </div>

            {/* Tab Content */}
            <div className="max-h-[32rem]">
              {activeTab === 'git' && (
                <GitRepoList
                  onSelect={handleSelect}
                  selectedPath={workingDirectory}
                />
              )}
              {activeTab === 'browse' && (
                <FolderBrowser
                  onSelect={handleSelect}
                  selectedPath={workingDirectory}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
