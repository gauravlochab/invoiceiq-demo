// ─── SOM Pharmacy Scoring ────────────────────────────────────────────────────
//
// SOM analog of the hospital Vendor Scoring screen. Where the hospital scores
// vendors on invoice accuracy, SOM scores pharmacies on order-time risk —
// "how risky is it to ship controlled substances to this pharmacy?"
//
// Composite 0-100 score derived deterministically from each pharmacy's record
// + its history of SOM exceptions:
//
//   40%  License Verification   active=100, expired/suspended/inactive=0, not_found=0
//   20%  Address Verification   distance ≤1km=100, ≤10km=60, >10km=0
//   15%  Price Discipline       1 - (#price_deviation_exceptions / total_orders)
//   15%  Volume Sanity          1 - (#outlier_exceptions / controlled_orders)
//   10%  Identity Completeness  NPI=50pts + DEA=50pts (each on file)
//
// Rating bands match VendorScore for UI consistency.

import { exceptions, type Exception } from "../../data";
import { pharmacies, type PharmacyRecord } from "./pharmacies";
import { sampleOrders } from "./orders";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PharmacyScore {
  id: string;                    // pharmacy id (PH-*)
  name: string;
  state: string;
  city: string;
  totalOrders: number;
  totalSpend: number;
  flaggedAmount: number;
  flaggedPct: number;
  score: number;                 // 0-100, higher = lower risk
  rating: "Critical" | "High Risk" | "Medium Risk" | "Low Risk";
  // Component contributions (each 0-100 within their category, weighted later)
  components: {
    license: number;
    address: number;
    price: number;
    volume: number;
    identity: number;
  };
  exceptions: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function ratingFor(score: number): PharmacyScore["rating"] {
  if (score < 30) return "Critical";
  if (score < 60) return "High Risk";
  if (score < 80) return "Medium Risk";
  return "Low Risk";
}

// ─── Score components (each returns 0-100) ──────────────────────────────────

function licenseScore(p: PharmacyRecord): number {
  switch (p.licenseStatus) {
    case "active": return 100;
    case "expired": return 0;
    case "suspended": return 0;
    case "inactive": return 25;     // voluntary closure ≠ wrongdoing
    case "not_found": return 0;
  }
}

function addressScore(p: PharmacyRecord): number {
  const d = haversineKm(p.declaredLat, p.declaredLng, p.geocodedLat, p.geocodedLng);
  if (d <= 1) return 100;
  if (d <= 10) return 60;
  return 0;
}

function priceScore(p: PharmacyRecord, somExceptions: Exception[]): number {
  const ordersForPharmacy = sampleOrders.filter((o) => o.pharmacy.id === p.id).length;
  const priceFlags = somExceptions.filter(
    (e) => e.type === "som_price_deviation" && e.vendor === p.name,
  ).length;
  // Without orders we can't score price discipline → assume neutral 80
  if (ordersForPharmacy === 0) return 80;
  const ratio = priceFlags / ordersForPharmacy;
  return Math.max(0, Math.round((1 - ratio) * 100));
}

function volumeScore(p: PharmacyRecord, somExceptions: Exception[]): number {
  const controlledOrders = sampleOrders.filter(
    (o) => o.pharmacy.id === p.id && o.lineItems.some((l) => l.isControlled),
  ).length;
  const outlierFlags = somExceptions.filter(
    (e) => e.type === "som_quantity_outlier" && e.vendor === p.name,
  ).length;
  if (controlledOrders === 0) return 80;
  const ratio = outlierFlags / controlledOrders;
  return Math.max(0, Math.round((1 - ratio) * 100));
}

function identityScore(p: PharmacyRecord): number {
  const npi = p.npi ? 50 : 0;
  const dea = p.deaNumber ? 50 : 0;
  return npi + dea;
}

// ─── Main: compute scores for all pharmacies ────────────────────────────────

function computePharmacyScore(p: PharmacyRecord, somExceptions: Exception[]): PharmacyScore {
  const license = licenseScore(p);
  const address = addressScore(p);
  const price = priceScore(p, somExceptions);
  const volume = volumeScore(p, somExceptions);
  const identity = identityScore(p);

  // Weighted composite: 40/20/15/15/10
  const score = Math.round(
    license * 0.40 +
    address * 0.20 +
    price * 0.15 +
    volume * 0.15 +
    identity * 0.10,
  );

  // Pharmacy's order history
  const ordersForPharmacy = sampleOrders.filter((o) => o.pharmacy.id === p.id);
  const totalSpend = ordersForPharmacy.reduce((sum, o) => sum + o.totalAmount, 0);

  // Pharmacy's SOM exceptions (joined by vendor name)
  const myExceptions = somExceptions.filter((e) => e.vendor === p.name);
  const flaggedAmount = myExceptions.reduce((sum, e) => sum + e.flaggedAmount, 0);
  const flaggedPct = totalSpend > 0 ? (flaggedAmount / totalSpend) * 100 : 0;

  return {
    id: p.id,
    name: p.name,
    state: p.state,
    city: p.city,
    totalOrders: ordersForPharmacy.length,
    totalSpend,
    flaggedAmount,
    flaggedPct: Number(flaggedPct.toFixed(1)),
    score,
    rating: ratingFor(score),
    components: { license, address, price, volume, identity },
    exceptions: myExceptions.map((e) => ({
      id: e.id,
      type: e.type,
      amount: e.flaggedAmount,
      date: e.detectedAt,
      description: e.description,
    })),
  };
}

export const pharmacyScores: PharmacyScore[] = pharmacies.map((p) => {
  const somExceptions = exceptions.filter((e) => e.type.startsWith("som_"));
  return computePharmacyScore(p, somExceptions);
});
