import { NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp/client';

export async function GET() {
  try {
    const client = getMCPClient();
    const servers = client.getConnectedServers();

    return NextResponse.json({ servers });
  } catch (error) {
    console.error('[MCP] Failed to get servers:', error);
    return NextResponse.json(
      { error: 'Failed to get servers' },
      { status: 500 }
    );
  }
}
