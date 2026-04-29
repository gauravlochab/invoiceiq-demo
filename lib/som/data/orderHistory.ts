// ─── SOM Mock Data — Per-Pharmacy Order History ──────────────────────────────
//
// Synthetic 30-day rolling history of controlled-substance order volumes per
// pharmacy. Used by the Pattern Outlier task's "Order History Trend" sub-
// check (per Rajesh, pharmacy_usecase_transcript.txt t=00:46): "your own
// order history trend, deviation, suddenly ordering more than before".
//
// Each entry is the average daily controlled-substance unit count for that
// pharmacy over the prior 30 days (i.e. the baseline against which today's
// order is compared). A current order whose controlled-substance volume
// exceeds 3× this baseline triggers a fail.
//
// Synthetic but proportional: clean baseline pharmacies reflect their actual
// catchment city's volume and population; the boss-case (PH-005 Westside)
// is intentionally low to make a 35,000-unit Xanax order look anomalous.

export interface PharmacyOrderHistory {
  /** Pharmacy ID — matches PharmacyRecord.id */
  pharmacyId: string;
  /** Average controlled-substance units per day over prior 30 days. */
  avgDailyControlledUnits: number;
  /** Total prior orders in last 30 days (for trend visualization). */
  priorOrders30d: number;
}

export const orderHistory: PharmacyOrderHistory[] = [
  // ── Real Active pharmacies — historical baseline scales with catchment ──
  { pharmacyId: "PH-001", avgDailyControlledUnits: 28, priorOrders30d: 22 },   // Gurleys Durham
  { pharmacyId: "PH-002", avgDailyControlledUnits: 35, priorOrders30d: 28 },   // Apex Family Raleigh
  { pharmacyId: "PH-004", avgDailyControlledUnits: 47, priorOrders30d: 31 },   // Sixth Avenue San Diego
  { pharmacyId: "PH-006", avgDailyControlledUnits: 95, priorOrders30d: 42 },   // Costco Durham (high vol chain)
  { pharmacyId: "PH-007", avgDailyControlledUnits: 31, priorOrders30d: 24 },   // Advance Community Raleigh
  { pharmacyId: "PH-009", avgDailyControlledUnits: 22, priorOrders30d: 18 },   // Alvarez Raleigh
  { pharmacyId: "PH-010", avgDailyControlledUnits: 41, priorOrders30d: 27 },   // Anderson Sacramento
  { pharmacyId: "PH-011", avgDailyControlledUnits: 18, priorOrders30d: 14 },   // Allermed San Diego (specialty)
  { pharmacyId: "PH-014", avgDailyControlledUnits: 26, priorOrders30d: 20 },   // Alta View San Diego
  { pharmacyId: "PH-015", avgDailyControlledUnits: 15, priorOrders30d: 8 },    // Alvarado SD (sparse — flag risk)
  { pharmacyId: "PH-016", avgDailyControlledUnits: 19, priorOrders30d: 16 },   // Clinic Pharmacy Durham
  { pharmacyId: "PH-017", avgDailyControlledUnits: 33, priorOrders30d: 26 },   // Apotheco Durham
  { pharmacyId: "PH-018", avgDailyControlledUnits: 29, priorOrders30d: 23 },   // A Plus Charlotte
  { pharmacyId: "PH-019", avgDailyControlledUnits: 51, priorOrders30d: 35 },   // 321 Pharmacy LA
  { pharmacyId: "PH-020", avgDailyControlledUnits: 38, priorOrders30d: 28 },   // B & B SF

  // ── Edge-case pharmacies — deliberately weak baselines so today's order trips ──
  { pharmacyId: "PH-003", avgDailyControlledUnits: 12, priorOrders30d: 10 },   // Tarheel (expired)
  { pharmacyId: "PH-005", avgDailyControlledUnits: 8,  priorOrders30d: 4 },    // Westside boss case
  { pharmacyId: "PH-008", avgDailyControlledUnits: 0,  priorOrders30d: 0 },    // Queen City shell
  { pharmacyId: "PH-012", avgDailyControlledUnits: 14, priorOrders30d: 11 },   // Sunset Strip (expired)
  { pharmacyId: "PH-013", avgDailyControlledUnits: 6,  priorOrders30d: 3 },    // Catawba Valley (inactive)
];

export function findOrderHistoryByPharmacyId(id: string): PharmacyOrderHistory | undefined {
  return orderHistory.find((h) => h.pharmacyId === id);
}
