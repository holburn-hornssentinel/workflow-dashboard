import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { errors } = await request.json();
    const logPath = join('/tmp', 'browser-errors.log');

    const timestamp = new Date().toISOString();
    const logContent = `\n\n=== ${timestamp} ===\n${JSON.stringify(errors, null, 2)}\n`;

    await writeFile(logPath, logContent, { flag: 'a' });

    return NextResponse.json({ success: true, logPath });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log errors' }, { status: 500 });
  }
}
