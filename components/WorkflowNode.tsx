import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

// Enhanced workflow node with better visuals
function WorkflowNode({ data, selected }: any) {
  return (
    <div
      className={`
        px-5 py-4 shadow-xl rounded-xl border-2 transition-all duration-200
        min-w-[280px] max-w-[320px]
        ${
          selected
            ? 'border-blue-400 bg-gradient-to-br from-blue-900/90 to-slate-800 scale-105 shadow-blue-500/50'
            : 'border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 hover:border-blue-500 hover:shadow-lg'
        }
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-blue-500 border-2 border-white"
      />

      <div>
        {/* Step Title */}
        <div className="text-white font-bold text-base mb-2 leading-snug">
          {data?.label || 'Step'}
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {data?.duration && (
            <div className="text-slate-300 text-xs bg-slate-700/50 px-2 py-1 rounded flex items-center gap-1">
              <span>⏱️</span>
              <span>{data.duration}</span>
            </div>
          )}

          {data?.model && (
            <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded flex items-center gap-1 border border-blue-500/30">
              <span>🤖</span>
              <span className="font-medium">{data.model}</span>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {data?.description && (
          <div className="text-slate-400 text-xs leading-relaxed line-clamp-2 mt-2 pt-2 border-t border-white/[0.06]">
            {data.description}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-blue-500 border-2 border-white"
      />
    </div>
  );
}

export default memo(WorkflowNode);
