import { nanoid } from 'nanoid';
import type { Suggestion, WorkflowGraph } from '@/types/suggestions';

/**
 * Suggest best practices and quality improvements
 */
export function checkQuality(graph: WorkflowGraph): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const { nodes, edges } = graph;

  // Check for monitoring/logging nodes
  const hasLoggingNode = nodes.some((n) => {
    const label = String(n.data?.label || '').toLowerCase();
    return label.includes('log') || label.includes('monitor');
  });

  if (!hasLoggingNode && nodes.length > 5) {
    suggestions.push({
      id: nanoid(),
      type: 'quality',
      title: 'Consider adding logging',
      description: 'Large workflows benefit from logging nodes to track execution progress and debug issues.',
      impact: 'low',
      mitigation: 'Add tool nodes that log key steps or state changes',
      nodeIds: [],
    });
  }

  // Check for long chains without checkpoints
  const MAX_CHAIN_LENGTH = 7;
  const visited = new Set<string>();
  const chains: string[][] = [];

  const findChains = (nodeId: string, chain: string[]) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    chain.push(nodeId);

    const outgoing = edges.filter((e) => e.source === nodeId);
    if (outgoing.length === 0) {
      chains.push([...chain]);
    } else {
      for (const edge of outgoing) {
        findChains(edge.target, [...chain]);
      }
    }
  };

  // Find start nodes
  const targetIds = new Set(edges.map((e) => e.target));
  const startNodes = nodes.filter((n) => !targetIds.has(n.id));

  for (const startNode of startNodes) {
    findChains(startNode.id, []);
  }

  for (const chain of chains) {
    if (chain.length > MAX_CHAIN_LENGTH) {
      suggestions.push({
        id: nanoid(),
        type: 'quality',
        title: 'Long chain without checkpoints',
        description: `A chain of ${chain.length} nodes detected. Consider adding checkpoint or validation nodes to make debugging easier.`,
        impact: 'low',
        mitigation: 'Break long chains with condition or validation nodes',
        nodeIds: chain,
      });
    }
  }

  // Check for input validation at workflow start
  const hasInputValidation = startNodes.some((n) => {
    const nodeType = n.data?.type;
    const label = String(n.data?.label || '').toLowerCase();
    return nodeType === 'condition' || label.includes('validat');
  });

  if (!hasInputValidation && nodes.length > 3) {
    suggestions.push({
      id: nanoid(),
      type: 'quality',
      title: 'Missing input validation',
      description: 'No input validation detected at workflow start. Validate inputs early to fail fast on invalid data.',
      impact: 'medium',
      mitigation: 'Add a condition node to validate inputs at the start',
      nodeIds: startNodes.map((n) => n.id),
    });
  }

  // Check for proper start/end nodes
  const hasStartNode = nodes.some((n) => n.data?.type === 'start');
  const hasEndNode = nodes.some((n) => n.data?.type === 'end');

  if (!hasStartNode && nodes.length > 0) {
    suggestions.push({
      id: nanoid(),
      type: 'quality',
      title: 'No start node defined',
      description: 'Workflows should have an explicit start node for clarity.',
      impact: 'low',
      mitigation: 'Add a start node at the beginning of your workflow',
      nodeIds: [],
    });
  }

  if (!hasEndNode && nodes.length > 0) {
    suggestions.push({
      id: nanoid(),
      type: 'quality',
      title: 'No end node defined',
      description: 'Workflows should have an explicit end node for clarity.',
      impact: 'low',
      mitigation: 'Add an end node at the conclusion of your workflow',
      nodeIds: [],
    });
  }

  return suggestions;
}
