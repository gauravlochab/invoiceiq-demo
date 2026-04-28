// ─── SOM Mock Data — Manufacturer Contract Pricing ───────────────────────────
//
// Per Rajesh (transcript 3, t=11:13): "manufacturer contract pricing — Pfizer,
// Biogen, J&J". For the tight Phase 2 skeleton we ship 3 manufacturers × 2-3
// NDCs each. Phase 3+ will expand to 5-12 per manufacturer.
//
// NDC = National Drug Code (10 or 11 digits, manufacturer-product-package).
// Reuses the spirit of lib/data.ts Contract — distributor's contracted price
// per NDC, with a tolerance band before the order is flagged as a deviation.

export interface ManufacturerContractPrice {
  ndc: string;
  manufacturer: "Pfizer" | "Johnson & Johnson" | "Biogen" | "Mylan" | "Teva";
  productName: string;
  /** Strength + dosage form, e.g. "20mg tablet". */
  form: string;
  /** Distributor's contracted unit price ($/unit). */
  contractPrice: number;
  /** % deviation tolerated before flagging. Typically 5-10%. */
  tolerancePct: number;
  /** Whether DEA scheduling makes this a controlled substance. */
  isControlled: boolean;
  /** True if the NDC requires extra SOM scrutiny (controlled / high-risk). */
  highRisk: boolean;
}

export const manufacturerPricing: ManufacturerContractPrice[] = [
  // ── Pfizer ────────────────────────────────────────────────────────────────
  {
    ndc: "00069-2587-30",
    manufacturer: "Pfizer",
    productName: "Lipitor",
    form: "20mg tablet",
    contractPrice: 3.75,
    tolerancePct: 5,
    isControlled: false,
    highRisk: false,
  },
  {
    ndc: "00069-1080-04",
    manufacturer: "Pfizer",
    productName: "Xanax",
    form: "0.5mg tablet",
    contractPrice: 1.20,
    tolerancePct: 5,
    isControlled: true,    // Schedule IV — controlled
    highRisk: true,
  },

  // ── Johnson & Johnson ─────────────────────────────────────────────────────
  {
    ndc: "50458-0140-30",
    manufacturer: "Johnson & Johnson",
    productName: "Tylenol with Codeine",
    form: "30mg/300mg tablet",
    contractPrice: 0.95,
    tolerancePct: 5,
    isControlled: true,    // Schedule III — controlled
    highRisk: true,
  },
  {
    ndc: "50458-0220-10",
    manufacturer: "Johnson & Johnson",
    productName: "Risperdal",
    form: "2mg tablet",
    contractPrice: 4.40,
    tolerancePct: 7,
    isControlled: false,
    highRisk: false,
  },

  // ── Biogen ────────────────────────────────────────────────────────────────
  {
    ndc: "64406-0007-01",
    manufacturer: "Biogen",
    productName: "Tecfidera",
    form: "240mg capsule",
    contractPrice: 92.30,
    tolerancePct: 4,
    isControlled: false,
    highRisk: false,
  },

  // ── Pfizer (additional NDCs) ──────────────────────────────────────────────
  {
    ndc: "00069-0080-30",
    manufacturer: "Pfizer",
    productName: "Norvasc",
    form: "5mg tablet",
    contractPrice: 1.85,
    tolerancePct: 6,
    isControlled: false,
    highRisk: false,
  },
  {
    ndc: "00069-1750-66",
    manufacturer: "Pfizer",
    productName: "Zoloft",
    form: "50mg tablet",
    contractPrice: 2.10,
    tolerancePct: 6,
    isControlled: false,
    highRisk: false,
  },
  {
    ndc: "00069-2238-30",
    manufacturer: "Pfizer",
    productName: "Lyrica",
    form: "75mg capsule",
    contractPrice: 6.40,
    tolerancePct: 5,
    isControlled: true,    // Schedule V
    highRisk: true,
  },

  // ── Johnson & Johnson (additional NDCs) ───────────────────────────────────
  {
    ndc: "50458-0578-01",
    manufacturer: "Johnson & Johnson",
    productName: "Concerta",
    form: "36mg ER tablet",
    contractPrice: 7.85,
    tolerancePct: 5,
    isControlled: true,    // Schedule II
    highRisk: true,
  },
  {
    ndc: "50458-0610-30",
    manufacturer: "Johnson & Johnson",
    productName: "Invokana",
    form: "100mg tablet",
    contractPrice: 14.20,
    tolerancePct: 5,
    isControlled: false,
    highRisk: false,
  },

  // ── Biogen (additional NDCs) ──────────────────────────────────────────────
  {
    ndc: "64406-0008-01",
    manufacturer: "Biogen",
    productName: "Vumerity",
    form: "231mg capsule",
    contractPrice: 88.10,
    tolerancePct: 4,
    isControlled: false,
    highRisk: false,
  },
  {
    ndc: "64406-0042-01",
    manufacturer: "Biogen",
    productName: "Spinraza",
    form: "12mg/5mL injection",
    contractPrice: 12_5000.00,    // specialty drug — high unit price
    tolerancePct: 2,
    isControlled: false,
    highRisk: true,
  },

  // ── Mylan (generics) ──────────────────────────────────────────────────────
  {
    ndc: "00378-2042-77",
    manufacturer: "Mylan",
    productName: "Lisinopril (generic)",
    form: "10mg tablet",
    contractPrice: 0.18,
    tolerancePct: 10,
    isControlled: false,
    highRisk: false,
  },
  {
    ndc: "00378-3145-93",
    manufacturer: "Mylan",
    productName: "Metformin (generic)",
    form: "500mg tablet",
    contractPrice: 0.12,
    tolerancePct: 10,
    isControlled: false,
    highRisk: false,
  },
  {
    ndc: "00378-7058-93",
    manufacturer: "Mylan",
    productName: "Hydrocodone/APAP (generic)",
    form: "5mg/325mg tablet",
    contractPrice: 0.42,
    tolerancePct: 6,
    isControlled: true,    // Schedule II
    highRisk: true,
  },

  // ── Teva (generics) ───────────────────────────────────────────────────────
  {
    ndc: "00093-7159-56",
    manufacturer: "Teva",
    productName: "Atorvastatin (generic)",
    form: "20mg tablet",
    contractPrice: 0.22,
    tolerancePct: 10,
    isControlled: false,
    highRisk: false,
  },
  {
    ndc: "00093-3147-19",
    manufacturer: "Teva",
    productName: "Sertraline (generic)",
    form: "50mg tablet",
    contractPrice: 0.31,
    tolerancePct: 10,
    isControlled: false,
    highRisk: false,
  },
];

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function findContractPriceByNdc(ndc: string): ManufacturerContractPrice | undefined {
  return manufacturerPricing.find((c) => c.ndc === ndc);
}
