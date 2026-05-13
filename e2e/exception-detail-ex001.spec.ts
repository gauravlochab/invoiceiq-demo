import { test, expect } from "@playwright/test";

test.describe("Exception Detail EX-001 (Contract Overage)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/exceptions/EX-001");
    await page.waitForTimeout(300);
  });

  test("shows vendor name BioMed Equipment Inc.", async ({ page }) => {
    await expect(page.getByText("BioMed Equipment Inc.")).toBeVisible();
  });

  test("shows Contract Overage type badge", async ({ page }) => {
    await expect(page.getByText("Contract Overage").first()).toBeVisible();
  });

  test("shows Medical Equipment category badge", async ({ page }) => {
    await expect(page.getByText("Medical Equipment").first()).toBeVisible();
  });

  test("escalation banner shows CFO Approval Required", async ({ page }) => {
    await expect(page.getByText("CFO Approval Required")).toBeVisible();
  });

  test("escalation banner mentions Chief Financial Officer", async ({ page }) => {
    await expect(page.getByText(/Chief Financial Officer/i)).toBeVisible();
  });

  test("escalation banner shows threshold amount", async ({ page }) => {
    await expect(page.getByText("$100,000").first()).toBeVisible();
  });

  test("has Back link to exceptions list", async ({ page }) => {
    const backLink = page.getByText("Back").first();
    await expect(backLink).toBeVisible();
  });
});
