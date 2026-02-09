import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'claude' | 'gemini';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export async function* streamCompletion(
  provider: AIProvider,
  messages: AIMessage[],
  options: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
  } = {}
): AsyncGenerator<StreamChunk> {
  if (provider === 'claude') {
    yield* streamClaude(messages, options);
  } else if (provider === 'gemini') {
    yield* streamGemini(messages, options);
  }
}

async function* streamClaude(
  messages: AIMessage[],
  options: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
  }
): AsyncGenerator<StreamChunk> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({ apiKey });
  const model = options.model || 'claude-sonnet-4-5-20250929';

  const stream = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    ...(options.systemPrompt && { system: options.systemPrompt }),
    stream: true,
  });

  // @ts-ignore - Anthropic streaming type issue
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      if (chunk.delta.type === 'text_delta') {
        yield { text: chunk.delta.text, done: false };
      }
    } else if (chunk.type === 'message_stop') {
      yield { text: '', done: true };
    }
  }
}

async function* streamGemini(
  messages: AIMessage[],
  options: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
  }
): AsyncGenerator<StreamChunk> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: options.model || 'gemini-2.5-flash',
  });

  // Combine system prompt and messages
  let prompt = '';
  if (options.systemPrompt) {
    prompt += `${options.systemPrompt}\n\n`;
  }

  // Convert messages to Gemini format
  for (const msg of messages) {
    prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
  }

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield { text, done: false };
    }
  }

  yield { text: '', done: true };
}

export async function generateText(options: {
  provider: AIProvider;
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}): Promise<string> {
  const messages: AIMessage[] = [{ role: 'user', content: options.prompt }];
  let fullText = '';

  for await (const chunk of streamCompletion(options.provider, messages, {
    model: options.model,
    systemPrompt: options.systemPrompt,
    temperature: options.temperature,
  })) {
    if (chunk.text) {
      fullText += chunk.text;
    }
  }

  return fullText;
}

// Provider detection functions
export function isKeyConfigured(provider: AIProvider): boolean {
  const key = provider === 'claude'
    ? process.env.ANTHROPIC_API_KEY
    : process.env.GEMINI_API_KEY;

  if (!key) return false;
  if (key.includes('your_') || key.includes('placeholder')) return false;
  if (key === 'your_anthropic_api_key_here' || key === 'your_gemini_api_key_here') return false;

  return true;
}

export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (isKeyConfigured('claude')) providers.push('claude');
  if (isKeyConfigured('gemini')) providers.push('gemini');
  return providers;
}

export function getDefaultProvider(): AIProvider | null {
  const available = getAvailableProviders();
  return available.length > 0 ? available[0] : null;
}
