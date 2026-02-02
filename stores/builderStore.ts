import { create } from 'zustand';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import { nanoid } from 'nanoid';

export type NodeType = 'agent' | 'tool' | 'condition' | 'loop' | 'parallel' | 'start' | 'end';

export interface AgentNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  prompt?: string;
  model?: string;
  tools?: string[];
  config?: Record<string, any>;
}

interface HistoryState {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
}

interface BuilderState {
  // Canvas state
  nodes: Node<AgentNodeData>[];
  edges: Edge[];

  // Selection state
  selectedNodes: string[];
  selectedEdges: string[];

  // History for undo/redo
  history: HistoryState[];
  historyIndex: number;

  // UI state
  isPanelOpen: boolean;
  selectedNodeId: string | null;

  // Actions - Node Management
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (id: string, data: Partial<AgentNodeData>) => void;
  deleteNode: (id: string) => void;

  // Actions - Edge Management
  addEdge: (source: string, target: string) => void;
  deleteEdge: (id: string) => void;

  // Actions - Selection
  selectNode: (id: string | null) => void;
  selectNodes: (ids: string[]) => void;
  selectEdges: (ids: string[]) => void;
  clearSelection: () => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveHistory: () => void;

  // Actions - UI
  togglePanel: () => void;
  setIsPanelOpen: (open: boolean) => void;

  // Actions - Import/Export
  importWorkflow: (nodes: Node<AgentNodeData>[], edges: Edge[]) => void;
  exportWorkflow: () => { nodes: Node<AgentNodeData>[]; edges: Edge[] };
  reset: () => void;
}

const initialState = {
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
  history: [],
  historyIndex: -1,
  isPanelOpen: true,
  selectedNodeId: null,
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  ...initialState,

  // Node changes from React Flow
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<AgentNodeData>[],
    });
  },

  // Edge changes from React Flow
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  // Add new node
  addNode: (type: NodeType, position: { x: number; y: number }) => {
    const id = nanoid();
    const newNode: Node<AgentNodeData> = {
      id,
      type: 'custom',
      position,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        type,
      },
    };

    set({ nodes: [...get().nodes, newNode] });
    get().saveHistory();
  },

  // Update node data
  updateNode: (id: string, data: Partial<AgentNodeData>) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
    get().saveHistory();
  },

  // Delete node
  deleteNode: (id: string) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
    });
    get().saveHistory();
  },

  // Add edge
  addEdge: (source: string, target: string) => {
    const id = nanoid();
    const newEdge: Edge = {
      id,
      source,
      target,
      type: 'smoothstep',
    };

    set({ edges: [...get().edges, newEdge] });
    get().saveHistory();
  },

  // Delete edge
  deleteEdge: (id: string) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== id),
    });
    get().saveHistory();
  },

  // Select node
  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  // Select multiple nodes
  selectNodes: (ids: string[]) => {
    set({ selectedNodes: ids });
  },

  // Select multiple edges
  selectEdges: (ids: string[]) => {
    set({ selectedEdges: ids });
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedNodes: [], selectedEdges: [], selectedNodeId: null });
  },

  // Save current state to history
  saveHistory: () => {
    const { nodes, edges, history, historyIndex } = get();

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);

    // Add current state
    newHistory.push({ nodes: [...nodes], edges: [...edges] });

    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // Undo
  undo: () => {
    const { history, historyIndex } = get();

    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({
        nodes: [...prevState.nodes],
        edges: [...prevState.edges],
        historyIndex: historyIndex - 1,
      });
    }
  },

  // Redo
  redo: () => {
    const { history, historyIndex } = get();

    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        nodes: [...nextState.nodes],
        edges: [...nextState.edges],
        historyIndex: historyIndex + 1,
      });
    }
  },

  // Check if can undo
  canUndo: () => {
    return get().historyIndex > 0;
  },

  // Check if can redo
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  // Toggle property panel
  togglePanel: () => {
    set({ isPanelOpen: !get().isPanelOpen });
  },

  // Set panel open state
  setIsPanelOpen: (open: boolean) => {
    set({ isPanelOpen: open });
  },

  // Import workflow from YAML
  importWorkflow: (nodes: Node<AgentNodeData>[], edges: Edge[]) => {
    set({ nodes, edges });
    get().saveHistory();
  },

  // Export workflow to YAML
  exportWorkflow: () => {
    const { nodes, edges } = get();
    return { nodes, edges };
  },

  // Reset builder
  reset: () => {
    set(initialState);
  },
}));
