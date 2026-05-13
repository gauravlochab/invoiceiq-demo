import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  daysUntilDeadline,
  getSlaUrgency,
  getSlaColor,
  mapLegacyStatusToPhase,
  getPhaseConfig,
  RECOVERY_PHASES,
  SLA_TRANSITIONS,
  PARKLAND_RECOVERY_CONFIG,
} from "@/lib/recovery-config";

// ─── Freeze time to 2026-05-13 for deterministic date tests ────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-13"));
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── daysUntilDeadline ─────────────────────────────────────────────────────

describe("daysUntilDeadline", () => {
  it("returns 1 for tomorrow (2026-05-14)", () => {
    expect(daysUntilDeadline("2026-05-14")).toBe(1);
  });

  it("returns a negative number for yesterday (2026-05-12)", () => {
    const result = daysUntilDeadline("2026-05-12");
    expect(result).toBeLessThan(0);
  });

  it("returns a large positive number for a far-future date (2026-12-31)", () => {
    const result = daysUntilDeadline("2026-12-31");
    expect(result).toBeGreaterThan(200);
  });
});

// ─── getSlaUrgency ─────────────────────────────────────────────────────────

describe("getSlaUrgency", () => {
  it('returns "overdue" when daysRemaining is negative', () => {
    expect(getSlaUrgency(-1)).toBe("overdue");
    expect(getSlaUrgency(-10)).toBe("overdue");
  });

  it('returns "critical" when daysRemaining is 0', () => {
    expect(getSlaUrgency(0)).toBe("critical");
  });

  it('returns "critical" when daysRemaining is 2', () => {
    expect(getSlaUrgency(2)).toBe("critical");
  });

  it('returns "warning" when daysRemaining is 3', () => {
    expect(getSlaUrgency(3)).toBe("warning");
  });

  it('returns "warning" when daysRemaining is 5', () => {
    expect(getSlaUrgency(5)).toBe("warning");
  });

  it('returns "ok" when daysRemaining is 6', () => {
    expect(getSlaUrgency(6)).toBe("ok");
  });

  it('returns "ok" when daysRemaining is 100', () => {
    expect(getSlaUrgency(100)).toBe("ok");
  });
});

// ─── getSlaColor ───────────────────────────────────────────────────────────

describe("getSlaColor", () => {
  it('returns dot "#dc2626" for "overdue"', () => {
    expect(getSlaColor("overdue").dot).toBe("#dc2626");
  });

  it('returns dot "#ef4444" for "critical"', () => {
    expect(getSlaColor("critical").dot).toBe("#ef4444");
  });

  it('returns dot "#d97706" for "warning"', () => {
    expect(getSlaColor("warning").dot).toBe("#d97706");
  });

  it('returns dot "#059669" for "ok"', () => {
    expect(getSlaColor("ok").dot).toBe("#059669");
  });

  it("returns an object with text, bg, border, and dot keys for overdue", () => {
    const color = getSlaColor("overdue");
    expect(color).toHaveProperty("text");
    expect(color).toHaveProperty("bg");
    expect(color).toHaveProperty("border");
    expect(color).toHaveProperty("dot");
  });

  it("returns an object with text, bg, border, and dot keys for critical", () => {
    const color = getSlaColor("critical");
    expect(Object.keys(color).sort()).toEqual(["bg", "border", "dot", "text"]);
  });

  it("returns an object with text, bg, border, and dot keys for warning", () => {
    const color = getSlaColor("warning");
    expect(Object.keys(color).sort()).toEqual(["bg", "border", "dot", "text"]);
  });

  it("returns an object with text, bg, border, and dot keys for ok", () => {
    const color = getSlaColor("ok");
    expect(Object.keys(color).sort()).toEqual(["bg", "border", "dot", "text"]);
  });
});

// ─── mapLegacyStatusToPhase ────────────────────────────────────────────────

describe("mapLegacyStatusToPhase", () => {
  it('maps "pending" to "vendor_contacted"', () => {
    expect(mapLegacyStatusToPhase("pending")).toBe("vendor_contacted");
  });

  it('maps "in_progress" to "under_review"', () => {
    expect(mapLegacyStatusToPhase("in_progress")).toBe("under_review");
  });

  it('maps "recovered" to "resolved"', () => {
    expect(mapLegacyStatusToPhase("recovered")).toBe("resolved");
  });

  it('maps "partial" to "credit_pending"', () => {
    expect(mapLegacyStatusToPhase("partial")).toBe("credit_pending");
  });

  it('maps "closed" to "resolved"', () => {
    expect(mapLegacyStatusToPhase("closed")).toBe("resolved");
  });
});

// ─── getPhaseConfig ────────────────────────────────────────────────────────

describe("getPhaseConfig", () => {
  it('returns label "Identified" for phase "identified"', () => {
    const config = getPhaseConfig("identified");
    expect(config.label).toBe("Identified");
  });

  it('returns badgeClass "badge neutral" for phase "identified"', () => {
    const config = getPhaseConfig("identified");
    expect(config.badgeClass).toBe("badge neutral");
  });

  it('returns slaColor "#059669" for phase "resolved"', () => {
    const config = getPhaseConfig("resolved");
    expect(config.slaColor).toBe("#059669");
  });

  it('returns badgeClass "badge critical" for phase "escalated"', () => {
    const config = getPhaseConfig("escalated");
    expect(config.badgeClass).toBe("badge critical");
  });
});

// ─── Constants ─────────────────────────────────────────────────────────────

describe("Constants", () => {
  it("RECOVERY_PHASES has exactly 6 entries", () => {
    expect(RECOVERY_PHASES).toHaveLength(6);
  });

  it("SLA_TRANSITIONS has exactly 4 entries", () => {
    expect(SLA_TRANSITIONS).toHaveLength(4);
  });

  it('PARKLAND_RECOVERY_CONFIG has policyRef "AP-POL-4.3-2026"', () => {
    expect(PARKLAND_RECOVERY_CONFIG.policyRef).toBe("AP-POL-4.3-2026");
  });
});
