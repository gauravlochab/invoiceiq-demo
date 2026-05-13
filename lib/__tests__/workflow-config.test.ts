import { describe, it, expect } from "vitest";
import { getEscalationLevel, PARKLAND_CONFIG } from "@/lib/workflow-config";

describe("getEscalationLevel()", () => {
  it("$123,890 returns CFO level with autoEscalate true", () => {
    const result = getEscalationLevel(123890);
    expect(result).not.toBeNull();
    expect(result!.approver).toBe("Chief Financial Officer");
    expect(result!.autoEscalate).toBe(true);
  });

  it("$100,000 exact returns CFO (inclusive boundary)", () => {
    const result = getEscalationLevel(100000);
    expect(result).not.toBeNull();
    expect(result!.approver).toBe("Chief Financial Officer");
  });

  it("$99,999 returns VP level", () => {
    const result = getEscalationLevel(99999);
    expect(result).not.toBeNull();
    expect(result!.approver).toBe("VP of Finance");
  });

  it("$50,000 exact returns VP with autoEscalate true", () => {
    const result = getEscalationLevel(50000);
    expect(result).not.toBeNull();
    expect(result!.approver).toBe("VP of Finance");
    expect(result!.autoEscalate).toBe(true);
  });

  it("$49,999 returns Manager with autoEscalate false", () => {
    const result = getEscalationLevel(49999);
    expect(result).not.toBeNull();
    expect(result!.approver).toBe("Department Manager");
    expect(result!.autoEscalate).toBe(false);
  });

  it("$10,000 exact returns Manager", () => {
    const result = getEscalationLevel(10000);
    expect(result).not.toBeNull();
    expect(result!.approver).toBe("Department Manager");
  });

  it("$9,999 returns null (below all thresholds)", () => {
    const result = getEscalationLevel(9999);
    expect(result).toBeNull();
  });

  it("$0 returns null", () => {
    const result = getEscalationLevel(0);
    expect(result).toBeNull();
  });

  it("$1,000,000 returns CFO", () => {
    const result = getEscalationLevel(1000000);
    expect(result).not.toBeNull();
    expect(result!.approver).toBe("Chief Financial Officer");
  });
});

describe("PARKLAND_CONFIG", () => {
  it('has customer "Parkland Health" and exactly 3 escalation thresholds', () => {
    expect(PARKLAND_CONFIG.customer).toBe("Parkland Health");
    expect(PARKLAND_CONFIG.escalationThresholds).toHaveLength(3);
  });
});
