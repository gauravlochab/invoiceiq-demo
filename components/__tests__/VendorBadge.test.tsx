import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VendorBadge } from "@/components/VendorBadge";

describe("VendorBadge", () => {
  it('default render with "Cardinal Health": shows logo image and "Cardinal"', () => {
    render(<VendorBadge name="Cardinal Health" />);
    const img = screen.getByRole("img", { name: "Cardinal Health" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/logos/cardinal-health.svg");
    expect(screen.getByText("Cardinal")).toBeInTheDocument();
  });

  it('size="sm" renders logo with width 24', () => {
    render(<VendorBadge name="Cardinal Health" size="sm" />);
    const img = screen.getByRole("img", { name: "Cardinal Health" });
    expect(img).toHaveAttribute("width", "24");
    expect(img).toHaveAttribute("height", "24");
  });

  it('size="md" renders logo with width 32', () => {
    render(<VendorBadge name="Cardinal Health" size="md" />);
    const img = screen.getByRole("img", { name: "Cardinal Health" });
    expect(img).toHaveAttribute("width", "32");
    expect(img).toHaveAttribute("height", "32");
  });

  it('size="lg" shows full name "Cardinal Health" (not just "Cardinal")', () => {
    render(<VendorBadge name="Cardinal Health" size="lg" />);
    expect(screen.getByText("Cardinal Health")).toBeInTheDocument();
  });

  it("showName={false} hides name text", () => {
    render(<VendorBadge name="Cardinal Health" showName={false} />);
    expect(screen.getByRole("img", { name: "Cardinal Health" })).toBeInTheDocument();
    expect(screen.queryByText("Cardinal")).not.toBeInTheDocument();
    expect(screen.queryByText("Cardinal Health")).not.toBeInTheDocument();
  });

  it('unknown vendor "FooBar Labs" renders initials fallback "FL"', () => {
    render(<VendorBadge name="FooBar Labs" />);
    expect(screen.getByText("FL")).toBeInTheDocument();
  });

  it("unknown vendor circle has inline backgroundColor", () => {
    render(<VendorBadge name="FooBar Labs" />);
    const circle = screen.getByText("FL");
    expect(circle).toHaveStyle({ backgroundColor: expect.any(String) });
  });

  it('"Owens & Minor" shows logo image', () => {
    render(<VendorBadge name="Owens & Minor" />);
    const img = screen.getByRole("img", { name: "Owens & Minor" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/logos/owens-minor.svg");
  });
});
