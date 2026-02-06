#!/bin/bash

# QA Interactive - Playwright Browser Tests
# Runs interactive browser tests against the live demo site

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🎭 Running QA Interactive (Playwright Tests)"
echo "=============================================="
echo ""

# Ensure Chromium is installed
echo -e "${YELLOW}📦 Ensuring Chromium is installed...${NC}"
npx playwright install chromium

echo ""
echo -e "${YELLOW}📁 Creating screenshot directories...${NC}"
mkdir -p qa_screenshots
mkdir -p qa_screenshots_interactive

echo ""
echo -e "${YELLOW}🧪 Running Playwright tests...${NC}"
echo ""

# Run visual tests
echo "Running visual/interactive tests..."
if npx playwright test e2e/qa-interactive.spec.ts; then
    VISUAL_EXIT=0
else
    VISUAL_EXIT=1
fi

echo ""
echo "Running console error detection..."
if npx playwright test e2e/qa-console-errors.spec.ts; then
    CONSOLE_EXIT=0
else
    CONSOLE_EXIT=1
fi

# Determine overall exit code
if [ $VISUAL_EXIT -eq 0 ] && [ $CONSOLE_EXIT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All interactive tests passed!${NC}"
    TEST_EXIT=0
else
    echo ""
    echo "❌ Some interactive tests failed"
    TEST_EXIT=1
fi

echo ""
echo "=============================================="
echo "📸 Screenshots saved to:"
echo "  - qa_screenshots/ (page tests)"
echo "  - qa_screenshots_interactive/ (interactive tests)"
echo ""

# List screenshots
if [ -d "qa_screenshots" ] && [ "$(ls -A qa_screenshots)" ]; then
    echo "Page screenshots:"
    ls -lh qa_screenshots/
    echo ""
fi

if [ -d "qa_screenshots_interactive" ] && [ "$(ls -A qa_screenshots_interactive)" ]; then
    echo "Interactive screenshots:"
    ls -lh qa_screenshots_interactive/
    echo ""
fi

echo "To view the HTML report, run:"
echo "  npx playwright show-report"
echo ""

exit $TEST_EXIT
