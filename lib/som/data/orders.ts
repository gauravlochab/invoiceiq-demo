// ─── SOM Mock Data — Incoming Orders ─────────────────────────────────────────
//
// 15 orders that exercise each branch of the workflow:
//   ORD-1001  Joseph's Pharmacy, Durham      — clean pass (Rajesh's example)
//   ORD-1002  Carolina Health, Raleigh       — address mismatch
//   ORD-1003  Tarheel Drugs, Charlotte       — expired license
//   ORD-1004  Westside Pharmacy, LA          — price spike + suspended license
//   ORD-1005  through ORD-1015              — clean / mixed filler orders
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

  // ── ORD-1005: Costco Pharmacy Durham — Metformin + Neurontin, clean ──────
  {
    id: "ORD-1005",
    receivedAt: "2026-04-28T05:15:00Z",
    pharmacy: pharmacyByIdx(5),
    lineItems: [
      {
        ndc: "00093-5159-01",
        manufacturer: "Teva",
        description: "Metformin 500mg tablet",
        quantity: 2000,
        unit: "tablet",
        unitPrice: 0.04,
        isControlled: false,
      },
      {
        ndc: "00071-0155-23",
        manufacturer: "Parke-Davis",
        description: "Neurontin 300mg capsule",
        quantity: 500,
        unit: "tablet",
        unitPrice: 0.82,
        isControlled: false,
      },
    ],
    totalAmount: 2000 * 0.04 + 500 * 0.82,  // $490.00
  },

  // ── ORD-1006: Advance Community Health — Alprazolam, controlled ──────────
  {
    id: "ORD-1006",
    receivedAt: "2026-04-27T16:44:00Z",
    pharmacy: pharmacyByIdx(6),
    lineItems: [
      {
        ndc: "00555-0829-02",
        manufacturer: "Barr",
        description: "Alprazolam 0.5mg tablet",
        quantity: 8000,
        unit: "tablet",
        unitPrice: 0.31,
        isControlled: true,
      },
    ],
    totalAmount: 8000 * 0.31,  // $2,480.00
  },

  // ── ORD-1007: Queen City Family Drug — Metoprolol + Amoxicillin + Tylenol ─
  {
    id: "ORD-1007",
    receivedAt: "2026-04-27T14:22:00Z",
    pharmacy: pharmacyByIdx(7),
    lineItems: [
      {
        ndc: "00378-0011-01",
        manufacturer: "Mylan",
        description: "Metoprolol 25mg tablet",
        quantity: 3000,
        unit: "tablet",
        unitPrice: 0.08,
        isControlled: false,
      },
      {
        ndc: "00143-1444-01",
        manufacturer: "Westward",
        description: "Amoxicillin 500mg capsule",
        quantity: 2000,
        unit: "capsule",
        unitPrice: 0.15,
        isControlled: false,
      },
      {
        ndc: "50580-0496-01",
        manufacturer: "McNeil",
        description: "Tylenol 500mg tablet",
        quantity: 5000,
        unit: "tablet",
        unitPrice: 0.06,
        isControlled: false,
      },
    ],
    totalAmount: 3000 * 0.08 + 2000 * 0.15 + 5000 * 0.06,  // $840.00
  },

  // ── ORD-1008: Alvarez Pharmacy — Hydrocodone, high-volume controlled ──────
  {
    id: "ORD-1008",
    receivedAt: "2026-04-27T11:38:00Z",
    pharmacy: pharmacyByIdx(8),
    lineItems: [
      {
        ndc: "00603-5552-58",
        manufacturer: "Qualitest",
        description: "Hydrocodone 5mg/325mg tablet",
        quantity: 12000,
        unit: "tablet",
        unitPrice: 0.48,
        isControlled: true,
      },
    ],
    totalAmount: 12000 * 0.48,  // $5,760.00
  },

  // ── ORD-1009: Anderson Bros Florin Square — Neurontin + Metformin ─────────
  {
    id: "ORD-1009",
    receivedAt: "2026-04-27T09:55:00Z",
    pharmacy: pharmacyByIdx(9),
    lineItems: [
      {
        ndc: "00071-0155-23",
        manufacturer: "Parke-Davis",
        description: "Neurontin 300mg capsule",
        quantity: 1000,
        unit: "tablet",
        unitPrice: 0.82,
        isControlled: false,
      },
      {
        ndc: "00093-5159-01",
        manufacturer: "Teva",
        description: "Metformin 500mg tablet",
        quantity: 3000,
        unit: "tablet",
        unitPrice: 0.04,
        isControlled: false,
      },
    ],
    totalAmount: 1000 * 0.82 + 3000 * 0.04,  // $940.00
  },

  // ── ORD-1010: Allermed Pharmacy — Lorazepam, controlled ──────────────────
  {
    id: "ORD-1010",
    receivedAt: "2026-04-26T22:10:00Z",
    pharmacy: pharmacyByIdx(10),
    lineItems: [
      {
        ndc: "64679-0911-01",
        manufacturer: "Lannett",
        description: "Lorazepam 1mg tablet",
        quantity: 5000,
        unit: "tablet",
        unitPrice: 0.29,
        isControlled: true,
      },
    ],
    totalAmount: 5000 * 0.29,  // $1,450.00
  },

  // ── ORD-1011: Sunset Strip Pharmacy — Amoxicillin + Metoprolol, clean ─────
  {
    id: "ORD-1011",
    receivedAt: "2026-04-26T18:33:00Z",
    pharmacy: pharmacyByIdx(11),
    lineItems: [
      {
        ndc: "00143-1444-01",
        manufacturer: "Westward",
        description: "Amoxicillin 500mg capsule",
        quantity: 4000,
        unit: "capsule",
        unitPrice: 0.15,
        isControlled: false,
      },
      {
        ndc: "00378-0011-01",
        manufacturer: "Mylan",
        description: "Metoprolol 25mg tablet",
        quantity: 2500,
        unit: "tablet",
        unitPrice: 0.08,
        isControlled: false,
      },
    ],
    totalAmount: 4000 * 0.15 + 2500 * 0.08,  // $800.00
  },

  // ── ORD-1012: Catawba Valley Drugs — Alprazolam, controlled ─────────────
  {
    id: "ORD-1012",
    receivedAt: "2026-04-26T15:47:00Z",
    pharmacy: pharmacyByIdx(12),
    lineItems: [
      {
        ndc: "00555-0829-02",
        manufacturer: "Barr",
        description: "Alprazolam 0.5mg tablet",
        quantity: 3500,
        unit: "tablet",
        unitPrice: 0.31,
        isControlled: true,
      },
    ],
    totalAmount: 3500 * 0.31,  // $1,085.00
  },

  // ── ORD-1013: Alta View Health Care — Metformin + Tylenol, clean ─────────
  {
    id: "ORD-1013",
    receivedAt: "2026-04-26T13:20:00Z",
    pharmacy: pharmacyByIdx(13),
    lineItems: [
      {
        ndc: "00093-5159-01",
        manufacturer: "Teva",
        description: "Metformin 500mg tablet",
        quantity: 5000,
        unit: "tablet",
        unitPrice: 0.04,
        isControlled: false,
      },
      {
        ndc: "50580-0496-01",
        manufacturer: "McNeil",
        description: "Tylenol 500mg tablet",
        quantity: 8000,
        unit: "tablet",
        unitPrice: 0.06,
        isControlled: false,
      },
    ],
    totalAmount: 5000 * 0.04 + 8000 * 0.06,  // $680.00
  },

  // ── ORD-1014: Alvarado Pharmacy SD — Hydrocodone, controlled ─────────────
  {
    id: "ORD-1014",
    receivedAt: "2026-04-26T10:05:00Z",
    pharmacy: pharmacyByIdx(14),
    lineItems: [
      {
        ndc: "00603-5552-58",
        manufacturer: "Qualitest",
        description: "Hydrocodone 5mg/325mg tablet",
        quantity: 7500,
        unit: "tablet",
        unitPrice: 0.48,
        isControlled: true,
      },
    ],
    totalAmount: 7500 * 0.48,  // $3,600.00
  },

  // ── ORD-1015: Clinic Pharmacy Croasdaile — Neurontin + Amoxicillin + Metoprolol
  {
    id: "ORD-1015",
    receivedAt: "2026-04-26T08:45:00Z",
    pharmacy: pharmacyByIdx(15),
    lineItems: [
      {
        ndc: "00071-0155-23",
        manufacturer: "Parke-Davis",
        description: "Neurontin 300mg capsule",
        quantity: 800,
        unit: "tablet",
        unitPrice: 0.82,
        isControlled: false,
      },
      {
        ndc: "00143-1444-01",
        manufacturer: "Westward",
        description: "Amoxicillin 500mg capsule",
        quantity: 1500,
        unit: "capsule",
        unitPrice: 0.15,
        isControlled: false,
      },
      {
        ndc: "00378-0011-01",
        manufacturer: "Mylan",
        description: "Metoprolol 25mg tablet",
        quantity: 1000,
        unit: "tablet",
        unitPrice: 0.08,
        isControlled: false,
      },
    ],
    totalAmount: 800 * 0.82 + 1500 * 0.15 + 1000 * 0.08,  // $908.00
  },
];

export function findOrderById(id: string): IncomingOrder | undefined {
  return sampleOrders.find((o) => o.id === id);
}
