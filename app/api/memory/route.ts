import { NextRequest, NextResponse } from 'next/server';
import { getVectorStore } from '@/lib/memory/vector-store';
import { getContextManager } from '@/lib/memory/context-manager';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    const vectorStore = getVectorStore();

    // If no type or "all", return all memories
    if (!type || type === 'all') {
      const allTypes = ['conversation', 'fact', 'preference', 'context'];
      const memoriesByType = await Promise.all(
        allTypes.map(t => vectorStore.getByType(t as any))
      );
      const memories = memoriesByType.flat();
      return NextResponse.json({ memories });
    }

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
      case 'conversation':
        await contextManager.storeMessage(
          metadata?.sessionId || 'default',
          metadata?.role || 'user',
          content
        );
        break;
      case 'context':
        const vectorStore = getVectorStore();
        await vectorStore.store(content, { type: 'context', ...metadata });
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

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      // Delete single memory by ID
      const vectorStore = getVectorStore();
      await vectorStore.delete(id);
      return NextResponse.json({ success: true });
    } else {
      // Clear all memories
      const contextManager = getContextManager();
      await contextManager.clearAllMemories();
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('[Memory] Failed to delete memories:', error);
    return NextResponse.json(
      { error: 'Failed to delete memories' },
      { status: 500 }
    );
  }
}
