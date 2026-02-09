import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Simple in-memory rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_BODY_SIZE = 10 * 1024; // 10KB

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (limit.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    // Read body and check size
    const bodyText = await request.text();
    if (bodyText.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large. Maximum 10KB.' },
        { status: 413 }
      );
    }

    const { errors } = JSON.parse(bodyText);
    const logPath = join('/tmp', 'browser-errors.log');

    const timestamp = new Date().toISOString();
    const sanitizedIp = ip.replace(/[^a-zA-Z0-9.:, ]/g, '');
    const logContent = `\n\n=== ${timestamp} (IP: ${sanitizedIp}) ===\n${JSON.stringify(errors, null, 2)}\n`;

    await writeFile(logPath, logContent, { flag: 'a' });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log errors' }, { status: 500 });
  }
}
