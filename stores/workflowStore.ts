import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { Workflow, WorkflowData, StepStatus, StepStatusMap } from '@/types/workflow';

interface StreamingState {
  isStreaming: boolean;
  streamingStepKey: string | null;
  streamingChunks: string[];
  streamingError: string | null;
  abortController: AbortController | null;
}

interface WorkflowState {
  // Workflow data
  workflow: Workflow | null;
  nodes: Node[];
  edges: Edge[];

  // Wizard state
  currentStepIndex: number;
  stepOrder: string[]; // Ordered array of step keys
  stepStatus: StepStatusMap; // Track status of each step

  // Directory state
  workingDirectory: string;
  recentDirectories: string[];

  // Model selection
  selectedModel: string;

  // Execution state
  isExecuting: boolean;
  executionOutput: string[];

  // Streaming state
  streaming: StreamingState;

  // Actions
  setWorkflow: (data: WorkflowData) => void;
  goToStep: (index: number) => void;
  goToStepByKey: (stepKey: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  markStepStatus: (stepKey: string, status: StepStatus) => void;
  setWorkingDirectory: (path: string) => void;
  addRecentDirectory: (path: string) => void;
  setSelectedModel: (model: string) => void;
  setIsExecuting: (executing: boolean) => void;
  addExecutionOutput: (output: string) => void;
  clearExecutionOutput: () => void;

  // Streaming actions
  startStreaming: (stepKey: string, abortController: AbortController) => void;
  addStreamingChunk: (chunk: string) => void;
  stopStreaming: (error?: string) => void;
  abortStreaming: () => void;

  reset: () => void;
}

// Client-safe default working directory
const getDefaultWorkingDir = () => {
  if (typeof window === 'undefined') {
    // Server-side: use process.env.HOME
    return process.env.HOME || '/tmp';
  }
  // Client-side: use empty string, will be set by API call
  return '';
};

// Load recent directories from localStorage
const loadRecentDirectories = (): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('recentDirectories');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[WorkflowStore] Failed to load recent directories:', error);
    return [];
  }
};

