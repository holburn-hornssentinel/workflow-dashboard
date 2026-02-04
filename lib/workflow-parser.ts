import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface WorkflowStep {
  name: string;
  duration?: string;
  model_recommendation?: string;
  ai_prompt?: string;
  tasks?: Record<string, any>;
  checklist?: string[];
  output?: string;
  next_step?: string;
}

export interface Workflow {
  name: string;
  version: string;
  description: string;
  estimated_duration?: string;
  difficulty?: string;
  phases?: string[];
  steps: Record<string, WorkflowStep>;
}

export interface WorkflowNode {
  id: string;
  type: 'workflowStep';
  position: { x: number; y: number };
  data: {
    label: string;
    duration?: string;
    model?: string;
    description?: string;
    stepKey: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

/**
 * Load all workflows from the ~/.claude/workflows directory
 */
export function loadWorkflows(): Workflow[] {
  const workflowDir = path.join(process.env.HOME || '', '.claude', 'workflows');

  if (!fs.existsSync(workflowDir)) {
    console.warn(`Workflow directory not found: ${workflowDir}`);
    return [];
  }

  const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yaml'));

  return files.map(file => {
    const filePath = path.join(workflowDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    try {
      const parsed = yaml.load(content) as any;

      // Extract steps - handle both flat and nested structures
      const steps: Record<string, WorkflowStep> = {};

      // Reserved keys that should not be treated as steps
      const reservedKeys = [
        'name', 'version', 'description', 'estimated_duration',
        'difficulty', 'phases', 'overview', 'workflow_diagram',
        'review_philosophy', 'deployment_types', 'environments',
        'metrics', 'common_issues', 'notes', 'useful_commands'
      ];

      Object.keys(parsed).forEach(key => {
        // Skip reserved metadata keys
        if (reservedKeys.includes(key)) {
          return;
        }

        const value = parsed[key];

        // Skip if not an object
        if (typeof value !== 'object' || value === null) {
          return;
        }

        // Flat structure: step_1, step_2, etc.
        if (key.startsWith('step_')) {
          steps[key] = value;
        }
        // Nested structure: phase_X.steps
        else if (key.startsWith('phase_') && value.steps) {
          Object.entries(value.steps).forEach(([stepKey, stepData]: [string, any]) => {
            const fullKey = `${key}_${stepKey}`;
            steps[fullKey] = stepData;
          });
        }
        // Flexible: any object with 'name' property or workflow-like key names
        else if (
          value.name ||
          key.includes('_phase') ||
          key.includes('_preparation') ||
          key.includes('_stage') ||
          key.includes('_deployment') ||
          key.includes('_review') ||
          key.includes('_response') ||
          key.includes('_approval') ||
          key.includes('rollback')
        ) {
          steps[key] = value;
        }
      });

      return {
        name: parsed.name || file,
        version: parsed.version || '1.0.0',
        description: parsed.description || '',
        estimated_duration: parsed.estimated_duration,
        difficulty: parsed.difficulty,
        phases: parsed.phases,
        steps,
      };
    } catch (error) {
      console.error(`Error parsing workflow ${file}:`, error);
      return null;
    }
  }).filter(Boolean) as Workflow[];
}

/**
 * Convert workflow steps to React Flow nodes and edges
 * Uses a flowing zigzag layout for better visualization
 */
export function workflowToGraph(workflow: Workflow): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  // Sort steps by key (step_1, step_2, etc.)
  const sortedSteps = Object.keys(workflow.steps).sort((a, b) => {
    const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
    const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
    return aNum - bNum;
  });

  // Layout configuration for better visual flow
  const HORIZONTAL_SPACING = 500; // Increased from 400 for larger nodes
  const VERTICAL_SPACING = 280; // Increased from 200 for better spacing
  const ITEMS_PER_ROW = 2; // Reduced from 3 to give nodes more room

  sortedSteps.forEach((stepKey, index) => {
    const step = workflow.steps[stepKey];

    // Calculate zigzag position
    const row = Math.floor(index / ITEMS_PER_ROW);
    const col = index % ITEMS_PER_ROW;

    // Alternate row direction for flowing layout
    const isEvenRow = row % 2 === 0;
    const xPosition = isEvenRow
      ? col * HORIZONTAL_SPACING + 100
      : (ITEMS_PER_ROW - 1 - col) * HORIZONTAL_SPACING + 100;

    // Create node with better positioning
    nodes.push({
      id: stepKey,
      type: 'workflowStep',
      position: {
        x: xPosition,
        y: row * VERTICAL_SPACING + 50,
      },
      data: {
        label: step.name,
        duration: step.duration,
        model: step.model_recommendation,
        description: step.ai_prompt?.substring(0, 100) + '...' || '',
        stepKey,
      },
    });

    // Create edge to next step
    if (index < sortedSteps.length - 1) {
      edges.push({
        id: `e-${stepKey}-${sortedSteps[index + 1]}`,
        source: stepKey,
        target: sortedSteps[index + 1],
        type: 'smoothstep',
      });
    }
  });

  return { nodes, edges };
}

/**
 * Convert workflow name to URL-friendly slug
 */
export function workflowToSlug(workflow: Workflow): string {
  return workflow.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Get a single workflow by name
 */
export function getWorkflow(name: string): Workflow | null {
  const workflows = loadWorkflows();

  // Normalize both the search name and workflow names for comparison
  const normalizedSearch = name.toLowerCase().replace(/[-_\s]+/g, '');

  return workflows.find(w => {
    const normalizedWorkflow = w.name.toLowerCase().replace(/[-_\s]+/g, '');
    return normalizedWorkflow.includes(normalizedSearch) ||
           w.name.toLowerCase().includes(name.toLowerCase());
  }) || null;
}

/**
 * Get workflow statistics
 */
export function getWorkflowStats(workflow: Workflow) {
  const stepCount = Object.keys(workflow.steps).length;
  const totalTasks = Object.values(workflow.steps).reduce((acc, step) => {
    return acc + (step.tasks ? Object.keys(step.tasks).length : 0);
  }, 0);

  const modelsUsed = Array.from(new Set(
    Object.values(workflow.steps)
      .map(s => s.model_recommendation)
      .filter((m): m is string => Boolean(m))
  ));

  return {
    stepCount,
    totalTasks,
    modelsUsed,
    estimatedDuration: workflow.estimated_duration || 'Unknown',
    difficulty: workflow.difficulty || 'Medium',
  };
}

/**
 * Convert builder graph (nodes/edges) to YAML workflow
 */
export function graphToYaml(nodes: any[], edges: any[]): string {
  // Build workflow structure from graph
  const workflow: any = {
    name: 'Untitled Workflow',
    version: '1.0',
    description: 'Created with Visual Builder',
    steps: {},
  };

  // Convert nodes to steps
  nodes.forEach((node, index) => {
    const stepKey = `step${index + 1}`;
    const step: any = {
      name: node.data.label,
    };

    if (node.data.prompt) {
      step.ai_prompt = node.data.prompt;
    }

    if (node.data.model) {
      step.model_recommendation = node.data.model;
    }

    // Find outgoing edges
    const outgoingEdges = edges.filter((e) => e.source === node.id);
    if (outgoingEdges.length > 0) {
      // For now, just use the first outgoing edge
      const targetNode = nodes.find((n) => n.id === outgoingEdges[0].target);
      if (targetNode) {
        const targetIndex = nodes.findIndex((n) => n.id === targetNode.id);
        step.next_step = `step${targetIndex + 1}`;
      }
    }

    workflow.steps[stepKey] = step;
  });

  return yaml.dump(workflow);
}

/**
 * Convert YAML workflow to builder graph (nodes/edges)
 */
export function yamlToGraph(yamlContent: string): { nodes: any[]; edges: any[] } {
  const workflow = yaml.load(yamlContent) as Workflow;
  const nodes: any[] = [];
  const edges: any[] = [];

  const stepKeys = Object.keys(workflow.steps);
  const SPACING = 300;

  stepKeys.forEach((stepKey, index) => {
    const step = workflow.steps[stepKey];

    // Determine node type from step properties
    let nodeType = 'agent';
    if (stepKey.includes('condition') || stepKey.includes('check')) {
      nodeType = 'condition';
    } else if (stepKey.includes('loop')) {
      nodeType = 'loop';
    } else if (stepKey.includes('parallel')) {
      nodeType = 'parallel';
    } else if (index === 0) {
      nodeType = 'start';
    } else if (index === stepKeys.length - 1) {
      nodeType = 'end';
    }

    nodes.push({
      id: stepKey,
      type: 'custom',
      position: {
        x: (index % 3) * SPACING + 100,
        y: Math.floor(index / 3) * SPACING + 100,
      },
      data: {
        label: step.name,
        type: nodeType,
        prompt: step.ai_prompt,
        model: step.model_recommendation,
      },
    });

    // Create edge to next step
    if (step.next_step) {
      edges.push({
        id: `e-${stepKey}-${step.next_step}`,
        source: stepKey,
        target: step.next_step,
        type: 'smoothstep',
      });
    }
  });

  return { nodes, edges };
}
