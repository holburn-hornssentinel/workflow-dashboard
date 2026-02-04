// Shared TypeScript interfaces for workflow dashboard

import { Node, Edge } from '@xyflow/react';

// Workflow step definition
export interface WorkflowStep {
  name: string;
  duration?: string;
  model_recommendation?: string;
  ai_prompt?: string;
  tasks?: Record<string, WorkflowTask>;
  checklist?: string[];
  output?: string;
  next_step?: string;
}

// Workflow task (sub-task within a step)
export interface WorkflowTask {
  name: string;
  ai_prompt?: string;
  duration?: string;
}

// Workflow metadata
export interface Workflow {
  name: string;
  version: string;
  description: string;
  estimated_duration?: string;
  difficulty?: 'low' | 'medium' | 'high';
  phases?: string[];
  steps: Record<string, WorkflowStep>;
}

// Complete workflow data with React Flow nodes/edges
export interface WorkflowData {
  workflow: Workflow;
  nodes: Node[];
  edges: Edge[];
}

// Step execution status
export type StepStatus = 'pending' | 'active' | 'completed' | 'error';

// Step status record
export interface StepStatusMap {
  [stepKey: string]: StepStatus;
}

// Directory entry for folder browser
export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isGitRepo: boolean;
}

// Git repository info
export interface GitRepo {
  name: string;
  path: string;
  lastModified: Date;
}

// Execution output message
export interface ExecutionMessage {
  type: 'output' | 'error' | 'tool' | 'status';
  content: string;
  timestamp: Date;
  stepKey?: string;
}
