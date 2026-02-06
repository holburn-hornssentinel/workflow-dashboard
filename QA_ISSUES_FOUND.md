# QA Issues Found - Workflow Demo Site

**Date:** 2026-02-06
**Site:** https://workflow.mikedeez.top
**QA Round:** 2 (Console Error Detection)

## Executive Summary

✅ **API Tests:** 15/15 passed
❌ **Browser Tests:** 5/6 passed
❌ **Console Errors:** 7 errors detected (2 CSP violations, 5 console errors)

## Issues Detected

### Critical: CSP Violations

#### 1. Three.js HDR Environment Map Blocked
**Location:** Builder page (3D view)
**Error:**
```
Connecting to 'https://raw.githubusercontent.com/pmndrs/drei-assets/.../potsdamer_platz_1k.hdr'
violates Content Security Policy directive: "connect-src 'self' https://raw.githack.com https://cdn.mxpnl.com"
```

**Impact:**
- 3D view environment lighting fails to load
- Causes WebGL context errors
- Fallback to dark background

**Root Cause:** CSP `connect-src` directive does not include `https://raw.githubusercontent.com`

**Fix:** Add `https://raw.githubusercontent.com` to `connect-src` directive in CSP

---

#### 2. Mixpanel Analytics Blocked
**Location:** Builder page (and potentially all pages)
**Error:**
```
Connecting to 'https://api-js.mixpanel.com/track/?verbose=1&ip=1&_=...'
violates Content Security Policy directive: "connect-src 'self' https://raw.githack.com https://cdn.mxpnl.com"
```

**Impact:**
- Analytics events are not being tracked
- User behavior data is lost
- No telemetry on feature usage

**Root Cause:** CSP `connect-src` includes `https://cdn.mxpnl.com` (for Mixpanel script loading) but not `https://api-js.mixpanel.com` (for event tracking)

**Fix:** Add `https://api-js.mixpanel.com` to `connect-src` directive in CSP

---

### Medium: Cascading Errors

#### 3. Three.js HDR Loading Failures (x2)
**Location:** Builder page
**Error:**
```
Uncaught exception: Could not load potsdamer_platz_1k.hdr: Failed to fetch
```

**Impact:** Same as issue #1

**Root Cause:** Cascading error from CSP violation #1

**Fix:** Same as issue #1

---

### Low: API Endpoint Restriction

#### 4. Settings API Forbidden
**Location:** Settings page
**Error:**
```
Failed to load resource: the server responded with a status of 403 ()
```

**Impact:**
- Attempting to load `/api/settings/env` endpoint
- Expected behavior in demo mode
- No functional impact

**Root Cause:** Demo mode security restriction (intentional)

**Fix:** None required (working as designed)

---

## Potential Issues Not Yet Encountered

### Web Worker CSP Violations
The current CSP policy does not allow `blob:` URLs for workers:
- Current: `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.mxpnl.com https://static.cloudflareinsights.com`
- Missing: `blob:` support
- Impact: If the app attempts to create web workers from blob URLs, they will be blocked

**Recommendation:** Add `blob:` to `script-src` and add `worker-src 'self' blob:`

---

## Fixes Applied

### 1. Created `middleware.ts` with Updated CSP
File: `/home/horns/workflow-dashboard/middleware.ts`

**New CSP Policy:**
```
connect-src 'self' https://raw.githack.com https://cdn.mxpnl.com
            https://api-js.mixpanel.com https://raw.githubusercontent.com;
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.mxpnl.com
           https://static.cloudflareinsights.com blob:;
worker-src 'self' blob:;
child-src 'self' blob:;
```

### 2. Enhanced QA Test Suite
Created `e2e/qa-console-errors.spec.ts` to:
- ✅ Detect CSP violations
- ✅ Capture uncaught exceptions
- ✅ Identify failed resource loads
- ✅ Report all console errors with page context
- ✅ Generate detailed JSON error reports

### 3. Updated Test Runner
Updated `run_qa_interactive.sh` to:
- Run visual/interactive tests
- Run console error detection tests
- Report combined results

---

## Deployment Required

⚠️ **The fixes are ready but NOT deployed**

The `middleware.ts` file has been created locally with the correct CSP policy, but it needs to be deployed to the live site at `https://workflow.mikedeez.top`.

### Deployment Steps:
1. Commit `middleware.ts` to git
2. Push to production branch
3. Redeploy the site
4. Run QA tests to verify: `./run_qa_interactive.sh`

See `CSP_FIX_GUIDE.md` for detailed deployment instructions.

---

## Test Results Before Fix

### Console Error Test
```
CSP Violations: 2
Console Errors: 5

Breakdown:
- Builder page: 6 errors (2 CSP, 4 cascading)
- Settings page: 1 error (expected 403)
```

### Expected Results After Fix
```
CSP Violations: 0
Console Errors: 1 (only the expected 403 on Settings)
```

---

## Files Created/Modified

### New Files
- `middleware.ts` - CSP header middleware
- `e2e/qa-console-errors.spec.ts` - Console error detection tests
- `CSP_FIX_GUIDE.md` - Deployment guide
- `QA_ISSUES_FOUND.md` - This document
- `qa_console_errors_detailed.json` - Error report

### Modified Files
- `run_qa_interactive.sh` - Added console error checking
- `e2e/qa-interactive.spec.ts` - Added console error capture (partial)

---

## Recommendations

### Immediate Actions
1. ✅ Deploy `middleware.ts` to production
2. ✅ Re-run QA tests to verify fixes
3. ✅ Monitor Mixpanel dashboard to confirm analytics are working

### Future Improvements
1. Add CSP reporting endpoint to capture violations in production
2. Set up automated QA runs on each deployment
3. Add performance monitoring for WebGL/Three.js initialization
4. Consider using a CDN for Three.js assets instead of raw.githubusercontent.com

---

## QA Test Coverage

### What We Test Now ✅
- All API endpoints (GET/POST)
- All page loads
- Mock data display
- Integration flows (export/import)
- **Console errors and CSP violations** (NEW)
- **Browser exceptions** (NEW)
- **Resource load failures** (NEW)

### What We Don't Test Yet
- User interactions (clicks, form submissions)
- Real-time features (WebSockets)
- Performance metrics
- Accessibility (WCAG compliance)
- Mobile responsiveness
- Cross-browser compatibility (only Chromium tested)
