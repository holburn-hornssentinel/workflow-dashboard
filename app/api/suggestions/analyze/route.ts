import { NextRequest, NextResponse } from 'next/server';
import { analyzeWorkflow } from '@/lib/suggestions/analyzer';
import type { WorkflowGraph, AnalysisConfig } from '@/types/suggestions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodes, edges, config = {} } = body as {
      nodes: WorkflowGraph['nodes'];
      edges: WorkflowGraph['edges'];
      config?: AnalysisConfig;
    };

    if (!nodes || !edges) {
      return NextResponse.json(
        { error: 'Missing nodes or edges' },
        { status: 400 }
      );
    }

    const graph: WorkflowGraph = { nodes, edges };
    const result = await analyzeWorkflow(graph, config);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze workflow' },
      { status: 500 }
    );
  }
}
