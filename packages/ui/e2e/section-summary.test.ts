import { expect, test } from '@playwright/test';

test.describe('SectionSummary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/section-summary');
    await page.waitForTimeout(500);
  });

  test('displays summary overview', async ({ page }) => {
    await expect(page.getByText('Overview', { exact: true })).toBeVisible();
    await expect(
      page.getByText('This document provides a comprehensive overview'),
    ).toBeVisible();
  });

  test('displays section titles', async ({ page }) => {
    await expect(page.getByText('Key Sections')).toBeVisible();
    await expect(page.getByText('Introduction to SM-2')).toBeVisible();
    await expect(page.getByText('The Algorithm Steps')).toBeVisible();
    await expect(page.getByText('Quality Ratings')).toBeVisible();
  });

  test('expands section content on click', async ({ page }) => {
    const sectionTitle = page.getByText('Introduction to SM-2');
    const sectionContent = page.getByText(
      'SuperMemo-2 (SM-2) is an algorithm developed by Piotr Wozniak',
    );

    await sectionTitle.click();
    await expect(sectionContent).toBeVisible();
  });

  test('displays section content with line breaks', async ({ page }) => {
    const sectionTitle = page.getByText('The Algorithm Steps');
    await sectionTitle.click();

    const contentArea = page
      .locator('.whitespace-pre-wrap')
      .filter({ hasText: '1. Update repetition count (n).' });
    await expect(contentArea).toBeVisible();
  });
});
