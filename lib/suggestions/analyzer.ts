import type { AnalysisResult, AnalysisConfig, WorkflowGraph } from '@/types/suggestions';
import { checkParallelization } from './rules/parallelization';
import { checkWarnings } from './rules/warnings';
import { checkQuality } from './rules/quality';
import { checkSecurity, calculateSecurityScore } from './rules/security';

/**
 * Calculate workflow quality score (0-100)
 */
function calculateScore(graph: WorkflowGraph, suggestionCount: number): number {
  const { nodes } = graph;

  if (nodes.length === 0) return 0;

  // Start with base score
  let score = 100;

  // Deduct points for warnings (5 points each)
  score -= suggestionCount * 5;

  // Bonus points for good practices
  const hasStartNode = nodes.some((n) => n.data?.type === 'start');
  const hasEndNode = nodes.some((n) => n.data?.type === 'end');
  const hasParallelism = nodes.some((n) => n.data?.type === 'parallel');
  const hasErrorHandling = nodes.some((n) => n.data?.type === 'condition');

  if (hasStartNode) score += 5;
  if (hasEndNode) score += 5;
  if (hasParallelism) score += 5;
  if (hasErrorHandling) score += 5;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze workflow and return suggestions
 */
export async function analyzeWorkflow(
  graph: WorkflowGraph,
  config: AnalysisConfig = {}
): Promise<AnalysisResult> {
  const {
    checkParallelization: enableParallel = true,
    checkWarnings: enableWarnings = true,
    checkQuality: enableQuality = true,
  } = config;

  const suggestions = [];

  // Run rule-based analysis
  if (enableParallel) {
    suggestions.push(...checkParallelization(graph));
  }

  if (enableWarnings) {
    suggestions.push(...checkWarnings(graph));
  }

  if (enableQuality) {
    suggestions.push(...checkQuality(graph));
  }

  // Run security analysis (always enabled)
  const securitySuggestions = checkSecurity(graph);
  suggestions.push(...securitySuggestions);

  // Calculate scores
  const workflowScore = calculateScore(graph, suggestions.length);
  const securityScoreResult = calculateSecurityScore(securitySuggestions);

  return {
    suggestions,
    workflowScore,
    securityScore: securityScoreResult.overall,
  };
}
