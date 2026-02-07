'use client';

import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';

interface EnhancedWorkflowNodeProps {
  data: {
    name: string;
    duration?: string;
    model_recommendation?: string;
    ai_prompt?: string;
    status?: 'pending' | 'active' | 'completed' | 'error';
  };
  selected?: boolean;
}

function EnhancedWorkflowNode({ data, selected }: EnhancedWorkflowNodeProps) {
  const { name, duration, model_recommendation, ai_prompt, status = 'pending' } = data;

  // Status-based styling
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500 bg-emerald-500/10';
      case 'active':
        return 'border-blue-500 bg-blue-500/10';
      case 'error':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-slate-500 bg-slate-700/90';
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'active':
        return '▶';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  return (
    <div
      className={`
        rounded-lg border-2 transition-all duration-200
        ${selected ? 'border-blue-400 shadow-lg shadow-blue-500/50' : getStatusStyles()}
        ${selected ? 'scale-105' : 'hover:scale-102'}
      `}
      style={{ width: '420px', minHeight: '140px' }}
    >
      {/* Top Handle */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />

      <div className="px-6 py-5">
        {/* Header with status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getStatusIndicator()}</span>
              <h3 className="text-base font-medium text-slate-50 leading-tight">{name}</h3>
            </div>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3">
          {duration && (
            <span className="px-3 py-1 bg-slate-800/80 text-slate-300 rounded-md text-sm font-medium">
              ⏱️ {duration}
            </span>
          )}
          {model_recommendation && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-md text-sm font-medium">
              🤖 {model_recommendation}
            </span>
          )}
        </div>

        {/* Prompt Preview */}
        {ai_prompt && (
          <div className="mt-3 pt-3 border-t border-slate-600">
            <p className="text-slate-400 text-sm line-clamp-2">{ai_prompt}</p>
          </div>
        )}
      </div>

      {/* Bottom Handle */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
}

export default memo(EnhancedWorkflowNode);
