/**
 * Next.js Middleware for API authentication
 * Validates API keys for all API routes in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, isAuthRequired } from '@/lib/security/auth';

export function middleware(request: NextRequest) {
  // Skip auth if not required (e.g., development mode)
  if (!isAuthRequired()) {
    return NextResponse.next();
  }

  // Skip auth for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip auth for health check endpoints
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  // Validate API key
  if (!validateApiKey(request)) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Invalid or missing API key',
      },
      { status: 401 }
    );
  }

  // API key valid, proceed
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: '/api/:path*',
};
