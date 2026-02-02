import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

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
    const { workflow, step, prompt, model, workingDirectory } = await request.json();

    // Generate a session ID
    const sessionId = `${workflow}-${step}-${Date.now()}`;

    // Safely handle potentially undefined prompt and working directory
    const safePrompt = prompt || 'Help me with this workflow step';
    const escapedPrompt = safePrompt.replace(/"/g, '\\"');
    const safeModel = model || 'gemini-flash';
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

    // Execute Claude Code in non-interactive mode
    const command = `claude -p "${escapedPrompt}" --model ${safeModel}`;

    // Run in background and return immediately
    exec(command, { cwd: executionDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error}`);
        return;
      }
      console.log(`Output: ${stdout}`);
      if (stderr) console.error(`stderr: ${stderr}`);
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
