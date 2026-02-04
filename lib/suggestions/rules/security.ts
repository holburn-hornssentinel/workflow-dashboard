/**
 * Security rule checks for workflow analysis
 * Detects potential security vulnerabilities in workflows
 */

import type { WorkflowGraph } from '@/types/suggestions';
import type {
  SecuritySuggestion,
  SecuritySeverity,
  SecurityScore,
} from '@/types/security';
import {
  DANGEROUS_TOOLS,
  SECURITY_PATTERNS,
} from '@/types/security';

/**
 * Main security check function
 * Analyzes workflow graph for security vulnerabilities
 */
export function checkSecurity(graph: WorkflowGraph): SecuritySuggestion[] {
  const suggestions: SecuritySuggestion[] = [];

  // Check each node for security issues
  for (const node of graph.nodes) {
    suggestions.push(...checkNodeSecurity(node));
  }

  // Check for workflow-level security issues
  suggestions.push(...checkWorkflowPatterns(graph));

  return suggestions;
}

/**
 * Calculate security score based on detected issues
 */
export function calculateSecurityScore(
  suggestions: SecuritySuggestion[]
): SecurityScore {
  const criticalCount = suggestions.filter((s) => s.severity === 'critical').length;
  const highCount = suggestions.filter((s) => s.severity === 'high').length;
  const mediumCount = suggestions.filter((s) => s.severity === 'medium').length;
  const lowCount = suggestions.filter((s) => s.severity === 'low').length;

  // Calculate overall score (deduct points for each severity level)
  let score = 100;
  score -= criticalCount * 30;
  score -= highCount * 15;
  score -= mediumCount * 5;
  score -= lowCount * 2;

  return {
    overall: Math.max(0, score),
    critical: criticalCount,
    high: highCount,
    medium: mediumCount,
    low: lowCount,
  };
}

/**
 * Check individual node for security issues
 */
function checkNodeSecurity(node: any): SecuritySuggestion[] {
  const suggestions: SecuritySuggestion[] = [];

  // Check for dangerous tool usage
  if (node.type === 'mcp' && node.data?.toolId) {
    const dangerousToolCheck = checkDangerousTool(node);
    if (dangerousToolCheck) {
      suggestions.push(dangerousToolCheck);
    }
  }

  // Check for hardcoded credentials
  if (node.data?.prompt || node.data?.config) {
    const credentialCheck = checkHardcodedCredentials(node);
    if (credentialCheck) {
      suggestions.push(credentialCheck);
    }
  }

  // Check for command injection risks
  if (
    node.type === 'agent' &&
    (node.data?.prompt?.includes('exec') || node.data?.prompt?.includes('command'))
  ) {
    const commandCheck = checkCommandInjection(node);
    if (commandCheck) {
      suggestions.push(commandCheck);
    }
  }

  // Check for unrestricted file access
  if (node.type === 'mcp' && node.data?.toolId?.includes('filesystem')) {
    const fileAccessCheck = checkFileAccess(node);
    if (fileAccessCheck) {
      suggestions.push(fileAccessCheck);
    }
  }

  // Check for missing input validation
  if (node.type === 'agent' && !node.data?.validation) {
    const validationCheck = checkInputValidation(node);
    if (validationCheck) {
      suggestions.push(validationCheck);
    }
  }

  return suggestions;
}

/**
 * Check for dangerous tool usage
 */
function checkDangerousTool(node: any): SecuritySuggestion | null {
  const toolId = node.data?.toolId;

  for (const dangerousTool of DANGEROUS_TOOLS) {
    if (toolId.includes(dangerousTool)) {
      return {
        id: `sec-dangerous-tool-${node.id}`,
        type: 'security',
        severity: 'high',
        title: `Dangerous Tool: ${toolId}`,
        description: `Node "${node.data?.label || node.id}" uses dangerous tool "${toolId}" which can modify system state or execute commands.`,
        remediation:
          'Add human-in-the-loop approval for this tool call or restrict its usage to specific safe arguments.',
        cwe: 'CWE-250',
        nodeIds: [node.id],
      };
    }
  }

  return null;
}

/**
 * Check for hardcoded credentials
 */
function checkHardcodedCredentials(node: any): SecuritySuggestion | null {
  const textToCheck = [
    node.data?.prompt,
    JSON.stringify(node.data?.config),
    JSON.stringify(node.data?.args),
  ]
    .filter(Boolean)
    .join(' ');

  for (const pattern of SECURITY_PATTERNS.HARDCODED_CREDENTIALS) {
    if (pattern.test(textToCheck)) {
      return {
        id: `sec-credentials-${node.id}`,
        type: 'security',
        severity: 'critical',
        title: 'Hardcoded Credentials Detected',
        description: `Node "${node.data?.label || node.id}" appears to contain hardcoded credentials or API keys.`,
        remediation:
          'Use environment variables or secure credential storage instead of hardcoding sensitive values.',
        cwe: 'CWE-798',
        nodeIds: [node.id],
      };
    }
  }

  return null;
}

