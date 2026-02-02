import { NextResponse } from 'next/server';
import { getContextManager } from '@/lib/memory/context-manager';

export async function GET() {
  try {
    const contextManager = getContextManager();
    const stats = await contextManager.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Memory] Failed to get stats:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
