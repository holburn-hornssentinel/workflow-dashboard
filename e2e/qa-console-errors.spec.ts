import { test, expect } from '@playwright/test';
import * as fs from 'fs';

type ConsoleError = {
  page: string;
  type: 'error' | 'warning' | 'csp';
  message: string;
};

const errors: ConsoleError[] = [];

test.describe('QA Console Errors - Check for Browser Errors', () => {

  const pages = [
    { name: 'Homepage', url: '/' },
    { name: 'Agents', url: '/agents' },
    { name: 'Builder', url: '/builder' },
    { name: 'Tools', url: '/tools' },
    { name: 'Memory', url: '/memory' },
    { name: 'Settings', url: '/settings' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} - Check for console errors`, async ({ page }) => {
      // Capture all console messages
      page.on('console', async (msg) => {
        const text = msg.text();
        const type = msg.type();

        // Check for errors
        if (type === 'error') {
          errors.push({
            page: pageInfo.name,
            type: 'error',
            message: text
          });
        }

        // Check for CSP violations
        if (text.includes('Content Security Policy') ||
            text.includes('violates the following') ||
            text.includes('CSP')) {
          errors.push({
            page: pageInfo.name,
            type: 'csp',
            message: text
          });
        }
      });

      // Capture page errors (uncaught exceptions)
      page.on('pageerror', (error) => {
        errors.push({
          page: pageInfo.name,
          type: 'error',
          message: `Uncaught exception: ${error.message}`
        });
      });

      // Navigate to page
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');

      // Wait for any async operations
      await page.waitForTimeout(3000);

      // Try to interact with the page to trigger lazy-loaded errors
      if (pageInfo.url === '/builder') {
        // Try to trigger 3D view which causes WebGL/Three.js errors
        const toggle3D = page.getByRole('button', { name: /3d/i });
        if (await toggle3D.count() > 0) {
          await toggle3D.first().click().catch(() => {});
          await page.waitForTimeout(2000);
        }
      }
    });
  }

  test.afterAll(async () => {
    if (errors.length > 0) {
      // Group errors by type
      const cspErrors = errors.filter(e => e.type === 'csp');
      const consoleErrors = errors.filter(e => e.type === 'error');

      console.log('\n' + '='.repeat(80));
      console.log('❌ CONSOLE ERRORS DETECTED');
      console.log('='.repeat(80) + '\n');

      if (cspErrors.length > 0) {
        console.log(`CSP Violations: ${cspErrors.length}`);
        console.log('-'.repeat(80));
        cspErrors.forEach((err, i) => {
          console.log(`\n${i + 1}. [${err.page}]`);
          console.log(`   ${err.message.substring(0, 300)}`);
        });
        console.log('\n');
      }

      if (consoleErrors.length > 0) {
        console.log(`Console Errors: ${consoleErrors.length}`);
        console.log('-'.repeat(80));
        consoleErrors.forEach((err, i) => {
          console.log(`\n${i + 1}. [${err.page}]`);
          console.log(`   ${err.message.substring(0, 300)}`);
        });
        console.log('\n');
      }

      // Write detailed report
      const report = {
        timestamp: new Date().toISOString(),
        totalErrors: errors.length,
        cspViolations: cspErrors.length,
        consoleErrors: consoleErrors.length,
        errors: errors
      };

      fs.writeFileSync(
        'qa_console_errors_detailed.json',
        JSON.stringify(report, null, 2)
      );

      console.log('Detailed error report: qa_console_errors_detailed.json\n');
      console.log('='.repeat(80) + '\n');

      // Fail the test if critical errors found
      expect(cspErrors.length).toBe(0);
    } else {
      console.log('\n✅ No console errors detected\n');
    }
  });
});
