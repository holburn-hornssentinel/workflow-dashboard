'use client';

import { useBuilderStore, AgentNodeData } from '@/stores/builderStore';

export default function PropertyPanel() {
  const { selectedNodeId, nodes, updateNode } = useBuilderStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-slate-900/95 backdrop-blur border-l border-slate-700 p-4">
        <div className="text-center text-slate-400 mt-8">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm">Select a node to edit properties</p>
        </div>
      </div>
    );
  }

  const data = selectedNode.data;

  const handleUpdate = (field: keyof AgentNodeData, value: any) => {
    updateNode(selectedNode.id, { [field]: value });
  };

  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur border-l border-slate-700 p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-1">Properties</h3>
        <p className="text-xs text-slate-400">Node ID: {selectedNode.id}</p>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Label
          </label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => handleUpdate('label', e.target.value)}
            className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Type (read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Type
          </label>
          <div className="bg-slate-800/50 text-slate-400 px-3 py-2 rounded border border-slate-700">
            {data.type}
          </div>
        </div>

        {/* AI Prompt (for agent nodes) */}
        {data.type === 'agent' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              AI Prompt
            </label>
            <textarea
              value={data.prompt || ''}
              onChange={(e) => handleUpdate('prompt', e.target.value)}
              rows={6}
              className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Enter the prompt for this agent..."
            />
          </div>
        )}

        {/* Model Selection (for agent nodes) */}
        {data.type === 'agent' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Model
            </label>
            <select
              value={data.model || ''}
              onChange={(e) => handleUpdate('model', e.target.value)}
              className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a model...</option>
              <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
              <option value="claude-opus-4-5-20251101">Claude Opus 4.5</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
              <option value="gemini-flash">Gemini Flash</option>
              <option value="gemini-pro">Gemini Pro</option>
            </select>
          </div>
        )}

        {/* Tools (for agent nodes) */}
        {data.type === 'agent' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tools (comma-separated)
            </label>
            <input
              type="text"
              value={data.tools?.join(', ') || ''}
              onChange={(e) =>
                handleUpdate(
                  'tools',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="tool1, tool2, tool3"
            />
          </div>
        )}

        {/* Condition Expression (for condition nodes) */}
        {data.type === 'condition' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Condition Expression
            </label>
            <input
              type="text"
              value={data.config?.expression || ''}
              onChange={(e) =>
                handleUpdate('config', {
                  ...data.config,
                  expression: e.target.value,
                })
              }
              className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="e.g., result === 'success'"
            />
          </div>
        )}

        {/* Loop Count (for loop nodes) */}
        {data.type === 'loop' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Iterations
            </label>
            <input
              type="number"
              value={data.config?.iterations || 1}
              onChange={(e) =>
                handleUpdate('config', {
                  ...data.config,
                  iterations: parseInt(e.target.value),
                })
              }
              className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              min="1"
            />
          </div>
        )}

        {/* Delete Button */}
        <div className="pt-4 border-t border-slate-700">
          <button
            onClick={() => {
              useBuilderStore.getState().deleteNode(selectedNode.id);
              useBuilderStore.getState().selectNode(null);
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded transition-colors"
          >
            Delete Node
          </button>
        </div>
      </div>
    </div>
  );
}
