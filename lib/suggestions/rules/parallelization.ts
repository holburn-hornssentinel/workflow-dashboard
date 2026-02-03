import { nanoid } from 'nanoid';
import type { Suggestion, WorkflowGraph } from '@/types/suggestions';

/**
 * Detect parallelizable steps in workflow
 * Finds nodes with same parent that have no inter-dependencies
 */
export function checkParallelization(graph: WorkflowGraph): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const { nodes, edges } = graph;

  // Build adjacency map
  const childrenMap = new Map<string, Set<string>>();
  const parentsMap = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, new Set());
    }
    childrenMap.get(edge.source)!.add(edge.target);

    if (!parentsMap.has(edge.target)) {
      parentsMap.set(edge.target, new Set());
    }
    parentsMap.get(edge.target)!.add(edge.source);
  }

  // Find groups of siblings that could be parallelized
  const processedGroups = new Set<string>();

  for (const [parentId, children] of childrenMap.entries()) {
    const childrenArray = Array.from(children);

    // Need at least 2 children to parallelize
    if (childrenArray.length < 2) continue;

    // Check if any children already in a parallel node
    const hasParallelChild = childrenArray.some((childId) => {
      const childNode = nodes.find((n) => n.id === childId);
      return childNode?.data?.type === 'parallel';
    });

    if (hasParallelChild) continue;

    // Check for inter-dependencies between siblings
    let hasInterDeps = false;
    for (let i = 0; i < childrenArray.length; i++) {
      for (let j = i + 1; j < childrenArray.length; j++) {
        const child1 = childrenArray[i];
        const child2 = childrenArray[j];

        // Check if there's an edge between these siblings
        const hasEdge = edges.some(
          (e) =>
            (e.source === child1 && e.target === child2) ||
            (e.source === child2 && e.target === child1)
        );

        if (hasEdge) {
          hasInterDeps = true;
          break;
        }
      }
      if (hasInterDeps) break;
    }

    if (!hasInterDeps) {
      const groupKey = childrenArray.sort().join(',');
      if (!processedGroups.has(groupKey)) {
        processedGroups.add(groupKey);

        const parentNode = nodes.find((n) => n.id === parentId);
        const childNodes = nodes.filter((n) => childrenArray.includes(n.id));

        suggestions.push({
          id: nanoid(),
          type: 'optimization',
          title: 'Parallel execution opportunity detected',
          description: `${childrenArray.length} independent steps after "${parentNode?.data?.label || parentId}" can run in parallel. Group them into a parallel node for faster execution.`,
          impact: 'high',
          estimatedSpeedup: `~${childrenArray.length}x faster`,
          nodeIds: childrenArray,
        });
      }
    }
  }

  return suggestions;
}
