import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequest, formatValidationError } from '@/lib/security/validators';
import { ModelRouter, createDefaultRouterConfig } from '@/lib/ai/router';
import { costTracker } from '../usage/route';

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

    // Log selection
    console.log('[Router] Model selection:', {
      taskType,
      selectedModel: selectedModel.model,
      estimatedCost,
      budgetUsed: budgetStatus.percentUsed.toFixed(1) + '%',
    });

    // Return selected model and execution plan
    // In production, this would actually call the model API
    return NextResponse.json({
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
      // Include actual execution details (would be real in production)
      message: `This is a demonstration response. In production, this would execute the prompt using ${selectedModel.model}.`,
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
 * This would integrate with your Claude CLI or API in production
 */
async function executeWithModel(
  model: string,
  prompt: string,
  workingDirectory?: string
): Promise<{ output: string; inputTokens: number; outputTokens: number }> {
  // Placeholder implementation
  // In production, this would call the actual model API or CLI

  // Simulate token usage (replace with actual token counting)
  const inputTokens = Math.ceil(prompt.length / 4);
  const outputTokens = Math.ceil(inputTokens * 0.5); // Estimate

  return {
    output: `Response from ${model}: This is a placeholder response. Integrate with actual model API.`,
    inputTokens,
    outputTokens,
  };
}
