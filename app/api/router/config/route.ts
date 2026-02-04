import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequest, formatValidationError } from '@/lib/security/validators';
import { ALLOWED_MODELS } from '@/lib/security/sanitizer';

/**
 * Router configuration schema
 */
const RouterConfigSchema = z.object({
  budgetLimit: z.number().positive().optional(),
  budgetPeriod: z.enum(['day', 'week', 'month']).optional(),
  fallbackModel: z.enum(ALLOWED_MODELS).optional(),
  rules: z
    .array(
      z.object({
        id: z.string(),
        taskType: z.string(),
        preferredModel: z.enum(ALLOWED_MODELS),
        fallbackModel: z.enum(ALLOWED_MODELS).optional(),
      })
    )
    .optional(),
});

// In-memory config storage (would be persisted in production)
let currentConfig: {
  budgetLimit: number;
  budgetPeriod: 'day' | 'week' | 'month';
  fallbackModel: typeof ALLOWED_MODELS[number];
  rules: Array<{
    id: string;
    taskType: string;
    preferredModel: typeof ALLOWED_MODELS[number];
    fallbackModel?: typeof ALLOWED_MODELS[number];
  }>;
} = {
  budgetLimit: 5.0,
  budgetPeriod: 'day',
  fallbackModel: 'ollama/llama3.1',
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
  ],
};

/**
 * GET /api/router/config
 * Returns current router configuration
 */
export async function GET() {
  try {
    return NextResponse.json({
      config: currentConfig,
    });
  } catch (error) {
    console.error('[Router Config] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/router/config
 * Updates router configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateRequest(RouterConfigSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatValidationError(validation.error), {
        status: 400,
      });
    }

    // Update configuration
    currentConfig = {
      ...currentConfig,
      ...validation.data,
    };

    return NextResponse.json({
      success: true,
      config: currentConfig,
    });
  } catch (error) {
    console.error('[Router Config] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/router/config
 * Resets configuration to defaults
 */
export async function DELETE() {
  try {
    currentConfig = {
      budgetLimit: 5.0,
      budgetPeriod: 'day',
      fallbackModel: 'ollama/llama3.1',
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
      ],
    };

    return NextResponse.json({
      success: true,
      config: currentConfig,
    });
  } catch (error) {
    console.error('[Router Config] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to reset configuration' },
      { status: 500 }
    );
  }
}
