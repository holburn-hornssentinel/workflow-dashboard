import { NextRequest } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/qa/results
 * Returns QA test results and screenshot metadata
 */
export async function GET(request: NextRequest) {
  try {
    const screenshotsDir = join(process.cwd(), 'tests', 'screenshots');
    const resultsFile = join(process.cwd(), 'tests', 'qa_results.json');

    // Read last run results if available
    let lastRunResults = null;
    try {
      const resultsData = await readFile(resultsFile, 'utf-8');
      lastRunResults = JSON.parse(resultsData);
    } catch {
      // No results file yet
    }

    // Read screenshot directory
    let screenshots: Array<{
      filename: string;
      timestamp: number;
      size: number;
    }> = [];

    try {
      const files = await readdir(screenshotsDir);

      // Filter for PNG files only
      const pngFiles = files.filter(f => f.endsWith('.png'));

      // Get metadata for each screenshot
      for (const filename of pngFiles) {
        try {
          const filePath = join(screenshotsDir, filename);
          const stats = await stat(filePath);
          screenshots.push({
            filename,
            timestamp: stats.mtimeMs,
            size: stats.size,
          });
        } catch {
          // Skip files we can't read
        }
      }

      // Sort by timestamp (newest first)
      screenshots.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      // Screenshots directory doesn't exist yet
    }

    return new Response(
      JSON.stringify({
        lastRun: lastRunResults,
        screenshots,
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[QA] Results error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to read results'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
