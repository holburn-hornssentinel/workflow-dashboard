import type { Node3DGeometry } from '@/types/visualization';
import { NODE_GEOMETRY_MAP } from '@/types/visualization';

/**
 * Get 3D geometry configuration for a node type
 */
export function getNodeGeometry(nodeType?: string): Node3DGeometry {
  if (!nodeType) {
    return NODE_GEOMETRY_MAP.agent;
  }

  return NODE_GEOMETRY_MAP[nodeType] ?? NODE_GEOMETRY_MAP.agent;
}

/**
 * Get color for node type
 */
export function getNodeColor(nodeType?: string): string {
  return getNodeGeometry(nodeType).color;
}

/**
 * Get scale for node type
 */
export function getNodeScale(nodeType?: string): number {
  return getNodeGeometry(nodeType).scale;
}

/**
 * Check if node type should be rendered as cone pointing down
 */
export function isConePointingDown(nodeType?: string): boolean {
  return nodeType === 'end';
}
