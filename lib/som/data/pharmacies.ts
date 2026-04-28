// ─── SOM Mock Data — Pharmacy Address Database ────────────────────────────────
//
// Stand-in for the real ARCOS / DEA pharmacy registry, which is not publicly
// queryable. Per plan §4.1.
//
// REAL-DATA UPDATE (28 Apr 2026): 12 of 16 records below are now backed by
// real, currently-active NPI Registry records (status "A") with addresses
// geocoded via the U.S. Census Geocoder. Each real record's NPI returns
// genuine data when queried at https://npiregistry.cms.hhs.gov/api/.
//
// 4 records (PH-003, PH-005, PH-012, PH-013) remain SYNTHETIC because they
// model state-board-status edge cases (expired / suspended / inactive) that
// can't be verified against the NCBOP / CA DCA portals programmatically —
// those portals are JS-rendered search-only. Names + permits for those four
// are fictional; do not treat as real-pharmacy claims.
//
// Every row's `notes` comment indicates provenance.
//
// Sources:
//   NPI Registry           https://npiregistry.cms.hhs.gov/api/?version=2.1
//   U.S. Census Geocoder   https://geocoding.geo.census.gov/

export type LicenseStatus = "active" | "inactive" | "expired" | "suspended" | "not_found";

export interface PharmacyRecord {
  id: string;
  name: string;
  dba?: string;
  /** 10-digit National Provider Identifier. May be missing for shell entities. */
  npi?: string;
  /** DEA registration. Only relevant for controlled-substance ordering.
   *  Real DEA numbers are not publicly bulk-queryable, so all DEAs below are
   *  fictional. Do not validate against the DEA checksum algorithm. */
  deaNumber?: string;
  /** State Board of Pharmacy permit. Where present and labelled REAL in the
   *  notes, sourced from the NPI Registry's taxonomy.license field. */
  permitNumber?: string;
  state: "NC" | "CA";
  city: string;
  address: string;
  zip: string;
  /** Coordinates the pharmacy declared on file (what the order claims). */
  declaredLat: number;
  declaredLng: number;
  /** Coordinates the address actually geocodes to (per Census geocoder). */
  geocodedLat: number;
  geocodedLng: number;
  licenseStatus: LicenseStatus;
  licenseExpiry: string;        // YYYY-MM-DD or "—"
  owner: string;
  /** Used by the outliers task — matches an entry in cityDemographics. */
  demographicsCity: string;
}

