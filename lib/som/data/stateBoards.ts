// ─── SOM Mock Data — State Board of Pharmacy responses ───────────────────────
//
// Stand-in for live state board lookups. Per Rajesh (transcript 3, t=12:50–
// 14:00) the NC Board of Pharmacy site allows search by name; CA board lets
// you search by name too. Both return permit number, status, expiry.
//
// Shape mimics what those public sites surface. For demo realism we add a
// small synthetic latency at the action layer (lib/som/actions/queryStateBoard.ts).

import type { LicenseStatus } from "./pharmacies";

export interface StateBoardResponse {
  /** Which state board responded. */
  source: "NC Board of Pharmacy" | "CA Board of Pharmacy";
  /** Direct hit on the queried name; null if no record. */
  record: {
    legalName: string;
    permitNumber: string;
    status: LicenseStatus;
    expiry: string;             // YYYY-MM-DD
    licensee: string;
    address: string;
  } | null;
  /** Public URL for the board search the demo claims to have hit. */
  searchUrl: string;
}

// Indexed by pharmacy.id from pharmacies.ts so the action can look it up
// after resolving the order's pharmacy.
export const stateBoardResponsesByPharmacyId: Record<string, StateBoardResponse> = {
  "PH-001": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Joseph's Pharmacy",
      permitNumber: "NC-PH-018472",
      status: "active",
      expiry: "2027-06-30",
      licensee: "Joseph Anand, RPh",
      address: "1842 Hillsborough Rd, Durham, NC 27705",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-002": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Carolina Health Pharmacy",
      permitNumber: "NC-PH-022914",
      status: "active",
      expiry: "2026-12-31",
      licensee: "Sarah Chen, PharmD",
      address: "417 Glenwood Ave, Raleigh, NC 27603",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-003": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Tarheel Drugs",
      permitNumber: "NC-PH-009847",
      status: "expired",
      expiry: "2025-08-15",
      licensee: "Marcus Holloway, RPh",
      address: "2200 South Blvd, Charlotte, NC 28203",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-004": {
    source: "CA Board of Pharmacy",
    record: {
      legalName: "Bayside Community Pharmacy",
      permitNumber: "CA-PHY-67241",
      status: "active",
      expiry: "2028-03-31",
      licensee: "Priya Ramaswamy, PharmD",
      address: "3245 Adams Ave, San Diego, CA 92116",
    },
    searchUrl: "https://search.dca.ca.gov/?BD=10",
  },
  "PH-005": {
    source: "CA Board of Pharmacy",
    record: {
      legalName: "Westside Pharmacy",
      permitNumber: "CA-PHY-19384",
      status: "suspended",
      expiry: "2026-09-30",
      licensee: "(under board investigation)",
      address: "8829 Pico Blvd, Los Angeles, CA 90035",
    },
    searchUrl: "https://search.dca.ca.gov/?BD=10",
  },
  "PH-006": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Durham Family Drugs",
      permitNumber: "NC-PH-021337",
      status: "active",
      expiry: "2027-11-30",
      licensee: "Aisha Patel, PharmD",
      address: "3815 Guess Rd, Durham, NC 27705",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-007": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Glenwood Apothecary",
      permitNumber: "NC-PH-024855",
      status: "active",
      expiry: "2028-01-31",
      licensee: "Daniel Okafor, RPh",
      address: "2100 Hillsborough St, Raleigh, NC 27607",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-008": {
    // Total shell — no record on the board
    source: "NC Board of Pharmacy",
    record: null,
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-009": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Triangle Med Pharmacy",
      permitNumber: "NC-PH-028102",
      status: "active",
      expiry: "2027-05-31",
      licensee: "Hugo Martinez, PharmD",
      address: "4400 Six Forks Rd, Raleigh, NC 27609",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-010": {
    source: "CA Board of Pharmacy",
    record: {
      legalName: "Capitol Health Pharmacy",
      permitNumber: "CA-PHY-71244",
      status: "active",
      expiry: "2027-08-31",
      licensee: "Linh Tran, PharmD",
      address: "1610 J St, Sacramento, CA 95814",
    },
    searchUrl: "https://search.dca.ca.gov/?BD=10",
  },
  "PH-011": {
    source: "CA Board of Pharmacy",
    record: {
      legalName: "La Jolla Coastal Drug",
      permitNumber: "CA-PHY-80115",
      status: "active",
      expiry: "2028-09-30",
      licensee: "Emily Watanabe, RPh",
      address: "7825 Fay Ave, San Diego, CA 92037",
    },
    searchUrl: "https://search.dca.ca.gov/?BD=10",
  },
  "PH-012": {
    source: "CA Board of Pharmacy",
    record: {
      legalName: "Sunset Strip Pharmacy",
      permitNumber: "CA-PHY-58921",
      status: "expired",
      expiry: "2024-12-31",
      licensee: "Robert Kim, RPh",
      address: "8500 Sunset Blvd, Los Angeles, CA 90069",
    },
    searchUrl: "https://search.dca.ca.gov/?BD=10",
  },
  "PH-013": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Catawba Valley Drugs",
      permitNumber: "NC-PH-014488",
      status: "inactive",
      expiry: "2026-04-30",
      licensee: "(licensee retired)",
      address: "725 Tryon St, Charlotte, NC 28202",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-014": {
    source: "CA Board of Pharmacy",
    record: {
      legalName: "Mission Bay Compounding",
      permitNumber: "CA-PHY-66719",
      status: "active",
      expiry: "2027-04-30",
      licensee: "Carlos Rivera, PharmD",
      address: "1855 Garnet Ave, San Diego, CA 92109",
    },
    searchUrl: "https://search.dca.ca.gov/?BD=10",
  },
  "PH-015": {
    source: "CA Board of Pharmacy",
    record: {
      legalName: "Pacific Discount Drugs",
      permitNumber: "CA-PHY-99021",
      status: "active",
      expiry: "2026-12-31",
      licensee: "(LLC — single member)",
      address: "1200 W Olympic Blvd, Los Angeles, CA 90015",
    },
    searchUrl: "https://search.dca.ca.gov/?BD=10",
  },
  "PH-016": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Ninth Street Apothecary",
      permitNumber: "NC-PH-027330",
      status: "active",
      expiry: "2027-09-30",
      licensee: "Mei-Lin Zhao, RPh",
      address: "729 Ninth St, Durham, NC 27705",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
};
