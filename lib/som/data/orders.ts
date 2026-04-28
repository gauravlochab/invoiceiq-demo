// ─── SOM Mock Data — Incoming Orders ─────────────────────────────────────────
//
// 4 canonical orders that exercise each branch of the workflow:
//   ORD-1001  Joseph's Pharmacy, Durham      — clean pass (Rajesh's example)
//   ORD-1002  Carolina Health, Raleigh       — address mismatch
//   ORD-1003  Tarheel Drugs, Charlotte       — expired license
//   ORD-1004  Westside Pharmacy, LA          — price spike + suspended license
//
// Used by app/som/page.tsx (queue) and app/som/order/[id]/page.tsx (runner).

import type { IncomingOrder } from "../types";
import { pharmacies } from "./pharmacies";

const pharmacyByIdx = (i: number) => {
  const p = pharmacies[i];
  return {
    id: p.id,
    name: p.name,
    permitNumber: p.permitNumber,
    npi: p.npi,
    state: p.state,
    city: p.city,
    address: p.address,
  };
};

export const sampleOrders: IncomingOrder[] = [
  // ── ORD-1001: Joseph's Pharmacy — clean order, Rajesh's example ──────────
  {
    id: "ORD-1001",
    receivedAt: "2026-04-28T09:14:00Z",
    pharmacy: pharmacyByIdx(0),
    isFresh: true,
    lineItems: [
      {
        ndc: "00069-2587-30",
        manufacturer: "Pfizer",
        description: "Lipitor 20mg tablet",
        quantity: 240,        // 8 bottles × 30
        unit: "tablet",
        unitPrice: 3.78,      // within 5% of $3.75 contract — pass
        isControlled: false,
      },
      {
        ndc: "50458-0220-10",
        manufacturer: "Johnson & Johnson",
        description: "Risperdal 2mg tablet",
        quantity: 100,
        unit: "tablet",
        unitPrice: 4.50,      // within 7% of $4.40 — pass
        isControlled: false,
      },
    ],
    totalAmount: 240 * 3.78 + 100 * 4.50,
  },

  // ── ORD-1002: Carolina Health — address mismatch ─────────────────────────
  {
    id: "ORD-1002",
    receivedAt: "2026-04-28T08:42:00Z",
    pharmacy: pharmacyByIdx(1),
    lineItems: [
      {
        ndc: "00069-2587-30",
        manufacturer: "Pfizer",
        description: "Lipitor 20mg tablet",
        quantity: 180,
        unit: "tablet",
        unitPrice: 3.80,
        isControlled: false,
      },
    ],
    totalAmount: 180 * 3.80,
  },

  // ── ORD-1003: Tarheel Drugs — expired license + small controlled order ───
  {
    id: "ORD-1003",
    receivedAt: "2026-04-28T07:58:00Z",
    pharmacy: pharmacyByIdx(2),
    lineItems: [
      {
        ndc: "50458-0140-30",
        manufacturer: "Johnson & Johnson",
        description: "Tylenol with Codeine 30mg/300mg",
        quantity: 300,
        unit: "tablet",
        unitPrice: 0.97,     // within tolerance — but license is expired
        isControlled: true,
      },
    ],
    totalAmount: 300 * 0.97,
  },

  // ── ORD-1004: Westside Pharmacy — suspended + price spike + outlier ──────
  {
    id: "ORD-1004",
    receivedAt: "2026-04-28T06:31:00Z",
    pharmacy: pharmacyByIdx(4),
    lineItems: [
      {
        ndc: "00069-1080-04",
        manufacturer: "Pfizer",
        description: "Xanax 0.5mg tablet",
        quantity: 35_000,    // 3.6× LA monthly baseline (9,800) → fail
        unit: "tablet",
        unitPrice: 1.42,     // 18% over $1.20 contract → price deviation
        isControlled: true,
      },
    ],
    totalAmount: 35_000 * 1.42,
  },
];

export function findOrderById(id: string): IncomingOrder | undefined {
  return sampleOrders.find((o) => o.id === id);
}
