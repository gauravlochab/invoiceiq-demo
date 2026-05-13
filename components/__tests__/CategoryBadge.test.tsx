import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryBadge } from "@/components/CategoryBadge";
import { CATEGORY_CONFIG } from "@/lib/data";

describe("CategoryBadge", () => {
  it('"Medical Equipment" renders a span with text "Medical Equipment"', () => {
    render(<CategoryBadge category="Medical Equipment" />);
    const badge = screen.getByText("Medical Equipment");
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe("SPAN");
  });

  it('"Medical Equipment" has correct CSS class', () => {
    render(<CategoryBadge category="Medical Equipment" />);
    const badge = screen.getByText("Medical Equipment");
    expect(badge.className).toContain("category-equipment");
  });

  it('"Pharmaceuticals" renders text "Pharmaceuticals"', () => {
    render(<CategoryBadge category="Pharmaceuticals" />);
    expect(screen.getByText("Pharmaceuticals")).toBeInTheDocument();
  });

  it.each([
    "Medical Equipment",
    "Pharmaceuticals",
    "Surgical Supplies",
    "Sterilization",
    "GPO — General",
  ])("renders category: %s", (category) => {
    const { container } = render(<CategoryBadge category={category} />);
    const config = CATEGORY_CONFIG[category];
    const badge = screen.getByText(config.label);
    expect(badge).toBeInTheDocument();
    expect(container.innerHTML).not.toBe("");
  });

  it('"Unknown Category" returns null (container empty)', () => {
    const { container } = render(<CategoryBadge category="Unknown Category" />);
    expect(container.innerHTML).toBe("");
  });

  it("empty string returns null", () => {
    const { container } = render(<CategoryBadge category="" />);
    expect(container.innerHTML).toBe("");
  });
});
