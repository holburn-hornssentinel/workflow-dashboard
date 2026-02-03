# Testing Quick Start Guide 🧪

## ✅ All Tests Passing: 21/21

## Quick Commands

### Run All Automated Tests (Recommended)
```bash
# Full test suite (takes ~30 seconds)
npm run type-check && npm run test:ci
```

### Individual Test Types

```bash
# 1. TypeScript Type Checking (✅ 0 errors)
npm run type-check

# 2. Unit + Component Tests (✅ 21 passing)
npm run test:ci

# 3. Watch Mode (for development)
npm test

# 4. E2E Tests (requires dev server running)
npm run test:e2e          # Headless
npm run test:e2e:headed   # See browser (debugging)
```

---

## Test Results Summary

### ✅ TypeScript Type Checking
- **Status:** PASSING
- **Files checked:** All .ts/.tsx files
- **Errors:** 0

### ✅ Unit Tests (Jest)
- **Status:** 21/21 PASSING
- **Coverage:** 93.54% (workflow-parser.ts)
- **Test Files:**
  - `__tests__/lib/workflow-parser.test.ts` (12 tests)
  - `__tests__/components/WorkflowNode.test.tsx` (9 tests)

### ⚡ E2E Tests (Playwright)
- **Status:** Ready to run
- **Test File:** `e2e/workflow-dashboard.spec.ts`
- **Scenarios:** 10+ user journeys
- **Requires:** Dev server running (`npm run dev`)

---

## What Each Test Validates

### Unit Tests: workflow-parser.test.ts
✅ URL slug generation (`workflowToSlug`)
✅ Zigzag node layout algorithm
✅ Workflow statistics calculation
✅ YAML file loading from ~/.claude/workflows
✅ Workflow search and name matching

### Component Tests: WorkflowNode.test.tsx
✅ Node renders with step name
✅ Duration and model badges display
✅ Description preview shows
✅ Selection state styling (blue highlight)
✅ Connection handles (top/bottom)
✅ Graceful handling of missing data

### E2E Tests: workflow-dashboard.spec.ts
✅ Homepage workflow cards display
✅ Navigation to workflow details
✅ React Flow visualization renders
✅ Node click shows step details
✅ Model selector dropdown works
✅ Execute button functionality
✅ Back navigation
✅ Accessibility (headings, links)

---

## Code Coverage Report

```
File                  | Coverage
----------------------|----------
workflow-parser.ts    | 93.54% ✅
WorkflowNode.tsx      | 100%   ✅
```

View detailed coverage:
```bash
npm run test:ci
open coverage/lcov-report/index.html
```

---

## Running Tests During Development

### Before Every Commit
```bash
npm run type-check  # Fast (~5s)
npm run test:ci     # Medium (~10s)
```

### Before Every Push
```bash
npm run type-check && npm run test:ci && npm run lint
```

### Full QA Before Release
```bash
# Start dev server in one terminal
npm run dev

# Run tests in another terminal
npm run test:all
```

---

## Debugging Failed Tests

### TypeScript Errors
```bash
# Show full error details
npm run type-check 2>&1 | less
```

### Jest Unit Test Failures
```bash
# Run specific test file
npm test -- workflow-parser.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should calculate"

# Show verbose output
npm test -- --verbose
```

### Playwright E2E Failures
```bash
# Run with browser visible
npm run test:e2e:headed

# Interactive mode with time-travel debugging
npm run test:e2e:ui

# Run specific test
npx playwright test --grep "should display homepage"
```

---

## Manual Testing Checklist

Quick visual checks to do in browser:

1. **Homepage** (http://localhost:3004)
   - [ ] 5 workflow cards display
   - [ ] Stats show correct numbers
   - [ ] No console errors (F12)

2. **Workflow Detail** (click any workflow)
   - [ ] Visualization loads with nodes
   - [ ] Nodes arranged in zigzag pattern
   - [ ] Click node → details panel appears
   - [ ] No "Hook order" errors in console

3. **Interactions**
   - [ ] Zoom in/out works (mouse wheel)
   - [ ] Pan canvas (click & drag)
   - [ ] Back button returns to homepage
   - [ ] Model selector dropdown works

---

## Test File Locations

```
workflow-dashboard/
├── __tests__/
│   ├── lib/
│   │   └── workflow-parser.test.ts    ← Unit tests
│   └── components/
│       └── WorkflowNode.test.tsx      ← Component tests
├── e2e/
│   └── workflow-dashboard.spec.ts     ← E2E tests
├── jest.config.js                     ← Jest configuration
├── playwright.config.ts               ← Playwright configuration
└── QA_TESTING_GUIDE.md               ← Full testing documentation
```

---

## Common Issues & Fixes

### "Cannot find module '@/lib/workflow-parser'"
**Fix:** Check `jest.config.js` has correct moduleNameMapper

### "toBeInTheDocument is not defined"
**Fix:** Already fixed with `__tests__/setup.d.ts`

### E2E tests fail with "page not found"
**Fix:** Ensure dev server is running: `npm run dev`

### Tests pass locally but fail in CI
**Fix:** Use `npm run test:ci` instead of `npm test`

---

## Performance Benchmarks

| Test Type | Duration | When to Run |
|-----------|----------|-------------|
| TypeScript | ~5s | Every save (IDE) |
| Jest (watch) | ~1s | During development |
| Jest (CI) | ~10s | Pre-commit |
| E2E (headless) | ~30s | Pre-push |
| E2E (headed) | ~60s | Debugging only |

---

## Next Steps

1. **Run tests now:**
   ```bash
   npm run type-check && npm run test:ci
   ```

2. **Check the output** - should see "21 passed"

3. **View coverage report:**
   ```bash
   open coverage/lcov-report/index.html
   ```

4. **Try E2E tests:**
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   npm run test:e2e:headed
   ```

5. **Read full guide:**
   ```bash
   cat QA_TESTING_GUIDE.md
   ```

---

## Quick Health Check

Run this to verify everything works:

```bash
echo "🧪 Running health check..."
npm run type-check && \
npm run test:ci && \
echo "✅ All tests passing!" || \
echo "❌ Tests failed - check output above"
```

**Expected Output:** `✅ All tests passing!`

---

For comprehensive testing documentation, see: `QA_TESTING_GUIDE.md`
