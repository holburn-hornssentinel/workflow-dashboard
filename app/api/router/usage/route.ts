import { NextRequest, NextResponse } from 'next/server';
import { CostTracker } from '@/lib/ai/cost-tracker';

// Global cost tracker instance (would be persisted in production)
const costTracker = new CostTracker(5.0, 'day');

/**
 * GET /api/router/usage
 * Returns usage statistics and budget status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | null;

    // Get budget status
    const budgetStatus = costTracker.getBudgetStatus();

    // Get usage for period
    const usageRecords = period
      ? costTracker.getUsage(period)
      : costTracker.getAllRecords();

    // Get model breakdown
    const modelBreakdown = costTracker.getModelBreakdown();

    // Calculate statistics
    const totalCalls = usageRecords.length;
    const totalTokens = usageRecords.reduce(
      (sum, r) => sum + r.inputTokens + r.outputTokens,
      0
    );

    // Group by task type
    const taskTypeBreakdown = usageRecords.reduce(
      (acc, record) => {
        const taskType = record.taskType || 'unknown';
        if (!acc[taskType]) {
          acc[taskType] = { count: 0, cost: 0 };
        }
        acc[taskType].count += 1;
        acc[taskType].cost += record.cost;
        return acc;
      },
      {} as Record<string, { count: number; cost: number }>
    );

    return NextResponse.json({
      budgetStatus,
      usage: {
        totalCalls,
        totalTokens,
        totalCost: budgetStatus.used,
        records: usageRecords.slice(0, 100), // Limit to last 100
      },
      breakdown: {
        byModel: Object.fromEntries(modelBreakdown),
        byTaskType: taskTypeBreakdown,
      },
    });
  } catch (error) {
    console.error('[Router Usage] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/router/usage
 * Record a usage event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, inputTokens, outputTokens, taskType } = body;

    if (!model || inputTokens === undefined || outputTokens === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: model, inputTokens, outputTokens' },
        { status: 400 }
      );
    }

    // Record usage
    const record = costTracker.record({
      model,
      inputTokens,
      outputTokens,
      taskType,
    });

    // Get updated budget status
    const budgetStatus = costTracker.getBudgetStatus();

    return NextResponse.json({
      success: true,
      record,
      budgetStatus,
    });
  } catch (error) {
    console.error('[Router Usage] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/router/usage
 * Clear usage history
 */
export async function DELETE() {
  try {
    costTracker.clearRecords();

    return NextResponse.json({
      success: true,
      message: 'Usage history cleared',
    });
  } catch (error) {
    console.error('[Router Usage] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to clear usage history' },
      { status: 500 }
    );
  }
}

// Export the cost tracker for use in other routes
export { costTracker };
