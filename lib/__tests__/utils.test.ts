import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("passes through a single class", () => {
    expect(cn("p-4")).toBe("p-4");
  });

  it("resolves Tailwind padding conflicts (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("resolves Tailwind color conflicts", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("ignores falsy values", () => {
    expect(cn("p-4", false && "hidden")).toBe("p-4");
  });

  it("handles undefined, null, and empty string", () => {
    expect(cn("p-4", undefined, null, "")).toBe("p-4");
  });

  it("accepts array input", () => {
    const result = cn("p-4", ["m-2", "text-sm"]);
    expect(result).toContain("p-4");
    expect(result).toContain("m-2");
    expect(result).toContain("text-sm");
  });

  it("returns empty string with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("preserves non-conflicting classes", () => {
    const result = cn("flex", "flex-col", "items-center");
    expect(result).toContain("flex");
    expect(result).toContain("flex-col");
    expect(result).toContain("items-center");
  });
});
