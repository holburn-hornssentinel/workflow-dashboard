import { NextRequest } from 'next/server';
import { streamCompletion, AIProvider } from '@/lib/ai/providers';

// Streaming execution endpoint supporting multiple AI providers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      model = 'claude-sonnet-4-5-20250929',
      systemPrompt,
      tools,
      provider = 'claude'
    } = body;

    // Validate provider
    if (!['claude', 'gemini'].includes(provider)) {
      return new Response(
        JSON.stringify({ error: `Invalid provider: ${provider}. Must be 'claude' or 'gemini'` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check API key for selected provider
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Check for placeholder keys
    const isClaudeConfigured = claudeKey && claudeKey !== 'your_anthropic_api_key_here' && !claudeKey.includes('placeholder');
    const isGeminiConfigured = geminiKey && geminiKey !== 'your_gemini_api_key_here' && !geminiKey.includes('placeholder');

    if (provider === 'claude' && !isClaudeConfigured) {
      return new Response(
        JSON.stringify({ error: 'Please configure your Anthropic API key in Settings → AI Models' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (provider === 'gemini' && !isGeminiConfigured) {
      return new Response(
        JSON.stringify({ error: 'Please configure your Google Gemini API key in Settings → AI Models' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messages = [{ role: 'user' as const, content: prompt }];

          // Stream messages from selected AI provider
          for await (const chunk of streamCompletion(provider as AIProvider, messages, {
            model,
            systemPrompt,
            ...(tools && { tools }),
          })) {
            if (chunk.text) {
              const data = JSON.stringify({
                type: 'content_block_delta',
                delta: { type: 'text_delta', text: chunk.text },
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            if (chunk.done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            }
          }

          controller.close();
        } catch (error) {
          console.error('[Stream] Error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Stream] Request error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
