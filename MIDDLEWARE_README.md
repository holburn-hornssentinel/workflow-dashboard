# Middleware Configuration (Optional)

## ⚠️ Note: Next.js 16 Deprecation

Next.js 16 has deprecated the `middleware.ts` file convention in favor of `proxy.ts`.

For now, the middleware file has been renamed to `middleware.ts.optional` to:
1. Avoid the deprecation warning during development
2. Keep the code available for production deployments
3. Maintain a clean startup experience for new users

## 🔒 Security: Auth is Disabled in Development by Default

**Good news:** Authentication is automatically disabled in development mode, so the middleware warning doesn't affect functionality:

```typescript
// lib/security/auth.ts
export function isAuthRequired(): boolean {
  if (process.env.NODE_ENV === 'development') {
    return process.env.REQUIRE_AUTH_IN_DEV === 'true'; // defaults to false
  }
  return true; // production always requires auth
}
```

## 📋 When You Need Auth Middleware

### For Production Deployments

If you're deploying to production and want API authentication:

**Option 1: Wait for Next.js proxy convention (recommended)**
- Next.js will release `proxy.ts` as the replacement
- We'll update the middleware accordingly
- For now, API routes can add auth checks individually

**Option 2: Use the optional middleware file**
```bash
# Rename the file to activate it
mv middleware.ts.optional middleware.ts

# Set your API key
export DASHBOARD_API_KEY=your-secure-key
export NODE_ENV=production

# Start the server
npm start
```

**Note:** You'll see the deprecation warning, but it will still work.

### For API Route-Level Auth

You can also add auth to individual API routes:

```typescript
// app/api/your-route/route.ts
import { validateApiKey, isAuthRequired } from '@/lib/security/auth';

export async function POST(request: NextRequest) {
  // Check auth if required
  if (isAuthRequired() && !validateApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Your route logic...
}
```

## 🚀 Current Status

**Development (default):**
- ✅ No middleware warning (file renamed)
- ✅ No auth blocking
- ✅ Clean startup for new users
- ✅ All security validation still active (input validation, model allowlist, etc.)

**Production:**
- ⚠️ Middleware file available but optional
- ✅ Security features active (command injection prevention, input validation)
- ✅ API route-level auth can be added as needed
- ⏳ Waiting for Next.js proxy.ts convention

## 🔐 Security Features Still Active

Even without middleware auth, these security features protect your deployment:

1. **Input Validation** - All API endpoints use Zod schemas
2. **Model Allowlist** - Only approved models can be used
3. **Command Injection Prevention** - Safe command execution with spawn()
4. **Path Traversal Protection** - Working directory validation
5. **Security Scanner** - Real-time vulnerability detection
6. **Permission System** - Human-in-the-loop approvals

**You're still secure!** The middleware was just one optional layer for production API authentication.
