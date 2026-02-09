import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequest, formatValidationError } from '@/lib/security/validators';
import { ModelRouter, createDefaultRouterConfig } from '@/lib/ai/router';
import { CostTracker } from '@/lib/ai/cost-tracker';

/**
 * Schema for routed completion request
 */
const CompletionRequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  taskType: z.string().optional(),
  estimatedComplexity: z.enum(['low', 'medium', 'high']).optional(),
  estimatedTokens: z.number().int().positive().optional(),
  requiresReasoning: z.boolean().optional(),
  requiresSpeed: z.boolean().optional(),
  workingDirectory: z.string().optional(),
});

// Initialize router with default config
const router = new ModelRouter(createDefaultRouterConfig());

// Initialize cost tracker
const costTracker = new CostTracker();

/**
 * POST /api/router/complete
 * Intelligently routes completion request to appropriate model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = validateRequest(CompletionRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatValidationError(validation.error), {
        status: 400,
      });
    }

    const {
      prompt,
      taskType = 'general',
      estimatedComplexity,
      estimatedTokens,
      requiresReasoning,
      requiresSpeed,
      workingDirectory,
    } = validation.data;

    // Create task context
    const context = {
      type: taskType,
      prompt,
      estimatedComplexity,
      estimatedTokens,
      requiresReasoning,
      requiresSpeed,
    };

    // Select model using router
    const selectedModel = router.selectModel(taskType, context);

    // Check budget before proceeding
    const budgetStatus = costTracker.getBudgetStatus();
    if (budgetStatus.percentUsed >= 100 && selectedModel.model !== 'ollama/llama3.1') {
      return NextResponse.json(
        {
          error: 'Budget exceeded',
          message: 'Daily budget limit reached. Please increase limit or try again later.',
          budgetStatus,
          selectedModel: 'ollama/llama3.1',
        },
        { status: 429 }
      );
    }

    // Estimate cost
    const estimatedCost = router.estimateCost(
      selectedModel.model,
      estimatedTokens || 1000
    );

    // Execute with the selected model
    const result = await executeWithModel(selectedModel.model, prompt, workingDirectory);

    // Track actual usage
    costTracker.record({
      model: selectedModel.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      taskType,
    });

    // Return selected model and execution result
    return NextResponse.json({
      output: result.output,
      selectedModel: {
        model: selectedModel.model,
        maxTokens: selectedModel.maxTokens,
        temperature: selectedModel.temperature,
        capabilities: selectedModel.capabilities,
      },
      estimatedCost,
      budgetStatus: {
        used: budgetStatus.used,
        limit: budgetStatus.limit,
        remaining: budgetStatus.remaining,
        percentUsed: budgetStatus.percentUsed,
      },
      executionPlan: {
        taskType,
        complexity: estimatedComplexity || 'medium',
        reasoning: `Selected ${selectedModel.model} based on task type "${taskType}" and ${
          estimatedComplexity ? `complexity "${estimatedComplexity}"` : 'heuristics'
        }`,
      },
      tokensUsed: {
        input: result.inputTokens,
        output: result.outputTokens,
        total: result.inputTokens + result.outputTokens,
      },
    });
  } catch (error) {
    console.error('[Router Complete] Error:', error);
    return NextResponse.json(
      {
        error: 'Completion request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to actually execute with selected model
 */
async function executeWithModel(
  model: string,
  prompt: string,
  workingDirectory?: string
): Promise<{ output: string; inputTokens: number; outputTokens: number }> {
  // Dynamically import to avoid circular dependencies
  const { generateText } = await import('@/lib/ai/providers');

  // Determine provider from model name
  let provider: 'claude' | 'gemini' = 'claude';
  if (model.includes('gemini')) {
    provider = 'gemini';
  }

  try {
    const output = await generateText({
      provider,
      model,
      prompt,
    });

    // Estimate token usage (replace with actual token counting if available)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(output.length / 4);

    return {
      output,
      inputTokens,
      outputTokens,
    };
  } catch (error) {
    throw new Error(`Model execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
