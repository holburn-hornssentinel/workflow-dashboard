import type { Node, Edge } from '@xyflow/react';

export type SuggestionType = 'optimization' | 'warning' | 'quality' | 'security';
export type { SecuritySeverity } from './security';
export type SuggestionImpact = 'high' | 'medium' | 'low';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  impact?: SuggestionImpact;
  estimatedSpeedup?: string;
  mitigation?: string;
  nodeIds?: string[];
}

export interface AnalysisResult {
  suggestions: Suggestion[];
  workflowScore: number; // 0-100
  securityScore?: number; // 0-100, added by security scanner
}

export interface AnalysisConfig {
  useAI?: boolean;
  checkParallelization?: boolean;
  checkWarnings?: boolean;
  checkQuality?: boolean;
}

export interface WorkflowGraph {
  nodes: Node[];
  edges: Edge[];
}

export interface SuggestionRule {
  name: string;
  check: (graph: WorkflowGraph) => Suggestion[];
  priority: number;
}
