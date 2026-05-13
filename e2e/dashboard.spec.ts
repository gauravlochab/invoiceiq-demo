import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(600);
  });

  test("shows page title and subtitle", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Invoice Intelligence/i })).toBeVisible();
    await expect(page.getByText("Parkland Health", { exact: false }).first()).toBeVisible();
  });

  test("renders metric cards with values", async ({ page }) => {
    await expect(page.getByText("1,847").first()).toBeVisible();
    await expect(page.getByText("Amount at Risk").first()).toBeVisible();
    await expect(page.getByText("Contracts at Risk").first()).toBeVisible();
  });

  test("shows agent status strip with 5 agents", async ({ page }) => {
    await expect(page.getByText("Invoice Agent")).toBeVisible();
    await expect(page.getByText("Validation Agent")).toBeVisible();
    await expect(page.getByText("Compliance Agent")).toBeVisible();
    await expect(page.getByText("Recovery Agent")).toBeVisible();
    await expect(page.getByText("Insight Agent")).toBeVisible();
  });

  test("charts are always visible", async ({ page }) => {
    await expect(page.getByText("Spend & Exception Trend")).toBeVisible();
    await expect(page.getByText("Amount at risk by exception type")).toBeVisible();
  });

  test("Recent Exceptions table has rows with Review links", async ({ page }) => {
    await expect(page.getByText("Recent Exceptions")).toBeVisible();
    const reviewLinks = page.getByRole("link", { name: /Review/i });
    await expect(reviewLinks.first()).toBeVisible();
    const count = await reviewLinks.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("View all link navigates to /exceptions", async ({ page }) => {
    const viewAllLink = page.getByRole("link", { name: /View all/i });
    await expect(viewAllLink).toBeVisible();
    await expect(viewAllLink).toHaveAttribute("href", "/exceptions");
  });

  test("shows Discrepancy Analysis by Category chart", async ({ page }) => {
    await expect(page.getByText("Discrepancy Analysis by Category")).toBeVisible();
    await expect(page.getByRole("button", { name: "Quarterly" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mar 2026" })).toBeVisible();
  });

  test("category badges appear in exceptions table", async ({ page }) => {
    const table = page.locator("table").last();
    await expect(table.getByText("Medical Equipment").first()).toBeVisible();
  });

  test("vendor badges with logos appear in exceptions table", async ({ page }) => {
    const table = page.locator("table").last();
    const vendorImg = table.getByRole("img", { name: /BioMed Equipment/i }).first();
    await expect(vendorImg).toBeVisible();
  });

  test("Run Scan button shows scanning state then disables", async ({ page }) => {
    const scanButton = page.getByRole("button", { name: /Run Scan|Scanning|Last scan/i });
    await scanButton.click();
    await expect(page.getByText(/Scanning/i)).toBeVisible();
    await page.waitForTimeout(2500);
    await expect(page.getByText(/Last scan/i)).toBeVisible();
  });

  test("Export button opens export dialog", async ({ page }) => {
    const exportBtn = page.getByRole("button", { name: /Export/i });
    await exportBtn.click();
    await page.waitForTimeout(200);
    await expect(page.getByText("CSV Spreadsheet")).toBeVisible();
    await expect(page.getByText("PDF Report")).toBeVisible();
  });
});
