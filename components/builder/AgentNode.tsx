'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AgentNodeData, NodeType } from '@/stores/builderStore';

const nodeIcons: Record<NodeType, string> = {
  agent: '🤖',
  tool: '🔧',
  condition: '🔀',
  loop: '🔄',
  parallel: '⚡',
  start: '🟢',
  end: '🔴',
};

const nodeColors: Record<NodeType, string> = {
  agent: 'border-blue-500 bg-blue-500/10',
  tool: 'border-green-500 bg-green-500/10',
  condition: 'border-yellow-500 bg-yellow-500/10',
  loop: 'border-purple-500 bg-purple-500/10',
  parallel: 'border-orange-500 bg-orange-500/10',
  start: 'border-emerald-500 bg-emerald-500/10',
  end: 'border-red-500 bg-red-500/10',
};

function AgentNode({ data, selected }: NodeProps) {
  const nodeData = data as AgentNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(nodeData.label);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (nodeData.label !== label) {
      // Update handled by parent component through onNodeUpdate
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setLabel(nodeData.label);
      setIsEditing(false);
    }
  };

  const icon = nodeIcons[nodeData.type] || '⚙️';
  const colorClass = nodeColors[nodeData.type] || 'border-gray-500 bg-gray-500/10';

  return (
    <div
      className={`
        min-w-[200px] rounded-lg border-2 ${colorClass}
        ${selected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''}
        transition-all duration-200
      `}
    >
      {/* Input Handle */}
      {nodeData.type !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-slate-400"
        />
      )}

      {/* Node Content */}
      <div className="p-4">
        {/* Icon + Label */}
        <div className="flex items-center gap-2 mb-2">
          <div className="text-2xl">{icon}</div>
          {isEditing ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-slate-800 text-white px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          ) : (
            <div
              onDoubleClick={handleDoubleClick}
              className="flex-1 text-white font-medium cursor-text"
            >
              {nodeData.label}
            </div>
          )}
        </div>

        {/* Type Badge */}
        <div className="text-xs text-slate-400 uppercase tracking-wide">
          {nodeData.type}
        </div>

        {/* Prompt Preview */}
        {nodeData.prompt && (
          <div className="mt-2 text-xs text-slate-400 line-clamp-2 bg-slate-800/50 p-2 rounded">
            {nodeData.prompt}
          </div>
        )}

        {/* Model Badge */}
        {nodeData.model && (
          <div className="mt-2">
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
              {nodeData.model}
            </span>
          </div>
        )}

        {/* Tools Count */}
        {nodeData.tools && nodeData.tools.length > 0 && (
          <div className="mt-2 text-xs text-slate-400">
            🔧 {nodeData.tools.length} tools
          </div>
        )}
      </div>

      {/* Output Handle */}
      {nodeData.type !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-slate-400"
        />
      )}
    </div>
  );
}

export default memo(AgentNode);
