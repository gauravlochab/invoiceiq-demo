import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EscalationBanner } from "@/components/EscalationBanner";

describe("EscalationBanner", () => {
  it("flaggedAmount={5000} renders nothing (below threshold)", () => {
    const { container } = render(<EscalationBanner flaggedAmount={5000} />);
    expect(container.innerHTML).toBe("");
  });

  it('flaggedAmount={10000} contains "Manager Approval Required"', () => {
    render(<EscalationBanner flaggedAmount={10000} />);
    expect(screen.getByText("Manager Approval Required")).toBeInTheDocument();
  });

  it("flaggedAmount={10000} has amber-related classes (not red)", () => {
    const { container } = render(<EscalationBanner flaggedAmount={10000} />);
    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toContain("bg-amber-50");
    expect(banner.className).toContain("border-amber-200");
    expect(banner.className).not.toContain("bg-red-50");
  });

  it('flaggedAmount={50000} contains "VP Approval Required"', () => {
    render(<EscalationBanner flaggedAmount={50000} />);
    expect(screen.getByText("VP Approval Required")).toBeInTheDocument();
  });

  it("flaggedAmount={50000} has red-related classes", () => {
    const { container } = render(<EscalationBanner flaggedAmount={50000} />);
    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toContain("bg-red-50");
    expect(banner.className).toContain("border-red-200");
  });

  it('flaggedAmount={123890} contains "Chief Financial Officer"', () => {
    render(<EscalationBanner flaggedAmount={123890} />);
    expect(screen.getByText(/Chief Financial Officer/)).toBeInTheDocument();
  });

  it("Banner contains formatted currency text", () => {
    render(<EscalationBanner flaggedAmount={50000} />);
    expect(screen.getByText(/\$50,000/)).toBeInTheDocument();
  });

  it('auto-escalate banners contain "automatically escalated"', () => {
    render(<EscalationBanner flaggedAmount={50000} />);
    expect(screen.getByText(/automatically escalated/)).toBeInTheDocument();
  });

  it('non-auto banners contain "Requires approval from"', () => {
    render(<EscalationBanner flaggedAmount={10000} />);
    expect(screen.getByText(/Requires approval from/)).toBeInTheDocument();
  });
});
