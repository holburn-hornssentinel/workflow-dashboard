import type { Node } from '@xyflow/react';
import type { Node3DPosition, LayoutConfig } from '@/types/visualization';
import { DEFAULT_LAYOUT_CONFIG } from '@/types/visualization';

/**
 * Convert 2D React Flow positions to 3D space
 */
export function convert2DTo3D(
  nodes: Node[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Map<string, Node3DPosition> {
  const positions = new Map<string, Node3DPosition>();

  for (const node of nodes) {
    const nodeType = node.type || 'agent';
    const z = config.depthLayers[nodeType] ?? config.depthLayers.agent;

    positions.set(node.id, {
      x: (node.position?.x ?? 0) * config.scaleX,
      y: (node.position?.y ?? 0) * config.scaleY * -1, // Flip Y axis for 3D
      z,
    });
  }

  return positions;
}

/**
 * Calculate bounding box of 3D positions
 */
export function calculateBoundingBox(positions: Node3DPosition[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerY: number;
  centerZ: number;
} {
  if (positions.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      minZ: 0,
      maxZ: 0,
      centerX: 0,
      centerY: 0,
      centerZ: 0,
    };
  }

  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x));
  const minY = Math.min(...positions.map((p) => p.y));
  const maxY = Math.max(...positions.map((p) => p.y));
  const minZ = Math.min(...positions.map((p) => p.z));
  const maxZ = Math.max(...positions.map((p) => p.z));

  return {
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    centerZ: (minZ + maxZ) / 2,
  };
}

/**
 * Center positions around origin
 */
export function centerPositions(
  positions: Map<string, Node3DPosition>
): Map<string, Node3DPosition> {
  const posArray = Array.from(positions.values());
  const bbox = calculateBoundingBox(posArray);

  const centered = new Map<string, Node3DPosition>();
  for (const [id, pos] of positions.entries()) {
    centered.set(id, {
      x: pos.x - bbox.centerX,
      y: pos.y - bbox.centerY,
      z: pos.z - bbox.centerZ,
    });
  }

  return centered;
}
