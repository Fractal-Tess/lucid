import { expect, test } from '@playwright/test';

test.describe('SummaryViewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/summary-viewer');
    await page.waitForTimeout(500);
  });

  test('displays summary content', async ({ page }) => {
    const content = page.locator('.text-sm.leading-relaxed').first();
    await expect(content).toBeVisible();
    await expect(content).toContainText('Photosynthesis is the process');
  });

  test('displays sections', async ({ page }) => {
    const triggers = page.locator("[data-testid^='section-trigger-']");
    await expect(triggers).toHaveCount(3);
    await expect(triggers.nth(0)).toContainText('Light-Dependent Reactions');
    await expect(triggers.nth(1)).toContainText('Calvin Cycle');
    await expect(triggers.nth(2)).toContainText('Ecological Impact');
  });

  test('expands section on click', async ({ page }) => {
    const trigger = page.locator("[data-testid='section-trigger-0']");
    await trigger.click();

    const content = page.getByText(
      'These reactions occur in the thylakoid membranes',
    );
    await expect(content).toBeVisible();
  });

  test('shows empty state when no summary provided', async ({ page }) => {
    await page.goto('/summary-viewer?empty=true');
    await page.waitForTimeout(500);

    const emptyState = page.locator("[data-testid='empty-state']");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No summary available');
  });
});