/**
 * Check for command injection risks
 */
function checkCommandInjection(node: any): SecuritySuggestion | null {
  const prompt = node.data?.prompt || '';

  // Check if prompt contains dynamic command execution
  for (const pattern of SECURITY_PATTERNS.COMMAND_INJECTION) {
    if (pattern.test(prompt)) {
      return {
        id: `sec-command-injection-${node.id}`,
        type: 'security',
        severity: 'critical',
        title: 'Command Injection Risk',
        description: `Node "${node.data?.label || node.id}" contains patterns that may allow command injection.`,
        remediation:
          'Sanitize all inputs and use safe command execution methods with argument arrays instead of string interpolation.',
        cwe: 'CWE-78',
        nodeIds: [node.id],
      };
    }
  }

  return null;
}

/**
 * Check for unrestricted file access
 */
function checkFileAccess(node: any): SecuritySuggestion | null {
  const args = node.data?.args || {};
  const path = args.path || args.filePath || '';

  // Check for path traversal attempts
  for (const pattern of SECURITY_PATTERNS.PATH_TRAVERSAL) {
    if (pattern.test(path)) {
      return {
        id: `sec-path-traversal-${node.id}`,
        type: 'security',
        severity: 'high',
        title: 'Path Traversal Risk',
        description: `Node "${node.data?.label || node.id}" has file operations with potentially unsafe paths.`,
        remediation:
          'Validate and sanitize file paths. Restrict operations to specific directories.',
        cwe: 'CWE-22',
        nodeIds: [node.id],
      };
    }
  }

  // Warn if no path validation is present
  if (path && !args.validatePath) {
    return {
      id: `sec-no-path-validation-${node.id}`,
      type: 'security',
      severity: 'medium',
      title: 'Missing Path Validation',
      description: `Node "${node.data?.label || node.id}" performs file operations without explicit path validation.`,
      remediation:
        'Add path validation to ensure operations are restricted to authorized directories.',
      cwe: 'CWE-73',
      nodeIds: [node.id],
    };
  }

  return null;
}

/**
 * Check for missing input validation
 */
function checkInputValidation(node: any): SecuritySuggestion | null {
  // Check if node accepts external input without validation
  const hasExternalInput = node.data?.input || node.data?.variables;
  const hasValidation = node.data?.validation || node.data?.schema;

  if (hasExternalInput && !hasValidation) {
    return {
      id: `sec-no-validation-${node.id}`,
      type: 'security',
      severity: 'medium',
      title: 'Missing Input Validation',
      description: `Agent node "${node.data?.label || node.id}" accepts external input without validation.`,
      remediation:
        'Add input validation using schemas (e.g., Zod) to ensure data integrity and prevent injection attacks.',
      cwe: 'CWE-20',
      nodeIds: [node.id],
    };
  }

  return null;
}

/**
 * Check for workflow-level security patterns
 */
function checkWorkflowPatterns(graph: WorkflowGraph): SecuritySuggestion[] {
  const suggestions: SecuritySuggestion[] = [];

  // Check for network calls without sanitization
  const networkNodes = graph.nodes.filter(
    (n) =>
      n.type === 'mcp' &&
      typeof (n.data as any)?.toolId === 'string' &&
      (n.data as any).toolId.includes('network')
  );

  for (const node of networkNodes) {
    const url = (node.data as any)?.args?.url || '';
    if (typeof url === 'string' && url.includes('${')) {
      suggestions.push({
        id: `sec-unsafe-url-${node.id}`,
        type: 'security',
        severity: 'high',
        title: 'Unsanitized Network Request',
        description: `Node "${node.data?.label || node.id}" makes network requests with dynamic URLs that may not be sanitized.`,
        remediation:
          'Validate and sanitize all URL inputs. Use allowlists for permitted domains.',
        cwe: 'CWE-918',
        nodeIds: [node.id],
      });
    }
  }

  // Check for SQL operations
  const dbNodes = graph.nodes.filter(
    (n) =>
      n.type === 'mcp' &&
      typeof (n.data as any)?.toolId === 'string' &&
      (n.data as any).toolId.includes('database')
  );

  for (const node of dbNodes) {
    const query = (node.data as any)?.args?.query || '';

    for (const pattern of SECURITY_PATTERNS.SQL_INJECTION) {
      if (pattern.test(query)) {
        suggestions.push({
          id: `sec-sql-injection-${node.id}`,
          type: 'security',
          severity: 'critical',
          title: 'SQL Injection Risk',
          description: `Node "${node.data?.label || node.id}" contains SQL query patterns that may allow injection.`,
          remediation:
            'Use parameterized queries or prepared statements. Never concatenate user input into SQL queries.',
          cwe: 'CWE-89',
          nodeIds: [node.id],
        });
        break;
      }
    }
  }

  return suggestions;
}
