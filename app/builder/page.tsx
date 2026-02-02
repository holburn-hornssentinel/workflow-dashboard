'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, ConnectionMode, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useBuilderStore, NodeType } from '@/stores/builderStore';
import NodePalette from '@/components/builder/NodePalette';
import PropertyPanel from '@/components/builder/PropertyPanel';
import AgentNode from '@/components/builder/AgentNode';
import VibeInput from '@/components/vibe/VibeInput';
import Link from 'next/link';

const nodeTypes = {
  custom: AgentNode,
};

export default function BuilderPage() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [showVibeInput, setShowVibeInput] = useState(false);

  // Load vibe-generated workflow from session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const vibeData = sessionStorage.getItem('vibeWorkflow');
      if (vibeData) {
        try {
          const { nodes, edges } = JSON.parse(vibeData);
          useBuilderStore.getState().importWorkflow(nodes, edges);
          sessionStorage.removeItem('vibeWorkflow');
        } catch (err) {
          console.error('Failed to load vibe workflow:', err);
        }
      }
    }
  }, []);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addNode,
    addEdge,
    selectNode,
    selectedNodeId,
    isPanelOpen,
    togglePanel,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useBuilderStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
      }
      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        if (canRedo()) redo();
      }
      // Delete key to delete selected node
      if (e.key === 'Delete' && selectedNodeId) {
        useBuilderStore.getState().deleteNode(selectedNodeId);
        selectNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, selectedNodeId, selectNode]);

  // Handle drag start from palette
  const handleDragStart = (type: NodeType) => {
    setDraggedNodeType(type);
  };

  // Handle drop on canvas
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !draggedNodeType) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      addNode(draggedNodeType, position);
      setDraggedNodeType(null);
    },
    [reactFlowInstance, draggedNodeType, addNode]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle connection
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge(connection.source, connection.target);
      }
    },
    [addEdge]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Handle pane click (deselect)
  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const handleVibeGenerate = async (description: string) => {
    const response = await fetch('/api/vibe/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate workflow');
    }

    const data = await response.json();
    useBuilderStore.getState().importWorkflow(data.nodes, data.edges);
    setShowVibeInput(false);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-white">Visual Workflow Builder</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Vibe Coding */}
            <button
              onClick={() => setShowVibeInput(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
            >
              ✨ Vibe Code
            </button>

            {/* Undo/Redo */}
            <button
              onClick={undo}
              disabled={!canUndo()}
              className={`px-3 py-2 rounded transition-colors ${
                canUndo()
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className={`px-3 py-2 rounded transition-colors ${
                canRedo()
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              ↷
            </button>

            {/* Toggle Panel */}
            <button
              onClick={togglePanel}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
            >
              {isPanelOpen ? 'Hide Panel' : 'Show Panel'}
            </button>

            {/* Import/Export */}
            <button
              onClick={async () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.yaml,.yml';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                      const content = e.target?.result as string;
                      try {
                        const response = await fetch('/api/builder/import', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ yaml: content }),
                        });
                        const data = await response.json();
                        useBuilderStore.getState().importWorkflow(data.nodes, data.edges);
                      } catch (error) {
                        console.error('Import failed:', error);
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              Import YAML
            </button>
            <button
              onClick={async () => {
                const data = useBuilderStore.getState().exportWorkflow();
                try {
                  const response = await fetch('/api/builder/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });
                  const result = await response.json();
                  const blob = new Blob([result.yaml], { type: 'text/yaml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'workflow.yaml';
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Export failed:', error);
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Export YAML
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Node Palette */}
        <NodePalette onDragStart={handleDragStart} />

        {/* Center: Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const colorMap: Record<string, string> = {
                  agent: '#3b82f6',
                  tool: '#10b981',
                  condition: '#eab308',
                  loop: '#a855f7',
                  parallel: '#f97316',
                  start: '#10b981',
                  end: '#ef4444',
                };
                const nodeData = node.data as any;
                return colorMap[nodeData?.type] || '#6b7280';
              }}
            />
          </ReactFlow>

          {/* Node Count Badge */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
            <span className="font-medium">{nodes.length}</span> nodes,{' '}
            <span className="font-medium">{edges.length}</span> edges
          </div>
        </div>

        {/* Right: Property Panel */}
        {isPanelOpen && <PropertyPanel />}
      </div>

      {/* Vibe Input Modal */}
      {showVibeInput && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowVibeInput(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
            <VibeInput onGenerate={handleVibeGenerate} />
          </div>
        </div>
      )}
    </div>
  );
}
