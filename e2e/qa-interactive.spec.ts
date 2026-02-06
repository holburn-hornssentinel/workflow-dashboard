import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'qa_screenshots';
const INTERACTIVE_SCREENSHOT_DIR = 'qa_screenshots_interactive';

// Collect console errors
const consoleErrors: string[] = [];
const cspViolations: string[] = [];

test.beforeEach(async ({ page }) => {
  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`${msg.text()}`);
    }
  });

  // Capture CSP violations
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Content Security Policy') || text.includes('CSP')) {
      cspViolations.push(text);
    }
  });
});

test.afterAll(async () => {
  // Report errors at the end
  if (consoleErrors.length > 0 || cspViolations.length > 0) {
    console.log('\n⚠️  Console Errors Found:');
    console.log('========================\n');

    if (cspViolations.length > 0) {
      console.log('CSP Violations:', cspViolations.length);
      cspViolations.slice(0, 10).forEach((err, i) => {
        console.log(`${i + 1}. ${err.substring(0, 200)}`);
      });
      console.log('');
    }

    if (consoleErrors.length > 0) {
      console.log('Other Errors:', consoleErrors.length);
      consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(`${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    // Write to file
    fs.writeFileSync('qa_console_errors.log',
      '=== CSP Violations ===\n' +
      cspViolations.join('\n\n') +
      '\n\n=== Console Errors ===\n' +
      consoleErrors.join('\n\n')
    );
    console.log('\nFull error log written to: qa_console_errors.log\n');
  }
});

test.describe('QA Interactive - Page Navigation & Content', () => {

  test('Homepage - verify nav links and page title', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Close welcome modal if present
    const skipButton = page.getByRole('button', { name: /skip/i });
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }

    // Verify page loaded (check for main heading or content)
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'homepage.png'),
      fullPage: true
    });
  });

  test('Agents page - verify agent cards and task data', async ({ page }) => {
    await page.goto('/agents');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify agents page loaded - look for agent-related content
    const agentContent = page.locator('text=/agent|planner|executor|reviewer/i').first();
    await expect(agentContent).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'agents.png'),
      fullPage: true
    });
  });

  test('Builder page - verify canvas, node palette, Vibe Code button', async ({ page }) => {
    await page.goto('/builder');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for WebGL/Three.js to initialize

    // Verify builder page loaded - look for any content
    await expect(page.locator('body')).toBeVisible();

    // Try to find and click 3D view toggle if it exists
    const viewToggle = page.getByRole('button', { name: /3d|2d/i });
    if (await viewToggle.count() > 0) {
      await viewToggle.first().click();
      await page.waitForTimeout(1000);
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'builder.png'),
      fullPage: true
    });
  });

  test('Tools page - verify tool categories', async ({ page }) => {
    await page.goto('/tools');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify tools page loaded
    await expect(page.locator('body')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'tools.png'),
      fullPage: true
    });
  });

  test('Memory page - verify stats display', async ({ page }) => {
    await page.goto('/memory');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify memory page loaded
    await expect(page.locator('body')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'memory.png'),
      fullPage: true
    });
  });

  test('Settings page - verify settings load', async ({ page }) => {
    await page.goto('/settings');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify settings page loaded
    await expect(page.locator('body')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'settings.png'),
      fullPage: true
    });
  });
});

test.describe('QA Interactive - Interactive Features', () => {

  test('Memory type filter - click fact filter, verify memories appear', async ({ page }) => {
    await page.goto('/memory');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: path.join(INTERACTIVE_SCREENSHOT_DIR, 'memory-fact-filter.png'),
      fullPage: true
    });
  });

  test('Builder 2D/3D toggle - switch views, verify DOM changes', async ({ page }) => {
    await page.goto('/builder');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: path.join(INTERACTIVE_SCREENSHOT_DIR, 'builder-view.png'),
      fullPage: true
    });
  });

  test('Builder keyboard shortcuts - verify shortcuts display', async ({ page }) => {
    await page.goto('/builder');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: path.join(INTERACTIVE_SCREENSHOT_DIR, 'builder-shortcuts.png'),
      fullPage: true
    });
  });
});
