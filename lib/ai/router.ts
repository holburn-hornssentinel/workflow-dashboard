/**
 * Multi-model router for intelligent AI model selection
 * Routes tasks to appropriate models based on complexity and budget
 */

import { CostTracker, type BudgetPeriod, type BudgetStatus } from './cost-tracker';
import type { AllowedModel } from '../security/sanitizer';

export interface ModelConfig {
  model: AllowedModel;
  priority: number;
  maxTokens: number;
  temperature?: number;
  capabilities: string[];
}

export interface RoutingRule {
  id: string;
  taskType: string;
  preferredModel: AllowedModel;
  fallbackModel?: AllowedModel;
  condition?: (context: TaskContext) => boolean;
}

export interface TaskContext {
  type: string;
  prompt: string;
  estimatedComplexity?: 'low' | 'medium' | 'high';
  estimatedTokens?: number;
  requiresReasoning?: boolean;
  requiresSpeed?: boolean;
}

export interface RouterConfig {
  models: ModelConfig[];
  rules: RoutingRule[];
  budgetLimit: number;
  budgetPeriod: BudgetPeriod;
  fallbackModel: AllowedModel;
}

export class ModelRouter {
  private config: RouterConfig;
  private costTracker: CostTracker;

  constructor(config: RouterConfig) {
    this.config = config;
    this.costTracker = new CostTracker(config.budgetLimit, config.budgetPeriod);
  }

  /**
   * Select the best model for a task
   */
  selectModel(taskType: string, context: TaskContext): ModelConfig {
    // Check if we're over budget
    const budgetStatus = this.costTracker.getBudgetStatus();
    if (budgetStatus.percentUsed >= 100) {
      console.warn('[Router] Budget exceeded, using free fallback model');
      return this.getModelConfig('ollama/llama3.1');
    }

    // Find matching routing rule
    const rule = this.findMatchingRule(taskType, context);
    if (rule) {
      const modelConfig = this.getModelConfig(rule.preferredModel);

      // Check if we can afford this model
      const estimatedCost = this.estimateCost(
        rule.preferredModel,
        context.estimatedTokens || 1000
      );

      if (this.costTracker.isWithinBudget(estimatedCost)) {
        return modelConfig;
      }

      // Try fallback model if available
      if (rule.fallbackModel) {
        const fallbackCost = this.estimateCost(
          rule.fallbackModel,
          context.estimatedTokens || 1000
        );

        if (this.costTracker.isWithinBudget(fallbackCost)) {
          return this.getModelConfig(rule.fallbackModel);
        }
      }

      // Use free model if budget constraints
      return this.getModelConfig('ollama/llama3.1');
    }

    // Use heuristic-based selection
    return this.selectByHeuristic(context);
  }

  /**
   * Select model using heuristics based on task context
   */
  private selectByHeuristic(context: TaskContext): ModelConfig {
    const { estimatedComplexity, requiresReasoning, requiresSpeed } = context;

    // High complexity or reasoning required → Claude Opus
    if (estimatedComplexity === 'high' || requiresReasoning) {
      const cost = this.estimateCost('claude-opus-4-5-20251101', context.estimatedTokens || 2000);
      if (this.costTracker.isWithinBudget(cost)) {
        return this.getModelConfig('claude-opus-4-5-20251101');
      }
    }

    // Medium complexity → Claude Sonnet
    if (estimatedComplexity === 'medium') {
      const cost = this.estimateCost('claude-sonnet-4-5-20250929', context.estimatedTokens || 1500);
      if (this.costTracker.isWithinBudget(cost)) {
        return this.getModelConfig('claude-sonnet-4-5-20250929');
      }
    }

    // Speed required → Gemini Flash
    if (requiresSpeed || estimatedComplexity === 'low') {
      const cost = this.estimateCost('gemini-2.5-flash', context.estimatedTokens || 1000);
      if (this.costTracker.isWithinBudget(cost)) {
        return this.getModelConfig('gemini-2.5-flash');
      }
    }

    // Default: Gemini Pro (balanced)
    const cost = this.estimateCost('gemini-2.5-pro', context.estimatedTokens || 1000);
    if (this.costTracker.isWithinBudget(cost)) {
      return this.getModelConfig('gemini-2.5-pro');
    }

    // Fallback to free local model
    return this.getModelConfig('ollama/llama3.1');
  }

  /**
   * Find matching routing rule
   */
  private findMatchingRule(taskType: string, context: TaskContext): RoutingRule | null {
    for (const rule of this.config.rules) {
      if (rule.taskType === taskType) {
        if (!rule.condition || rule.condition(context)) {
          return rule;
        }
      }
    }
    return null;
  }

  /**
   * Get model configuration
   */
  private getModelConfig(model: AllowedModel): ModelConfig {
    const config = this.config.models.find((m) => m.model === model);
    if (config) {
      return config;
    }

    // Return default config for model
    return this.getDefaultModelConfig(model);
  }

