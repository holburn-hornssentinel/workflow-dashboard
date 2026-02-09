import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/security/auth';

export async function POST(request: NextRequest) {
  try {
    // Require API key authentication
    const apiKey = process.env.DASHBOARD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server restart is disabled. Configure DASHBOARD_API_KEY to enable.' },
        { status: 403 }
      );
    }

    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      );
    }

    // Send response before exiting
    const response = NextResponse.json({
      success: true,
      message: 'Server restarting...',
    });

    // Schedule process exit after response is sent
    // This allows the response to complete before the server goes down
    setTimeout(() => {
      console.log('[Restart] Authorized restart requested via API');
      process.exit(0);
    }, 500);

    return response;
  } catch (error) {
    console.error('Restart failed:', error);
    return NextResponse.json(
      { error: 'Failed to restart server' },
      { status: 500 }
    );
  }
}
