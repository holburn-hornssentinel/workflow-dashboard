import { NextRequest, NextResponse } from 'next/server';
import { getVectorStore } from '@/lib/memory/vector-store';
import { getContextManager } from '@/lib/memory/context-manager';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter required' },
        { status: 400 }
      );
    }

    const vectorStore = getVectorStore();
    const memories = await vectorStore.getByType(type as any);

    return NextResponse.json({ memories });
  } catch (error) {
    console.error('[Memory] Failed to get memories:', error);
    return NextResponse.json(
      { error: 'Failed to get memories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, metadata } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: 'Type and content required' },
        { status: 400 }
      );
    }

    const contextManager = getContextManager();

    switch (type) {
      case 'store':
      case 'fact':
        await contextManager.storeFact(content, metadata?.source);
        break;
      case 'preference':
        await contextManager.storePreference(metadata?.key || 'default', content);
        break;
      case 'message':
        await contextManager.storeMessage(
          metadata?.sessionId || 'default',
          metadata?.role || 'user',
          content
        );
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Memory] Failed to store memory:', error);
    return NextResponse.json(
      { error: 'Failed to store memory' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const contextManager = getContextManager();
    await contextManager.clearAllMemories();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Memory] Failed to clear memories:', error);
    return NextResponse.json(
      { error: 'Failed to clear memories' },
      { status: 500 }
    );
  }
}
