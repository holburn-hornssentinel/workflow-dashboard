import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/lib/agents/orchestrator';

export async function GET() {
  try {
    const orchestrator = getOrchestrator();
    const tasks = orchestrator.getAllTasks();

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('[Agents] Failed to get tasks:', error);
    return NextResponse.json(
      { error: 'Failed to get tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent, task } = body;

    if (!agent || !task) {
      return NextResponse.json(
        { error: 'Missing agent or task parameter' },
        { status: 400 }
      );
    }

    const orchestrator = getOrchestrator();

    // Resolve role name to agent ID
    const agents = orchestrator.getAgentsByRole(agent);
    if (agents.length === 0) {
      return NextResponse.json(
        { error: `No agent found with role: ${agent}` },
        { status: 404 }
      );
    }

    const agentId = agents[0].id;
    const createdTask = await orchestrator.assignTask(agentId, task, {});

    return NextResponse.json({ task: createdTask }, { status: 201 });
  } catch (error) {
    console.error('[Agents] Failed to assign task:', error);
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}
