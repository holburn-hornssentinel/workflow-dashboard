/**
 * Cost tracking for AI model usage
 * Tracks token usage and calculates costs across different models
 */

export interface UsageRecord {
  id: string;
  timestamp: Date;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  taskType?: string;
}

export interface BudgetStatus {
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  projectedEndOfPeriod: number;
}

export type BudgetPeriod = 'day' | 'week' | 'month';

/**
 * Model pricing per 1M tokens (input, output)
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5-20250929': { input: 3.0, output: 15.0 },
  'claude-opus-4-6': { input: 15.0, output: 75.0 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4.0 },
  'gemini-2.5-pro': { input: 1.25, output: 5.0 },
  'gemini-2.5-flash': { input: 0.075, output: 0.3 },
  'ollama/llama3.1': { input: 0.0, output: 0.0 }, // Local model
};

export class CostTracker {
  private records: UsageRecord[] = [];
  private budgetLimit: number;
  private budgetPeriod: BudgetPeriod;

  constructor(budgetLimit: number = 5.0, budgetPeriod: BudgetPeriod = 'day') {
    this.budgetLimit = budgetLimit;
    this.budgetPeriod = budgetPeriod;
  }

  /**
   * Record a usage event
   */
  record(usage: Omit<UsageRecord, 'id' | 'timestamp' | 'cost'>): UsageRecord {
    const cost = this.calculateCost(usage.model, usage.inputTokens, usage.outputTokens);

    const record: UsageRecord = {
      id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      cost,
      ...usage,
    };

    this.records.push(record);

    // Clean up old records periodically
    this.cleanupOldRecords();

    return record;
  }

  /**
   * Calculate cost for a model and token usage
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      console.warn(`[CostTracker] Unknown model pricing: ${model}, assuming $0`);
      return 0;
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Estimate cost for a prompt
   */
  estimateCost(model: string, estimatedInputTokens: number, estimatedOutputTokens: number): number {
    return this.calculateCost(model, estimatedInputTokens, estimatedOutputTokens);
  }

  /**
   * Get usage for a specific period
   */
  getUsage(period: BudgetPeriod): UsageRecord[] {
    const cutoffDate = this.getPeriodCutoff(period);
    return this.records.filter((r) => r.timestamp >= cutoffDate);
  }

  /**
   * Get current budget status
   */
  getBudgetStatus(): BudgetStatus {
    const periodUsage = this.getUsage(this.budgetPeriod);
    const used = periodUsage.reduce((sum, r) => sum + r.cost, 0);
    const remaining = Math.max(0, this.budgetLimit - used);
    const percentUsed = (used / this.budgetLimit) * 100;

    // Project end of period spending
    const periodStart = this.getPeriodCutoff(this.budgetPeriod);
    const now = new Date();
    const periodDuration = this.getPeriodDurationMs(this.budgetPeriod);
    const elapsedMs = now.getTime() - periodStart.getTime();
    const elapsedPercent = elapsedMs / periodDuration;

    const projectedEndOfPeriod = elapsedPercent > 0 ? used / elapsedPercent : used;

    return {
      used,
      limit: this.budgetLimit,
      remaining,
      percentUsed,
      projectedEndOfPeriod,
    };
  }

  /**
   * Get breakdown of costs by model
   */
  getModelBreakdown(): Map<string, number> {
    const periodUsage = this.getUsage(this.budgetPeriod);
    const breakdown = new Map<string, number>();

    for (const record of periodUsage) {
      const current = breakdown.get(record.model) || 0;
      breakdown.set(record.model, current + record.cost);
    }

    return breakdown;
  }

  /**
   * Check if within budget
   */
  isWithinBudget(additionalCost: number = 0): boolean {
    const status = this.getBudgetStatus();
    return status.used + additionalCost <= this.budgetLimit;
  }

  /**
   * Update budget settings
   */
  updateBudget(limit: number, period: BudgetPeriod): void {
    this.budgetLimit = limit;
    this.budgetPeriod = period;
  }

  /**
   * Get all records
   */
  getAllRecords(): UsageRecord[] {
    return [...this.records];
  }

  /**
   * Clear all records
   */
  clearRecords(): void {
    this.records = [];
  }

  /**
   * Get period cutoff date
   */
  private getPeriodCutoff(period: BudgetPeriod): Date {
    const now = new Date();
    const cutoff = new Date(now);

    switch (period) {
      case 'day':
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - now.getDay());
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'month':
        cutoff.setDate(1);
        cutoff.setHours(0, 0, 0, 0);
        break;
    }

    return cutoff;
  }

  /**
   * Get period duration in milliseconds
   */
  private getPeriodDurationMs(period: BudgetPeriod): number {
    switch (period) {
      case 'day':
        return 24 * 60 * 60 * 1000;
      case 'week':
        return 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Clean up records older than 90 days
   */
  private cleanupOldRecords(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    this.records = this.records.filter((r) => r.timestamp >= cutoff);
  }

  /**
   * Export usage data as JSON
   */
  exportData(): string {
    return JSON.stringify(
      {
        records: this.records,
        budgetLimit: this.budgetLimit,
        budgetPeriod: this.budgetPeriod,
      },
      null,
      2
    );
  }

  /**
   * Import usage data from JSON
   */
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      this.records = data.records.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
      }));
      this.budgetLimit = data.budgetLimit;
      this.budgetPeriod = data.budgetPeriod;
    } catch (error) {
      console.error('[CostTracker] Failed to import data:', error);
      throw new Error('Invalid import data');
    }
  }
}
