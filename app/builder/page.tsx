'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, ConnectionMode, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useBuilderStore, NodeType } from '@/stores/builderStore';
import NodePalette from '@/components/builder/NodePalette';
import PropertyPanel from '@/components/builder/PropertyPanel';
import AgentNode from '@/components/builder/AgentNode';
import VibeInput from '@/components/vibe/VibeInput';
import { ViewToggle } from '@/components/builder/ViewToggle';
import { Builder3DCanvas } from '@/components/builder/Builder3DCanvas';
import { SuggestionsPanel } from '@/components/builder/SuggestionsPanel';
import { useSuggestionsStore } from '@/stores/suggestionsStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { TemplateGallery } from '@/components/builder/TemplateGallery';
import Link from 'next/link';
import { Sparkles, LayoutTemplate } from 'lucide-react';
import { markChecklistComplete } from '@/components/walkthrough/ProgressChecklist';

const nodeTypes = {
  custom: AgentNode,
};

export default function BuilderPage() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [showVibeInput, setShowVibeInput] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { setSuggestions, setIsAnalyzing } = useSuggestionsStore();

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
    viewMode,
  } = useBuilderStore();

  // Load vibe-generated workflow from session storage
  useEffect(() => {
    // Mark builder as visited for walkthrough checklist
    markChecklistComplete('builder');

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

  // Debounced workflow analysis
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (nodes.length === 0) {
        setSuggestions({ suggestions: [], workflowScore: 0 });
        return;
      }

      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/suggestions/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes, edges }),
        });

        if (response.ok) {
          const result = await response.json();
          setSuggestions(result);
        }
      } catch (error) {
        console.error('Analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [nodes, edges, setSuggestions, setIsAnalyzing]);

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
      // Ctrl/Cmd + Enter to open Vibe Code modal
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        setShowVibeInput(true);
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

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (nodes.length > 0 || edges.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [nodes.length, edges.length]);

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
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  // Handle connection
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge(connection.source, connection.target);
        // Mark workflow as complete when first connection is made
        markChecklistComplete('workflow');
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

  const handleVibeGenerate = async (description: string, provider: 'claude' | 'gemini') => {
    setErrorMessage(null);
    try {
      const response = await fetch('/api/vibe/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, provider }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to generate workflow');
        throw new Error(data.error || 'Failed to generate workflow');
      }

      useBuilderStore.getState().importWorkflow(data.nodes, data.edges);
      setShowVibeInput(false);

      // Mark vibe and workflow checklist items as complete
      markChecklistComplete('vibe');
      markChecklistComplete('workflow');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate workflow');
      throw error;
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-slate-900/50 backdrop-blur p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-lg font-medium text-white">Visual Workflow Builder</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <ViewToggle />

            {/* Templates */}
            <button
              onClick={() => setShowTemplateGallery(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
            >
              <LayoutTemplate className="h-4 w-4" /> Templates
            </button>

            {/* Vibe Coding */}
            <button
              onClick={() => setShowVibeInput(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Vibe Code
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
              aria-label="Undo last action"
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
              aria-label="Redo last action"
            >
              ↷
            </button>

            {/* Toggle Panel */}
            <button
              onClick={togglePanel}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors active:scale-[0.98]"
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
                      setErrorMessage(null);
                      try {
                        const response = await fetch('/api/builder/import', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ yaml: content }),
                        });
                        const data = await response.json();
                        if (response.ok) {
                          useBuilderStore.getState().importWorkflow(data.nodes, data.edges);
                        } else {
                          setErrorMessage(data.error || 'Failed to import workflow');
                        }
                      } catch (error) {
                        console.error('Import failed:', error);
                        setErrorMessage('Failed to import workflow. Invalid file format.');
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

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="bg-red-500/20 border-b border-red-500/50 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-red-400 text-sm">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Node Palette */}
        <NodePalette onDragStart={handleDragStart} />

        {/* Center: Canvas */}
        <div
          className={`flex-1 relative transition-all w-full h-full ${isDraggingOver ? 'ring-4 ring-blue-500/50 ring-inset' : ''}`}
          ref={reactFlowWrapper}
        >
          {isDraggingOver && viewMode === '2d' && (
            <div className="absolute inset-4 border-4 border-dashed border-blue-500 rounded-lg pointer-events-none z-10 bg-blue-500/5">
              <div className="flex items-center justify-center h-full">
                <div className="text-blue-400 text-base font-medium">Drop node here</div>
              </div>
            </div>
          )}
          {viewMode === '2d' ? (
            <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onDrop={(e) => {
              handleDrop(e);
              setIsDraggingOver(false);
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onInit={setReactFlowInstance}
            snapToGrid={true}
            snapGrid={[15, 15]}
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
          ) : (
            <ErrorBoundary fallback={<div className="flex items-center justify-center h-full text-white">3D view failed to load. Please use 2D view.</div>}>
              <Builder3DCanvas nodes={nodes} edges={edges} />
            </ErrorBoundary>
          )}

          {/* Node Count Badge */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur border border-white/[0.06] rounded-lg px-4 py-2 text-white text-sm">
            <span className="font-medium">{nodes.length}</span> nodes,{' '}
            <span className="font-medium">{edges.length}</span> edges
          </div>
        </div>

        {/* Right: Property Panel */}
        {isPanelOpen && <PropertyPanel />}

        {/* Right: Suggestions Panel */}
        <SuggestionsPanel />
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

      {/* Template Gallery */}
      <TemplateGallery
        isOpen={showTemplateGallery}
        onClose={() => setShowTemplateGallery(false)}
      />
      </div>
    </ErrorBoundary>
  );
}
