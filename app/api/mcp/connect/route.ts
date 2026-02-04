import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp/client';
import { getServerByName, validateServerConfig } from '@/lib/mcp/tool-registry';

export async function POST(request: NextRequest) {
  try {
    const { serverName } = await request.json();

    if (!serverName) {
      return NextResponse.json(
        { error: 'Server name required' },
        { status: 400 }
      );
    }

    const serverConfig = getServerByName(serverName);
    if (!serverConfig) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    // Validate configuration
    const validation = validateServerConfig(serverConfig);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid server configuration', details: validation.errors },
        { status: 400 }
      );
    }

    const client = getMCPClient();

    // Check if already connected
    if (client.isConnected(serverName)) {
      return NextResponse.json({ success: true, alreadyConnected: true });
    }

    // Connect to server
    await client.connectToServer(serverConfig);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MCP] Connection error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Connection failed',
      },
      { status: 500 }
    );
  }
}
