// ─── SOM Mock Data — State Board of Pharmacy responses ───────────────────────
//
// Stand-in for live state board lookups. NCBOP and CA DCA portals are
// JS-rendered and not programmatically queryable, so this dataset mocks
// the response shape. For records where NPI Registry taxonomy.license
// surfaces a real permit number, that real permit is used here too;
// otherwise permits are synthetic. License statuses (active/expired/
// suspended/inactive) are demo values.
//
// Maintained in lockstep with lib/som/data/pharmacies.ts. All names mirror
// what's there — see pharmacies.ts comments for which records are REAL vs
// SYNTHETIC.

import type { LicenseStatus } from "./pharmacies";

export interface StateBoardResponse {
  source: "NC Board of Pharmacy" | "CA Board of Pharmacy";
  record: {
    legalName: string;
    permitNumber: string;
    status: LicenseStatus;
    expiry: string;
    licensee: string;
    address: string;
  } | null;
  searchUrl: string;
}

export const stateBoardResponsesByPharmacyId: Record<string, StateBoardResponse> = {
  "PH-001": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Gurleys Pharmacy Inc",
      permitNumber: "NC-PH-018472",
      status: "active",
      expiry: "2027-06-30",
      licensee: "Danny C. Gurley",
      address: "114 W Main St, Durham, NC 27701",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-002": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Apex Family Pharmacy Inc",
      permitNumber: "NC 09471",
      status: "active",
      expiry: "2026-12-31",
      licensee: "Wendy Haun, RPh",
      address: "2601 Blue Ridge Rd, Raleigh, NC 27607",
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
      legalName: "Sixth Avenue Pharmacy",
      permitNumber: "CA-PHY-67241",
      status: "active",
      expiry: "2028-03-31",
      licensee: "Alma Jean Chappell",
      address: "2121 5th Ave, San Diego, CA 92101",
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
      legalName: "Costco Wholesale Corporation",
      permitNumber: "NC 7681",
      status: "active",
      expiry: "2027-11-30",
      licensee: "Costco Wholesale Corporation",
      address: "1510 N Pointe Dr, Durham, NC 27705",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-007": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Advance Community Health, Inc",
      permitNumber: "NC 13075",
      status: "active",
      expiry: "2028-01-31",
      licensee: "Tonchelle Renee Lucas",
      address: "1011 Rock Quarry Rd, Raleigh, NC 27610",
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
      legalName: "Alvarez Pharmacy & Discount Inc",
      permitNumber: "NC-PH-028102",
      status: "active",
      expiry: "2027-05-31",
      licensee: "(per CA Sec of State filings)",
      address: "2645 E Millbrook Rd Ste C, Raleigh, NC 27604",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
  "PH-010": {
    source: "CA Board of Pharmacy",
    record: {
      legalName: "Anderson Brothers Florin Square Pharmacy Inc",
      permitNumber: "CA PHY20884",
      status: "active",
      expiry: "2027-08-31",
      licensee: "(per CA Sec of State filings)",
      address: "2374 Florin Rd, Sacramento, CA 95822",
    },
    searchUrl: "https://search.dca.ca.gov/?BD=10",
  },
  "PH-011": {
    source: "CA Board of Pharmacy",
    record: {
      legalName: "Allermed Pharmacy",
      permitNumber: "CA PHY50592",
      status: "active",
      expiry: "2028-09-30",
      licensee: "Stewart H. Nielsen, PhD",
      address: "7203 Convoy Ct, San Diego, CA 92111",
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
      legalName: "Alta View Health Care LLC",
      permitNumber: "CA-PHY-66719",
      status: "active",
      expiry: "2027-04-30",
      licensee: "Amjad Alqazqi",
      address: "2939 Alta View Dr Ste L, San Diego, CA 92139",
    },
    searchUrl: "https://search.dca.ca.gov/?BD=10",
  },
  "PH-015": {
    source: "CA Board of Pharmacy",
    record: {
      legalName: "Alvarado Pharmacy SD",
      permitNumber: "CA-PHY-99021",
      status: "active",
      expiry: "2026-12-31",
      licensee: "(LLC — single member)",
      address: "5555 Reservoir Dr Ste 114, San Diego, CA 92120",
    },
    searchUrl: "https://search.dca.ca.gov/?BD=10",
  },
  "PH-016": {
    source: "NC Board of Pharmacy",
    record: {
      legalName: "Clinic Pharmacy Croasdaile, LLC",
      permitNumber: "NC-PH-027330",
      status: "active",
      expiry: "2027-09-30",
      licensee: "Ketul Chaudhary, RPh",
      address: "2726 Croasdaile Dr Ste 104, Durham, NC 27705",
    },
    searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
  },
};
