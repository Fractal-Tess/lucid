import { expect, test } from '@playwright/test';

test.describe('QuizEditor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quiz-editor');
    await page.waitForTimeout(500);
  });

  test('displays list of quiz questions', async ({ page }) => {
    const questions = page.locator("[data-testid='question-item']");
    await expect(questions).toHaveCount(3);
  });

  test('shows add question button', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-question-button']");
    await expect(addButton).toBeVisible();
  });

  test('opens add question form when clicking add button', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-question-button']");
    await addButton.click();

    const form = page.locator("[data-testid='add-question-form']");
    await expect(form).toBeVisible();
  });

  test('creates new question with add form', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-question-button']");
    await addButton.click();

    const questionInput = page.locator("[data-testid='new-question-input']");
    const option0 = page.locator("[data-testid='new-option-0']");
    const option1 = page.locator("[data-testid='new-option-1']");
    const saveButton = page.locator("[data-testid='save-new-question-button']");

    await questionInput.fill('What is the largest ocean?');
    await option0.fill('Atlantic');
    await option1.fill('Pacific');
    await saveButton.click();

    const questions = page.locator("[data-testid='question-item']");
    await expect(questions).toHaveCount(4);
  });

  test('validates that question requires at least 2 options', async ({
    page,
  }) => {
    const addButton = page.locator("[data-testid='add-question-button']");
    await addButton.click();

    const questionInput = page.locator("[data-testid='new-question-input']");
    const option0 = page.locator("[data-testid='new-option-0']");
    const saveButton = page.locator("[data-testid='save-new-question-button']");

    await questionInput.fill('Single option question?');
    await option0.fill('Only option');
    await expect(saveButton).toBeDisabled();
  });

  test('can add more than 2 options', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-question-button']");
    await addButton.click();

    const addOptionButton = page.locator("[data-testid='add-option-button']");
    await addOptionButton.click();

    const option2 = page.locator("[data-testid='new-option-2']");
    await expect(option2).toBeVisible();
  });

  test('can remove options', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-question-button']");
    await addButton.click();

    const addOptionButton = page.locator("[data-testid='add-option-button']");
    await addOptionButton.click();

    const removeOption = page.locator("[data-testid='remove-option-1']");
    await removeOption.click();

    const option2 = page.locator("[data-testid='new-option-2']");
    await expect(option2).not.toBeVisible();
  });

  test('cancels add form without creating question', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-question-button']");
    await addButton.click();

    const cancelButton = page.locator("[data-testid='cancel-add-button']");
    await cancelButton.click();

    const form = page.locator("[data-testid='add-question-form']");
    await expect(form).not.toBeVisible();

    const questions = page.locator("[data-testid='question-item']");
    await expect(questions).toHaveCount(3);
  });

  test('opens edit mode when clicking edit button', async ({ page }) => {
    const firstQuestion = page.locator("[data-testid='question-item']").first();
    const editButton = firstQuestion.locator("[data-testid='edit-button']");
    await editButton.click();

    const editForm = firstQuestion.locator("[data-testid='edit-form']");
    await expect(editForm).toBeVisible();
  });

  test('updates question content', async ({ page }) => {
    const firstQuestion = page.locator("[data-testid='question-item']").first();
    const editButton = firstQuestion.locator("[data-testid='edit-button']");
    await editButton.click();

    const questionInput = page.locator("[data-testid='edit-question-input']");
    const saveButton = page.locator("[data-testid='save-edit-button']");

    await questionInput.fill('Updated question?');
    await saveButton.click();

    await expect(
      firstQuestion.locator("[data-testid='question-text']"),
    ).toHaveText('Updated question?');
  });

  test('can update explanation', async ({ page }) => {
    const firstQuestion = page.locator("[data-testid='question-item']").first();
    const editButton = firstQuestion.locator("[data-testid='edit-button']");
    await editButton.click();

    const explanationInput = page.locator(
      "[data-testid='edit-explanation-input']",
    );
    const saveButton = page.locator("[data-testid='save-edit-button']");

    await explanationInput.fill('This is an updated explanation');
    await saveButton.click();

    await expect(
      firstQuestion.locator("[data-testid='question-explanation']"),
    ).toHaveText('This is an updated explanation');
  });

  test('cancels edit without saving changes', async ({ page }) => {
    const firstQuestion = page.locator("[data-testid='question-item']").first();
    const originalQuestion = await firstQuestion
      .locator("[data-testid='question-text']")
      .textContent();

    const editButton = firstQuestion.locator("[data-testid='edit-button']");
    await editButton.click();

    const questionInput = page.locator("[data-testid='edit-question-input']");
    const cancelButton = page.locator("[data-testid='cancel-edit-button']");

    await questionInput.fill('This should not be saved');
    await cancelButton.click();

    await expect(
      firstQuestion.locator("[data-testid='question-text']"),
    ).toHaveText(originalQuestion!);
  });

  test('deletes question when clicking delete button', async ({ page }) => {
    const questions = page.locator("[data-testid='question-item']");
    await expect(questions).toHaveCount(3);

    const firstQuestion = questions.first();
    const deleteButton = firstQuestion.locator("[data-testid='delete-button']");
    await deleteButton.click();

    await expect(questions).toHaveCount(2);
  });

  test('shows drag handles for reordering', async ({ page }) => {
    const firstQuestion = page.locator("[data-testid='question-item']").first();
    const dragHandle = firstQuestion.locator("[data-testid='drag-handle']");
    await expect(dragHandle).toBeVisible();
  });

  test('displays question text for each question', async ({ page }) => {
    const firstQuestion = page.locator("[data-testid='question-item']").first();
    await expect(
      firstQuestion.locator("[data-testid='question-text']"),
    ).toHaveText('What is capital of France?');
  });

  test('displays all answer options', async ({ page }) => {
    const firstQuestion = page.locator("[data-testid='question-item']").first();
    const options = firstQuestion.locator('.text-sm');
    await expect(options).toHaveCount(4);
  });

  test('highlights correct answer', async ({ page }) => {
    const firstQuestion = page.locator("[data-testid='question-item']").first();
    const correctAnswer = firstQuestion.locator(
      '.text-green-700, .text-green-400',
    );
    await expect(correctAnswer).toContainText('Paris');
  });

  test('displays explanation when available', async ({ page }) => {
    const firstQuestion = page.locator("[data-testid='question-item']").first();
    const explanation = firstQuestion.locator(
      "[data-testid='question-explanation']",
    );
    await expect(explanation).toBeVisible();
    await expect(explanation).toContainText('Paris is capital');
  });

  test('save button is disabled when form is invalid', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-question-button']");
    await addButton.click();

    const saveButton = page.locator("[data-testid='save-new-question-button']");
    await expect(saveButton).toBeDisabled();

    const questionInput = page.locator("[data-testid='new-question-input']");
    await questionInput.fill('Some question');
    await expect(saveButton).toBeDisabled();

    const option0 = page.locator("[data-testid='new-option-0']");
    await option0.fill('Option A');
    await expect(saveButton).toBeDisabled();

    const option1 = page.locator("[data-testid='new-option-1']");
    await option1.fill('Option B');
    await expect(saveButton).not.toBeDisabled();
  });

  test('shows empty state when no questions', async ({ page }) => {
    // Delete all questions first
    while ((await page.locator("[data-testid='question-item']").count()) > 0) {
      const deleteButton = page
        .locator("[data-testid='question-item']")
        .first()
        .locator("[data-testid='delete-button']");
      await deleteButton.click();
      await page.waitForTimeout(100);
    }

    const emptyState = page.locator("[data-testid='empty-state']");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No questions yet');
  });
});
