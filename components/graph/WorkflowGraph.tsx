'use client';

import { useMemo, memo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EnhancedWorkflowNode from './EnhancedWorkflowNode';

interface WorkflowGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (event: any, node: Node) => void;
  selectedNodeId?: string;
}

function WorkflowGraph({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
}: WorkflowGraphProps) {
  // Define custom node types
  const nodeTypes = useMemo(() => ({ workflowStep: EnhancedWorkflowNode }), []);

  // Only transform nodes if we have a selectedNodeId to avoid creating new objects unnecessarily
  const nodesWithSelection = useMemo(
    () => {
      if (!selectedNodeId) {
        return nodes; // Pass through unchanged to prevent object recreation
      }
      return nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      }));
    },
    [nodes, selectedNodeId]
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        className="bg-slate-900"
        style={{ width: '100%', height: '100%' }}
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background color="#475569" gap={16} />
        <Controls className="bg-slate-800 border-white/[0.06]" />
        <MiniMap
          className="bg-slate-800 border-white/[0.06]"
          nodeColor={(node) => (node.selected ? '#60a5fa' : '#3b82f6')}
        />
      </ReactFlow>
    </div>
  );
}

export default memo(WorkflowGraph);
