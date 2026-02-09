import { nanoid } from 'nanoid';

export type AgentRole = 'planner' | 'executor' | 'reviewer' | 'researcher' | 'coordinator';

export type AgentStatus = 'idle' | 'running' | 'waiting' | 'completed' | 'failed';

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  status: AgentStatus;
  systemPrompt: string;
  capabilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentTask {
  id: string;
  agentId: string;
  description: string;
  input: any;
  output?: any;
  status: AgentStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private messages: AgentMessage[] = [];
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents() {
    // Planner Agent
    this.registerAgent({
      role: 'planner',
      name: 'Strategy Planner',
      description: 'Breaks down complex goals into actionable steps',
      systemPrompt: `You are a strategic planning agent. Your role is to analyze goals and break them down into clear, actionable steps. Consider dependencies, resources needed, and potential risks. Output structured plans with step-by-step instructions.`,
      capabilities: ['planning', 'task-decomposition', 'dependency-analysis'],
    });

    // Executor Agent
    this.registerAgent({
      role: 'executor',
      name: 'Task Executor',
      description: 'Executes tasks and carries out actions',
      systemPrompt: `You are a task execution agent. Your role is to carry out specific tasks efficiently. Follow instructions precisely, report progress, and handle errors gracefully. Use available tools to complete your objectives.`,
      capabilities: ['execution', 'tool-use', 'error-handling'],
    });

    // Reviewer Agent
    this.registerAgent({
      role: 'reviewer',
      name: 'Quality Reviewer',
      description: 'Reviews outputs for quality and correctness',
      systemPrompt: `You are a quality review agent. Your role is to review work products for accuracy, completeness, and quality. Provide constructive feedback and suggest improvements. Ensure standards are met before approval.`,
      capabilities: ['review', 'quality-assurance', 'feedback'],
    });

    // Researcher Agent
    this.registerAgent({
      role: 'researcher',
      name: 'Information Researcher',
      description: 'Gathers and synthesizes information',
      systemPrompt: `You are a research agent. Your role is to gather relevant information from available sources, synthesize findings, and present insights. Be thorough, cite sources, and provide context for your findings.`,
      capabilities: ['research', 'information-gathering', 'synthesis'],
    });

    // Coordinator Agent
    this.registerAgent({
      role: 'coordinator',
      name: 'Workflow Coordinator',
      description: 'Coordinates between agents and manages workflow',
      systemPrompt: `You are a coordination agent. Your role is to manage workflow between agents, route tasks appropriately, and ensure smooth collaboration. Monitor progress and intervene when needed.`,
      capabilities: ['coordination', 'routing', 'monitoring'],
    });
  }

  registerAgent(config: Omit<Agent, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Agent {
    const agent: Agent = {
      ...config,
      id: nanoid(),
      status: 'idle',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.agents.set(agent.id, agent);
    this.emit('agent:registered', agent);
    return agent;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAgentsByRole(role: AgentRole): Agent[] {
    const agents: Agent[] = [];
    this.agents.forEach((agent) => {
      if (agent.role === role) {
        agents.push(agent);
      }
    });
    return agents;
  }

  getAllAgents(): Agent[] {
    const agents: Agent[] = [];
    this.agents.forEach((agent) => agents.push(agent));
    return agents;
  }

  async assignTask(agentId: string, description: string, input: any): Promise<AgentTask> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const task: AgentTask = {
      id: nanoid(),
      agentId,
      description,
      input,
      status: 'running',
      startedAt: new Date(),
    };

    this.tasks.set(task.id, task);
    this.updateAgentStatus(agentId, 'running');
    this.emit('task:assigned', { agent, task });

    // Execute AI task asynchronously (don't block the response)
    this.executeTask(task.id, agent).catch((error) => {
      console.error('[Agent] Task execution failed:', error);
      this.failTask(task.id, error.message || 'Task execution failed');
    });

    return task;
  }

  async completeTask(taskId: string, output: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.output = output;
    task.status = 'completed';
    task.completedAt = new Date();

    const agent = this.agents.get(task.agentId);
    if (agent) {
      this.updateAgentStatus(agent.id, 'idle');
    }

    this.emit('task:completed', { task, output });
  }

  async failTask(taskId: string, error: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'failed';
    task.error = error;
    task.completedAt = new Date();

    const agent = this.agents.get(task.agentId);
    if (agent) {
      this.updateAgentStatus(agent.id, 'idle');
    }

    this.emit('task:failed', { task, error });
  }

  sendMessage(from: string, to: string, content: string, metadata?: Record<string, any>): void {
    const message: AgentMessage = {
      id: nanoid(),
      from,
      to,
      content,
      timestamp: new Date(),
      metadata,
    };

    this.messages.push(message);
    this.emit('message:sent', message);
  }

  getMessages(agentId?: string): AgentMessage[] {
    if (!agentId) {
      return [...this.messages];
    }

    return this.messages.filter((msg) => msg.from === agentId || msg.to === agentId);
  }

  private updateAgentStatus(agentId: string, status: AgentStatus): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.updatedAt = new Date();
      this.emit('agent:status-changed', { agent, status });
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  getTasksByAgent(agentId: string): AgentTask[] {
    const tasks: AgentTask[] = [];
    this.tasks.forEach((task) => {
      if (task.agentId === agentId) {
        tasks.push(task);
      }
    });
    return tasks;
  }

  getActiveTasks(): AgentTask[] {
    const tasks: AgentTask[] = [];
    this.tasks.forEach((task) => {
      if (task.status === 'running' || task.status === 'waiting') {
        tasks.push(task);
      }
    });
    return tasks;
  }

  getAllTasks(): AgentTask[] {
    const tasks: AgentTask[] = [];
    this.tasks.forEach((task) => tasks.push(task));
    return tasks;
  }

  private async executeTask(taskId: string, agent: Agent): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    try {
      const provider = this.getAvailableProvider();
      if (!provider) {
        throw new Error('No AI provider configured');
      }

      // Import dynamically to avoid circular dependencies
      const { generateText } = await import('@/lib/ai/providers');

      const prompt = `${agent.systemPrompt}\n\nTask: ${task.description}`;

      const response = await generateText({
        provider,
        model: provider === 'claude' ? 'claude-sonnet-4-5-20250929' : 'gemini-2.5-flash',
        prompt,
        systemPrompt: agent.systemPrompt,
      });

      await this.completeTask(taskId, response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.failTask(taskId, errorMessage);
    }
  }

  private getAvailableProvider(): 'claude' | 'gemini' | null {
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Check for placeholder keys
    if (claudeKey && claudeKey !== 'your_anthropic_api_key_here' && !claudeKey.includes('placeholder')) {
      return 'claude';
    }
    if (geminiKey && geminiKey !== 'your_gemini_api_key_here' && !geminiKey.includes('placeholder')) {
      return 'gemini';
    }
    return null;
  }

  reset(): void {
    this.tasks.clear();
    this.messages = [];
    this.agents.forEach((agent) => {
      agent.status = 'idle';
      agent.updatedAt = new Date();
    });
    this.emit('orchestrator:reset', {});
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}
