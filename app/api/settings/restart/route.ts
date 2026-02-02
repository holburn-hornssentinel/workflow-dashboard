import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Send response before exiting
    const response = NextResponse.json({
      success: true,
      message: 'Server restarting...',
    });

    // Schedule process exit after response is sent
    // This allows the response to complete before the server goes down
    setTimeout(() => {
      console.log('Restarting server...');
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
