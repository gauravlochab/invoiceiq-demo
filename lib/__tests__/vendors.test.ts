import { describe, it, expect } from "vitest";
import { getVendorInfo, VENDOR_CONFIG } from "@/lib/vendors";

describe("getVendorInfo()", () => {
  it('returns exact config for "Cardinal Health"', () => {
    const info = getVendorInfo("Cardinal Health");
    expect(info).toEqual({
      name: "Cardinal Health",
      shortName: "Cardinal",
      initials: "CH",
      color: "#c41e3a",
      textColor: "#ffffff",
      logo: "/logos/cardinal-health.svg",
    });
  });

  it('returns initials "ST" for "Steris Corporation"', () => {
    const info = getVendorInfo("Steris Corporation");
    expect(info.initials).toBe("ST");
  });

  it('returns initials "OM" for "Owens & Minor" (ampersand in name)', () => {
    const info = getVendorInfo("Owens & Minor");
    expect(info.initials).toBe("OM");
  });

  it('returns initials "AW" for unknown vendor "Acme Widget Corp"', () => {
    const info = getVendorInfo("Acme Widget Corp");
    expect(info.initials).toBe("AW");
  });

  it('returns initials "XY" for single-word unknown vendor "Xylophone"', () => {
    const info = getVendorInfo("Xylophone");
    expect(info.initials).toBe("XY");
  });

  it("returns name equal to input string for unknown vendor", () => {
    const info = getVendorInfo("Acme Widget Corp");
    expect(info.name).toBe("Acme Widget Corp");
  });

  it("returns shortName equal to first word for unknown vendor", () => {
    const info = getVendorInfo("Acme Widget Corp");
    expect(info.shortName).toBe("Acme");
  });

  it("returns deterministic color for unknown vendor (same name produces same color)", () => {
    const first = getVendorInfo("SomeRandomVendor LLC");
    const second = getVendorInfo("SomeRandomVendor LLC");
    expect(first.color).toBe(second.color);
  });

  it('always returns textColor "#ffffff" for unknown vendors', () => {
    expect(getVendorInfo("Acme Widget Corp").textColor).toBe("#ffffff");
    expect(getVendorInfo("Xylophone").textColor).toBe("#ffffff");
    expect(getVendorInfo("Foo Bar Baz Qux").textColor).toBe("#ffffff");
  });
});

describe("VENDOR_CONFIG", () => {
  it("has at least 20 entries", () => {
    expect(Object.keys(VENDOR_CONFIG).length).toBeGreaterThanOrEqual(20);
  });
});

describe("getVendorInfo robustness", () => {
  it("never throws for various inputs including edge-case strings", () => {
    const inputs = ["", " ", "A", "  spaces  ", "123 Numeric Vendor"];
    for (const input of inputs) {
      expect(() => getVendorInfo(input)).not.toThrow();
    }
  });
});
