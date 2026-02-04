import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/lib/agents/orchestrator';

export async function GET() {
  try {
    const orchestrator = getOrchestrator();
    const agents = orchestrator.getAllAgents();

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('[Agents] Failed to get agents:', error);
    return NextResponse.json(
      { error: 'Failed to get agents' },
      { status: 500 }
    );
  }
}
