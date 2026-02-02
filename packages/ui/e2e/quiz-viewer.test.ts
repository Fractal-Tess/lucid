import { expect, test } from '@playwright/test';

test.describe('QuizViewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quiz-viewer');
    await page.waitForTimeout(500);
  });

  test('displays quiz question', async ({ page }) => {
    const question = page.locator("[data-testid='quiz-question']");
    await expect(question).toBeVisible();
    await expect(question).toHaveText('What is the capital of France?');
  });

  test('shows question counter indicating current position', async ({
    page,
  }) => {
    const counter = page.locator("[data-testid='question-counter']");
    await expect(counter).toBeVisible();
    await expect(counter).toHaveText('Question 1 / 3');

    const nextButton = page.locator("[data-testid='next-button']");
    await nextButton.click();
    await expect(counter).toHaveText('Question 2 / 3');
  });

  test('highlights correct answer when correct option selected', async ({
    page,
  }) => {
    const options = page.locator("[data-testid^='quiz-option']");
    const nextButton = page.locator("[data-testid='next-button']");
    const option = options.nth(1); // Paris

    await option.click();
    await expect(option).toHaveClass(/bg-green-500/);
    await expect(option).toHaveClass(/text-white/);
  });

  test('displays all answer options', async ({ page }) => {
    const options = page.locator("[data-testid^='quiz-option']");
    await expect(options).toHaveCount(4);
    await expect(options.nth(0)).toContainText('London');
    await expect(options.nth(1)).toContainText('Paris');
    await expect(options.nth(2)).toContainText('Berlin');
    await expect(options.nth(3)).toContainText('Madrid');
  });

  test('highlights correct answer and shows explanation when wrong option selected', async ({
    page,
  }) => {
    const options = page.locator("[data-testid^='quiz-option']");
    const nextButton = page.locator("[data-testid='next-button']");
    const wrongOption = options.nth(0); // London
    const correctOption = options.nth(1); // Paris

    await wrongOption.click();

    // Wrong answer should have error styling
    await expect(wrongOption).toHaveClass(/bg-red-500/);
    await expect(wrongOption).toHaveClass(/text-white/);

    // Correct answer should be revealed
    await expect(correctOption).toHaveClass(/bg-green-500/);
    await expect(correctOption).toHaveClass(/text-white/);

    // Explanation should be visible
    const explanation = page.locator("[data-testid='quiz-explanation']");
    await expect(explanation).toBeVisible();
    await expect(explanation).toContainText('Paris is the capital');
  });

  test('disables all options after answering', async ({ page }) => {
    const options = page.locator("[data-testid^='quiz-option']");
    const option = options.nth(1); // Paris

    await option.click();

    // All options should be disabled
    for (let i = 0; i < (await options.count()); i++) {
      await expect(options.nth(i)).toBeDisabled();
    }
  });

  test('navigates to next question with button click', async ({ page }) => {
    const counter = page.locator("[data-testid='question-counter']");
    const nextButton = page.locator("[data-testid='next-button']");
    const options = page.locator("[data-testid^='quiz-option']");

    await expect(counter).toHaveText('Question 1 / 3');
    await nextButton.click();
    await expect(counter).toHaveText('Question 2 / 3');
  });

  test('navigates to previous question with button click', async ({ page }) => {
    const nextButton = page.locator("[data-testid='next-button']");
    const prevButton = page.locator("[data-testid='prev-button']");
    const counter = page.locator("[data-testid='question-counter']");
    const options = page.locator("[data-testid^='quiz-option']");

    // Navigate to second question
    await options.nth(0).click();
    await nextButton.click();
    await expect(counter).toHaveText('Question 2 / 3');

    // Go back to first question
    await prevButton.click();
    await expect(counter).toHaveText('Question 1 / 3');
  });

  test('disables previous button on first question', async ({ page }) => {
    const prevButton = page.locator("[data-testid='prev-button']");
    await expect(prevButton).toBeDisabled();
  });

  test('shows finish button on last question', async ({ page }) => {
    const nextButton = page.locator("[data-testid='next-button']");
    const counter = page.locator("[data-testid='question-counter']");
    const options = page.locator("[data-testid^='quiz-option']");

    // Navigate to last question
    await options.nth(0).click();
    await nextButton.click();
    await options.nth(1).click();
    await nextButton.click();

    await expect(counter).toHaveText('Question 3 / 3');
    // Finish button should be visible and enabled on last question
    await expect(nextButton).toBeVisible();
    await expect(nextButton).not.toBeDisabled();
  });

  test('shows score after completing all questions', async ({ page }) => {
    const nextButton = page.locator("[data-testid='next-button']");
    const options = page.locator("[data-testid^='quiz-option']");
    const question = page.locator("[data-testid='quiz-question']");

    // Answer all questions correctly
    // Q1: Paris (index 1)
    await options.nth(1).click();
    await nextButton.click();

    // Q2: 4 (index 1)
    await options.nth(1).click();
    await nextButton.click();

    // Q3: Jupiter (index 2)
    await options.nth(2).click();
    await nextButton.click();

    // Should show results
    const results = page.locator("[data-testid='quiz-results']");
    await expect(results).toBeVisible();
    await expect(results).toContainText('Your Score: 3 / 3');
  });

  test('shows correct score for mixed correct/incorrect answers', async ({
    page,
  }) => {
    const nextButton = page.locator("[data-testid='next-button']");
    const options = page.locator("[data-testid^='quiz-option']");
    const question = page.locator("[data-testid='quiz-question']");

    // Q1: Wrong answer (London - index 0)
    await options.nth(0).click();
    await nextButton.click();

    // Q2: Correct answer (4 - index 1)
    await options.nth(1).click();
    await nextButton.click();

    // Q3: Correct answer (Jupiter - index 2)
    await options.nth(2).click();
    await nextButton.click();

    const results = page.locator("[data-testid='quiz-results']");
    await expect(results).toContainText('Your Score: 2 / 3');
  });

  test('has proper ARIA attributes for accessibility', async ({ page }) => {
    const options = page.locator("[data-testid^='quiz-option']");

    // Options should be buttons
    for (let i = 0; i < (await options.count()); i++) {
      await expect(options.nth(i)).toHaveAttribute('type', 'button');
    }
  });

  test('shows empty state when no questions provided', async ({ page }) => {
    await page.goto('/quiz-viewer?empty=true');
    await page.waitForTimeout(500);

    await expect(page.locator("[data-testid='empty-state']")).toBeVisible();
    await expect(page.locator("[data-testid='empty-state']")).toContainText(
      'No questions',
    );
  });

  test('restarts quiz on restart button click', async ({ page }) => {
    const nextButton = page.locator("[data-testid='next-button']");
    const restartButton = page.locator("[data-testid='restart-button']");
    const options = page.locator("[data-testid^='quiz-option']");
    const question = page.locator("[data-testid='quiz-question']");

    // Complete quiz
    // Q1: Paris (index 1)
    await options.nth(1).click();
    await nextButton.click();

    // Q2: 4 (index 1)
    await options.nth(1).click();
    await nextButton.click();

    // Q3: Jupiter (index 2)
    await options.nth(2).click();
    await nextButton.click();

    // Show results
    const results = page.locator("[data-testid='quiz-results']");
    await expect(results).toBeVisible();

    // Restart
    await restartButton.click();

    // Should be back to first question
    const counter = page.locator("[data-testid='question-counter']");
    await expect(counter).toHaveText('Question 1 / 3');
    await expect(results).not.toBeVisible();
  });
});
