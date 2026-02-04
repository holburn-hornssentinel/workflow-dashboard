import { NextRequest, NextResponse } from 'next/server';
import { getVectorStore } from '@/lib/memory/vector-store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter required' },
        { status: 400 }
      );
    }

    const vectorStore = getVectorStore();
    const results = await vectorStore.search(query, 20);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[Memory] Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
