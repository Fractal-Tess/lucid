import { expect, test } from "@playwright/test";

test.describe("NotesViewer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/notes-viewer");
    await page.waitForTimeout(500);
  });

  test("displays notes title", async ({ page }) => {
    await expect(page.getByText("Notes", { exact: true })).toBeVisible();
  });

  test("displays notes content with markdown formatting", async ({ page }) => {
    await expect(page.getByText("Introduction to Photosynthesis")).toBeVisible();
    await expect(page.getByText("light energy")).toBeVisible();
  });

  test("displays key points section", async ({ page }) => {
    await expect(page.getByText("Key Points")).toBeVisible();
    await expect(page.getByText("Photosynthesis converts light energy into glucose")).toBeVisible();
    await expect(page.getByText("Chlorophyll is the primary pigment involved")).toBeVisible();
  });

  test("displays key points with numbered badges", async ({ page }) => {
    const badges = page.locator("[data-testid='notes-viewer'] .badge");
    await expect(badges.first()).toContainText("1");
  });
});
