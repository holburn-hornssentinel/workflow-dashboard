/**
 * Permission types for human-in-the-loop approval system
 */

export type PermissionLevel = 'auto' | 'notify' | 'confirm' | 'block';

export interface ToolPermission {
  toolId: string;
  level: PermissionLevel;
  allowedArgs?: Record<string, unknown>;
  requiresReason: boolean;
  description?: string;
}

export interface PermissionRequest {
  id: string;
  type: 'tool' | 'command' | 'file';
  toolId?: string;
  details: Record<string, unknown>;
  status: 'pending' | 'approved' | 'denied' | 'timeout';
  requestedAt: Date;
  respondedAt?: Date;
  reason?: string;
  rememberChoice?: boolean;
}

export interface PermissionResponse {
  requestId: string;
  approved: boolean;
  reason?: string;
  rememberChoice?: boolean;
}

export interface PermissionConfig {
  defaultLevel: PermissionLevel;
  autoApproveTimeoutMs: number;
  toolPermissions: Map<string, ToolPermission>;
  rememberedChoices: Map<string, boolean>; // toolId -> approved
}

/**
 * Risk levels for operations
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Risk assessment for a tool operation
 */
export interface RiskAssessment {
  level: RiskLevel;
  reasons: string[];
  mitigations: string[];
}

/**
 * Helper to determine risk level for a tool
 */
export function assessToolRisk(toolId: string, args?: Record<string, unknown>): RiskAssessment {
  const reasons: string[] = [];
  const mitigations: string[] = [];

  // High-risk tools
  if (toolId.includes('delete') || toolId.includes('drop')) {
    reasons.push('Destructive operation that cannot be undone');
    mitigations.push('Ensure you have backups');
    mitigations.push('Verify the target resource is correct');
    return { level: 'critical', reasons, mitigations };
  }

  if (toolId.includes('write') || toolId.includes('execute')) {
    reasons.push('Can modify system state');
    mitigations.push('Review the operation details carefully');

    // Check for path traversal in args
    if (args?.path && typeof args.path === 'string') {
      if (args.path.includes('..')) {
        reasons.push('Path contains directory traversal');
        return { level: 'critical', reasons, mitigations };
      }
    }

    return { level: 'high', reasons, mitigations };
  }

  if (toolId.includes('push') || toolId.includes('publish')) {
    reasons.push('Will publish changes externally');
    mitigations.push('Ensure changes have been reviewed');
    return { level: 'high', reasons, mitigations };
  }

  // Medium-risk tools
  if (toolId.includes('network') || toolId.includes('http')) {
    reasons.push('Makes external network requests');
    mitigations.push('Verify the target URL is trusted');
    return { level: 'medium', reasons, mitigations };
  }

  if (toolId.includes('read') || toolId.includes('list')) {
    reasons.push('Reads sensitive data');
    return { level: 'medium', reasons, mitigations };
  }

  // Low-risk by default
  return { level: 'low', reasons: ['Standard operation'], mitigations: [] };
}

/**
 * Get color for risk level
 */
export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-green-500';
  }
}

/**
 * Get background color for risk level
 */
export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-red-500/10 border-red-500/30';
    case 'high':
      return 'bg-orange-500/10 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/10 border-yellow-500/30';
    case 'low':
      return 'bg-green-500/10 border-green-500/30';
  }
}
