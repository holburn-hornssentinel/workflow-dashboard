'use client';

import { useState, useEffect } from 'react';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

const CHECKLIST_KEY = 'walkthrough-checklist';

const initialChecklist: ChecklistItem[] = [
  { id: 'settings', label: 'Configure API Keys', completed: false },
  { id: 'builder', label: 'Visit Visual Builder', completed: false },
  { id: 'vibe', label: 'Try Vibe Coding', completed: false },
  { id: 'workflow', label: 'Create First Workflow', completed: false },
  { id: 'qa', label: 'Run QA Tests', completed: false },
];

export default function ProgressChecklist() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Load saved progress
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CHECKLIST_KEY);
      if (saved) {
        setChecklist(JSON.parse(saved));
      }
    }
  }, []);

  const completedCount = checklist.filter((item) => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 z-30 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-all flex items-center gap-2"
      >
        <span className="text-sm font-medium">
          Progress: {completedCount}/{checklist.length}
        </span>
        <div className="w-16 h-2 bg-purple-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-30 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div>
          <h3 className="text-white font-semibold">Getting Started</h3>
          <p className="text-xs text-slate-400 mt-1">
            {completedCount}/{checklist.length} completed
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {checklist.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              item.completed
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                item.completed
                  ? 'bg-green-500 border-green-500'
                  : 'border-slate-600'
              }`}
            >
              {item.completed && <span className="text-white text-xs">✓</span>}
            </div>
            <span
              className={`text-sm ${
                item.completed ? 'text-green-400 line-through' : 'text-slate-300'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      {progress === 100 && (
        <div className="p-4 border-t border-slate-700 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <p className="text-center text-sm text-white font-medium">
            🎉 You are all set! Happy building!
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to mark items as complete
export function markChecklistComplete(itemId: string) {
  if (typeof window === 'undefined') return;

  const saved = localStorage.getItem(CHECKLIST_KEY);
  const checklist = saved ? JSON.parse(saved) : initialChecklist;

  const updated = checklist.map((item: ChecklistItem) =>
    item.id === itemId ? { ...item, completed: true } : item
  );

  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(updated));

  // Trigger storage event to update UI
  window.dispatchEvent(new Event('storage'));
}
