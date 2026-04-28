// ─── Action: Query State Board of Pharmacy ───────────────────────────────────
//
// Mock state-board lookup (NC + CA per plan §4.2). Real boards (ncbop.org,
// search.dca.ca.gov) allow lookup by name or permit number; we simulate the
// response shape and return whatever's keyed in stateBoardResponsesByPharmacyId.
//
// In transcript 3 (t=12:50) Rajesh demonstrated the NC site live — this is
// the visual analog for the demo.

import { stateBoardResponsesByPharmacyId, type StateBoardResponse } from "../data/stateBoards";

export async function queryStateBoard(pharmacyId: string): Promise<StateBoardResponse> {
  // State board sites are public but slow — simulate that.
  const latencyMs = 800 + Math.floor(Math.random() * 400);
  await new Promise((r) => setTimeout(r, latencyMs));

  return (
    stateBoardResponsesByPharmacyId[pharmacyId] ?? {
      source: "NC Board of Pharmacy",
      record: null,
      searchUrl: "https://portal.ncbop.org/verification?type=Pharmacy",
    }
  );
}
