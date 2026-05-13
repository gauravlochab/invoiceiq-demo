import { test, expect } from "@playwright/test";

test.describe("Vendor Scoring", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/vendor-scoring");
    await page.waitForTimeout(600);
  });

  test("page loads with Vendor Scoring heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Vendor Scoring/i })).toBeVisible();
  });

  test("shows vendor table", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("shows risk rating badges", async ({ page }) => {
    await expect(page.getByText("Critical").first()).toBeVisible();
  });

  test("shows vendor names", async ({ page }) => {
    const vendorImg = page.getByRole("img", { name: /Cardinal Health/i }).first();
    await expect(vendorImg).toBeVisible();
  });

  test("shows recovery percentage values", async ({ page }) => {
    const pctValues = page.getByText(/\d+%/);
    const count = await pctValues.count();
    expect(count).toBeGreaterThan(0);
  });
});
