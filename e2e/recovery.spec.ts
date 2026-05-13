import { test, expect } from "@playwright/test";

test.describe("Recovery Queue", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/recovery");
    await page.waitForTimeout(600);
  });

  test("page loads with Recovery Queue heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Recovery Queue" })).toBeVisible();
  });

  test("shows recovery records", async ({ page }) => {
    await expect(page.getByText("REC-001")).toBeVisible();
  });

  test("shows SLA badges with color coding", async ({ page }) => {
    await page.waitForTimeout(200);
    const slaBadges = page.locator("text=/\\d+d remaining|Overdue/i");
    const count = await slaBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test("shows policy banner with Parkland Health reference", async ({ page }) => {
    await expect(page.getByText("Parkland Health Recovery Policy").first()).toBeVisible();
  });

  test("shows category badges via vendor category mapping", async ({ page }) => {
    await expect(page.getByText("REC-001")).toBeVisible();
    const badges = page.getByText(/Medical Equipment|Pharmaceuticals|Surgical Supplies/i);
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  test("shows vendor badges with logos", async ({ page }) => {
    const vendorImg = page.getByRole("img", { name: /Cardinal Health/i }).first();
    await expect(vendorImg).toBeVisible();
  });

  test("shows summary metrics strip", async ({ page }) => {
    await expect(page.getByText("In Queue").first()).toBeVisible();
    await expect(page.getByText("Total Target").first()).toBeVisible();
  });

  test("shows SLA compliance panel", async ({ page }) => {
    await expect(page.getByText("SLA Compliance").first()).toBeVisible();
  });

  test("recovery trend chart section is visible", async ({ page }) => {
    await expect(page.getByText("Recovery Trend").first()).toBeVisible();
  });

  test("recovery trend shows legend", async ({ page }) => {
    await expect(page.getByText("Target").first()).toBeVisible();
    await expect(page.getByText("Recovered").first()).toBeVisible();
  });
});
