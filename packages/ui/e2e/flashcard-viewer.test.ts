import { expect, test } from '@playwright/test';

test.describe('FlashcardViewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/flashcard-viewer');
    // Wait for Svelte hydration to complete
    await page.waitForTimeout(500);
  });

  test('displays flashcard with question on front', async ({ page }) => {
    const card = page.locator("[data-testid='flashcard']");
    await expect(card).toBeVisible();
    await expect(card.locator("[data-testid='flashcard-front']")).toBeVisible();
    await expect(card.locator("[data-testid='flashcard-front']")).toHaveText(
      'What is the capital of France?',
    );
    // Back of card has opacity-0 class but is still in DOM
    await expect(card.locator("[data-testid='flashcard-back']")).toHaveClass(
      /opacity-0/,
    );
  });

  test('flips card to show answer on click', async ({ page }) => {
    const card = page.locator("[data-testid='flashcard']");
    await card.click();

    await expect(card.locator("[data-testid='flashcard-back']")).toBeVisible();
    await expect(card.locator("[data-testid='flashcard-back']")).toHaveText(
      'Paris',
    );
  });

  test('flips card when Space key is pressed', async ({ page }) => {
    const card = page.locator("[data-testid='flashcard']");

    await card.press('Space');
    await expect(card.locator("[data-testid='flashcard-back']")).toBeVisible();
    await expect(card.locator("[data-testid='flashcard-back']")).toHaveText(
      'Paris',
    );

    await card.press('Space');
    await expect(card.locator("[data-testid='flashcard-front']")).toBeVisible();
  });

  test('navigates to next card with button click', async ({ page }) => {
    const counter = page.locator("[data-testid='card-counter']");
    const nextButton = page.locator("[data-testid='next-button']");

    await expect(counter).toHaveText('1 / 3');
    await nextButton.click();
    await expect(counter).toHaveText('2 / 3');
  });

  test('navigates to previous card with button click', async ({ page }) => {
    const card = page.locator("[data-testid='flashcard']");
    const nextButton = page.locator("[data-testid='next-button']");
    const prevButton = page.locator("[data-testid='prev-button']");
    const counter = page.locator("[data-testid='card-counter']");

    // Navigate to second card
    await nextButton.click();
    await expect(counter).toHaveText('2 / 3');

    // Go back to first card
    await prevButton.click();
    await expect(counter).toHaveText('1 / 3');
  });

  test('shows card counter indicating current position', async ({ page }) => {
    const counter = page.locator("[data-testid='card-counter']");
    await expect(counter).toHaveText('1 / 3');

    const nextButton = page.locator("[data-testid='next-button']");
    await nextButton.click();
    await expect(counter).toHaveText('2 / 3');
  });

  test('disables previous button on first card', async ({ page }) => {
    const prevButton = page.locator("[data-testid='prev-button']");
    await expect(prevButton).toBeDisabled();
  });

  test('disables next button on last card', async ({ page }) => {
    const nextButton = page.locator("[data-testid='next-button']");
    const counter = page.locator("[data-testid='card-counter']");

    // Navigate to last card using the next button
    await nextButton.click();
    await expect(counter).toHaveText('2 / 3');
    await nextButton.click();
    await expect(counter).toHaveText('3 / 3');

    await expect(nextButton).toBeDisabled();
  });

  test('shows rating buttons after flipping card', async ({ page }) => {
    const card = page.locator("[data-testid='flashcard']");
    const ratingButtons = page.locator("[data-testid='rating-buttons']");

    // Rating buttons should not be visible initially
    await expect(ratingButtons).not.toBeVisible();

    // Flip the card
    await card.click();

    // Rating buttons should now be visible
    await expect(ratingButtons).toBeVisible();
  });

  test('can rate card difficulty 1-5', async ({ page }) => {
    const card = page.locator("[data-testid='flashcard']");

    await card.click();

    // Click rating button 4
    const ratingButton = page.locator("[data-testid='rating-button-4']");
    await ratingButton.click();

    // Should advance to next card after rating
    const counter = page.locator("[data-testid='card-counter']");
    await expect(counter).toHaveText('2 / 3');
  });

  test('has proper ARIA attributes for accessibility', async ({ page }) => {
    const card = page.locator("[data-testid='flashcard']");
    await expect(card).toHaveAttribute('role', 'button');
    await expect(card).toHaveAttribute('tabindex', '0');
  });

  test('respects custom card width', async ({ page }) => {
    await page.goto('/flashcard-viewer?width=800');
    await page.waitForTimeout(500);
    const card = page.locator("[data-testid='flashcard']");
    const box = await card.boundingBox();
    expect(box?.width).toBeCloseTo(800, 50);
  });

  test('shows empty state when no cards provided', async ({ page }) => {
    await page.goto('/flashcard-viewer?empty=true');
    await page.waitForTimeout(500);
    await expect(page.locator("[data-testid='empty-state']")).toBeVisible();
    await expect(page.locator("[data-testid='empty-state']")).toContainText(
      'flashcards',
    );
  });
});
