// ─── SOM Mock Data — Per-Pharmacy Controlled-Substance Quotas ────────────────
//
// Synthetic 30-day rolling cap on each pharmacy's controlled-substance
// purchases. Used by the Pattern Outlier task's "Controlled Quota" sub-check
// (per Rajesh, pharmacy_usecase_transcript.txt t=01:08): "this is a
// controlled substance and again that has some kind of quota and maybe
// you're ordering too much of the controlled substance".
//
// Real implementation: distributors set per-pharmacy quotas based on the
// pharmacy's prior 90-day legitimate-use pattern, DEA reporting thresholds,
// and ARCOS-mandated suspicious-order monitoring rules. Quotas updated
// monthly. Here, we hand-craft quota / used pairs that exercise each
// outcome (well below, near, over).

export interface PharmacyQuota {
  pharmacyId: string;
  /** Total controlled-substance units the pharmacy is permitted to receive
   *  this 30-day window. */
  monthlyQuotaUnits: number;
  /** Units already received this window before the pending order. */
  usedThisWindow: number;
}

export const controlledQuotas: PharmacyQuota[] = [
  // Real Active pharmacies — quotas proportional to volume + buffer
  { pharmacyId: "PH-001", monthlyQuotaUnits: 1_200, usedThisWindow: 740 },     // Gurleys Durham
  { pharmacyId: "PH-002", monthlyQuotaUnits: 1_400, usedThisWindow: 920 },     // Apex Raleigh
  { pharmacyId: "PH-004", monthlyQuotaUnits: 1_800, usedThisWindow: 1_100 },   // Sixth Ave SD
  { pharmacyId: "PH-006", monthlyQuotaUnits: 4_000, usedThisWindow: 2_840 },   // Costco Durham
  { pharmacyId: "PH-007", monthlyQuotaUnits: 1_300, usedThisWindow: 825 },     // Advance Community
  { pharmacyId: "PH-009", monthlyQuotaUnits: 900,   usedThisWindow: 615 },     // Alvarez Raleigh
  { pharmacyId: "PH-010", monthlyQuotaUnits: 1_600, usedThisWindow: 1_080 },   // Anderson Sacramento
  { pharmacyId: "PH-011", monthlyQuotaUnits: 700,   usedThisWindow: 480 },     // Allermed SD
  { pharmacyId: "PH-014", monthlyQuotaUnits: 1_000, usedThisWindow: 720 },     // Alta View SD
  { pharmacyId: "PH-015", monthlyQuotaUnits: 600,   usedThisWindow: 480 },     // Alvarado SD (near cap → flag risk)
  { pharmacyId: "PH-016", monthlyQuotaUnits: 800,   usedThisWindow: 510 },     // Clinic Pharmacy Durham
  { pharmacyId: "PH-017", monthlyQuotaUnits: 1_350, usedThisWindow: 870 },     // Apotheco Durham
  { pharmacyId: "PH-018", monthlyQuotaUnits: 1_200, usedThisWindow: 760 },     // A Plus Charlotte
  { pharmacyId: "PH-019", monthlyQuotaUnits: 2_100, usedThisWindow: 1_440 },   // 321 LA
  { pharmacyId: "PH-020", monthlyQuotaUnits: 1_500, usedThisWindow: 1_010 },   // B & B SF

  // Edge-case pharmacies
  { pharmacyId: "PH-003", monthlyQuotaUnits: 500,   usedThisWindow: 410 },     // Tarheel (expired) — close to cap
  { pharmacyId: "PH-005", monthlyQuotaUnits: 200,   usedThisWindow: 180 },     // Westside (suspended) — at cap
  { pharmacyId: "PH-008", monthlyQuotaUnits: 0,     usedThisWindow: 0 },       // Queen City shell — no quota
  { pharmacyId: "PH-012", monthlyQuotaUnits: 600,   usedThisWindow: 540 },     // Sunset Strip (expired) — near cap
  { pharmacyId: "PH-013", monthlyQuotaUnits: 0,     usedThisWindow: 0 },       // Catawba Valley (inactive) — quota frozen
];

export function findQuotaByPharmacyId(id: string): PharmacyQuota | undefined {
  return controlledQuotas.find((q) => q.pharmacyId === id);
}
