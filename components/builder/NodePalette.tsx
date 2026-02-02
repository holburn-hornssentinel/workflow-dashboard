'use client';

import { NodeType } from '@/stores/builderStore';

interface NodePaletteProps {
  onDragStart: (type: NodeType) => void;
}

interface NodeTemplate {
  type: NodeType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'agent',
    label: 'Agent',
    icon: '🤖',
    description: 'AI agent that performs tasks',
    color: 'bg-blue-500',
  },
  {
    type: 'tool',
    label: 'Tool',
    icon: '🔧',
    description: 'External tool or function',
    color: 'bg-green-500',
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: '🔀',
    description: 'Conditional branching logic',
    color: 'bg-yellow-500',
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: '🔄',
    description: 'Repeat steps multiple times',
    color: 'bg-purple-500',
  },
  {
    type: 'parallel',
    label: 'Parallel',
    icon: '⚡',
    description: 'Execute steps in parallel',
    color: 'bg-orange-500',
  },
  {
    type: 'start',
    label: 'Start',
    icon: '🟢',
    description: 'Workflow start point',
    color: 'bg-emerald-500',
  },
  {
    type: 'end',
    label: 'End',
    icon: '🔴',
    description: 'Workflow end point',
    color: 'bg-red-500',
  },
];

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="w-64 bg-slate-900/95 backdrop-blur border-r border-slate-700 p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-2">Node Palette</h3>
        <p className="text-sm text-slate-400">Drag nodes onto the canvas</p>
      </div>

      <div className="space-y-2">
        {nodeTemplates.map((template) => (
          <div
            key={template.type}
            draggable
            onDragStart={(e) => {
              onDragStart(template.type);
              // Create ghost image for better drag feedback
              const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
              ghost.style.opacity = '0.5';
              ghost.style.position = 'absolute';
              ghost.style.top = '-1000px';
              document.body.appendChild(ghost);
              e.dataTransfer.setDragImage(ghost, 50, 25);
              setTimeout(() => document.body.removeChild(ghost), 0);
            }}
            className="group cursor-grab active:cursor-grabbing bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 hover:shadow-lg hover:shadow-blue-500/20 rounded-lg p-3 transition-all duration-200 touch-manipulation"
            style={{ minHeight: '44px' }} // Touch-friendly minimum size
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 ${template.color} rounded-lg flex items-center justify-center text-xl flex-shrink-0`}
                style={{ minWidth: '44px', minHeight: '44px' }} // Touch-friendly tap target
              >
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">
                  {template.label}
                </div>
                <div className="text-slate-400 text-xs mt-1 line-clamp-2">
                  {template.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-700">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">
          Keyboard Shortcuts
        </h4>
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Delete</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">Del</kbd>
          </div>
          <div className="flex justify-between">
            <span>Undo</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">Ctrl+Z</kbd>
          </div>
          <div className="flex justify-between">
            <span>Redo</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">Ctrl+Y</kbd>
          </div>
          <div className="flex justify-between">
            <span>Select All</span>
            <kbd className="px-2 py-1 bg-slate-800 rounded">Ctrl+A</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
