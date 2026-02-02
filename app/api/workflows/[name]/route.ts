import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow, workflowToGraph } from '@/lib/workflow-parser';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const workflowName = decodeURIComponent(name);

  const workflow = getWorkflow(workflowName);

  if (!workflow) {
    return NextResponse.json(
      { error: 'Workflow not found' },
      { status: 404 }
    );
  }

  const { nodes, edges } = workflowToGraph(workflow);

  return NextResponse.json({
    workflow,
    nodes,
    edges,
  });
}
