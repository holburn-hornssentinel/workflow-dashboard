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
 * Check if authentication is required based on environment
 */
export function isAuthRequired(): boolean {
  // Skip auth in development by default
  if (process.env.NODE_ENV === 'development') {
    return process.env.REQUIRE_AUTH_IN_DEV === 'true';
  }

  // Always require auth in production
  return true;
}
