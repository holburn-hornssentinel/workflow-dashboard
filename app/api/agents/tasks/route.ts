import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/lib/agents/orchestrator';

export async function GET() {
  try {
    const orchestrator = getOrchestrator();
    const tasks = orchestrator.getActiveTasks();

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('[Agents] Failed to get tasks:', error);
    return NextResponse.json(
      { error: 'Failed to get tasks' },
      { status: 500 }
    );
  }
}
