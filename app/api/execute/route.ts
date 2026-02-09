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
import { validateApiKey } from '@/lib/security/auth';

// Session storage for execution results
interface ExecutionSession {
  sessionId: string;
  stdout: string[];
  stderr: string[];
  status: 'running' | 'completed' | 'failed';
  exitCode?: number;
}

const sessions = new Map<string, ExecutionSession>();

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
    // Require API key authentication
    const apiKey = process.env.DASHBOARD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Execution is disabled. Configure DASHBOARD_API_KEY to enable.' },
        { status: 403 }
      );
    }

    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      );
    }

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

    // Create session
    const session: ExecutionSession = {
      sessionId,
      stdout: [],
      stderr: [],
      status: 'running',
    };
    sessions.set(sessionId, session);

    // Execute using spawn with argument array for security
    const child = spawn(safeCommand.command, safeCommand.args, {
      cwd: executionDir,
      env: process.env,
    });

    // Set up event handlers
    child.stdout.on('data', (data) => {
      session.stdout.push(data.toString());
    });

    child.stderr.on('data', (data) => {
      session.stderr.push(data.toString());
    });

    child.on('error', (error) => {
      session.status = 'failed';
      session.stderr.push(error.message);
    });

    child.on('close', (code) => {
      session.status = code === 0 ? 'completed' : 'failed';
      session.exitCode = code ?? undefined;
      // Add TTL cleanup: remove session after 30 minutes
      setTimeout(() => sessions.delete(sessionId), 30 * 60 * 1000);
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      status: session.status,
      exitCode: session.exitCode,
      stdout: session.stdout.join(''),
      stderr: session.stderr.join(''),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
