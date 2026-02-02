import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env.local');

interface EnvConfig {
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  MEMORY_BACKEND?: string;
  LANCEDB_PATH?: string;
}

// GET: Read current environment configuration (masked)
export async function GET() {
  try {
    const config: EnvConfig = {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      MEMORY_BACKEND: process.env.MEMORY_BACKEND || 'local',
      LANCEDB_PATH: process.env.LANCEDB_PATH || './data/lancedb',
    };

    // Mask API keys for security
    const masked = {
      anthropicKey: maskKey(config.ANTHROPIC_API_KEY),
      geminiKey: maskKey(config.GEMINI_API_KEY),
      hasAnthropicKey: !!config.ANTHROPIC_API_KEY,
      hasGeminiKey: !!config.GEMINI_API_KEY,
      memoryBackend: config.MEMORY_BACKEND,
      lancedbPath: config.LANCEDB_PATH,
    };

    return NextResponse.json(masked);
  } catch (error) {
    console.error('Failed to read env config:', error);
    return NextResponse.json({ error: 'Failed to read configuration' }, { status: 500 });
  }
}

// POST: Update environment configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anthropicKey, geminiKey, memoryBackend, lancedbPath } = body;

    // Read existing .env.local or create new
    let envContent = '';
    if (existsSync(ENV_PATH)) {
      envContent = readFileSync(ENV_PATH, 'utf-8');
    }

    // Parse existing env vars
    const envVars = parseEnvFile(envContent);

    // Update values (only if provided and not masked)
    if (anthropicKey && !anthropicKey.includes('***')) {
      envVars.ANTHROPIC_API_KEY = anthropicKey.trim();
    }
    if (geminiKey && !geminiKey.includes('***')) {
      envVars.GEMINI_API_KEY = geminiKey.trim();
    }
    if (memoryBackend) {
      envVars.MEMORY_BACKEND = memoryBackend;
    }
    if (lancedbPath) {
      envVars.LANCEDB_PATH = lancedbPath;
    }

    // Write back to .env.local
    const newContent = buildEnvFile(envVars);
    writeFileSync(ENV_PATH, newContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Configuration saved. Restart the server for changes to take effect.',
    });
  } catch (error) {
    console.error('Failed to write env config:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}

// Mask API key for display (show first 7 and last 4 characters)
function maskKey(key?: string): string {
  if (!key) return '';
  if (key.length < 12) return '***';
  return `${key.slice(0, 7)}***${key.slice(-4)}`;
}

// Parse .env file into key-value pairs
function parseEnvFile(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim();
    vars[key] = value;
  }

  return vars;
}

// Build .env file content from key-value pairs
function buildEnvFile(vars: Record<string, string>): string {
  const lines = [
    '# AI Provider API Keys',
    '# You need at least ONE of these configured',
    '',
    '# Anthropic Claude API Key',
    '# Get your key from: https://console.anthropic.com/',
    `ANTHROPIC_API_KEY=${vars.ANTHROPIC_API_KEY || ''}`,
    '',
    '# Google Gemini API Key',
    '# Get your key from: https://aistudio.google.com/app/apikey',
    `GEMINI_API_KEY=${vars.GEMINI_API_KEY || ''}`,
    '',
    '# Memory Backend (local or cloud)',
    `MEMORY_BACKEND=${vars.MEMORY_BACKEND || 'local'}`,
    `LANCEDB_PATH=${vars.LANCEDB_PATH || './data/lancedb'}`,
    '',
  ];

  return lines.join('\n');
}
