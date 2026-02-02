import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isGitRepo: boolean;
}

/**
 * Validate that a path is safe and within allowed boundaries
 */
function isPathSafe(targetPath: string): boolean {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const resolvedPath = path.resolve(targetPath);

  // Must be within home directory
  if (!resolvedPath.startsWith(homeDir)) {
    return false;
  }

  // Check for directory traversal attempts
  if (targetPath.includes('..') || targetPath.includes('~')) {
    return false;
  }

  return true;
}

/**
 * Check if a directory contains a .git folder
 */
function isGitRepository(dirPath: string): boolean {
  try {
    const gitPath = path.join(dirPath, '.git');
    return fs.existsSync(gitPath) && fs.statSync(gitPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Browse directory contents
 * GET /api/directories?path=/some/path
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedPath = searchParams.get('path');

    // Default to home directory if no path specified
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const targetPath = requestedPath || homeDir;

    // Validate path safety
    if (!isPathSafe(targetPath)) {
      return NextResponse.json(
        { error: 'Invalid or unauthorized path' },
        { status: 403 }
      );
    }

    // Check if path exists
    if (!fs.existsSync(targetPath)) {
      return NextResponse.json(
        { error: 'Path does not exist' },
        { status: 404 }
      );
    }

    // Check if path is a directory
    const stats = await fs.promises.stat(targetPath);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is not a directory' },
        { status: 400 }
      );
    }

    // Read directory contents
    const entries = await fs.promises.readdir(targetPath, { withFileTypes: true });

    // Filter to only directories and format the response
    const directories: DirectoryEntry[] = entries
      .filter(entry => entry.isDirectory())
      .filter(entry => !entry.name.startsWith('.')) // Hide hidden directories by default
      .map(entry => {
        const fullPath = path.join(targetPath, entry.name);
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          isGitRepo: isGitRepository(fullPath),
        };
      })
      .sort((a, b) => {
        // Git repos first, then alphabetically
        if (a.isGitRepo && !b.isGitRepo) return -1;
        if (!a.isGitRepo && b.isGitRepo) return 1;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      currentPath: targetPath,
      parentPath: path.dirname(targetPath),
      canGoUp: targetPath !== homeDir,
      entries: directories,
      count: directories.length,
    });
  } catch (error) {
    console.error('Error browsing directory:', error);
    return NextResponse.json(
      { error: 'Failed to browse directory' },
      { status: 500 }
    );
  }
}
