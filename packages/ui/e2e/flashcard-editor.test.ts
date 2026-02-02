import { expect, test } from '@playwright/test';

test.describe('FlashcardEditor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/flashcard-editor');
    await page.waitForTimeout(500);
  });

  test('displays list of flashcards', async ({ page }) => {
    const cards = page.locator("[data-testid='flashcard-item']");
    await expect(cards).toHaveCount(3);
  });

  test('shows add card button', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-card-button']");
    await expect(addButton).toBeVisible();
  });

  test('opens add card form when clicking add button', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-card-button']");
    await addButton.click();

    const form = page.locator("[data-testid='add-card-form']");
    await expect(form).toBeVisible();
  });

  test('creates new card with add form', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-card-button']");
    await addButton.click();

    const questionInput = page.locator("[data-testid='new-question-input']");
    const answerInput = page.locator("[data-testid='new-answer-input']");
    const saveButton = page.locator("[data-testid='save-new-card-button']");

    await questionInput.fill('What is the speed of light?');
    await answerInput.fill('299,792,458 m/s');
    await saveButton.click();

    const cards = page.locator("[data-testid='flashcard-item']");
    await expect(cards).toHaveCount(4);
  });

  test('cancels add form without creating card', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-card-button']");
    await addButton.click();

    const cancelButton = page.locator("[data-testid='cancel-add-button']");
    await cancelButton.click();

    const form = page.locator("[data-testid='add-card-form']");
    await expect(form).not.toBeVisible();

    const cards = page.locator("[data-testid='flashcard-item']");
    await expect(cards).toHaveCount(3);
  });

  test('opens edit mode when clicking edit button', async ({ page }) => {
    const firstCard = page.locator("[data-testid='flashcard-item']").first();
    const editButton = firstCard.locator("[data-testid='edit-button']");
    await editButton.click();

    const editForm = firstCard.locator("[data-testid='edit-form']");
    await expect(editForm).toBeVisible();
  });

  test('updates card content', async ({ page }) => {
    const firstCard = page.locator("[data-testid='flashcard-item']").first();
    const editButton = firstCard.locator("[data-testid='edit-button']");
    await editButton.click();

    const questionInput = page.locator("[data-testid='edit-question-input']");
    const saveButton = page.locator("[data-testid='save-edit-button']");

    await questionInput.fill('Updated question?');
    await saveButton.click();

    await expect(firstCard.locator("[data-testid='card-question']")).toHaveText(
      'Updated question?',
    );
  });

  test('cancels edit without saving changes', async ({ page }) => {
    const firstCard = page.locator("[data-testid='flashcard-item']").first();
    const originalQuestion = await firstCard
      .locator("[data-testid='card-question']")
      .textContent();

    const editButton = firstCard.locator("[data-testid='edit-button']");
    await editButton.click();

    const questionInput = page.locator("[data-testid='edit-question-input']");
    const cancelButton = page.locator("[data-testid='cancel-edit-button']");

    await questionInput.fill('This should not be saved');
    await cancelButton.click();

    await expect(firstCard.locator("[data-testid='card-question']")).toHaveText(
      originalQuestion!,
    );
  });

  test('deletes card when clicking delete button', async ({ page }) => {
    const cards = page.locator("[data-testid='flashcard-item']");
    await expect(cards).toHaveCount(3);

    const firstCard = cards.first();
    const deleteButton = firstCard.locator("[data-testid='delete-button']");
    await deleteButton.click();

    await expect(cards).toHaveCount(2);
  });

  test('shows drag handles for reordering', async ({ page }) => {
    const firstCard = page.locator("[data-testid='flashcard-item']").first();
    const dragHandle = firstCard.locator("[data-testid='drag-handle']");
    await expect(dragHandle).toBeVisible();
  });

  test('displays question and answer for each card', async ({ page }) => {
    const firstCard = page.locator("[data-testid='flashcard-item']").first();
    await expect(firstCard.locator("[data-testid='card-question']")).toHaveText(
      'What is the capital of France?',
    );
    await expect(firstCard.locator("[data-testid='card-answer']")).toHaveText(
      'Paris',
    );
  });

  test('save button is disabled when fields are empty', async ({ page }) => {
    const addButton = page.locator("[data-testid='add-card-button']");
    await addButton.click();

    const saveButton = page.locator("[data-testid='save-new-card-button']");
    await expect(saveButton).toBeDisabled();

    const questionInput = page.locator("[data-testid='new-question-input']");
    await questionInput.fill('Some question');
    await expect(saveButton).toBeDisabled();

    const answerInput = page.locator("[data-testid='new-answer-input']");
    await answerInput.fill('Some answer');
    await expect(saveButton).not.toBeDisabled();
  });
});
