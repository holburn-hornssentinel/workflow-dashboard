import { test, expect } from '@playwright/test';

test.describe('Workflow Dashboard', () => {
  test('should display homepage with workflow cards', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page.getByRole('heading', { name: /Horns Workflow Control Center/i })).toBeVisible();

    // Check stats are displayed
    await expect(page.getByText(/Workflows Available/i)).toBeVisible();
    await expect(page.getByText(/Total Steps/i)).toBeVisible();

    // Check at least one workflow card exists
    const workflowCards = page.locator('a[href^="/workflows/"]');
    await expect(workflowCards.first()).toBeVisible();
  });

  test('should navigate to workflow detail page', async ({ page }) => {
    await page.goto('/');

    // Click on first workflow card
    const firstWorkflow = page.locator('a[href^="/workflows/"]').first();
    const workflowName = await firstWorkflow.locator('h3').textContent();
    await firstWorkflow.click();

    // Wait for navigation
    await page.waitForURL(/\/workflows\/.+/);

    // Check workflow name is displayed in header
    await expect(page.getByRole('heading', { name: new RegExp(workflowName || '', 'i') })).toBeVisible();

    // Check back button exists
    await expect(page.getByRole('link', { name: /back/i })).toBeVisible();
  });

  test('should display workflow visualization', async ({ page }) => {
    await page.goto('/workflows/bug-fix-workflow');

    // Wait for React Flow to render
    await page.waitForSelector('.react-flow', { timeout: 10000 });

    // Check that workflow nodes are rendered
    const nodes = page.locator('[data-id]').filter({ hasText: /.+/ });
    await expect(nodes.first()).toBeVisible({ timeout: 10000 });

    // Check controls are visible
    await expect(page.locator('.react-flow__controls')).toBeVisible();
  });

  test('should show step details when node is clicked', async ({ page }) => {
    await page.goto('/workflows/bug-fix-workflow');

    // Wait for visualization to load
    await page.waitForSelector('.react-flow', { timeout: 10000 });

    // Initially should show empty state
    await expect(page.getByText(/Select a Step/i)).toBeVisible();

    // Click on a workflow node - use more specific selector
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.waitFor({ state: 'visible', timeout: 10000 });
    await firstNode.click({ force: true, position: { x: 100, y: 50 } });

    // Wait a bit for React state to update
    await page.waitForTimeout(500);

    // Step details panel should appear - check for any h2 heading
    const heading = page.locator('h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Execute This Step/i })).toBeVisible();
  });

  test('should display model selector in step details', async ({ page }) => {
    await page.goto('/workflows/bug-fix-workflow');

    await page.waitForSelector('.react-flow', { timeout: 10000 });

    // Click on a node
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.waitFor({ state: 'visible', timeout: 10000 });
    await firstNode.click({ force: true, position: { x: 100, y: 50 } });

    // Wait for panel to appear
    await page.waitForTimeout(500);

    // Model selector should be visible (custom component with "AI Model:" label)
    await expect(page.getByText(/AI Model:/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Show all models/i })).toBeVisible();
  });

  test('should show execute button in step details', async ({ page }) => {
    await page.goto('/workflows/bug-fix-workflow');

    await page.waitForSelector('.react-flow', { timeout: 10000 });

    // Click on a node
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.waitFor({ state: 'visible', timeout: 10000 });
    await firstNode.click({ force: true, position: { x: 100, y: 50 } });

    // Wait for panel to appear
    await page.waitForTimeout(500);

    // Execute button should be visible and enabled
    const executeButton = page.getByRole('button', { name: /Execute This Step/i });
    await expect(executeButton).toBeVisible({ timeout: 5000 });
    await expect(executeButton).toBeEnabled();
  });

  test('should navigate back to homepage', async ({ page }) => {
    await page.goto('/workflows/bug-fix-workflow');

    // Click back button
    await page.getByRole('link', { name: /back/i }).click();

    // Should be on homepage
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Horns Workflow Control Center/i })).toBeVisible();
  });

  test('should handle multiple workflows', async ({ page }) => {
    await page.goto('/');

    const workflowCards = page.locator('a[href^="/workflows/"]');
    const count = await workflowCards.count();

    // Should have at least 3 workflows (bug-fix, code-review, deployment, feature-dev, new-product)
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should display workflow difficulty badges', async ({ page }) => {
    await page.goto('/');

    // Check for difficulty badges (could be high, medium, or low)
    const difficultyBadges = page.locator('text=/high|medium|low/i').first();
    await expect(difficultyBadges).toBeVisible();
  });
});

test.describe('Workflow Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check h1 exists
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('should have accessible navigation links', async ({ page }) => {
    await page.goto('/workflows/bug-fix-workflow');

    const backLink = page.getByRole('link', { name: /back/i });
    await expect(backLink).toHaveAttribute('href', '/');
  });
});
