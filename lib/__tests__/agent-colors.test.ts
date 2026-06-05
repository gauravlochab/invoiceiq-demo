import { describe, it, expect } from "vitest";
import { getAgentSubtleColor } from "../agent-colors";

describe("getAgentSubtleColor", () => {
  it.each([
    ["var(--agent-invoice)", "var(--agent-invoice-subtle)"],
    ["var(--agent-validation)", "var(--agent-validation-subtle)"],
    ["var(--agent-compliance)", "var(--agent-compliance-subtle)"],
    ["var(--agent-recovery)", "var(--agent-recovery-subtle)"],
    ["var(--agent-insight)", "var(--agent-insight-subtle)"],
  ])("maps %s → %s", (input, expected) => {
    expect(getAgentSubtleColor(input)).toBe(expected);
  });

  it("returns input unchanged for unknown colors", () => {
    expect(getAgentSubtleColor("var(--agent-unknown)")).toBe("var(--agent-unknown)");
    expect(getAgentSubtleColor("#ff0000")).toBe("#ff0000");
  });

  it("returns input unchanged for empty string", () => {
    expect(getAgentSubtleColor("")).toBe("");
  });
});
