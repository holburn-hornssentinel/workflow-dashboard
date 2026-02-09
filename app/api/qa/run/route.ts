import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { validateApiKey } from '@/lib/security/auth';

/**
 * POST /api/qa/run
 * Spawns QA test agent subprocess and streams output via SSE
 */
export async function POST(request: NextRequest) {
  // Auth check (optional - only if DASHBOARD_API_KEY is configured)
  const apiKey = process.env.DASHBOARD_API_KEY;
  if (apiKey && !validateApiKey(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const body = await request.json();
    const { headless = true, url } = body;

    // Default to current host if no URL provided
    const targetUrl = url || `http://localhost:${process.env.PORT || 3004}`;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Spawn Python QA agent subprocess
        const proc = spawn('python3', [
          'tests/qa_agent.py',
          '--json',
          '--url', targetUrl,
        ], {
          env: {
            ...process.env,
            HEADLESS: String(headless),
          },
          cwd: process.cwd(),
        });

        // Stream stdout as SSE events
        proc.stdout.on('data', (data) => {
          const lines = data.toString().split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              // Validate that line is valid JSON
              JSON.parse(line);
              controller.enqueue(encoder.encode(`data: ${line}\n\n`));
            } catch {
              // If not valid JSON, wrap as a log event
              const logEvent = JSON.stringify({
                type: 'log',
                level: 'stdout',
                text: line
              });
              controller.enqueue(encoder.encode(`data: ${logEvent}\n\n`));
            }
          }
        });

        // Stream stderr as error logs
        proc.stderr.on('data', (data) => {
          const errMsg = JSON.stringify({
            type: 'log',
            level: 'stderr',
            text: data.toString()
          });
          controller.enqueue(encoder.encode(`data: ${errMsg}\n\n`));
        });

        // Handle process completion
        proc.on('close', (code) => {
          const done = JSON.stringify({
            type: 'done',
            exitCode: code
          });
          controller.enqueue(encoder.encode(`data: ${done}\n\n`));
          controller.close();
        });

        // Handle process errors
        proc.on('error', (err) => {
          const errMsg = JSON.stringify({
            type: 'error',
            message: err.message
          });
          controller.enqueue(encoder.encode(`data: ${errMsg}\n\n`));
          controller.close();
        });

        // Handle client disconnect - kill process
        request.signal.addEventListener('abort', () => {
          proc.kill('SIGTERM');
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[QA] Run error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to start QA tests'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
