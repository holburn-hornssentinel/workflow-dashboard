import type { Node, Edge } from '@xyflow/react';
import type { Vector3 } from 'three';

export type ViewMode = '2d' | '3d';

export interface Node3DPosition {
  x: number;
  y: number;
  z: number;
}

export interface Node3DGeometry {
  type: 'sphere' | 'box' | 'octahedron' | 'torus' | 'cylinder' | 'cone';
  scale: number;
  color: string;
}

export interface Node3DData extends Node {
  position3d: Node3DPosition;
  geometry: Node3DGeometry;
}

export interface Edge3DData extends Edge {
  points: Vector3[];
  animated: boolean;
}

export interface LayoutConfig {
  scaleX: number;
  scaleY: number;
  layerSpacing: number;
  depthLayers: Record<string, number>;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  scaleX: 1,
  scaleY: 1,
  layerSpacing: 50,
  depthLayers: {
    start: 0,
    end: 0,
    agent: -50,
    tool: -100,
    condition: -100,
    loop: -75,
    parallel: -75,
  },
};

export const NODE_GEOMETRY_MAP: Record<string, Node3DGeometry> = {
  start: {
    type: 'cone',
    scale: 1.2,
    color: '#10b981', // emerald
  },
  end: {
    type: 'cone',
    scale: 1.2,
    color: '#ef4444', // red
  },
  agent: {
    type: 'sphere',
    scale: 1,
    color: '#3b82f6', // blue
  },
  tool: {
    type: 'box',
    scale: 1,
    color: '#22c55e', // green
  },
  condition: {
    type: 'octahedron',
    scale: 1,
    color: '#eab308', // yellow
  },
  loop: {
    type: 'torus',
    scale: 0.8,
    color: '#a855f7', // purple
  },
  parallel: {
    type: 'cylinder',
    scale: 1,
    color: '#f97316', // orange
  },
};
