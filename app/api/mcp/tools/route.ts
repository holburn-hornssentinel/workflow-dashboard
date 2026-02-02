import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    const client = getMCPClient();

    let tools;
    if (category) {
      tools = client.getToolsByCategory(category);
    } else {
      tools = client.getTools();
    }

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('[MCP] Failed to get tools:', error);
    return NextResponse.json(
      { error: 'Failed to get tools' },
      { status: 500 }
    );
  }
}
