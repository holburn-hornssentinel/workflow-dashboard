/**
 * Security sanitizer for safe command execution
 * Prevents command injection by using argument arrays instead of string interpolation
 */

export const ALLOWED_MODELS = [
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-6',
  'claude-haiku-4-5-20251001',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'ollama/llama3.1',
] as const;

export type AllowedModel = (typeof ALLOWED_MODELS)[number];

export interface SafeCommand {
  command: string;
  args: string[];
}

/**
 * Validates if a model is in the allowlist
 */
export function isAllowedModel(model: string): model is AllowedModel {
  return ALLOWED_MODELS.includes(model as AllowedModel);
}

/**
 * Builds a safe command for Claude CLI execution
 * Uses argument array to prevent command injection
 *
 * @param prompt - User prompt to send to the model
 * @param model - Model ID from the allowlist
 * @param workingDirectory - Optional working directory
 * @returns SafeCommand object with command and args array
 */
export function buildSafeCommand(
  prompt: string,
  model: AllowedModel,
  workingDirectory?: string
): SafeCommand {
  const args: string[] = [];

  // Add model flag
  args.push('--model', model);

  // Add working directory if specified
  if (workingDirectory) {
    args.push('--cwd', workingDirectory);
  }

  // Add prompt as final argument
  args.push(prompt);

  return {
    command: 'claude',
    args,
  };
}

/**
 * Sanitizes file paths to prevent directory traversal
 */
export function sanitizeFilePath(filePath: string): string {
  // Remove null bytes
  let sanitized = filePath.replace(/\0/g, '');

  // Normalize path separators
  sanitized = sanitized.replace(/\\/g, '/');

  // Remove dangerous patterns (loop to prevent bypass)
  while (sanitized.includes('../')) {
    sanitized = sanitized.replace(/\.\.\//g, '');
  }
  sanitized = sanitized.replace(/\.\.$/g, '');

  return sanitized;
}

/**
 * Validates tool ID format for MCP calls
 */
export function validateToolId(toolId: string): boolean {
  // Tool IDs should be in format: server:tool
  const pattern = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/;
  return pattern.test(toolId);
}
