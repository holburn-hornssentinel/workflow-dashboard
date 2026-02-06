# CSP Violations Fix Guide

## Issues Detected

The QA tests detected the following Content Security Policy violations:

### 1. Three.js HDR Environment Map (Builder Page)
**Error:** Connecting to `https://raw.githubusercontent.com/pmndrs/drei-assets/.../potsdamer_platz_1k.hdr` violates CSP `connect-src` directive

**Impact:** 3D view in the visual builder fails to load the environment lighting, causing WebGL context errors.

**Fix Required:** Add `https://raw.githubusercontent.com` to `connect-src` directive

### 2. Mixpanel Analytics
**Error:** Connecting to `https://api-js.mixpanel.com/track/` violates CSP `connect-src` directive

**Impact:** Analytics events are not being tracked.

**Fix Required:** Add `https://api-js.mixpanel.com` to `connect-src` directive

### 3. Web Workers (Not yet encountered but will fail)
**Potential Error:** Creating workers from blob URLs will violate CSP `worker-src` directive

**Fix Required:** Add `blob:` to `worker-src` and `script-src` directives

## Solution

A `middleware.ts` file has been created with the correct CSP policy:

```typescript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.mxpnl.com https://static.cloudflareinsights.com blob:;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self' data:;
  connect-src 'self' https://raw.githack.com https://cdn.mxpnl.com https://api-js.mixpanel.com https://raw.githubusercontent.com;
  worker-src 'self' blob:;
  child-src 'self' blob:;
  frame-src 'self';
  media-src 'self' blob: data:;
`.replace(/\s{2,}/g, ' ').trim();
```

### Changes Made:
1. ✅ Added `https://api-js.mixpanel.com` to `connect-src` (Mixpanel analytics)
2. ✅ Added `https://raw.githubusercontent.com` to `connect-src` (Three.js assets)
3. ✅ Added `blob:` to `script-src` (Web workers)
4. ✅ Added `worker-src 'self' blob:` (Web workers)
5. ✅ Added `child-src 'self' blob:` (Web workers)

## Deployment Instructions

### Option 1: Deploy via Next.js Middleware (Recommended)
The `middleware.ts` file is already created in the project root. To deploy:

```bash
# 1. Commit the middleware file
git add middleware.ts
git commit -m "fix: Add CSP headers to allow Three.js and Mixpanel"

# 2. Push to production
git push origin main

# 3. Redeploy the site (method depends on your hosting)
# For Vercel/Netlify, this happens automatically on push
```

### Option 2: Configure at Deployment Level
If using a deployment platform that allows CSP configuration:

**Vercel** (`vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.mxpnl.com https://static.cloudflareinsights.com blob:; connect-src 'self' https://raw.githack.com https://cdn.mxpnl.com https://api-js.mixpanel.com https://raw.githubusercontent.com; worker-src 'self' blob:;"
        }
      ]
    }
  ]
}
```

**Cloudflare Pages** (via dashboard):
- Navigate to Settings → Headers
- Add CSP header with the policy above

## Verification

After deploying, run the QA tests to verify all CSP violations are resolved:

```bash
# Run console error detection
npx playwright test e2e/qa-console-errors.spec.ts

# Expected output:
# ✅ No console errors detected
```

## Alternative: Disable Features in Demo Mode

If CSP cannot be updated on the deployed site, you can disable the problematic features in demo mode:

### Disable 3D View HDR Loading
Edit `app/builder/components/Builder3DView.tsx`:

```typescript
// Replace the Environment component with a simple color background
<Environment preset="sunset" /> // Remove this
<color attach="background" args={['#1a1a1a']} /> // Add this instead
```

### Disable Mixpanel in Demo
Edit `lib/analytics.ts` or wherever Mixpanel is initialized:

```typescript
if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
  // Disable Mixpanel in demo mode
  mixpanel.init('dummy', { track_pageview: false, disable_all_events: true });
} else {
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN);
}
```

## Testing

The QA test suite has been updated to detect console errors and CSP violations:

- `e2e/qa-console-errors.spec.ts` - Dedicated console error detection
- Test runs on all pages and captures:
  - CSP violations
  - Uncaught exceptions
  - Failed resource loads
  - WebGL errors

Run with:
```bash
./run_qa_interactive.sh  # Includes console error checks
```
