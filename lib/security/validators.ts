/**
 * Zod validation schemas for API request validation
 * Ensures all inputs are properly validated before processing
 */

import { z } from 'zod';
import { ALLOWED_MODELS } from './sanitizer';

/**
 * Schema for /api/execute endpoint
 * Validates prompt execution requests
 */
export const ExecuteRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt cannot be empty')
    .max(10000, 'Prompt exceeds maximum length of 10000 characters'),
  model: z.enum(ALLOWED_MODELS, {
    errorMap: () => ({ message: 'Invalid model. Must be one of the allowed models.' }),
  }),
  workingDirectory: z
    .string()
    .optional()
    .refine(
      (path) => {
        if (!path) return true;
        // Prevent directory traversal
        return !path.includes('..') && !path.includes('\0');
      },
      { message: 'Invalid working directory path' }
    ),
});

export type ExecuteRequest = z.infer<typeof ExecuteRequestSchema>;

/**
 * Schema for /api/mcp/call endpoint
 * Validates MCP tool call requests
 */
export const MCPCallRequestSchema = z.object({
  toolId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/, 'Tool ID must be in format server:tool'),
  args: z.record(z.unknown()).default({}),
});

export type MCPCallRequest = z.infer<typeof MCPCallRequestSchema>;

/**
 * Schema for workflow execution
 */
export const WorkflowExecuteSchema = z.object({
  workflowId: z.string().uuid('Invalid workflow ID format'),
  inputs: z.record(z.unknown()).optional(),
});

export type WorkflowExecuteRequest = z.infer<typeof WorkflowExecuteSchema>;

/**
 * Schema for agent node configuration
 */
export const AgentNodeConfigSchema = z.object({
  agentId: z.string().min(1),
  prompt: z.string().min(1).max(10000),
  model: z.enum(ALLOWED_MODELS).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export type AgentNodeConfig = z.infer<typeof AgentNodeConfigSchema>;

/**
 * Schema for MCP tool configuration
 */
export const MCPToolConfigSchema = z.object({
  serverId: z.string().min(1),
  toolName: z.string().min(1),
  args: z.record(z.unknown()),
  requiresApproval: z.boolean().optional().default(false),
});

export type MCPToolConfig = z.infer<typeof MCPToolConfigSchema>;

/**
 * Helper to safely parse and validate request body
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Format Zod error for API response
 */
export function formatValidationError(error: z.ZodError): {
  message: string;
  errors: Array<{ path: string; message: string }>;
} {
  return {
    message: 'Validation failed',
    errors: error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  };
}
