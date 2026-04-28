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
  // Note: NPI 1174077168 is a real, active NPI Registry record (Walgreens NC,
  // org-type pharmacy). Used so the live NPI Registry call in the License
  // Verification card actually resolves to "Active" during the demo. The
  // *display* identity of the pharmacy stays as Joseph's — only the NPI is
  // borrowed from a real record so the live-API wow-factor lands.
  {
    id: "PH-001",
    name: "Joseph's Pharmacy",
    dba: "Joseph's Family Pharmacy",
    npi: "1174077168",
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

  // ── NC: clean Walgreens-style chain (Durham) ─────────────────────────────
  {
    id: "PH-006",
    name: "Durham Family Drugs",
    npi: "1437291085",
    deaNumber: "FD2284716",
    permitNumber: "NC-PH-021337",
    state: "NC",
    city: "Durham",
    address: "3815 Guess Rd",
    zip: "27705",
    declaredLat: 36.0312,
    declaredLng: -78.9028,
    geocodedLat: 36.0312,
    geocodedLng: -78.9028,
    licenseStatus: "active",
    licenseExpiry: "2027-11-30",
    owner: "Aisha Patel, PharmD",
    demographicsCity: "Durham, NC",
  },

  // ── NC: clean Raleigh independent ────────────────────────────────────────
  {
    id: "PH-007",
    name: "Glenwood Apothecary",
    npi: "1592764803",
    deaNumber: "FG7728495",
    permitNumber: "NC-PH-024855",
    state: "NC",
    city: "Raleigh",
    address: "2100 Hillsborough St",
    zip: "27607",
    declaredLat: 35.7910,
    declaredLng: -78.6620,
    geocodedLat: 35.7910,
    geocodedLng: -78.6620,
    licenseStatus: "active",
    licenseExpiry: "2028-01-31",
    owner: "Daniel Okafor, RPh",
    demographicsCity: "Raleigh, NC",
  },

  // ── NC: not_found case (fake pharmacy attempting to register) ────────────
  {
    id: "PH-008",
    name: "Eastpoint RX Solutions",
    state: "NC",
    city: "Charlotte",
    address: "9 Industrial Park Way",
    zip: "28269",
    declaredLat: 35.3553,
    declaredLng: -80.7873,
    geocodedLat: 35.3553,
    geocodedLng: -80.7873,
    licenseStatus: "not_found",
    licenseExpiry: "—",
    owner: "(no licensee on file)",
    demographicsCity: "Charlotte, NC",
    // No permit, no NPI, no DEA — total shell
  },

  // ── NC: borderline-warn address discrepancy (1.5 km off) ─────────────────
  {
    id: "PH-009",
    name: "Triangle Med Pharmacy",
    npi: "1683914275",
    deaNumber: "FT8854371",
    permitNumber: "NC-PH-028102",
    state: "NC",
    city: "Raleigh",
    address: "4400 Six Forks Rd",
    zip: "27609",
    declaredLat: 35.8401,
    declaredLng: -78.6421,
    geocodedLat: 35.8268,    // ~1.5 km south — recent move?
    geocodedLng: -78.6398,
    licenseStatus: "active",
    licenseExpiry: "2027-05-31",
    owner: "Hugo Martinez, PharmD",
    demographicsCity: "Raleigh, NC",
  },

  // ── CA: clean Sacramento independent ─────────────────────────────────────
  {
    id: "PH-010",
    name: "Capitol Health Pharmacy",
    npi: "1773829461",
    deaNumber: "FC4421799",
    permitNumber: "CA-PHY-71244",
    state: "CA",
    city: "Sacramento",
    address: "1610 J St",
    zip: "95814",
    declaredLat: 38.5790,
    declaredLng: -121.4900,
    geocodedLat: 38.5790,
    geocodedLng: -121.4900,
    licenseStatus: "active",
    licenseExpiry: "2027-08-31",
    owner: "Linh Tran, PharmD",
    demographicsCity: "Sacramento, CA",
  },

  // ── CA: clean San Diego beachside ────────────────────────────────────────
  {
    id: "PH-011",
    name: "La Jolla Coastal Drug",
    npi: "1839275106",
    deaNumber: "FL3392845",
    permitNumber: "CA-PHY-80115",
    state: "CA",
    city: "San Diego",
    address: "7825 Fay Ave",
    zip: "92037",
    declaredLat: 32.8454,
    declaredLng: -117.2729,
    geocodedLat: 32.8454,
    geocodedLng: -117.2729,
    licenseStatus: "active",
    licenseExpiry: "2028-09-30",
    owner: "Emily Watanabe, RPh",
    demographicsCity: "San Diego, CA",
  },

  // ── CA: expired license (LA, smaller chain) ──────────────────────────────
  {
    id: "PH-012",
    name: "Sunset Strip Pharmacy",
    npi: "1928374550",
    deaNumber: "FS6671198",
    permitNumber: "CA-PHY-58921",
    state: "CA",
    city: "Los Angeles",
    address: "8500 Sunset Blvd",
    zip: "90069",
    declaredLat: 34.0945,
    declaredLng: -118.3787,
    geocodedLat: 34.0945,
    geocodedLng: -118.3787,
    licenseStatus: "expired",
    licenseExpiry: "2024-12-31",
    owner: "Robert Kim, RPh",
    demographicsCity: "Los Angeles, CA",
  },

  // ── NC: inactive license (voluntary closure) ─────────────────────────────
  {
    id: "PH-013",
    name: "Catawba Valley Drugs",
    npi: "1294857361",
    permitNumber: "NC-PH-014488",
    state: "NC",
    city: "Charlotte",
    address: "725 Tryon St",
    zip: "28202",
    declaredLat: 35.2271,
    declaredLng: -80.8431,
    geocodedLat: 35.2271,
    geocodedLng: -80.8431,
    licenseStatus: "inactive",
    licenseExpiry: "2026-04-30",
    owner: "(licensee retired)",
    demographicsCity: "Charlotte, NC",
  },

  // ── CA: borderline-warn small-distance discrepancy ───────────────────────
  {
    id: "PH-014",
    name: "Mission Bay Compounding",
    npi: "1456729038",
    deaNumber: "FM9923847",
    permitNumber: "CA-PHY-66719",
    state: "CA",
    city: "San Diego",
    address: "1855 Garnet Ave",
    zip: "92109",
    declaredLat: 32.7944,
    declaredLng: -117.2399,
    geocodedLat: 32.7821,
    geocodedLng: -117.2412,
    licenseStatus: "active",
    licenseExpiry: "2027-04-30",
    owner: "Carlos Rivera, PharmD",
    demographicsCity: "San Diego, CA",
  },

  // ── CA: deeply suspicious — large distance + fresh permit + no NPI ──────
  {
    id: "PH-015",
    name: "Pacific Discount Drugs",
    deaNumber: "FP5512873",
    permitNumber: "CA-PHY-99021",   // suspiciously round number
    state: "CA",
    city: "Los Angeles",
    address: "1200 W Olympic Blvd",
    zip: "90015",
    declaredLat: 34.0420,
    declaredLng: -118.2640,
    geocodedLat: 33.9170,        // resolves to South Bay (~14 km off)
    geocodedLng: -118.4080,
    licenseStatus: "active",
    licenseExpiry: "2026-12-31",
    owner: "(LLC — single member)",
    demographicsCity: "Los Angeles, CA",
    // Has DEA + permit but no NPI → controlled-substance buy-side red flag
  },

  // ── NC: clean small-volume independent (Durham) ──────────────────────────
  {
    id: "PH-016",
    name: "Ninth Street Apothecary",
    npi: "1517482903",
    deaNumber: "FN3845721",
    permitNumber: "NC-PH-027330",
    state: "NC",
    city: "Durham",
    address: "729 Ninth St",
    zip: "27705",
    declaredLat: 36.0095,
    declaredLng: -78.9211,
    geocodedLat: 36.0095,
    geocodedLng: -78.9211,
    licenseStatus: "active",
    licenseExpiry: "2027-09-30",
    owner: "Mei-Lin Zhao, RPh",
    demographicsCity: "Durham, NC",
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
