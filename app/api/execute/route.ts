import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import {
  buildSafeCommand,
  isAllowedModel,
  type AllowedModel,
} from '@/lib/security/sanitizer';
import {
  ExecuteRequestSchema,
  validateRequest,
  formatValidationError,
} from '@/lib/security/validators';

/**
 * Validate that a working directory path is safe
 */
function isWorkingDirectorySafe(targetPath: string): boolean {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const resolvedPath = path.resolve(targetPath);

  // Must be within home directory
  if (!resolvedPath.startsWith(homeDir)) {
    return false;
  }

  // Check for directory traversal attempts
  if (targetPath.includes('..')) {
    return false;
  }

  // Must exist and be a directory
  try {
    const stats = fs.statSync(resolvedPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequest(ExecuteRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatValidationError(validation.error), {
        status: 400,
      });
    }

    const { prompt, model, workingDirectory } = validation.data;

    // Additional model validation
    if (!isAllowedModel(model)) {
      return NextResponse.json(
        { error: 'Model not in allowlist' },
        { status: 400 }
      );
    }

    // Generate a session ID
    const sessionId = `workflow-${Date.now()}`;

    const defaultWorkingDir = process.env.HOME || process.env.USERPROFILE || '';

    // Validate and use working directory
    let executionDir = defaultWorkingDir;
    if (workingDirectory) {
      if (isWorkingDirectorySafe(workingDirectory)) {
        executionDir = workingDirectory;
      } else {
        return NextResponse.json(
          { error: 'Invalid or unauthorized working directory' },
          { status: 403 }
        );
      }
    }

    // Build safe command using argument array (prevents command injection)
    const safeCommand = buildSafeCommand(prompt, model, executionDir);

    // Execute using spawn with argument array for security
    const child = spawn(safeCommand.command, safeCommand.args, {
      cwd: executionDir,
      env: process.env,
    });

    // Log output
    child.stdout.on('data', (data) => {
      console.log(`Output: ${data.toString()}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data.toString()}`);
    });

    child.on('error', (error) => {
      console.error(`Execution error: ${error}`);
    });

    child.on('close', (code) => {
      console.log(`Process exited with code ${code}`);
    });

    return NextResponse.json({
      sessionId,
      status: 'started',
      message: 'Workflow step execution started',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow step' },
      { status: 500 }
    );
  }
}
