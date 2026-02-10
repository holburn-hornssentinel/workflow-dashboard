/**
 * Workflow template data model
 */

import type { Node, Edge } from '@xyflow/react';
import type { AgentNodeData } from '@/stores/builderStore';

export type TemplateCategory = 'security' | 'devops' | 'data-pipeline' | 'content' | 'code-review';
export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  tags: string[];
  securityScore: number;
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  metadata: {
    author: string;
    version: string;
    createdAt: string;
    estimatedCost: string;
    requiredProviders: ('claude' | 'gemini')[];
  };
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  tags: string[];
  securityScore: number;
  metadata: WorkflowTemplate['metadata'];
}
