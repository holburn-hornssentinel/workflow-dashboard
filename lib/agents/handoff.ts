import { nanoid } from 'nanoid';
import { AgentRole } from './orchestrator';

export interface HandoffContext {
  id: string;
  fromAgent: string;
  toAgent: string;
  fromRole: AgentRole;
  toRole: AgentRole;
  data: any;
  instructions?: string;
  createdAt: Date;
  acceptedAt?: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface HandoffPlan {
  steps: HandoffStep[];
  currentStep: number;
  context: Record<string, any>;
}

export interface HandoffStep {
  from: AgentRole;
  to: AgentRole;
  action: string;
  conditions?: string[];
}

export class AgentHandoffManager {
  private handoffs: Map<string, HandoffContext> = new Map();
  private plans: Map<string, HandoffPlan> = new Map();

  /**
   * Create a handoff between two agents
   */
  createHandoff(
    fromAgent: string,
    toAgent: string,
    fromRole: AgentRole,
    toRole: AgentRole,
    data: any,
    instructions?: string
  ): HandoffContext {
    const handoff: HandoffContext = {
      id: nanoid(),
      fromAgent,
      toAgent,
      fromRole,
      toRole,
      data,
      instructions,
      createdAt: new Date(),
      status: 'pending',
    };

    this.handoffs.set(handoff.id, handoff);
    return handoff;
  }

  /**
   * Accept a handoff
   */
  acceptHandoff(handoffId: string): HandoffContext {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) {
      throw new Error(`Handoff ${handoffId} not found`);
    }

    handoff.status = 'accepted';
    handoff.acceptedAt = new Date();

    return handoff;
  }

  /**
   * Reject a handoff
   */
  rejectHandoff(handoffId: string): HandoffContext {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) {
      throw new Error(`Handoff ${handoffId} not found`);
    }

    handoff.status = 'rejected';
    return handoff;
  }

  /**
   * Get handoff by ID
   */
  getHandoff(handoffId: string): HandoffContext | undefined {
    return this.handoffs.get(handoffId);
  }

  /**
   * Get pending handoffs for an agent
   */
  getPendingHandoffs(agentId: string): HandoffContext[] {
    const pending: HandoffContext[] = [];
    this.handoffs.forEach((handoff) => {
      if (handoff.toAgent === agentId && handoff.status === 'pending') {
        pending.push(handoff);
      }
    });
    return pending;
  }

  /**
   * Create a multi-step handoff plan
   */
  createHandoffPlan(steps: HandoffStep[], initialContext: Record<string, any> = {}): HandoffPlan {
    const plan: HandoffPlan = {
      steps,
      currentStep: 0,
      context: initialContext,
    };

    const planId = nanoid();
    this.plans.set(planId, plan);

    return plan;
  }

  /**
   * Execute next step in a handoff plan
   */
  async executeNextStep(
    planId: string,
    stepOutput: any
  ): Promise<{ completed: boolean; nextStep?: HandoffStep }> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    // Update context with step output
    plan.context[`step_${plan.currentStep}_output`] = stepOutput;

    // Move to next step
    plan.currentStep++;

    if (plan.currentStep >= plan.steps.length) {
      return { completed: true };
    }

    const nextStep = plan.steps[plan.currentStep];
    return { completed: false, nextStep };
  }

  /**
   * Build a standard workflow handoff chain
   */
  buildStandardWorkflow(): HandoffStep[] {
    return [
      {
        from: 'coordinator',
        to: 'planner',
        action: 'Create execution plan',
      },
      {
        from: 'planner',
        to: 'researcher',
        action: 'Gather necessary information',
        conditions: ['requires_research'],
      },
      {
        from: 'researcher',
        to: 'executor',
        action: 'Execute plan steps',
      },
      {
        from: 'executor',
        to: 'reviewer',
        action: 'Review execution results',
      },
      {
        from: 'reviewer',
        to: 'coordinator',
        action: 'Report final results',
      },
    ];
  }

  /**
   * Build a research-focused workflow
   */
  buildResearchWorkflow(): HandoffStep[] {
    return [
      {
        from: 'coordinator',
        to: 'researcher',
        action: 'Initial information gathering',
      },
      {
        from: 'researcher',
        to: 'planner',
        action: 'Plan analysis approach',
      },
      {
        from: 'planner',
        to: 'researcher',
        action: 'Deep dive research',
      },
      {
        from: 'researcher',
        to: 'reviewer',
        action: 'Validate findings',
      },
      {
        from: 'reviewer',
        to: 'coordinator',
        action: 'Present research report',
      },
    ];
  }

  /**
   * Build an execution-focused workflow
   */
  buildExecutionWorkflow(): HandoffStep[] {
    return [
      {
        from: 'coordinator',
        to: 'planner',
        action: 'Create task breakdown',
      },
      {
        from: 'planner',
        to: 'executor',
        action: 'Execute tasks sequentially',
      },
      {
        from: 'executor',
        to: 'reviewer',
        action: 'Quality check',
      },
      {
        from: 'reviewer',
        to: 'executor',
        action: 'Fix issues',
        conditions: ['has_issues'],
      },
      {
        from: 'reviewer',
        to: 'coordinator',
        action: 'Deliver final output',
      },
    ];
  }

  /**
   * Get workflow recommendations based on task type
   */
  recommendWorkflow(taskDescription: string): HandoffStep[] {
    const lower = taskDescription.toLowerCase();

    if (lower.includes('research') || lower.includes('analyze') || lower.includes('investigate')) {
      return this.buildResearchWorkflow();
    }

    if (lower.includes('execute') || lower.includes('build') || lower.includes('create')) {
      return this.buildExecutionWorkflow();
    }

    return this.buildStandardWorkflow();
  }

  /**
   * Clear all handoffs
   */
  clearHandoffs(): void {
    this.handoffs.clear();
    this.plans.clear();
  }
}

// Singleton instance
let handoffManagerInstance: AgentHandoffManager | null = null;

export function getHandoffManager(): AgentHandoffManager {
  if (!handoffManagerInstance) {
    handoffManagerInstance = new AgentHandoffManager();
  }
  return handoffManagerInstance;
}
