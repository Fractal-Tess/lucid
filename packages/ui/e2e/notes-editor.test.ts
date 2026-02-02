import { expect, test } from '@playwright/test';

test.describe('NotesEditor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notes-editor');
    await page.waitForTimeout(500);
  });

  test('displays edit notes title', async ({ page }) => {
    await expect(page.getByText('Edit Notes')).toBeVisible();
  });

  test('displays content textarea', async ({ page }) => {
    const textarea = page.locator("[data-testid='notes-content-input']");
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(/Introduction to Photosynthesis/);
  });

  test('displays key points section', async ({ page }) => {
    await expect(page.getByText('Key Points (2)')).toBeVisible();
    await expect(
      page.getByText('Photosynthesis converts light energy into glucose'),
    ).toBeVisible();
  });

  test('allows editing key points', async ({ page }) => {
    const editButton = page
      .locator("[data-testid='edit-keypoint-button']")
      .first();
    await editButton.click();

    const input = page.locator("[data-testid='edit-keypoint-input']");
    await expect(input).toBeVisible();

    await input.fill('Updated key point');
    await page.locator("[data-testid='save-keypoint-button']").click();

    await expect(page.getByText('Updated key point')).toBeVisible();
  });

  test('allows adding new key points', async ({ page }) => {
    const input = page.locator("[data-testid='new-keypoint-input']");
    await input.fill('New key point');

    const addButton = page.locator("[data-testid='add-keypoint-button']");
    await addButton.click();

    await expect(page.getByText('New key point')).toBeVisible();
  });

  test('allows deleting key points', async ({ page }) => {
    const initialCount = await page
      .locator("[data-testid='delete-keypoint-button']")
      .count();

    const deleteButton = page
      .locator("[data-testid='delete-keypoint-button']")
      .first();
    await deleteButton.click();

    const newCount = await page
      .locator("[data-testid='delete-keypoint-button']")
      .count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('switches between edit and preview tabs', async ({ page }) => {
    await page.getByRole('tab', { name: 'Preview' }).click();

    await expect(
      page.getByText('Introduction to Photosynthesis'),
    ).toBeVisible();
    await expect(
      page.locator("[data-testid='notes-content-input']"),
    ).not.toBeVisible();
  });

  test('save button is disabled when no changes', async ({ page }) => {
    const saveButton = page.locator("[data-testid='save-notes-button']");
    await expect(saveButton).toBeDisabled();
  });

  test('save button enables after content change', async ({ page }) => {
    const textarea = page.locator("[data-testid='notes-content-input']");
    await textarea.fill('Updated content');

    const saveButton = page.locator("[data-testid='save-notes-button']");
    await expect(saveButton).toBeEnabled();
  });
});
