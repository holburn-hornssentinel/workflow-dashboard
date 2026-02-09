import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/qa/screenshots/[filename]
 * Serves screenshot images with filename validation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: Validate filename to prevent path traversal
    // Only allow alphanumeric, underscore, hyphen, and .png extension
    if (!/^[a-zA-Z0-9_-]+\.png$/.test(filename)) {
      return new Response(
        JSON.stringify({ error: 'Invalid filename' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Construct safe file path
    const filePath = join(process.cwd(), 'tests', 'screenshots', filename);

    // Read file
    const fileBuffer = await readFile(filePath);

    // Return image with proper content type
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[QA] Screenshot error:', error);

    // Check if file not found
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new Response(
        JSON.stringify({ error: 'Screenshot not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to serve screenshot'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
