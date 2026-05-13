import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatCurrency,
  formatDate,
  CATEGORY_CONFIG,
  vendorCategoryMap,
  exceptions,
  addToRecoveryQueue,
  updateRecoveryRecord,
  recoveryQueue,
  allExceptions,
  updateExceptionStatus,
  recoveryTrendData,
} from "@/lib/data";
import type { RecoveryRecord, RecoveryStatus } from "@/lib/data";

// ─── formatCurrency ────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it('formats 123890 as "$123,890"', () => {
    expect(formatCurrency(123890)).toBe("$123,890");
  });

  it('formats 0 as "$0"', () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it('formats 1000000 as "$1,000,000"', () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000");
  });

  it("rounds 99.99 to a whole number with no decimals", () => {
    const result = formatCurrency(99.99);
    expect(result).toBe("$100");
  });

  it("formats -5000 with a minus sign", () => {
    const result = formatCurrency(-5000);
    expect(result).toMatch(/-/);
  });
});

// ─── formatDate ────────────────────────────────────────────────────────────

describe("formatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats "2026-03-28" as "Mar 28, 2026"', () => {
    expect(formatDate("2026-03-28")).toBe("Mar 28, 2026");
  });

  it('formats "2026-01-01" as "Jan 1, 2026"', () => {
    expect(formatDate("2026-01-01")).toBe("Jan 1, 2026");
  });

  it('formats "2026-12-31" as "Dec 31, 2026"', () => {
    expect(formatDate("2026-12-31")).toBe("Dec 31, 2026");
  });
});

// ─── CATEGORY_CONFIG ───────────────────────────────────────────────────────

describe("CATEGORY_CONFIG", () => {
  const expectedCategories = [
    "Medical Equipment",
    "Pharmaceuticals",
    "Surgical Supplies",
    "Sterilization",
    "GPO — General",
  ];

  it("contains all 5 expected categories", () => {
    for (const cat of expectedCategories) {
      expect(CATEGORY_CONFIG).toHaveProperty(cat);
    }
  });

  it("each category has bg, text, border, and label keys", () => {
    for (const cat of expectedCategories) {
      const cfg = CATEGORY_CONFIG[cat];
      expect(cfg).toHaveProperty("bg");
      expect(cfg).toHaveProperty("text");
      expect(cfg).toHaveProperty("border");
      expect(cfg).toHaveProperty("label");
    }
  });

  it("each category label matches its key", () => {
    for (const cat of expectedCategories) {
      expect(CATEGORY_CONFIG[cat].label).toBe(cat);
    }
  });
});

// ─── vendorCategoryMap ─────────────────────────────────────────────────────

describe("vendorCategoryMap", () => {
  it("has at least 16 entries", () => {
    expect(Object.keys(vendorCategoryMap).length).toBeGreaterThanOrEqual(16);
  });

  it("every vendor in exceptions with a category has a mapping", () => {
    for (const ex of exceptions) {
      if (ex.category) {
        expect(vendorCategoryMap).toHaveProperty(ex.vendor);
      }
    }
  });

  it('maps "Cardinal Health" to "Pharmaceuticals"', () => {
    expect(vendorCategoryMap["Cardinal Health"]).toBe("Pharmaceuticals");
  });
});

// ─── addToRecoveryQueue ────────────────────────────────────────────────────

describe("addToRecoveryQueue", () => {
  it("adds a record to the front of the recovery queue", () => {
    const before = recoveryQueue.length;
    const record: Omit<RecoveryRecord, "id"> = {
      exceptionId: "EX-999",
      vendor: "Test Vendor",
      invoiceNumber: "TV-0001",
      targetAmount: 1000,
      status: "pending" as RecoveryStatus,
      initiatedAt: "2026-05-13T00:00:00Z",
      emailSentTo: "test@test.com",
    };
    const result = addToRecoveryQueue(record);
    expect(recoveryQueue.length).toBe(before + 1);
    expect(recoveryQueue[0].id).toBe(result.id);
  });

  it("returns a record with an id in REC-NNN format", () => {
    const record: Omit<RecoveryRecord, "id"> = {
      exceptionId: "EX-998",
      vendor: "Another Vendor",
      invoiceNumber: "AV-0001",
      targetAmount: 2000,
      status: "pending" as RecoveryStatus,
      initiatedAt: "2026-05-13T00:00:00Z",
      emailSentTo: "another@test.com",
    };
    const result = addToRecoveryQueue(record);
    expect(result.id).toMatch(/^REC-\d{3}$/);
  });
});

// ─── updateRecoveryRecord ──────────────────────────────────────────────────

describe("updateRecoveryRecord", () => {
  it("patches an existing record in the queue", () => {
    const target = recoveryQueue[0];
    const originalStatus = target.status;
    const newStatus: RecoveryStatus = originalStatus === "pending" ? "in_progress" : "pending";
    updateRecoveryRecord(target.id, { status: newStatus });
    const updated = recoveryQueue.find((r) => r.id === target.id);
    expect(updated?.status).toBe(newStatus);
    // Restore original state
    updateRecoveryRecord(target.id, { status: originalStatus });
  });

  it("silently no-ops when given a non-existent id", () => {
    const before = [...recoveryQueue.map((r) => ({ ...r }))];
    updateRecoveryRecord("REC-NONEXISTENT", { status: "recovered" });
    expect(recoveryQueue.length).toBe(before.length);
  });
});

// ─── updateExceptionStatus ────────────────────────────────────────────────

describe("updateExceptionStatus", () => {
  it("changes the status of an existing exception", () => {
    const target = allExceptions.find((e) => e.id === "EX-001")!;
    const originalStatus = target.status;
    updateExceptionStatus("EX-001", "escalated");
    expect(target.status).toBe("escalated");
    updateExceptionStatus("EX-001", originalStatus);
  });

  it("silently no-ops for a non-existent exception id", () => {
    expect(() => updateExceptionStatus("EX-NONEXISTENT", "resolved")).not.toThrow();
  });

  it("mutates the same object reference visible in allExceptions", () => {
    const before = allExceptions.find((e) => e.id === "EX-002")!;
    const originalStatus = before.status;
    updateExceptionStatus("EX-002", "resolved");
    const after = allExceptions.find((e) => e.id === "EX-002")!;
    expect(after.status).toBe("resolved");
    updateExceptionStatus("EX-002", originalStatus);
  });
});

// ─── recoveryTrendData ────────────────────────────────────────────────────

describe("recoveryTrendData", () => {
  it("has exactly 12 months of data", () => {
    expect(recoveryTrendData).toHaveLength(12);
  });

  it("each entry has month, target, recovered, and successRate", () => {
    for (const entry of recoveryTrendData) {
      expect(entry).toHaveProperty("month");
      expect(typeof entry.target).toBe("number");
      expect(typeof entry.recovered).toBe("number");
      expect(typeof entry.successRate).toBe("number");
    }
  });

  it("success rates are between 0 and 100", () => {
    for (const entry of recoveryTrendData) {
      expect(entry.successRate).toBeGreaterThanOrEqual(0);
      expect(entry.successRate).toBeLessThanOrEqual(100);
    }
  });
});
