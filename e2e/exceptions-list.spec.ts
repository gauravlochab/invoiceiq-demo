import { test, expect } from "@playwright/test";

test.describe("Exceptions List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/exceptions");
    await page.waitForTimeout(500);
  });

  test("page loads with exceptions table", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("link", { name: /Review/i }).first()).toBeVisible();
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(10);
  });

  test("category column shows CategoryBadge pills", async ({ page }) => {
    await expect(page.getByText("Medical Equipment").first()).toBeVisible();
  });

  test("vendor badges with initials are visible", async ({ page }) => {
    await expect(page.getByText("CH").first()).toBeVisible();
  });

  test("filter chips show counts", async ({ page }) => {
    await expect(page.getByText(/All \(\d+\)/)).toBeVisible();
    await expect(page.getByText(/Critical/i).first()).toBeVisible();
  });

  test("Critical filter reduces total results count", async ({ page }) => {
    const allText = await page.getByText(/Showing \d+ to \d+ of \d+ results/).textContent();
    const allTotal = parseInt(allText?.match(/of (\d+)/)?.[1] || "0");

    await page.getByText(/^Critical \(\d+\)$/).click();
    await page.waitForTimeout(200);

    const critText = await page.getByText(/Showing \d+ to \d+ of \d+ results/).textContent();
    const critTotal = parseInt(critText?.match(/of (\d+)/)?.[1] || "0");

    expect(critTotal).toBeLessThan(allTotal);
    expect(critTotal).toBeGreaterThan(0);
  });

  test("table header has Category column", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: "Category" })).toBeVisible();
  });

  test("review link navigates to detail page", async ({ page }) => {
    const firstReview = page.getByRole("link", { name: /Review/i }).first();
    const href = await firstReview.getAttribute("href");
    expect(href).toMatch(/\/exceptions\/EX-\d+/);
  });
});
