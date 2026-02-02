import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

interface GitRepo {
  name: string;
  path: string;
  lastModified: string;
}

/**
 * Scan common development directories for Git repositories
 * GET /api/directories/git-repos
 */
export async function GET(request: NextRequest) {
  try {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';

    if (!homeDir) {
      return NextResponse.json(
        { error: 'Home directory not found' },
        { status: 500 }
      );
    }

    // Common directories to scan for git repos
    const scanDirs = [
      homeDir,
      path.join(homeDir, 'projects'),
      path.join(homeDir, 'code'),
      path.join(homeDir, 'dev'),
      path.join(homeDir, 'workspace'),
      path.join(homeDir, 'Documents'),
    ].filter(dir => fs.existsSync(dir));

    const repos: GitRepo[] = [];
    const seenPaths = new Set<string>();

    for (const dir of scanDirs) {
      try {
        // Find .git directories up to 4 levels deep
        // Exclude common non-repo directories
        const findCommand = `find "${dir}" -maxdepth 4 -name .git -type d \\
          -not -path "*/node_modules/*" \\
          -not -path "*/.cache/*" \\
          -not -path "*/vendor/*" \\
          -not -path "*/dist/*" \\
          -not -path "*/build/*" \\
          2>/dev/null`;

        const { stdout } = await execAsync(findCommand, {
          timeout: 10000, // 10 second timeout
          maxBuffer: 1024 * 1024, // 1MB buffer
        });

        const gitDirs = stdout.trim().split('\n').filter(Boolean);

        for (const gitDir of gitDirs) {
          // Get the repository root directory (parent of .git)
          const repoPath = path.dirname(gitDir);

          // Skip if we've already seen this repo
          if (seenPaths.has(repoPath)) continue;
          seenPaths.add(repoPath);

          try {
            const stats = await fs.promises.stat(repoPath);
            const repoName = path.basename(repoPath);

            repos.push({
              name: repoName,
              path: repoPath,
              lastModified: stats.mtime.toISOString(),
            });
          } catch (err) {
            // Skip repos we can't stat
            continue;
          }
        }
      } catch (err) {
        // Continue scanning other directories even if one fails
        console.error(`Error scanning ${dir}:`, err);
        continue;
      }
    }

    // Sort by last modified (most recent first)
    repos.sort((a, b) => {
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

    // Limit to 50 most recent repos
    const limitedRepos = repos.slice(0, 50);

    return NextResponse.json({
      repos: limitedRepos,
      count: limitedRepos.length,
    });
  } catch (error) {
    console.error('Error scanning for git repos:', error);
    return NextResponse.json(
      { error: 'Failed to scan for git repositories' },
      { status: 500 }
    );
  }
}
