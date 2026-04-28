// ─── SOM Mock Data — Pharmacy Address Database ────────────────────────────────
//
// Stand-in for the real ARCOS / DEA pharmacy registry, which is not publicly
// queryable. Per plan §4.1 + Rajesh's transcript-3 "Joseph's Pharmacy, Durham"
// example. Coverage: NC + CA. Mix of legit + suspicious entries.
//
// IMPORTANT: All data is fictitious. NPI / DEA / permit numbers do NOT
// correspond to real pharmacies — generated for demo only.

export type LicenseStatus = "active" | "inactive" | "expired" | "suspended" | "not_found";

export interface PharmacyRecord {
  id: string;
  name: string;
  dba?: string;
  /** 10-digit National Provider Identifier. May be missing for shell entities. */
  npi?: string;
  /** DEA registration. Only relevant for controlled-substance ordering. */
  deaNumber?: string;
  /** State Board of Pharmacy permit. */
  permitNumber?: string;
  state: "NC" | "CA";
  city: string;
  address: string;
  zip: string;
  /** Coordinates the pharmacy declared on file (what the order claims). */
  declaredLat: number;
  declaredLng: number;
  /** Coordinates the address actually geocodes to (mock Google Maps result). */
  geocodedLat: number;
  geocodedLng: number;
  licenseStatus: LicenseStatus;
  licenseExpiry: string;        // YYYY-MM-DD
  owner: string;
  /** Used by the outliers task — matches an entry in cityDemographics. */
  demographicsCity: string;
}

export const pharmacies: PharmacyRecord[] = [
  // ── Canonical demo pharmacy (Rajesh's example, transcript 3, t=14:20) ──────
  {
    id: "PH-001",
    name: "Joseph's Pharmacy",
    dba: "Joseph's Family Pharmacy",
    npi: "1538291647",
    deaNumber: "BJ4521987",
    permitNumber: "NC-PH-018472",
    state: "NC",
    city: "Durham",
    address: "1842 Hillsborough Rd",
    zip: "27705",
    declaredLat: 35.9940,
    declaredLng: -78.9382,
    geocodedLat: 35.9940,    // matches → address verified
    geocodedLng: -78.9382,
    licenseStatus: "active",
    licenseExpiry: "2027-06-30",
    owner: "Joseph Anand, RPh",
    demographicsCity: "Durham, NC",
  },

  // ── NC: address mismatch case (declared coords vs actual geocode diverge) ──
  {
    id: "PH-002",
    name: "Carolina Health Pharmacy",
    npi: "1729384651",
    deaNumber: "BC8829471",
    permitNumber: "NC-PH-022914",
    state: "NC",
    city: "Raleigh",
    address: "417 Glenwood Ave",
    zip: "27603",
    declaredLat: 35.7886,    // declared in Raleigh
    declaredLng: -78.6447,
    geocodedLat: 35.2271,    // actually geocodes to Charlotte (red flag)
    geocodedLng: -80.8431,
    licenseStatus: "active",
    licenseExpiry: "2026-12-31",
    owner: "Sarah Chen, PharmD",
    demographicsCity: "Raleigh, NC",
  },

  // ── NC: expired license ──────────────────────────────────────────────────
  {
    id: "PH-003",
    name: "Tarheel Drugs",
    npi: "1840573926",
    deaNumber: "BT1198372",
    permitNumber: "NC-PH-009847",
    state: "NC",
    city: "Charlotte",
    address: "2200 South Blvd",
    zip: "28203",
    declaredLat: 35.2092,
    declaredLng: -80.8597,
    geocodedLat: 35.2092,
    geocodedLng: -80.8597,
    licenseStatus: "expired",
    licenseExpiry: "2025-08-15",  // already expired
    owner: "Marcus Holloway, RPh",
    demographicsCity: "Charlotte, NC",
  },

  // ── CA: clean baseline pharmacy ──────────────────────────────────────────
  {
    id: "PH-004",
    name: "Bayside Community Pharmacy",
    npi: "1623847519",
    deaNumber: "BB7745812",
    permitNumber: "CA-PHY-67241",
    state: "CA",
    city: "San Diego",
    address: "3245 Adams Ave",
    zip: "92116",
    declaredLat: 32.7649,
    declaredLng: -117.1267,
    geocodedLat: 32.7649,
    geocodedLng: -117.1267,
    licenseStatus: "active",
    licenseExpiry: "2028-03-31",
    owner: "Priya Ramaswamy, PharmD",
    demographicsCity: "San Diego, CA",
  },

  // ── CA: suspended license (manual review required) ───────────────────────
  {
    id: "PH-005",
    name: "Westside Pharmacy",
    permitNumber: "CA-PHY-19384",
    state: "CA",
    city: "Los Angeles",
    address: "8829 Pico Blvd",
    zip: "90035",
    declaredLat: 34.0512,
    declaredLng: -118.3856,
    geocodedLat: 34.0512,
    geocodedLng: -118.3856,
    licenseStatus: "suspended",
    licenseExpiry: "2026-09-30",
    owner: "(under board investigation)",
    demographicsCity: "Los Angeles, CA",
    // No NPI / DEA on file — additional red flag
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function findPharmacyById(id: string): PharmacyRecord | undefined {
  return pharmacies.find((p) => p.id === id);
}

export function findPharmacyByNameAndState(
  name: string,
  state: string,
): PharmacyRecord | undefined {
  const target = name.trim().toLowerCase();
  return pharmacies.find(
    (p) =>
      p.state === state &&
      (p.name.toLowerCase() === target || p.dba?.toLowerCase() === target),
  );
}
