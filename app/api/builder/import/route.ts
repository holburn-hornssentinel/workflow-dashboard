import { NextRequest, NextResponse } from 'next/server';
import { yamlToGraph } from '@/lib/workflow-parser';

export async function POST(request: NextRequest) {
  try {
    const { yaml } = await request.json();

    if (!yaml) {
      return NextResponse.json(
        { error: 'YAML content required' },
        { status: 400 }
      );
    }

    const { nodes, edges } = yamlToGraph(yaml);

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error('[Import] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
