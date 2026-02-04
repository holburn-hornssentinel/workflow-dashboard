'use client';

import { useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Material } from 'three';
import type { Node3DPosition } from '@/types/visualization';

interface Edge3DProps {
  sourcePos: Node3DPosition;
  targetPos: Node3DPosition;
  animated?: boolean;
}

export function Edge3D({ sourcePos, targetPos, animated = false }: Edge3DProps) {
  const lineRef = useRef<Material>(null);

  // Animate dashed line
  useFrame(() => {
    if (lineRef.current && animated) {
      // @ts-expect-error - dashOffset exists on LineDashedMaterial
      if (lineRef.current.dashOffset !== undefined) {
        // @ts-expect-error - dashOffset exists on LineDashedMaterial
        lineRef.current.dashOffset -= 0.01;
      }
    }
  });

  // Create bezier curve for more natural connection
  const midX = (sourcePos.x + targetPos.x) / 2;
  const midY = (sourcePos.y + targetPos.y) / 2;
  const midZ = (sourcePos.z + targetPos.z) / 2;

  // Add slight curve
  const curveOffset = 5;
  const points: [number, number, number][] = [
    [sourcePos.x, sourcePos.y, sourcePos.z],
    [midX, midY + curveOffset, midZ],
    [targetPos.x, targetPos.y, targetPos.z],
  ];

  return (
    <Line
      points={points}
      color="#64748b"
      lineWidth={2}
      dashed={animated}
      dashScale={50}
      dashSize={3}
      dashOffset={0}
      // @ts-expect-error - ref type mismatch
      ref={lineRef}
    />
  );
}
