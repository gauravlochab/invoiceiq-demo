import { test, expect } from "@playwright/test";

test.describe("Product Analysis", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/product-analysis");
    await page.waitForTimeout(600);
  });

  test("page loads with Product Category Analysis heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Product Category Analysis/i })).toBeVisible();
  });

  test("shows Medical Equipment category", async ({ page }) => {
    await expect(page.getByText("Medical Equipment").first()).toBeVisible();
  });

  test("shows Pharmaceuticals category", async ({ page }) => {
    await expect(page.getByText("Pharmaceuticals").first()).toBeVisible();
  });

  test("shows data table with category rows", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("shows chart visualization", async ({ page }) => {
    const chart = page.locator(".recharts-responsive-container");
    await expect(chart).toBeVisible();
  });
});
