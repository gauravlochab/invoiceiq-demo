import { test, expect } from "@playwright/test";

test.describe("Extraction Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/extract");
    await page.waitForTimeout(600);
  });

  test("page loads with Extract Invoice heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Extract Invoice/i })).toBeVisible();
  });

  test("shows more than 25 invoice cards", async ({ page }) => {
    await expect(page.getByText("Steris Corporation").first()).toBeVisible();
    const cards = page.locator(".card").filter({ hasText: "Invoice ·" });
    const count = await cards.count();
    expect(count).toBeGreaterThan(25);
  });

  test("shows upload dropzone", async ({ page }) => {
    await expect(page.getByText("Upload Invoice")).toBeVisible();
    await expect(page.getByText("Drag and drop")).toBeVisible();
  });

  test("shows supporting documents section", async ({ page }) => {
    await expect(page.getByText("SUPPORTING DOCUMENTS")).toBeVisible();
  });
});