// Save recent directories to localStorage
const saveRecentDirectories = (directories: string[]) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('recentDirectories', JSON.stringify(directories));
  } catch (error) {
    console.error('[WorkflowStore] Failed to save recent directories:', error);
  }
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  workflow: null,
  nodes: [],
  edges: [],
  currentStepIndex: 0,
  stepOrder: [],
  stepStatus: {},
  workingDirectory: getDefaultWorkingDir(),
  recentDirectories: loadRecentDirectories(),
  selectedModel: 'gemini-2.5-flash',
  isExecuting: false,
  executionOutput: [],
  streaming: {
    isStreaming: false,
    streamingStepKey: null,
    streamingChunks: [],
    streamingError: null,
    abortController: null,
  },

  // Set workflow data and initialize step order
  setWorkflow: (data: WorkflowData) => {
    const { workflow, nodes, edges } = data;

    // Extract step order from sorted step keys
    const sortedSteps = Object.keys(workflow.steps).sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
      return aNum - bNum;
    });

    // Initialize all steps as pending
    const initialStatus: StepStatusMap = {};
    sortedSteps.forEach((stepKey) => {
      initialStatus[stepKey] = 'pending';
    });

    // Mark first step as active
    if (sortedSteps.length > 0) {
      initialStatus[sortedSteps[0]] = 'active';
    }

    set({
      workflow,
      nodes,
      edges,
      stepOrder: sortedSteps,
      currentStepIndex: 0,
      stepStatus: initialStatus,
    });
  },

  // Navigate to step by index
  goToStep: (index: number) => {
    const { stepOrder, stepStatus } = get();

    if (index < 0 || index >= stepOrder.length) {
      return; // Out of bounds
    }

    // Update status: mark previous active as pending, new as active
    const newStatus = { ...stepStatus };
    Object.keys(newStatus).forEach((key) => {
      if (newStatus[key] === 'active') {
        newStatus[key] = 'pending';
      }
    });
    if (newStatus[stepOrder[index]] !== 'completed') {
      newStatus[stepOrder[index]] = 'active';
    }

    set({
      currentStepIndex: index,
      stepStatus: newStatus,
    });
  },

  // Navigate to step by key
  goToStepByKey: (stepKey: string) => {
    const { stepOrder } = get();
    const index = stepOrder.indexOf(stepKey);
    if (index !== -1) {
      get().goToStep(index);
    }
  },

  // Navigate to next step
  nextStep: () => {
    const { currentStepIndex, stepOrder } = get();
    if (currentStepIndex < stepOrder.length - 1) {
      get().goToStep(currentStepIndex + 1);
    }
  },

  // Navigate to previous step
  previousStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      get().goToStep(currentStepIndex - 1);
    }
  },

  // Mark step status (pending, active, completed, error)
  markStepStatus: (stepKey: string, status: StepStatus) => {
    const { stepStatus } = get();
    set({
      stepStatus: {
        ...stepStatus,
        [stepKey]: status,
      },
    });
  },

  // Set working directory
  setWorkingDirectory: (path: string) => {
    set({ workingDirectory: path });
    get().addRecentDirectory(path);
  },

  // Add directory to recent list (max 10)
  addRecentDirectory: (path: string) => {
    const { recentDirectories } = get();
    const filtered = recentDirectories.filter((dir) => dir !== path);
    const updated = [path, ...filtered].slice(0, 10);
    set({ recentDirectories: updated });

    // Persist to localStorage using helper
    saveRecentDirectories(updated);
  },

  // Set selected AI model
  setSelectedModel: (model: string) => {
    set({ selectedModel: model });
  },

  // Set execution state
  setIsExecuting: (executing: boolean) => {
    set({ isExecuting: executing });
  },

  // Add execution output line
  addExecutionOutput: (output: string) => {
    const { executionOutput } = get();
    set({ executionOutput: [...executionOutput, output] });
  },

  // Clear execution output
  clearExecutionOutput: () => {
    set({ executionOutput: [] });
  },

  // Start streaming for a step
  startStreaming: (stepKey: string, abortController: AbortController) => {
    set({
      streaming: {
        isStreaming: true,
        streamingStepKey: stepKey,
        streamingChunks: [],
        streamingError: null,
        abortController,
      },
    });
  },

  // Add streaming chunk
  addStreamingChunk: (chunk: string) => {
    const { streaming } = get();
    set({
      streaming: {
        ...streaming,
        streamingChunks: [...streaming.streamingChunks, chunk],
      },
    });
  },

  // Stop streaming
  stopStreaming: (error?: string) => {
    const { streaming } = get();
    set({
      streaming: {
        ...streaming,
        isStreaming: false,
        streamingError: error || null,
        abortController: null,
      },
    });
  },

  // Abort streaming
  abortStreaming: () => {
    const { streaming } = get();
    if (streaming.abortController) {
      streaming.abortController.abort();
    }
    set({
      streaming: {
        ...streaming,
        isStreaming: false,
        abortController: null,
      },
    });
  },

  // Reset store to initial state
  reset: () => {
    set({
      workflow: null,
      nodes: [],
      edges: [],
      currentStepIndex: 0,
      stepOrder: [],
      stepStatus: {},
      workingDirectory: getDefaultWorkingDir(),
      selectedModel: 'gemini-2.5-flash',
      isExecuting: false,
      executionOutput: [],
      streaming: {
        isStreaming: false,
        streamingStepKey: null,
        streamingChunks: [],
        streamingError: null,
        abortController: null,
      },
    });
  },
}));

// Selector hooks for common use cases
export const useCurrentStep = () => {
  return useWorkflowStore((state) => {
    if (!state.workflow || state.stepOrder.length === 0) {
      return null;
    }
    const stepKey = state.stepOrder[state.currentStepIndex];
    return {
      key: stepKey,
      step: state.workflow.steps[stepKey],
      index: state.currentStepIndex,
      total: state.stepOrder.length,
      status: state.stepStatus[stepKey],
    };
  });
};

export const useStepByKey = (stepKey: string) => {
  return useWorkflowStore((state) => {
    if (!state.workflow || !stepKey) {
      return null;
    }
    return {
      key: stepKey,
      step: state.workflow.steps[stepKey],
      status: state.stepStatus[stepKey],
    };
  });
};