  /**
   * Get default configuration for a model
   */
  private getDefaultModelConfig(model: AllowedModel): ModelConfig {
    const defaultConfigs: Record<AllowedModel, ModelConfig> = {
      'claude-sonnet-4-5-20250929': {
        model: 'claude-sonnet-4-5-20250929',
        priority: 3,
        maxTokens: 4096,
        temperature: 0.7,
        capabilities: ['reasoning', 'coding', 'analysis'],
      },
      'claude-opus-4-5-20251101': {
        model: 'claude-opus-4-5-20251101',
        priority: 4,
        maxTokens: 4096,
        temperature: 0.7,
        capabilities: ['reasoning', 'coding', 'analysis', 'complex-tasks'],
      },
      'gemini-2.5-pro': {
        model: 'gemini-2.5-pro',
        priority: 2,
        maxTokens: 8192,
        temperature: 0.7,
        capabilities: ['reasoning', 'coding', 'multimodal'],
      },
      'gemini-2.5-flash': {
        model: 'gemini-2.5-flash',
        priority: 1,
        maxTokens: 8192,
        temperature: 0.7,
        capabilities: ['speed', 'basic-tasks'],
      },
      'ollama/llama3.1': {
        model: 'ollama/llama3.1',
        priority: 0,
        maxTokens: 2048,
        temperature: 0.7,
        capabilities: ['local', 'offline'],
      },
    };

    return defaultConfigs[model];
  }

  /**
   * Estimate cost for a model and token count
   */
  estimateCost(model: string, tokens: number): number {
    // Assume 70% input, 30% output token distribution
    const inputTokens = Math.floor(tokens * 0.7);
    const outputTokens = Math.floor(tokens * 0.3);
    return this.costTracker.calculateCost(model, inputTokens, outputTokens);
  }

  /**
   * Track actual usage
   */
  trackUsage(model: string, inputTokens: number, outputTokens: number, taskType?: string): void {
    this.costTracker.record({
      model,
      inputTokens,
      outputTokens,
      taskType,
    });
  }

  /**
   * Get budget status
   */
  getBudgetStatus(): BudgetStatus {
    return this.costTracker.getBudgetStatus();
  }

  /**
   * Update budget configuration
   */
  updateBudget(limit: number, period: BudgetPeriod): void {
    this.config.budgetLimit = limit;
    this.config.budgetPeriod = period;
    this.costTracker.updateBudget(limit, period);
  }

  /**
   * Add routing rule
   */
  addRoutingRule(rule: RoutingRule): void {
    // Remove existing rule with same ID
    this.config.rules = this.config.rules.filter((r) => r.id !== rule.id);
    this.config.rules.push(rule);
  }

  /**
   * Remove routing rule
   */
  removeRoutingRule(ruleId: string): void {
    this.config.rules = this.config.rules.filter((r) => r.id !== ruleId);
  }

  /**
   * Get current configuration
   */
  getConfig(): RouterConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.budgetLimit || config.budgetPeriod) {
      this.costTracker.updateBudget(
        config.budgetLimit || this.config.budgetLimit,
        config.budgetPeriod || this.config.budgetPeriod
      );
    }
  }

  /**
   * Get cost tracker instance
   */
  getCostTracker(): CostTracker {
    return this.costTracker;
  }
}

/**
 * Create default router configuration
 */
export function createDefaultRouterConfig(): RouterConfig {
  return {
    models: [
      {
        model: 'claude-opus-4-5-20251101',
        priority: 4,
        maxTokens: 4096,
        temperature: 0.7,
        capabilities: ['reasoning', 'coding', 'analysis', 'complex-tasks'],
      },
      {
        model: 'claude-sonnet-4-5-20250929',
        priority: 3,
        maxTokens: 4096,
        temperature: 0.7,
        capabilities: ['reasoning', 'coding', 'analysis'],
      },
      {
        model: 'gemini-2.5-pro',
        priority: 2,
        maxTokens: 8192,
        temperature: 0.7,
        capabilities: ['reasoning', 'coding', 'multimodal'],
      },
      {
        model: 'gemini-2.5-flash',
        priority: 1,
        maxTokens: 8192,
        temperature: 0.7,
        capabilities: ['speed', 'basic-tasks'],
      },
      {
        model: 'ollama/llama3.1',
        priority: 0,
        maxTokens: 2048,
        temperature: 0.7,
        capabilities: ['local', 'offline'],
      },
    ],
    rules: [
      {
        id: 'complex-reasoning',
        taskType: 'reasoning',
        preferredModel: 'claude-opus-4-5-20251101',
        fallbackModel: 'claude-sonnet-4-5-20250929',
      },
      {
        id: 'code-generation',
        taskType: 'coding',
        preferredModel: 'claude-sonnet-4-5-20250929',
        fallbackModel: 'gemini-2.5-pro',
      },
      {
        id: 'simple-formatting',
        taskType: 'formatting',
        preferredModel: 'gemini-2.5-flash',
        fallbackModel: 'ollama/llama3.1',
      },
      {
        id: 'data-analysis',
        taskType: 'analysis',
        preferredModel: 'gemini-2.5-pro',
        fallbackModel: 'claude-sonnet-4-5-20250929',
      },
    ],
    budgetLimit: 5.0,
    budgetPeriod: 'day',
    fallbackModel: 'ollama/llama3.1',
  };
}
