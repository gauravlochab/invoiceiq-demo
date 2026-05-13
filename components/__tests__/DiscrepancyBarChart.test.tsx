import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { DiscrepancyBarChart } from "@/components/DiscrepancyBarChart";

describe("DiscrepancyBarChart", () => {
  it("renders without crash", () => {
    const { container } = render(<DiscrepancyBarChart />);
    expect(container).toBeTruthy();
  });

  it('shows heading "Discrepancy Analysis by Category"', () => {
    render(<DiscrepancyBarChart />);
    expect(screen.getByText("Discrepancy Analysis by Category")).toBeInTheDocument();
  });

  it('has "Quarterly" button', () => {
    render(<DiscrepancyBarChart />);
    expect(screen.getByRole("button", { name: "Quarterly" })).toBeInTheDocument();
  });

  it('has "Mar 2026" button', () => {
    render(<DiscrepancyBarChart />);
    expect(screen.getByRole("button", { name: "Mar 2026" })).toBeInTheDocument();
  });

  it("shows 5 category legend items", () => {
    render(<DiscrepancyBarChart />);
    expect(screen.getByText("Medical Equipment")).toBeInTheDocument();
    expect(screen.getByText("Pharmaceuticals")).toBeInTheDocument();
    expect(screen.getByText("Surgical Supplies")).toBeInTheDocument();
    expect(screen.getByText("Sterilization")).toBeInTheDocument();
    // Use a function matcher for the em-dash character
    expect(screen.getByText((content) => content === "GPO — General")).toBeInTheDocument();
  });

  it('clicking "Mar 2026" changes active button styling', async () => {
    const user = userEvent.setup();
    render(<DiscrepancyBarChart />);

    const quarterlyBtn = screen.getByRole("button", { name: "Quarterly" });
    const dailyBtn = screen.getByRole("button", { name: "Mar 2026" });

    // Initially, Quarterly is active (has bg-white class)
    expect(quarterlyBtn.className).toContain("bg-white");
    expect(dailyBtn.className).not.toContain("bg-white");

    // Click Mar 2026
    await user.click(dailyBtn);

    // Now Mar 2026 should be active
    expect(dailyBtn.className).toContain("bg-white");
    expect(quarterlyBtn.className).not.toContain("bg-white");
  });
});
