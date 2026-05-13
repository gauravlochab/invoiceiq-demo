import { test, expect } from "@playwright/test";

test.describe("Exception Detail EX-006 (Match Exception)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/exceptions/EX-006");
    await page.waitForTimeout(300);
  });

  test("shows vendor name Steris Corporation", async ({ page }) => {
    await expect(page.getByText("Steris Corporation")).toBeVisible();
  });

  test("shows Match Exception type", async ({ page }) => {
    await expect(page.getByText("Match Exception").first()).toBeVisible();
  });

  test("shows Sterilization category badge", async ({ page }) => {
    await expect(page.getByText("Sterilization").first()).toBeVisible();
  });

  test("shows line items table with item codes", async ({ page }) => {
    await expect(page.getByText("STE-4821-A").first()).toBeVisible();
    await expect(page.getByText("STE-2200-C").first()).toBeVisible();
    await expect(page.getByText("STE-9940-B").first()).toBeVisible();
  });

  test("STE-4821-A shows price mismatch indicator", async ({ page }) => {
    const row = page.locator("tr", { hasText: "STE-4821-A" });
    await expect(row.getByText("$2.50").first()).toBeVisible();
    await expect(row.getByText("$2.10").first()).toBeVisible();
  });

  test("clicking a line item action opens legal disclaimer dialog", async ({ page }) => {
    const firstActionBtn = page.locator("tr", { hasText: "STE-4821-A" }).getByRole("button").first();
    await firstActionBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("disclaimer checkbox must be checked before confirming", async ({ page }) => {
    const firstActionBtn = page.locator("tr", { hasText: "STE-4821-A" }).getByRole("button").first();
    await firstActionBtn.click();
    await page.waitForTimeout(200);
    const confirmButton = page.getByRole("button", { name: /Confirm/i });
    await expect(confirmButton).toBeDisabled();

    const checkbox = page.getByRole("checkbox");
    await checkbox.check();
    await expect(confirmButton).toBeEnabled();
  });

  test("shows total amounts", async ({ page }) => {
    await expect(page.getByText("$27,550").first()).toBeVisible();
  });
});
