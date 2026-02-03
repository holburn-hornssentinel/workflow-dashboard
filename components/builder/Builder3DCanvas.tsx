'use client';

import { Canvas } from '@react-three/fiber';
import type { Node, Edge } from '@xyflow/react';
import { Scene3D } from './Scene3D';
import { Node3D } from './Node3D';
import { Edge3D } from './Edge3D';
import { convert2DTo3D, centerPositions } from '@/lib/3d/layoutAlgorithm';
import { useBuilderStore } from '@/stores/builderStore';
import { useMemo } from 'react';

interface Builder3DCanvasProps {
  nodes: Node[];
  edges: Edge[];
}

export function Builder3DCanvas({ nodes, edges }: Builder3DCanvasProps) {
  const { selectedNodeId, setSelectedNodeId } = useBuilderStore();

  // Convert 2D positions to 3D
  const positions3D = useMemo(() => {
    const converted = convert2DTo3D(nodes);
    return centerPositions(converted);
  }, [nodes]);

  const handleNodeSelect = (id: string) => {
    setSelectedNodeId(id);
  };

  return (
    <div className="w-full h-full bg-gray-900">
      <Canvas
        camera={{
          position: [0, 0, 100],
          fov: 50,
        }}
        style={{ background: '#111827' }}
      >
        <Scene3D />

        {/* Render nodes */}
        {nodes.map((node) => {
          const position = positions3D.get(node.id);
          if (!position) return null;

          return (
            <Node3D
              key={node.id}
              node={node}
              position={position}
              selected={selectedNodeId === node.id}
              onSelect={handleNodeSelect}
            />
          );
        })}

        {/* Render edges */}
        {edges.map((edge) => {
          const sourcePos = positions3D.get(edge.source);
          const targetPos = positions3D.get(edge.target);
          if (!sourcePos || !targetPos) return null;

          return (
            <Edge3D
              key={edge.id}
              sourcePos={sourcePos}
              targetPos={targetPos}
              animated={edge.animated}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
