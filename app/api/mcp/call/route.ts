import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp/client';

export async function POST(request: NextRequest) {
  try {
    const { toolId, args } = await request.json();

    if (!toolId) {
      return NextResponse.json({ error: 'Tool ID required' }, { status: 400 });
    }

    const client = getMCPClient();
    const result = await client.callTool(toolId, args || {});

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[MCP] Tool call error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Tool call failed',
      },
      { status: 500 }
    );
  }
}
