import { NextRequest, NextResponse } from 'next/server';
import { graphToYaml } from '@/lib/workflow-parser';

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges } = await request.json();

    if (!nodes || !edges) {
      return NextResponse.json(
        { error: 'Nodes and edges required' },
        { status: 400 }
      );
    }

    const yamlContent = graphToYaml(nodes, edges);

    return NextResponse.json({ yaml: yamlContent });
  } catch (error) {
    console.error('[Export] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}
