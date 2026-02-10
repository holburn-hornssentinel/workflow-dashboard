/**
 * API authentication using API keys
 * Protects endpoints from unauthorized network access
 */

import { NextRequest } from 'next/server';

export const AUTH_CONFIG = {
  headerName: 'X-API-Key',
  envVar: 'DASHBOARD_API_KEY',
} as const;

/**
 * Validates API key from request header
 * Returns true if API key matches environment variable
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get(AUTH_CONFIG.headerName);
  const validKey = process.env[AUTH_CONFIG.envVar];

  // Require API key to be configured and match
  if (!validKey) {
    console.warn(
      '[Auth] DASHBOARD_API_KEY not configured - API authentication disabled'
    );
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (!apiKey) {
    return false;
  }

  return timingSafeEqual(apiKey, validKey);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate a secure random API key
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  let result = '';

  // Use crypto.getRandomValues for secure random generation
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

/**
 * Get the current authentication mode from environment
 */
export function getAuthMode(): 'open' | 'api-key' | 'dev-bypass' {
  const mode = process.env.AUTH_MODE?.toLowerCase();

  if (mode === 'open' || mode === 'api-key' || mode === 'dev-bypass') {
    return mode;
  }

  // Default to dev-bypass for backwards compatibility
  return 'dev-bypass';
}

/**
 * Check if authentication is required based on environment
 */
export function isAuthRequired(): boolean {
  const authMode = getAuthMode();

  switch (authMode) {
    case 'open':
      // No auth required
      return false;
    case 'api-key':
      // Always require auth
      return true;
    case 'dev-bypass':
      // Skip auth in development, require in production
      return process.env.NODE_ENV !== 'development';
    default:
      // Default to requiring auth for safety
      return true;
  }
}
