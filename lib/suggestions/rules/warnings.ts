import { nanoid } from 'nanoid';
import type { Suggestion, WorkflowGraph } from '@/types/suggestions';

/**
 * Detect risky configurations and potential issues
 */
export function checkWarnings(graph: WorkflowGraph): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const { nodes, edges } = graph;

  // Build outgoing edges map
  const outgoingMap = new Map<string, number>();
  for (const edge of edges) {
    outgoingMap.set(edge.source, (outgoingMap.get(edge.source) || 0) + 1);
  }

  for (const node of nodes) {
    const nodeType = node.data?.type;
    const config = (node.data?.config || {}) as Record<string, any>;

    // Check loop nodes without maxIterations
    if (nodeType === 'loop') {
      if (!config.maxIterations || config.maxIterations <= 0) {
        suggestions.push({
          id: nanoid(),
          type: 'warning',
          title: 'Loop without iteration limit',
          description: `Loop node "${node.data?.label || node.id}" has no maxIterations set. This could cause infinite loops.`,
          impact: 'high',
          mitigation: 'Add a maxIterations value in the node configuration',
          nodeIds: [node.id],
        });
      }
    }

    // Check agent nodes without error handling
    if (nodeType === 'agent') {
      const hasErrorBranch = edges.some(
        (e) => e.source === node.id && e.sourceHandle === 'error'
      );

      if (!hasErrorBranch) {
        suggestions.push({
          id: nanoid(),
          type: 'warning',
          title: 'Agent without error handling',
          description: `Agent "${node.data?.label || node.id}" has no error handling branch. Failures will halt the workflow.`,
          impact: 'medium',
          mitigation: 'Add an error handler node or condition to gracefully handle failures',
          nodeIds: [node.id],
        });
      }
    }

    // Check tool nodes without timeout
    if (nodeType === 'tool') {
      if (!config.timeout) {
        suggestions.push({
          id: nanoid(),
          type: 'warning',
          title: 'Tool without timeout',
          description: `Tool "${node.data?.label || node.id}" has no timeout configured. Long-running operations could hang indefinitely.`,
          impact: 'medium',
          mitigation: 'Set a reasonable timeout value (e.g., 30000ms)',
          nodeIds: [node.id],
        });
      }
    }

    // Check for dead-end nodes (not 'end' type but no outgoing edges)
    if (nodeType !== 'end') {
      const outgoingCount = outgoingMap.get(node.id) || 0;
      if (outgoingCount === 0) {
        suggestions.push({
          id: nanoid(),
          type: 'warning',
          title: 'Dead-end node detected',
          description: `Node "${node.data?.label || node.id}" has no outgoing connections. Consider connecting it or changing it to an 'end' node.`,
          impact: 'low',
          mitigation: 'Add outgoing edge or change node type to "end"',
          nodeIds: [node.id],
        });
      }
    }
  }

  return suggestions;
}
