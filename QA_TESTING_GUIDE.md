# QA & Testing Guide - Workflow Dashboard

## Table of Contents
1. [Quick Start](#quick-start)
2. [Automated Testing](#automated-testing)
3. [Manual QA Checklist](#manual-qa-checklist)
4. [Test Coverage](#test-coverage)
5. [CI/CD Integration](#cicd-integration)

---

## Quick Start

### Run All Tests
```bash
# Run full test suite (type check + lint + unit + e2e)
npm run test:all

# Quick test during development
npm run type-check && npm run test:ci
```

### Individual Test Suites
```bash
# TypeScript type checking
npm run type-check

# ESLint code quality
npm run lint

# Unit tests (watch mode for development)
npm test

# Unit tests (CI mode with coverage)
npm run test:ci

# E2E tests (headless)
npm run test:e2e

# E2E tests (with browser UI)
npm run test:e2e:headed
```

---

## Automated Testing

### 1. TypeScript Type Checking ✅

**What it tests:** Type safety, interface compliance, null safety

**Command:** `npm run type-check`

**Fixed Issues:**
- ✅ Array spread operator compatibility
- ✅ Type narrowing with filter predicates
- ✅ Proper typing for workflow parser functions

**Expected Output:** No errors (silent success)

---

### 2. Unit Tests (Jest + React Testing Library) ✅

**What it tests:** Individual functions, utility logic, isolated components

**Location:** `__tests__/lib/`, `__tests__/components/`

**Command:** `npm run test:ci`

#### Test Files:

##### `__tests__/lib/workflow-parser.test.ts`
- ✅ `workflowToSlug()` - URL slug generation
- ✅ `workflowToGraph()` - Node/edge creation & zigzag layout
- ✅ `getWorkflowStats()` - Statistics calculation
- ✅ `loadWorkflows()` - YAML file loading
- ✅ `getWorkflow()` - Name matching & normalization

##### `__tests__/components/WorkflowNode.test.tsx`
- ✅ Node rendering with all metadata
- ✅ Selection state styling
- ✅ Handle (connection point) rendering
- ✅ Graceful handling of missing data

**Run specific test suites:**
```bash
npm run test:unit      # lib/ tests only
npm run test:component # component/ tests only
```

**Coverage Report:**
```bash
npm run test:ci
# View coverage/ directory for detailed HTML report
```

---

### 3. Integration Tests (API Routes) ✅

**What it tests:** Next.js API endpoints, request/response handling

**Location:** `__tests__/api/`

**Command:** `npm run test:api`

#### Test Files:

##### `__tests__/api/workflows.test.ts`
- ✅ GET `/api/workflows/[name]` returns workflow data
- ✅ Returns 404 for non-existent workflows
- ✅ Handles URL-encoded names
- ✅ Returns proper node/edge structure
- ✅ Sequential edge connections

---

### 4. End-to-End Tests (Playwright) ✅

**What it tests:** Complete user journeys, browser interactions, UI rendering

**Location:** `e2e/`

**Commands:**
```bash
npm run test:e2e         # Headless mode (fast)
npm run test:e2e:headed  # See browser (debugging)
npm run test:e2e:ui      # Interactive UI mode
```

#### Test Scenarios:

##### `e2e/workflow-dashboard.spec.ts`
- ✅ Homepage displays workflow cards
- ✅ Navigation to workflow detail pages
- ✅ React Flow visualization renders
- ✅ Node click shows step details
- ✅ Model selector appears in step details
- ✅ Execute button is functional
- ✅ Back navigation works
- ✅ Multiple workflows load correctly
- ✅ Accessibility: heading hierarchy
- ✅ Accessibility: navigation links

**View Test Report:**
```bash
npm run test:e2e
npx playwright show-report  # Opens HTML report in browser
```

**Debug Failed Tests:**
```bash
npm run test:e2e:headed                    # See browser
npx playwright test --debug                # Step-through debugger
npx playwright test --trace on             # Record trace
npx playwright show-trace trace.zip        # View trace
```

---

## Manual QA Checklist

### Pre-Testing Setup
- [ ] Dev server running: `npm run dev`
- [ ] Browser DevTools Console open (F12)
- [ ] Check for JavaScript errors (should be 0)
- [ ] Verify no TypeScript errors: `npm run type-check`

---

### 1. Homepage Testing

#### Visual Layout
- [ ] **Header**: "🎯 Horns Workflow Control Center" displays
- [ ] **Description**: Subtitle text visible
- [ ] **Stats Cards**: 4 stat cards display (Workflows, Total Steps, Claude Max, Complex Workflows)
- [ ] **Workflow Grid**: Responsive 2-column layout on desktop

#### Workflow Cards
- [ ] **Count**: All 5 workflows display:
  - [ ] Bug Fix Workflow
  - [ ] Code Review Workflow
  - [ ] Deployment Workflow
  - [ ] Feature Development Workflow
  - [ ] New Product Development Workflow

- [ ] **Card Content** (for each card):
  - [ ] Workflow name
  - [ ] Description
  - [ ] Difficulty badge (high/medium/low) with correct color
  - [ ] Step count
  - [ ] Task count
  - [ ] Estimated duration
  - [ ] Model badges (if applicable)
  - [ ] "View Workflow →" link

- [ ] **Hover Effects**:
  - [ ] Border changes to blue
  - [ ] Shadow appears
  - [ ] Arrow moves right slightly
  - [ ] Cursor changes to pointer

#### Interactions
- [ ] Click each workflow card → navigates to detail page
- [ ] Browser back button → returns to homepage

---

### 2. Workflow Detail Page Testing

Test each workflow: `bug-fix-workflow`, `code-review-workflow`, `deployment-workflow`, `feature-development-workflow`, `new-product-development-workflow`

#### Page Load
- [ ] **URL**: Matches `/workflows/[workflow-name]`
- [ ] **No errors** in console
- [ ] **Page renders** within 2 seconds
- [ ] **No "Hook order" errors** (critical!)

#### Header Section
- [ ] **Back button**: "← Back" link visible and works
- [ ] **Workflow name**: Displays correctly
- [ ] **Description**: Shows workflow description
- [ ] **Difficulty badge**: Correct color (red=high, yellow=medium, green=low)
- [ ] **Duration**: Estimated duration displays

#### Workflow Visualization (React Flow)
- [ ] **Canvas renders**: Dark gray background with grid
- [ ] **Nodes appear**: All workflow steps visible
- [ ] **Node layout**: Zigzag pattern (3 columns)
  - [ ] Row 1: left → right
  - [ ] Row 2: right → left
  - [ ] Row 3: left → right
- [ ] **Node spacing**: Comfortable spacing (400px horizontal, 200px vertical)
- [ ] **Edges (connections)**: Smooth curved lines connecting steps sequentially
- [ ] **Controls**: Zoom buttons (+ / -) and fit view button visible
- [ ] **MiniMap**: Small map in bottom-right corner

#### Node Visuals
- [ ] **Size**: Nodes are 280-320px wide, readable
- [ ] **Gradients**: Blue-gray gradient background
- [ ] **Borders**: Gray border (slate-600)
- [ ] **Text**: White step name, clear and bold
- [ ] **Duration badge**: ⏱️ icon with duration (if present)
- [ ] **Model badge**: 🤖 icon with model name (if present)
- [ ] **Description preview**: First 100 chars of AI prompt (if present)
- [ ] **Handles**: Connection dots on top and bottom

#### Node Interactions
- [ ] **Hover**: Border changes color, shadow increases
- [ ] **Click**: Node highlights in blue and scales up 5%
- [ ] **Selection persists**: Selected node stays highlighted
- [ ] **MiniMap updates**: Selected node shows lighter blue in minimap

#### Canvas Interactions
- [ ] **Zoom In/Out**: Mouse wheel or + / - buttons
- [ ] **Pan**: Click and drag background
- [ ] **Fit View**: Button centers all nodes
- [ ] **Zoom limits**: Min 0.1x, Max 1.5x

#### Step Detail Panel (Right Side)

##### Empty State (No node selected)
- [ ] Shows "👈 Select a Step" message
- [ ] Instructions visible

##### Active State (Node selected)
- [ ] **Panel appears**: Right sidebar visible
- [ ] **Step name**: Large heading at top
- [ ] **Duration**: Displays if present
- [ ] **Model recommendation badge**: Shows if present

- [ ] **Model Selector Dropdown**:
  - [ ] Dropdown appears
  - [ ] Shows current selection
  - [ ] Can change model
  - [ ] Recommendation highlighted (if present)

- [ ] **Execute Button**:
  - [ ] Blue button with "▶️ Execute This Step"
  - [ ] Enabled when step selected
  - [ ] Hover effect (darker blue)

- [ ] **AI Prompt Section**:
  - [ ] "AI Prompt:" label
  - [ ] Full prompt text in scrollable box
  - [ ] Light gray background
  - [ ] Max height with scroll

- [ ] **Tasks Section** (if present):
  - [ ] "Tasks (N):" label with count
  - [ ] Each task card shows:
    - [ ] Task name
    - [ ] Task prompt (first 2 lines)
  - [ ] Scrollable if many tasks

- [ ] **Checklist Section** (if present):
  - [ ] "Checklist:" label
  - [ ] Checkboxes for each item
  - [ ] Checkbox text readable

#### Execute Functionality
- [ ] Click "Execute This Step" button
- [ ] Alert appears with session ID
- [ ] No errors in console
- [ ] Button shows loading state ("⏳ Executing...")
- [ ] Button disables during execution

---

### 3. Cross-Workflow Consistency

Test navigation between workflows:
- [ ] Navigate: Home → Bug Fix → Home → Code Review → Home → Deployment
- [ ] No memory leaks (DevTools Memory tab)
- [ ] No console errors accumulating
- [ ] Each workflow displays correctly
- [ ] Node counts match workflow size

---

### 4. Responsive Design Testing

#### Desktop (1920x1080)
- [ ] Homepage: 2-column grid
- [ ] Workflow detail: Full canvas + sidebar
- [ ] All text readable
- [ ] No horizontal scroll

#### Laptop (1366x768)
- [ ] Layout adjusts
- [ ] Sidebar remains visible
- [ ] Canvas scales properly

#### Tablet (768px)
- [ ] Homepage: 1-column grid
- [ ] Workflow detail: Sidebar overlays or stacks

---

### 5. Browser Compatibility

Test in:
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)

Each browser should:
- [ ] Render React Flow correctly
- [ ] Handle interactions smoothly
- [ ] Show no console errors

---

### 6. Performance Testing

#### Page Load Times
- [ ] Homepage: < 2 seconds
- [ ] Workflow detail (first load): < 3 seconds
- [ ] Workflow detail (subsequent): < 1 second

#### Interaction Responsiveness
- [ ] Node click response: < 100ms
- [ ] Canvas pan/zoom: smooth 60fps
- [ ] Model selector dropdown: instant

#### Memory Usage
- [ ] Initial load: < 100MB
- [ ] After 5 workflow navigations: < 200MB
- [ ] No memory leaks (check DevTools Memory)

---

### 7. Error Handling

#### Invalid URLs
- [ ] `/workflows/non-existent` → Should show 404 or error message
- [ ] `/workflows/` (no name) → Should handle gracefully

#### API Failures
- [ ] Stop dev server → Navigate to workflow → Should show error state
- [ ] Restart server → Should recover

#### Browser Errors
- [ ] Check console for any errors
- [ ] Check Network tab for failed requests

---

### 8. Accessibility (A11y)

#### Keyboard Navigation
- [ ] Tab through homepage → reaches all workflow cards
- [ ] Enter on card → navigates to detail
- [ ] Tab on workflow detail → reaches back button, controls

#### Screen Reader
- [ ] Headings have proper hierarchy (h1 → h2 → h3)
- [ ] Links have descriptive text
- [ ] Buttons have clear labels

#### Color Contrast
- [ ] Text on dark background readable
- [ ] Difficulty badges have sufficient contrast

---

## Test Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | 80% | Run `npm run test:ci` to see |
| Integration Tests | 70% | Check coverage report |
| E2E Tests | Critical paths | 10+ scenarios ✅ |
| Type Coverage | 100% | ✅ No TypeScript errors |

**View Coverage:**
```bash
npm run test:ci
open coverage/lcov-report/index.html
```

---

## CI/CD Integration

### Pre-Commit Checklist
```bash
npm run type-check  # TypeScript
npm run lint        # ESLint
npm run test:ci     # Unit + Integration
```

### Pre-Push Checklist
```bash
npm run test:all    # Full test suite
```

### GitHub Actions Example
```yaml
name: QA Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Debugging Tips

### TypeScript Errors
```bash
# Show detailed error locations
npm run type-check | less
```

### Jest Test Failures
```bash
# Run specific test file
npm test -- workflow-parser.test.ts

# Debug mode (breakpoints)
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright E2E Failures
```bash
# Record video and trace
npm run test:e2e -- --video=on --trace=on

# Step through with debugger
npm run test:e2e -- --debug

# View last run trace
npx playwright show-trace trace.zip
```

### React Flow Visualization Issues
1. Open DevTools → Console
2. Look for React warnings
3. Check Network tab for failed API calls
4. Inspect React components with React DevTools

---

## Known Issues & Workarounds

### Issue: "Rendered more hooks than during the previous render"
**Status:** ✅ FIXED (moved useMemo before conditional returns)

### Issue: Wezterm copy/paste not working
**Status:** ✅ FIXED (created .wezterm.lua config)

### Issue: TypeScript Set spread operator error
**Status:** ✅ FIXED (changed to Array.from())

---

## Test Maintenance

### When to Update Tests

1. **New Feature Added** → Add unit + E2E tests
2. **Bug Fixed** → Add regression test
3. **API Changed** → Update integration tests
4. **UI Changed** → Update E2E selectors

### Test Review Checklist
- [ ] Tests are readable and well-named
- [ ] No flaky tests (run 10x to verify)
- [ ] Fast execution (< 30s for unit tests)
- [ ] Proper cleanup (no side effects)

---

## Contact & Support

For issues or questions:
1. Check this guide first
2. Review test output for specific errors
3. Check `/home/horns/workflow-dashboard/README.md`
4. Review code comments in test files

**Happy Testing! 🧪✅**
