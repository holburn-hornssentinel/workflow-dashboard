/**
 * Security-related type definitions
 */

import type { Suggestion } from './suggestions';

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecuritySuggestion extends Suggestion {
  type: 'security';
  severity: SecuritySeverity;
  cwe?: string; // CWE reference (e.g., CWE-78 for command injection)
  remediation: string;
}

export interface SecurityCheck {
  id: string;
  name: string;
  severity: SecuritySeverity;
  check: (context: SecurityCheckContext) => boolean;
  message: string;
  remediation: string;
  cwe?: string;
}

export interface SecurityCheckContext {
  nodeType?: string;
  nodeData?: Record<string, any>;
  toolId?: string;
  args?: Record<string, any>;
  prompt?: string;
}

export interface SecurityScore {
  overall: number; // 0-100, higher is better
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * Dangerous tools that require special handling
 */
export const DANGEROUS_TOOLS = [
  'filesystem:write_file',
  'filesystem:delete_file',
  'filesystem:execute_command',
  'git:push',
  'git:force_push',
  'network:http_request',
  'database:execute_query',
  'database:drop_table',
] as const;

export type DangerousTool = (typeof DANGEROUS_TOOLS)[number];

/**
 * Patterns that indicate potential security issues
 */
export const SECURITY_PATTERNS = {
  HARDCODED_CREDENTIALS: [
    /password\s*=\s*['"][^'"]+['"]/i,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
    /secret\s*=\s*['"][^'"]+['"]/i,
    /token\s*=\s*['"][^'"]+['"]/i,
    /bearer\s+[a-zA-Z0-9_-]+/i,
  ],
  COMMAND_INJECTION: [
    /\$\([^)]+\)/,
    /`[^`]+`/,
    /\|\s*\w+/,
    /;\s*\w+/,
    /&&\s*\w+/,
  ],
  PATH_TRAVERSAL: [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e/i,
  ],
  SQL_INJECTION: [
    /'\s*OR\s+/i,
    /--\s*$/,
    /;\s*DROP\s+/i,
    /UNION\s+SELECT/i,
  ],
  UNSAFE_DESERIALIZATION: [
    /JSON\.parse\(/i,
    /eval\(/i,
    /unserialize\(/i,
  ],
  XML_EXTERNAL_ENTITY: [
    /parseXML/i,
    /DOMParser/i,
    /XMLParser/i,
    /<!ENTITY/i,
  ],
} as const;
