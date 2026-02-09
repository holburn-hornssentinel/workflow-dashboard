import { NextResponse } from 'next/server';
import { isKeyConfigured } from '@/lib/ai/providers';

export async function GET() {
  try {
    const providers = [
      {
        id: 'claude',
        name: 'Claude (Anthropic)',
        configured: isKeyConfigured('claude'),
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        configured: isKeyConfigured('gemini'),
      },
    ];

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('[Providers] Failed to get provider status:', error);
    return NextResponse.json(
      { error: 'Failed to get provider status' },
      { status: 500 }
    );
  }
}
