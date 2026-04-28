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
};