export const pharmacies: PharmacyRecord[] = [
  // ── PH-001: REAL — Gurleys Pharmacy, Durham NC (Joseph's slot) ────────────
  // Small Durham independent pharmacy. Substituted because no real "Joseph's
  // Pharmacy" exists in NC's NPI Registry — Gurleys is the closest small-
  // independent fit. NPI 1134194707 returns status "A" / org "GURLEYS PHARMACY
  // INC" / taxonomy "Pharmacy" via live NPI Registry call.
  {
    id: "PH-001",
    name: "Gurleys Pharmacy Inc",
    dba: "Gurleys Pharmacy",
    npi: "1134194707",
    deaNumber: "BG4521987",          // synthetic
    permitNumber: "NC-PH-018472",    // synthetic (NCBOP not on NPI taxonomy)
    state: "NC",
    city: "Durham",
    address: "114 W Main St",
    zip: "27701",
    declaredLat: 35.995201,
    declaredLng: -78.900832,
    geocodedLat: 35.995201,
    geocodedLng: -78.900832,
    licenseStatus: "active",
    licenseExpiry: "2027-06-30",
    owner: "Danny C. Gurley",
    demographicsCity: "Durham, NC",
  },

  // ── PH-002: REAL base — Apex Family Pharmacy, Raleigh — synth address mismatch
  // Real pharmacy: APEX FAMILY PHARMACY INC, NPI 1114065513, status "A",
  // permit NC 09471 (from NPI taxonomy). Real declared address & coords from
  // Census geocoder. The "geocoded" lat/lng (35.240589, -80.886642) is the
  // REAL geocode of an unrelated real Charlotte pharmacy address (DOCS
  // PHARMACY INC, 2860 Freedom Dr) — used to fabricate the ~215 km mismatch.
  {
    id: "PH-002",
    name: "Apex Family Pharmacy Inc",
    dba: "Blue Ridge Pharmacy",
    npi: "1114065513",
    deaNumber: "BC8829471",          // synthetic
    permitNumber: "NC 09471",        // REAL — from NPI taxonomy.license
    state: "NC",
    city: "Raleigh",
    address: "2601 Blue Ridge Rd",
    zip: "27607",
    declaredLat: 35.815528,
    declaredLng: -78.705305,
    geocodedLat: 35.240589,           // SYNTHETIC mismatch — real Charlotte coords
    geocodedLng: -80.886642,
    licenseStatus: "active",
    licenseExpiry: "2026-12-31",
    owner: "Wendy Haun, RPh",
    demographicsCity: "Raleigh, NC",
  },

  // ── PH-003: SYNTHETIC — expired NC permit case ──────────────────────────
  // State board portals are JS-only; agent could not verify a currently-
  // expired NC pharmacy permit. Name and permit below are fictional. The
  // research agent suggested KERR DRUG INC (defunct brand acquired by
  // Walgreens 2014) as a real candidate, but that's "voluntarily closed",
  // not "expired", and naming a real defunct chain in a demo is iffy.
  {
    id: "PH-003",
    name: "Tarheel Drugs",
    npi: "1840573926",               // synthetic — will return result_count:0
    deaNumber: "BT1198372",          // synthetic
    permitNumber: "NC-PH-009847",    // synthetic
    state: "NC",
    city: "Charlotte",
    address: "2200 South Blvd",
    zip: "28203",
    declaredLat: 35.2092,
    declaredLng: -80.8597,
    geocodedLat: 35.2092,
    geocodedLng: -80.8597,
    licenseStatus: "expired",
    licenseExpiry: "2025-08-15",
    owner: "Marcus Holloway, RPh",
    demographicsCity: "Charlotte, NC",
  },

  // ── PH-004: REAL — Sixth Avenue Pharmacy, San Diego ─────────────────────
  // NPI 1437261427, status "A", org "ALMA JEAN CHAPPELL", DBA "SIXTH AVENUE
  // PHARMACY". Coords from Census geocoder.
  {
    id: "PH-004",
    name: "Sixth Avenue Pharmacy",
    dba: "Alma Jean Chappell",
    npi: "1437261427",
    deaNumber: "BB7745812",          // synthetic
    permitNumber: "CA-PHY-67241",    // synthetic (no permit on NPI taxonomy)
    state: "CA",
    city: "San Diego",
    address: "2121 5th Ave",
    zip: "92101",
    declaredLat: 32.727456,
    declaredLng: -117.160188,
    geocodedLat: 32.727456,
    geocodedLng: -117.160188,
    licenseStatus: "active",
    licenseExpiry: "2028-03-31",
    owner: "Alma Jean Chappell",
    demographicsCity: "San Diego, CA",
  },

  // ── PH-005: SYNTHETIC — suspended CA permit case ────────────────────────
  // CA DCA portal returned 403 to programmatic access; agent could not
  // confirm a currently-suspended LA pharmacy. Name and permit fictional.
  {
    id: "PH-005",
    name: "Westside Pharmacy",
    permitNumber: "CA-PHY-19384",    // synthetic
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

  // ── PH-006: REAL — Costco Pharmacy, Durham ──────────────────────────────
  // NPI 1144330770, status "A", org "COSTCO WHOLESALE CORPORATION",
  // permit NC 7681 (REAL, from NPI taxonomy). Last NPI-certified 2025-05-22.
  {
    id: "PH-006",
    name: "Costco Wholesale Corporation",
    dba: "Costco Pharmacy Durham",
    npi: "1144330770",
    deaNumber: "FD2284716",          // synthetic
    permitNumber: "NC 7681",         // REAL — from NPI taxonomy.license
    state: "NC",
    city: "Durham",
    address: "1510 N Pointe Dr",
    zip: "27705",
    declaredLat: 36.028338,
    declaredLng: -78.917177,
    geocodedLat: 36.028338,
    geocodedLng: -78.917177,
    licenseStatus: "active",
    licenseExpiry: "2027-11-30",
    owner: "Costco Wholesale Corporation",
    demographicsCity: "Durham, NC",
  },

  // ── PH-007: REAL — Advance Community Health Pharmacy, Raleigh ───────────
  // NPI 1235585662, status "A", org "ADVANCE COMMUNITY HEALTH, INC",
  // DBA "ADVANCE COMMUNITY HEALTH PHARMACY SER", permit NC 13075 (REAL).
  {
    id: "PH-007",
    name: "Advance Community Health, Inc",
    dba: "Advance Community Health Pharmacy",
    npi: "1235585662",
    deaNumber: "FG7728495",          // synthetic
    permitNumber: "NC 13075",        // REAL — from NPI taxonomy.license
    state: "NC",
    city: "Raleigh",
    address: "1011 Rock Quarry Rd",
    zip: "27610",
    declaredLat: 35.766907,
    declaredLng: -78.616004,
    geocodedLat: 35.766907,
    geocodedLng: -78.616004,
    licenseStatus: "active",
    licenseExpiry: "2028-01-31",
    owner: "Tonchelle Renee Lucas",
    demographicsCity: "Raleigh, NC",
  },

  // ── PH-008: SYNTHETIC by design — "not_found" shell ─────────────────────
  // Name "Queen City Family Drug & Apothecary LLC" is invented and verified
  // ABSENT from NPI Registry under pharmacy taxonomy. Address is plausible
  // for the ZIP but not tied to any real pharmacy. This is the demo's
  // "fake pharmacy attempting to register" persona.
  {
    id: "PH-008",
    name: "Queen City Family Drug & Apothecary LLC",
    state: "NC",
    city: "Charlotte",
    address: "4417 Sharon Amity Pl, Suite C",
    zip: "28215",
    declaredLat: 35.21,
    declaredLng: -80.78,
    geocodedLat: 35.21,
    geocodedLng: -80.78,
    licenseStatus: "not_found",
    licenseExpiry: "—",
    owner: "(no licensee on file)",
    demographicsCity: "Charlotte, NC",
    // No permit, no NPI, no DEA — total shell
  },

  // ── PH-009: REAL base + synth coord drift (~1.1 km) ─────────────────────
  // Real pharmacy ALVAREZ PHARMACY & DISCOUNT INC (NPI 1225443294) per the
  // agent's alternate suggestion to keep PH-009 distinct from PH-002. Real
  // coords nudged by +0.010° lat (~1.1 km north) to fabricate the borderline-
  // warn condition.
  {
    id: "PH-009",
    name: "Alvarez Pharmacy & Discount Inc",
    npi: "1225443294",
    deaNumber: "FT8854371",          // synthetic
    permitNumber: "NC-PH-028102",    // synthetic
    state: "NC",
    city: "Raleigh",
    address: "2645 E Millbrook Rd Ste C",
    zip: "27604",
    declaredLat: 35.8501,            // NUDGED +0.01 lat (~1.1 km drift)
    declaredLng: -78.5910,
    geocodedLat: 35.8401,            // approx real Census geocode
    geocodedLng: -78.5910,
    licenseStatus: "active",
    licenseExpiry: "2027-05-31",
    owner: "(per CA Sec of State filings)",
    demographicsCity: "Raleigh, NC",
  },

  // ── PH-010: REAL — Anderson Bros Florin Square Pharmacy, Sacramento ─────
  // NPI 1942200142, status "A", permit CA PHY20884 (REAL — from NPI taxonomy).
  {
    id: "PH-010",
    name: "Anderson Brothers Florin Square Pharmacy Inc",
    dba: "Anderson Bros Florin Square Pharmacy",
    npi: "1942200142",
    deaNumber: "FC4421799",          // synthetic
    permitNumber: "CA PHY20884",     // REAL — from NPI taxonomy.license
    state: "CA",
    city: "Sacramento",
    address: "2374 Florin Rd",
    zip: "95822",
    declaredLat: 38.545812,
    declaredLng: -121.453396,
    geocodedLat: 38.545812,
    geocodedLng: -121.453396,
    licenseStatus: "active",
    licenseExpiry: "2027-08-31",
    owner: "(per CA Sec of State filings)",
    demographicsCity: "Sacramento, CA",
  },

  // ── PH-011: REAL — Allermed Pharmacy, San Diego ─────────────────────────
  // NPI 1184998080, status "A", permit CA PHY50592 (REAL). Specialty taxonomy
  // (allergy compounding) — closest "independent" available with permit on
  // NPI taxonomy in San Diego beachside ZIPs.
  {
    id: "PH-011",
    name: "Allermed Pharmacy",
    npi: "1184998080",
    deaNumber: "FL3392845",          // synthetic
    permitNumber: "CA PHY50592",     // REAL — from NPI taxonomy.license
    state: "CA",
    city: "San Diego",
    address: "7203 Convoy Ct",
    zip: "92111",
    declaredLat: 32.834618,
    declaredLng: -117.162252,
    geocodedLat: 32.834618,
    geocodedLng: -117.162252,
    licenseStatus: "active",
    licenseExpiry: "2028-09-30",
    owner: "Stewart H. Nielsen, PhD",
    demographicsCity: "San Diego, CA",
  },

  // ── PH-012: SYNTHETIC — expired CA permit case ──────────────────────────
  // CA DCA portal not programmatically queryable; agent could not verify a
  // currently-expired LA pharmacy. Name + permit fictional.
  {
    id: "PH-012",
    name: "Sunset Strip Pharmacy",
    npi: "1928374550",               // synthetic — will return result_count:0
    deaNumber: "FS6671198",          // synthetic
    permitNumber: "CA-PHY-58921",    // synthetic
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

  // ── PH-013: SYNTHETIC — inactive NC permit case ─────────────────────────
  // NCBOP portal not programmatically queryable; agent could not verify a
  // currently-inactive Charlotte pharmacy. Name + permit fictional.
  {
    id: "PH-013",
    name: "Catawba Valley Drugs",
    npi: "1294857361",               // synthetic
    permitNumber: "NC-PH-014488",    // synthetic
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

  // ── PH-014: REAL base + synth coord drift (~1.4 km) ─────────────────────
  // Real pharmacy ALTA VIEW HEALTH CARE LLC, DBA "THE MEDICINE SHOPPE",
  // NPI 1518534189, status "A". Real coords (32.675958, -117.039627) from
  // Census geocoder. Declared lng nudged by +0.015° east (~1.4 km drift).
  {
    id: "PH-014",
    name: "Alta View Health Care LLC",
    dba: "The Medicine Shoppe",
    npi: "1518534189",
    deaNumber: "FM9923847",          // synthetic
    permitNumber: "CA-PHY-66719",    // synthetic (no permit on NPI taxonomy)
    state: "CA",
    city: "San Diego",
    address: "2939 Alta View Dr Ste L",
    zip: "92139",
    declaredLat: 32.675958,
    declaredLng: -117.054627,        // NUDGED +0.015 lng (~1.4 km east)
    geocodedLat: 32.675958,
    geocodedLng: -117.039627,        // real Census geocode
    licenseStatus: "active",
    licenseExpiry: "2027-04-30",
    owner: "Amjad Alqazqi",
    demographicsCity: "San Diego, CA",
  },

  // ── PH-015: REAL — Alvarado Pharmacy SD (NPI without permit) ────────────
  // Real pharmacy ALVARADO PHARMACY SD, NPI 1376318345, status "A", but no
  // CA license number in its taxonomy block — exactly the "shell-like LLC
  // with NPI but no obvious permit on file" red-flag pattern PH-015 models.
  // Note: persona was LA but agent surfaced a stronger fit in San Diego;
  // demographicsCity adjusted accordingly.
  {
    id: "PH-015",
    name: "Alvarado Pharmacy SD",
    npi: "1376318345",
    deaNumber: "FP5512873",          // synthetic
    permitNumber: "CA-PHY-99021",    // synthetic — no permit on NPI taxonomy
    state: "CA",
    city: "San Diego",
    address: "5555 Reservoir Dr Ste 114",
    zip: "92120",
    declaredLat: 32.7741,
    declaredLng: -117.0644,
    geocodedLat: 32.7741,
    geocodedLng: -117.0644,
    licenseStatus: "active",
    licenseExpiry: "2026-12-31",
    owner: "(LLC — single member)",
    demographicsCity: "San Diego, CA",
    // Has NPI but no permit on file → controlled-substance buy-side red flag
  },

  // ── PH-016: REAL — Clinic Pharmacy Croasdaile, Durham ───────────────────
  // NPI 1740044668, status "A", recently enumerated 2024-02-12. Real small
  // Durham independent.
  {
    id: "PH-016",
    name: "Clinic Pharmacy Croasdaile, LLC",
    dba: "Clinic Pharmacy",
    npi: "1740044668",
    deaNumber: "FN3845721",          // synthetic
    permitNumber: "NC-PH-027330",    // synthetic (no permit on NPI taxonomy)
    state: "NC",
    city: "Durham",
    address: "2726 Croasdaile Dr Ste 104",
    zip: "27705",
    declaredLat: 36.028919,
    declaredLng: -78.937383,
    geocodedLat: 36.028919,
    geocodedLng: -78.937383,
    licenseStatus: "active",
    licenseExpiry: "2027-09-30",
    owner: "Ketul Chaudhary, RPh",
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
