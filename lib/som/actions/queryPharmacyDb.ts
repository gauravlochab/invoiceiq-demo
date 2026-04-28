// ─── Action: Query Pharmacy Address Database ─────────────────────────────────
//
// Stand-in for the real ARCOS / DEA registry (per plan §4.1, "ARCOS-style mock
// DB" — genericized to "Pharmacy Address Database" since real ARCOS is not
// publicly queryable). Returns the on-file record for a pharmacy or null.

import { findPharmacyById, type PharmacyRecord } from "../data/pharmacies";

export interface PharmacyDbResponse {
  source: "Pharmacy Address Database";
  found: boolean;
  record: PharmacyRecord | null;
  /** Mock latency in ms — UI can render "Querying database…". */
  latencyMs: number;
}

export async function queryPharmacyDb(pharmacyId: string): Promise<PharmacyDbResponse> {
  // Simulate a DB roundtrip so the UI can show its "running" state.
  const latencyMs = 600 + Math.floor(Math.random() * 400);
  await new Promise((r) => setTimeout(r, latencyMs));

  const record = findPharmacyById(pharmacyId) ?? null;
  return {
    source: "Pharmacy Address Database",
    found: record !== null,
    record,
    latencyMs,
  };
}
