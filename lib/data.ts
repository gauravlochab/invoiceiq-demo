// ─── NORTHFIELD MEDICAL CENTER — Q1 2026 ─────────────────────────────────────
// Invoice Intelligence · Exceptions and Vendor Risk Data
// Total flagged: $396,390

export type Severity = "critical" | "high" | "medium" | "low";
export type ExceptionType =
  | "duplicate"
  | "match_exception"
  | "missing_rebate"
  | "contract_overage"
  | "suspicious_invoice"
  | "tier_pricing"
  // SOM (Suspicious Order Monitoring) exception types — flow into unified inbox.
  // Source: docs/PLAN_SOM_DRUG_DISTRIBUTOR.md §5.4
  | "som_address_mismatch"
  | "som_license_invalid"
  | "som_price_deviation"
  | "som_quantity_outlier";
export type Status = "open" | "under_review" | "resolved" | "escalated";

export interface Exception {
  id: string;
  type: ExceptionType;
  severity: Severity;
  status: Status;
  vendor: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  flaggedAmount: number;
  description: string;
  detectedAt: string;
  assignee?: string;
}

export interface InvoiceLineItem {
  itemCode: string;
  description: string;
  poDescription?: string;
  invoiceDescription?: string;
  poUnit?: string;
  invoiceUnit?: string;
  poQty: number;
  poUnitPrice: number;
  invoiceQty: number;
  invoiceUnitPrice: number;
  packingSlipQty: number;
  status: "match" | "price_mismatch" | "qty_mismatch" | "both_mismatch";
  flags?: ("price" | "qty" | "description" | "unit")[];
}

export interface DuplicatePair {
  id: string;
  vendor: string;
  invoice1: { number: string; date: string; amount: number; submittedVia: string };
  invoice2: { number: string; date: string; amount: number; submittedVia: string };
  similarity: number;
  amountDelta: number;
  daysDelta: number;
  flaggedAmount: number;
  status: Status;
}

export interface Contract {
  id: string;
  vendor: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  capType: "value" | "quantity" | "both";
  capValue: number;
  currentSpend: number;
  capQuantity?: number;
  currentQuantity?: number;
  rebateRate?: number;
  rebateThreshold?: number;
  rebateApplied?: number;
  rebateMissed?: number;
  tieredPricing?: { upToQty: number; unitPrice: number }[];
  status: "compliant" | "warning" | "breached" | "expired";
  category: string;
}

// ─── EXCEPTIONS ───────────────────────────────────────────────────────────────

export const exceptions: Exception[] = [
  {
    id: "EX-001",
    type: "contract_overage",
    severity: "critical",
    status: "open",
    vendor: "BioMed Equipment Inc.",
    invoiceNumber: "BME-2026-Q1-047",
    invoiceDate: "2026-03-28",
    amount: 623890,
    flaggedAmount: 123890,
    description:
      "Cumulative Q1 spend of $623,890 exceeds annual contract cap of $500,000 by $123,890. Contract #CTR-2024-BIO-009 has no auto-renewal clause. 23 invoices processed post-cap breach.",
    detectedAt: "2026-03-28T09:14:22Z",
    assignee: "Rajesh Jaluka",
  },
  {
    id: "EX-002",
    type: "duplicate",
    severity: "critical",
    status: "open",
    vendor: "MedSupply Corp",
    invoiceNumber: "MS-2026-0923",
    invoiceDate: "2026-01-21",
    amount: 47320,
    flaggedAmount: 47320,
    description:
      "Invoice MS-2026-0923 ($47,320) submitted via email on Jan 21 is a near-duplicate of MS-2026-0847 ($47,120) submitted by postal mail on Jan 15. Amount altered by $200 (0.42%). Same line items, same PO reference.",
    detectedAt: "2026-01-22T08:02:11Z",
    assignee: "Marcus Webb",
  },
  {
    id: "EX-003",
    type: "suspicious_invoice",
    severity: "critical",
    status: "escalated",
    vendor: "MedTech Solutions LLC",
    invoiceNumber: "MTS-INV-00291",
    invoiceDate: "2026-02-14",
    amount: 45200,
    flaggedAmount: 45200,
    description:
      "No PO found. Vendor 'MedTech Solutions LLC' not in approved vendor master. Invoice references services (IV Catheter Kits) outside vendor's registered category (Consulting). Bank account differs from any known vendor. Routed to compliance.",
    detectedAt: "2026-02-14T14:33:07Z",
    assignee: "Compliance Team",
  },
  {
    id: "EX-004",
    type: "missing_rebate",
    severity: "high",
    status: "open",
    vendor: "Cardinal Health",
    invoiceNumber: "CH-Q1-2026-REBATE",
    invoiceDate: "2026-03-31",
    amount: 312400,
    flaggedAmount: 89430,
    description:
      "Contract #CTR-2025-CAR-003 entitles Northfield to an 8.5% quarterly rebate on pharmaceutical spend exceeding $200K. Q1 spend: $312,400. Expected rebate credit memo: $26,554 (on excess $312,400). No credit memo received. Additionally, $62,876 in volume discount adjustments not applied across 47 line items.",
    detectedAt: "2026-04-01T06:00:00Z",
    assignee: "Rajesh Jaluka",
  },
  {
    id: "EX-005",
    type: "tier_pricing",
    severity: "high",
    status: "open",
    vendor: "Cardinal Health",
    invoiceNumber: "CH-2026-0341",
    invoiceDate: "2026-03-15",
    amount: 198900,
    flaggedAmount: 52260,
    description:
      "Contract specifies tiered pricing: $85/unit ≤1,000 units/month, $72/unit >1,000 units/month. March order: 2,340 units. Invoice billed all 2,340 units at $85 = $198,900. Correct: 1,000×$85 + 1,340×$72 = $181,480. Overcharge: $17,420. Same error repeated for 3 months (Jan–Mar 2026): total $52,260.",
    detectedAt: "2026-03-16T11:47:33Z",
    assignee: "Marcus Webb",
  },
  {
    id: "EX-006",
    type: "match_exception",
    severity: "high",
    status: "under_review",
    vendor: "Steris Corporation",
    invoiceNumber: "STC-2026-19847",
    invoiceDate: "2026-02-28",
    amount: 27750,
    flaggedAmount: 4600,
    description:
      "Price mismatch on Sterile Surgical Drape Sets. PO price: $2.10/unit. Invoiced price: $2.50/unit (+19%). 500 units per invoice × 23 invoices = $4,600 total overcharge. Packing slip quantities match. Product description variant detected: 'Sterile Drape Set' vs 'Surgical Draping Kit Pro'.",
    detectedAt: "2026-03-01T09:22:14Z",
    assignee: "James Park",
  },
  {
    id: "EX-007",
    type: "match_exception",
    severity: "medium",
    status: "under_review",
    vendor: "Medline Industries",
    invoiceNumber: "MDL-2026-44821",
    invoiceDate: "2026-03-10",
    amount: 79300,
    flaggedAmount: 14200,
    description:
      "Quantity mismatch: PO authorised 300 boxes of exam gloves (Box/200) at $218.46/box, packing slip confirms 300 delivered, but invoice bills 365 boxes. 65 boxes unbilled in PO. 65 × $218.46 = $14,200 overbilled.",
    detectedAt: "2026-03-11T10:15:00Z",
    assignee: "James Park",
  },
  {
    id: "EX-008",
    type: "duplicate",
    severity: "medium",
    status: "resolved",
    vendor: "Henry Schein",
    invoiceNumber: "HS-2026-77341",
    invoiceDate: "2026-01-30",
    amount: 8750,
    flaggedAmount: 8750,
    description:
      "Duplicate invoice detected. HS-2026-77341 and HS-2026-77298 submitted 4 days apart for identical line items totalling $8,750. Second invoice blocked before payment.",
    detectedAt: "2026-01-31T07:44:00Z",
    assignee: "Rajesh Jaluka",
  },
  {
    id: "EX-009",
    type: "missing_rebate",
    severity: "low",
    status: "open",
    vendor: "Vizient Inc.",
    invoiceNumber: "VZT-2026-Q1",
    invoiceDate: "2026-03-31",
    amount: 94200,
    flaggedAmount: 6850,
    description:
      "GPO contract entitles 7.25% rebate on spend above $80K/quarter. Q1 spend: $94,200. Rebate on $14,200 excess: $1,030. Additionally, 3% early-payment discount not applied across 12 invoices totalling $194,000 = $5,820 missed.",
    detectedAt: "2026-04-01T06:00:00Z",
    assignee: "Unassigned",
  },
  {
    id: "EX-010",
    type: "match_exception",
    severity: "low",
    status: "resolved",
    vendor: "Owens & Minor",
    invoiceNumber: "OM-2026-38920",
    invoiceDate: "2026-02-05",
    amount: 103731,
    flaggedAmount: 3890,
    description:
      "Unit of measure mismatch. PO ordered 640 'cases' of IV tubing at $156.00/case. Invoice billed 640 'cartons' at $162.08/carton — a different UOM at a higher price. 640 × ($162.08 − $156.00) = 640 × $6.08 = $3,891 variance (rounded to $3,890). Resolved: vendor issued credit memo CM-OM-0038.",
    detectedAt: "2026-02-06T08:30:00Z",
    assignee: "Rajesh Jaluka",
  },

  // ─── SOM exceptions (drug-distributor vertical) ──────────────────────────
  // These are flagged from the SOM workflow runs and surface in the unified
  // inbox per docs/PLAN_SOM_DRUG_DISTRIBUTOR.md §5.4. The "vendor" field is
  // re-purposed for the pharmacy name; the "invoiceNumber" holds the order ID.
  {
    id: "SOM-001",
    type: "som_address_mismatch",
    severity: "high",
    status: "open",
    vendor: "Apex Family Pharmacy Inc",
    invoiceNumber: "ORD-1002",
    invoiceDate: "2026-04-28",
    amount: 684,
    flaggedAmount: 684,
    description:
      "Address verification failed. Pharmacy declared 2601 Blue Ridge Rd, Raleigh NC, but the geocode resolves ~215 km away in Charlotte. Permit NC 09471 is active per NPI Registry, but coordinate drift suggests stale records or filing irregularity.",
    detectedAt: "2026-04-28T08:42:00Z",
    assignee: "SOM Analyst",
  },
  {
    id: "SOM-002",
    type: "som_license_invalid",
    severity: "critical",
    status: "open",
    vendor: "Tarheel Drugs",
    invoiceNumber: "ORD-1003",
    invoiceDate: "2026-04-28",
    amount: 291,
    flaggedAmount: 291,
    description:
      "License verification failed. NC Board of Pharmacy reports permit NC-PH-009847 is EXPIRED (expiry 2025-08-15). Order includes Schedule III controlled substance (Tylenol with Codeine 30mg/300mg, 300 tablets). Block fulfilment pending board contact.",
    detectedAt: "2026-04-28T07:58:00Z",
    assignee: "SOM Analyst",
  },
  {
    id: "SOM-003",
    type: "som_price_deviation",
    severity: "high",
    status: "open",
    vendor: "Westside Pharmacy",
    invoiceNumber: "ORD-1004",
    invoiceDate: "2026-04-28",
    amount: 49700,
    flaggedAmount: 7700,
    description:
      "Price deviation +18% on Pfizer Xanax 0.5mg (Schedule IV controlled). Ordered $1.42/unit vs contract $1.20/unit (5% tolerance). 35,000 units × $0.22 overage = $7,700. Compounded with suspended pharmacy license (CA-PHY-19384) and high-volume controlled-substance order — escalate to compliance.",
    detectedAt: "2026-04-28T06:31:00Z",
    assignee: "Compliance Team",
  },
  {
    id: "SOM-004",
    type: "som_quantity_outlier",
    severity: "critical",
    status: "escalated",
    vendor: "Westside Pharmacy",
    invoiceNumber: "ORD-1004",
    invoiceDate: "2026-04-28",
    amount: 49700,
    flaggedAmount: 49700,
    description:
      "Volume outlier: 35,000 controlled-substance units (Xanax 0.5mg) on a single order — 3.6× monthly baseline for the entire Los Angeles catchment from a single pharmacy. Triggers DEA-style suspicious-order reporting threshold.",
    detectedAt: "2026-04-28T06:31:00Z",
    assignee: "Compliance Team",
  },
];

// ─── THREE-WAY MATCH DETAIL (for EX-006 Steris) ──────────────────────────────

// PO-specific data: different POs have different quantities and prices
export const sterisLineItemsByPO: Record<string, Partial<Record<string, { poQty: number; poUnitPrice: number }>>> = {
  // Main PO — matches invoice quantities, contracted price $2.10 for STE-4821-A
  "po-NMC-2026-PO-2847.pdf": {
    "STE-4821-A": { poQty: 500, poUnitPrice: 2.10 },
    "STE-2200-C": { poQty: 800, poUnitPrice: 8.75 },
    "STE-9940-B": { poQty: 3000, poUnitPrice: 1.20 },
    "STE-3310-D": { poQty: 500, poUnitPrice: 14.50 },
    "STE-7710-A": { poQty: 1000, poUnitPrice: 4.85 },
    "STE-1100-C": { poQty: 2000, poUnitPrice: 1.90 },
  },
  // Alternative PO — different quantities (smaller order)
  "po-NMC-2026-PO-2651.pdf": {
    "STE-4821-A": { poQty: 400, poUnitPrice: 2.10 },
    "STE-2200-C": { poQty: 600, poUnitPrice: 8.75 },
    "STE-9940-B": { poQty: 1500, poUnitPrice: 1.20 },
    "STE-3310-D": { poQty: 300, poUnitPrice: 14.50 },
    "STE-7710-A": { poQty: 500, poUnitPrice: 4.85 },
    "STE-1100-C": { poQty: 1000, poUnitPrice: 1.90 },
  },
  // Older PO — even smaller, missing some items
  "po-NMC-2026-PO-2499.pdf": {
    "STE-4821-A": { poQty: 300, poUnitPrice: 2.10 },
    "STE-2200-C": { poQty: 500, poUnitPrice: 8.75 },
    "STE-9940-B": { poQty: 2000, poUnitPrice: 1.20 },
    "STE-3310-D": { poQty: 200, poUnitPrice: 14.50 },
    "STE-7710-A": { poQty: 0, poUnitPrice: 0 },
    "STE-1100-C": { poQty: 0, poUnitPrice: 0 },
  },
};

// PS-specific data: different packing slips have different received quantities
export const sterisLineItemsByPS: Record<string, Partial<Record<string, number>>> = {
  // Main PS — matches invoice quantities, except STE-9940-B is 20 short
  "packingslip-STC-PS-2026-0392.pdf": {
    "STE-4821-A": 500,
    "STE-2200-C": 800,
    "STE-9940-B": 2980,
    "STE-3310-D": 500,
    "STE-7710-A": 1000,
    "STE-1100-C": 2000,
  },
  // Alternative PS — matches PO-2651 quantities, 20 short on shields
  "packingslip-STC-PS-2026-0371.pdf": {
    "STE-4821-A": 400,
    "STE-2200-C": 600,
    "STE-9940-B": 1480,
    "STE-3310-D": 300,
    "STE-7710-A": 500,
    "STE-1100-C": 1000,
  },
  // Older PS — matches PO-2499, missing last two items
  "packingslip-STC-PS-2026-0350.pdf": {
    "STE-4821-A": 300,
    "STE-2200-C": 500,
    "STE-9940-B": 2000,
    "STE-3310-D": 200,
    "STE-7710-A": 0,
    "STE-1100-C": 0,
  },
};

// Default line items (matches PO-2847 + PS-0392)
// PO should have ALL the same items as invoice at same quantities
// Only discrepancies: price on STE-4821-A ($2.10 vs $2.50) and PS qty on STE-9940-B (2980 vs 3000)
export const sterisLineItems: InvoiceLineItem[] = [
  {
    itemCode: "STE-4821-A",
    description: "Sterile Surgical Drape Set / Surgical Draping Kit Pro",
    poDescription: "Sterile Surgical Drape Set Standard",
    invoiceDescription: "Surgical Draping Kit Pro (individually wrapped)",
    poUnit: "ea",
    invoiceUnit: "ea",
    poQty: 500,
    poUnitPrice: 2.1,
    invoiceQty: 500,
    invoiceUnitPrice: 2.5,
    packingSlipQty: 500,
    status: "price_mismatch",
    flags: ["price", "description"],
  },
  {
    itemCode: "STE-2200-C",
    description: "Surgical Isolation Gown AAMI Level 3 XL",
    poDescription: "Surgical Isolation Gown AAMI Level 3 XL",
    invoiceDescription: "Surgical Isolation Gown AAMI Level 3 XL",
    poUnit: "ea",
    invoiceUnit: "ea",
    poQty: 800,
    poUnitPrice: 8.75,
    invoiceQty: 800,
    invoiceUnitPrice: 8.75,
    packingSlipQty: 800,
    status: "match",
    flags: [],
  },
  {
    itemCode: "STE-9940-B",
    description: "Disposable Full-Face Shield with Anti-Fog Coating",
    poDescription: "Disposable Full-Face Shield with Anti-Fog Coating",
    invoiceDescription: "Disposable Full-Face Shield with Anti-Fog Coating",
    poUnit: "ea",
    invoiceUnit: "ea",
    poQty: 3000,
    poUnitPrice: 1.2,
    invoiceQty: 3000,
    invoiceUnitPrice: 1.2,
    packingSlipQty: 2980,
    status: "qty_mismatch",
    flags: ["qty"],
  },
  {
    itemCode: "STE-3310-D",
    description: "Sterile Gauze Pad 4x4 inch (pkg/100)",
    poDescription: "Sterile Gauze Pad 4x4 inch (pkg/100)",
    invoiceDescription: "Sterile Gauze Pad 4x4 inch (pkg/100)",
    poUnit: "pkg",
    invoiceUnit: "ea",
    poQty: 500,
    poUnitPrice: 14.5,
    invoiceQty: 500,
    invoiceUnitPrice: 14.5,
    packingSlipQty: 500,
    status: "match",
    flags: ["unit"],
  },
  {
    itemCode: "STE-7710-A",
    description: "Sterilization Wrap CSR 24x24 (case/500)",
    poDescription: "Sterilization Wrap CSR 24x24 (case/500)",
    invoiceDescription: "Sterilization Wrap CSR 24x24 (case/500)",
    poUnit: "sheet",
    invoiceUnit: "sheet",
    poQty: 1000,
    poUnitPrice: 4.85,
    invoiceQty: 1000,
    invoiceUnitPrice: 4.85,
    packingSlipQty: 1000,
    status: "match",
    flags: [],
  },
  {
    itemCode: "STE-1100-C",
    description: "Bouffant Surgical Cap Disposable (case/100)",
    poDescription: "Bouffant Surgical Cap Disposable (case/100)",
    invoiceDescription: "Bouffant Surgical Cap Disposable (case/100)",
    poUnit: "ea",
    invoiceUnit: "ea",
    poQty: 2000,
    poUnitPrice: 1.9,
    invoiceQty: 2000,
    invoiceUnitPrice: 1.9,
    packingSlipQty: 2000,
    status: "match",
    flags: [],
  },
];

// ─── THREE-WAY MATCH DETAIL (for EX-007 Medline) ─────────────────────────────

// Three-way match data for EX-007 (Medline Industries — qty mismatch)
export const medlineLineItems: InvoiceLineItem[] = [
  {
    itemCode: "MDL-EG-200",
    description: "Exam Gloves Nitrile Medium (Box/200)",
    poDescription: "Exam Gloves Nitrile Medium (Box/200)",
    invoiceDescription: "Exam Gloves Nitrile Medium (Box/200)",
    poUnit: "box", invoiceUnit: "box",
    poQty: 300, poUnitPrice: 218.46,
    invoiceQty: 365, invoiceUnitPrice: 218.46,
    packingSlipQty: 300,
    status: "qty_mismatch",
    flags: ["qty"],
  },
  {
    itemCode: "MDL-BP-100",
    description: "Bed Pads Disposable (Case/100)",
    poDescription: "Bed Pads Disposable (Case/100)",
    invoiceDescription: "Bed Pads Disposable (Case/100)",
    poUnit: "case", invoiceUnit: "case",
    poQty: 150, poUnitPrice: 42.00,
    invoiceQty: 150, invoiceUnitPrice: 42.00,
    packingSlipQty: 150,
    status: "match",
    flags: [],
  },
  {
    itemCode: "MDL-SC-8G",
    description: "Sharps Container 8 Gallon",
    poDescription: "Sharps Container 8 Gallon",
    invoiceDescription: "Sharps Container 8 Gallon",
    poUnit: "ea", invoiceUnit: "ea",
    poQty: 80, poUnitPrice: 28.50,
    invoiceQty: 80, invoiceUnitPrice: 28.50,
    packingSlipQty: 80,
    status: "match",
    flags: [],
  },
];

// ─── THREE-WAY MATCH DETAIL (for EX-010 Owens & Minor) ───────────────────────

// Three-way match data for EX-010 (Owens & Minor — UOM mismatch)
export const owensLineItems: InvoiceLineItem[] = [
  {
    itemCode: "OM-IVT-24",
    description: "IV Tubing Extension Set",
    poDescription: "IV Tubing Extension Set (case/24)",
    invoiceDescription: "IV Tubing Extension Set (carton/24)",
    poUnit: "case", invoiceUnit: "carton",
    poQty: 640, poUnitPrice: 156.00,
    invoiceQty: 640, invoiceUnitPrice: 162.08,
    packingSlipQty: 640,
    status: "price_mismatch",
    flags: ["price", "unit", "description"],
  },
  {
    itemCode: "OM-SYR-50",
    description: "Irrigation Syringe 60mL (Box/50)",
    poDescription: "Irrigation Syringe 60mL (Box/50)",
    invoiceDescription: "Irrigation Syringe 60mL (Box/50)",
    poUnit: "box", invoiceUnit: "box",
    poQty: 40, poUnitPrice: 34.00,
    invoiceQty: 40, invoiceUnitPrice: 34.00,
    packingSlipQty: 40,
    status: "match",
    flags: [],
  },
];

// ─── CONTRACT DETAILS (for exception detail pages) ──────────────────────────

// Contract details for exception detail pages
export const exceptionContracts: Record<string, {
  contractNumber: string;
  vendor: string;
  cap: number;
  currentSpend: number;
  startDate: string;
  endDate: string;
  terms: string;
  rebateRate?: number;
  rebateThreshold?: number;
  rebateOwed?: number;
  tiers?: { label: string; maxQty: number; unitPrice: number }[];
  currentQty?: number;
}> = {
  "EX-001": {
    contractNumber: "CTR-2024-BIO-009",
    vendor: "BioMed Equipment Inc.",
    cap: 500000,
    currentSpend: 623890,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    terms: "Annual spend cap of $500,000. No auto-renewal clause. Contract expired Dec 31, 2025.",
  },
  "EX-004": {
    contractNumber: "CTR-2025-CAR-003",
    vendor: "Cardinal Health",
    cap: 1500000,
    currentSpend: 892400,
    startDate: "2025-04-01",
    endDate: "2026-03-31",
    terms: "Quarterly rebate of 8.5% on pharmaceutical spend exceeding $200K.",
    rebateRate: 8.5,
    rebateThreshold: 200000,
    rebateOwed: 89430,
  },
  "EX-005": {
    contractNumber: "CTR-2025-CAR-003",
    vendor: "Cardinal Health",
    cap: 1500000,
    currentSpend: 892400,
    startDate: "2025-04-01",
    endDate: "2026-03-31",
    terms: "Tiered pricing: $85/unit up to 1,000 units/month, $72/unit above 1,000.",
    tiers: [
      { label: "Tier 1", maxQty: 1000, unitPrice: 85.00 },
      { label: "Tier 2", maxQty: 999999, unitPrice: 72.00 },
    ],
    currentQty: 2340,
  },
  "EX-009": {
    contractNumber: "CTR-2025-VZT-002",
    vendor: "Vizient Inc.",
    cap: 500000,
    currentSpend: 94200,
    startDate: "2025-01-01",
    endDate: "2026-12-31",
    terms: "7.25% rebate on spend above $80K/quarter. 3% early-payment discount on all invoices.",
    rebateRate: 7.25,
    rebateThreshold: 80000,
    rebateOwed: 6850,
  },
};

// Duplicate pair mapping for duplicate exceptions
export const exceptionDuplicates: Record<string, string> = {
  "EX-002": "DUP-001",
  "EX-008": "DUP-002",
};

// ─── DUPLICATE PAIRS ──────────────────────────────────────────────────────────

export const duplicatePairs: DuplicatePair[] = [
  {
    id: "DUP-001",
    vendor: "MedSupply Corp",
    invoice1: {
      number: "MS-2026-0847",
      date: "2026-01-15",
      amount: 47120,
      submittedVia: "Postal Mail",
    },
    invoice2: {
      number: "MS-2026-0923",
      date: "2026-01-21",
      amount: 47320,
      submittedVia: "Email Attachment",
    },
    similarity: 99.6,
    amountDelta: 200,
    daysDelta: 6,
    flaggedAmount: 47320,
    status: "open",
  },
  {
    id: "DUP-002",
    vendor: "Henry Schein",
    invoice1: {
      number: "HS-2026-77298",
      date: "2026-01-26",
      amount: 8750,
      submittedVia: "EDI",
    },
    invoice2: {
      number: "HS-2026-77341",
      date: "2026-01-30",
      amount: 8750,
      submittedVia: "Email Attachment",
    },
    similarity: 100,
    amountDelta: 0,
    daysDelta: 4,
    flaggedAmount: 8750,
    status: "resolved",
  },
  {
    id: "DUP-003",
    vendor: "Owens & Minor",
    invoice1: {
      number: "OM-2026-38781",
      date: "2026-02-28",
      amount: 12340,
      submittedVia: "Email Attachment",
    },
    invoice2: {
      number: "OM-2026-38920",
      date: "2026-03-05",
      amount: 12580,
      submittedVia: "Vendor Portal",
    },
    similarity: 97.8,
    amountDelta: 240,
    daysDelta: 5,
    flaggedAmount: 12580,
    status: "under_review",
  },
];

// ─── CONTRACTS ────────────────────────────────────────────────────────────────

export const contracts: Contract[] = [
  {
    id: "CTR-2024-BIO-009",
    vendor: "BioMed Equipment Inc.",
    contractNumber: "CTR-2024-BIO-009",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    capType: "value",
    capValue: 500000,
    currentSpend: 623890,
    status: "breached",
    category: "Medical Equipment",
  },
  {
    id: "CTR-2025-CAR-003",
    vendor: "Cardinal Health",
    contractNumber: "CTR-2025-CAR-003",
    startDate: "2025-04-01",
    endDate: "2026-03-31",
    capType: "value",
    capValue: 1500000,
    currentSpend: 892400,
    rebateRate: 8.5,
    rebateThreshold: 200000,
    rebateApplied: 0,
    rebateMissed: 89430,
    tieredPricing: [
      { upToQty: 1000, unitPrice: 85 },
      { upToQty: 999999, unitPrice: 72 },
    ],
    status: "warning",
    category: "Pharmaceuticals",
  },
  {
    id: "CTR-2025-MED-001",
    vendor: "MedSupply Corp",
    contractNumber: "CTR-2025-MED-001",
    startDate: "2025-01-01",
    endDate: "2026-12-31",
    capType: "both",
    capValue: 800000,
    currentSpend: 342100,
    capQuantity: 50000,
    currentQuantity: 28400,
    status: "compliant",
    category: "Surgical Supplies",
  },
  {
    id: "CTR-2025-STE-007",
    vendor: "Steris Corporation",
    contractNumber: "CTR-2025-STE-007",
    startDate: "2025-06-01",
    endDate: "2026-05-31",
    capType: "value",
    capValue: 300000,
    currentSpend: 228750,
    status: "warning",
    category: "Sterilization",
  },
  {
    id: "CTR-2025-VZT-002",
    vendor: "Vizient Inc.",
    contractNumber: "CTR-2025-VZT-002",
    startDate: "2025-01-01",
    endDate: "2026-12-31",
    capType: "value",
    capValue: 500000,
    currentSpend: 94200,
    rebateRate: 7.25,
    rebateThreshold: 80000,
    rebateApplied: 0,
    rebateMissed: 6850,
    status: "compliant",
    category: "GPO — General",
  },
];

// ─── RECOVERY WORKFLOW ───────────────────────────────────────────────────────

export type RecoveryStatus = "pending" | "in_progress" | "recovered" | "partial" | "closed";

export interface RecoveryRecord {
  id: string;
  exceptionId: string;
  vendor: string;
  invoiceNumber: string;
  targetAmount: number;
  status: RecoveryStatus;
  initiatedAt: string;
  emailSentTo: string;
  recoveredAmount?: number;
  closedReason?: string;
  analystNote?: string;
}

let _recoveryCounter = 14;

export const recoveryQueue: RecoveryRecord[] = [
  // ── In Progress ──────────────────────────────────────────────────────────
  {
    id: "REC-001",
    exceptionId: "EX-001",
    vendor: "BioMed Equipment Inc.",
    invoiceNumber: "BME-2026-Q1-047",
    targetAmount: 123890,
    status: "in_progress",
    initiatedAt: "2026-03-29T09:14:00Z",
    emailSentTo: "ar@biomed-equipment.com",
    analystNote: "Contract overage $123,890. Escalated to procurement director. BioMed acknowledged receipt — awaiting credit memo.",
  },
  {
    id: "REC-005",
    exceptionId: "EX-007",
    vendor: "Medline Industries",
    invoiceNumber: "MDL-2026-44821",
    targetAmount: 14200,
    status: "in_progress",
    initiatedAt: "2026-03-12T14:05:00Z",
    emailSentTo: "billing@medline.com",
    analystNote: "Quantity overbilling 65 units × $218.46. Medline dispute team reviewing. Response expected within 5 business days.",
  },
  {
    id: "REC-009",
    exceptionId: "EX-002",
    vendor: "MedSupply Corp",
    invoiceNumber: "MS-2026-0923",
    targetAmount: 47320,
    status: "in_progress",
    initiatedAt: "2026-01-23T08:50:00Z",
    emailSentTo: "billing@medsupplycorp.com",
    analystNote: "Duplicate invoice MS-2026-0923. MedSupply confirmed duplicate — partial credit $30,000 received. Balance $17,320 under dispute.",
    recoveredAmount: 30000,
  },
  {
    id: "REC-012",
    exceptionId: "EX-006",
    vendor: "Steris Corporation",
    invoiceNumber: "STC-2026-19847",
    targetAmount: 4600,
    status: "in_progress",
    initiatedAt: "2026-03-01T10:45:00Z",
    emailSentTo: "ap@steris.com",
    analystNote: "Price mismatch STE-4821-A: $2.10 contracted vs $2.50 billed. Steris finance team reviewing. 500 units × $0.40 = $200 confirmed; remaining 22 invoices under review.",
    recoveredAmount: 200,
  },
  // ── Pending ───────────────────────────────────────────────────────────────
  {
    id: "REC-004",
    exceptionId: "EX-005",
    vendor: "Cardinal Health",
    invoiceNumber: "CH-2026-0341",
    targetAmount: 52260,
    status: "pending",
    initiatedAt: "2026-04-05T14:20:00Z",
    emailSentTo: "contracts@cardinalhealth.com",
    analystNote: "Tier 2 pricing dispute. Recovery Agent flagged 3-month pattern ($17,420/mo). Awaiting vendor acknowledgement.",
  },
  {
    id: "REC-010",
    exceptionId: "EX-009",
    vendor: "Vizient Inc.",
    invoiceNumber: "VZT-2026-Q1",
    targetAmount: 6850,
    status: "pending",
    initiatedAt: "2026-04-02T09:00:00Z",
    emailSentTo: "gpo-rebates@vizient.com",
    analystNote: "GPO rebate shortfall $1,030 + early-payment discount $5,820. Vizient portal claim submitted — confirmation pending.",
  },
  {
    id: "REC-013",
    exceptionId: "EX-003",
    vendor: "MedTech Solutions LLC",
    invoiceNumber: "MTS-INV-00291",
    targetAmount: 45200,
    status: "pending",
    initiatedAt: "2026-02-16T11:30:00Z",
    emailSentTo: "accounts@medtechsolutions.net",
    analystNote: "Ghost vendor — no PO, not in approved master. Legal hold placed. Compliance referral submitted. Payment blocked pending investigation.",
  },
  // ── Partial ───────────────────────────────────────────────────────────────
  {
    id: "REC-002",
    exceptionId: "EX-004",
    vendor: "Cardinal Health",
    invoiceNumber: "CH-Q1-2026-REBATE",
    targetAmount: 89430,
    status: "partial",
    initiatedAt: "2026-04-02T11:30:00Z",
    emailSentTo: "rebates@cardinalhealth.com",
    recoveredAmount: 26554,
    closedReason: "Partially Recovered",
    analystNote: "Q1 rebate $26,554 received (credit memo CH-CM-2026-Q1). Volume discount $62,876 still outstanding — Cardinal disputes calculation methodology.",
  },
  {
    id: "REC-007",
    exceptionId: "EX-002",
    vendor: "MedSupply Corp",
    invoiceNumber: "MS-2026-0847",
    targetAmount: 47120,
    status: "partial",
    initiatedAt: "2026-01-18T09:00:00Z",
    emailSentTo: "ar@medsupplycorp.com",
    recoveredAmount: 39200,
    closedReason: "Partially Recovered",
    analystNote: "Original duplicate pair. $39,200 recovered via credit reversal. $7,920 shipping/handling dispute ongoing with MedSupply legal team.",
  },
  {
    id: "REC-011",
    exceptionId: "EX-007",
    vendor: "Medline Industries",
    invoiceNumber: "MDL-2026-44390",
    targetAmount: 8900,
    status: "partial",
    initiatedAt: "2026-02-20T13:15:00Z",
    emailSentTo: "billing@medline.com",
    recoveredAmount: 5400,
    closedReason: "Partially Recovered",
    analystNote: "Earlier Medline qty dispute. $5,400 credit received for confirmed short-ships. $3,500 residual pending warehouse sign-off.",
  },
  // ── Recovered ─────────────────────────────────────────────────────────────
  {
    id: "REC-003",
    exceptionId: "EX-008",
    vendor: "Henry Schein",
    invoiceNumber: "HS-2026-77341",
    targetAmount: 8750,
    status: "recovered",
    initiatedAt: "2026-02-01T10:00:00Z",
    emailSentTo: "billing@henryschein.com",
    recoveredAmount: 8750,
    closedReason: "Fully Recovered",
    analystNote: "Duplicate invoice fully reversed. Credit memo HS-CM-2026-077 received and applied. Case closed.",
  },
  {
    id: "REC-006",
    exceptionId: "EX-010",
    vendor: "Owens & Minor",
    invoiceNumber: "OM-2026-38920",
    targetAmount: 3890,
    status: "recovered",
    initiatedAt: "2026-02-07T08:30:00Z",
    emailSentTo: "creditmemos@owensandminor.com",
    recoveredAmount: 3890,
    closedReason: "Fully Recovered",
    analystNote: "UOM mismatch credit memo OM-CM-0038 received. $3,890 applied to open balance. Resolved in 2 business days.",
  },
  {
    id: "REC-008",
    exceptionId: "EX-009",
    vendor: "Vizient Inc.",
    invoiceNumber: "VZT-2025-Q4",
    targetAmount: 5200,
    status: "recovered",
    initiatedAt: "2026-01-10T09:00:00Z",
    emailSentTo: "gpo-rebates@vizient.com",
    recoveredAmount: 5200,
    closedReason: "Fully Recovered",
    analystNote: "Q4 2025 GPO rebate $5,200 received via Vizient portal payment VZT-PAY-2026-0012.",
  },
  // ── Closed ────────────────────────────────────────────────────────────────
  {
    id: "REC-014",
    exceptionId: "EX-003",
    vendor: "MedTech Solutions LLC",
    invoiceNumber: "MTS-INV-00187",
    targetAmount: 12400,
    status: "closed",
    initiatedAt: "2025-11-15T10:00:00Z",
    emailSentTo: "accounts@medtechsolutions.net",
    recoveredAmount: 0,
    closedReason: "Vendor Filed Dispute",
    analystNote: "Prior MedTech suspicious invoice. Vendor disputed all charges. Legal escalation not pursued — amount below litigation threshold. Written off per AP policy.",
  },
];

export function addToRecoveryQueue(record: Omit<RecoveryRecord, "id">): RecoveryRecord {
  _recoveryCounter += 1;
  const r: RecoveryRecord = { ...record, id: `REC-${String(_recoveryCounter).padStart(3, "0")}` };
  recoveryQueue.unshift(r);
  return r;
}

export function updateRecoveryRecord(id: string, patch: Partial<RecoveryRecord>): void {
  const idx = recoveryQueue.findIndex((r) => r.id === id);
  if (idx !== -1) Object.assign(recoveryQueue[idx], patch);
}

// ─── KPI SUMMARY ─────────────────────────────────────────────────────────────

export const kpiSummary = {
  totalInvoicesProcessed: 1847,
  totalExceptions: 10,
  openExceptions: 5,
  totalFlagged: 396390,
  totalRecovered: 12640, // resolved exceptions: EX-008 ($8,750) + EX-010 ($3,890)
  duplicatesBlocked: 2,
  contractsAtRisk: 3, // 1 breached + 2 warning
  avgProcessingTime: 2.4, // hours
  vendorsScanned: 5,
};

// ─── CHART DATA ───────────────────────────────────────────────────────────────

export const exceptionsByMonth = [
  { month: "Jan", duplicate: 2, match_exception: 0, missing_rebate: 0, suspicious: 0, tier_pricing: 0, contract_overage: 0 },
  { month: "Feb", duplicate: 0, match_exception: 2, missing_rebate: 0, suspicious: 1, tier_pricing: 0, contract_overage: 0 },
  { month: "Mar", duplicate: 0, match_exception: 1, missing_rebate: 2, suspicious: 0, tier_pricing: 1, contract_overage: 1 },
];

export const flaggedByType = [
  { name: "Contract Overage", value: 123890, color: "#ef4444" },
  { name: "Missing Rebate", value: 96280, color: "#f59e0b" },
  { name: "Tier Pricing", value: 52260, color: "#8b5cf6" },
  { name: "Suspicious Invoice", value: 45200, color: "#ef4444" },
  { name: "Duplicate Billing", value: 56070, color: "#f97316" },
  { name: "Match Exception", value: 22690, color: "#3b82f6" },
];

export const spendTrend = [
  { month: "Apr '25", spend: 1420000, exceptions: 24800 },
  { month: "May '25", spend: 1385000, exceptions: 19200 },
  { month: "Jun '25", spend: 1510000, exceptions: 31400 },
  { month: "Jul '25", spend: 1298000, exceptions: 18600 },
  { month: "Aug '25", spend: 1367000, exceptions: 22100 },
  { month: "Sep '25", spend: 1445000, exceptions: 28900 },
  { month: "Oct '25", spend: 1520000, exceptions: 34200 },
  { month: "Nov '25", spend: 1612000, exceptions: 41800 },
  { month: "Dec '25", spend: 1834000, exceptions: 52600 },
  { month: "Jan '26", spend: 1590000, exceptions: 48100 },
  { month: "Feb '26", spend: 1471000, exceptions: 38700 },
  { month: "Mar '26", spend: 1680000, exceptions: 57300 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── VENDOR SCORING ──────────────────────────────────────────────────────────

export interface VendorScore {
  id: string;
  name: string;
  totalInvoices: number;
  totalSpend: number;
  discrepancyAmount: number;
  discrepancyPct: number;
  score: number;
  rating: "Critical" | "High Risk" | "Medium Risk" | "Low Risk";
  recoveryPct: number;
  exceptions: { id: string; type: string; amount: number; date: string; description: string }[];
}

export const vendorScores: VendorScore[] = [
  {
    id: "VS-001", name: "MedTech Solutions LLC", totalInvoices: 1, totalSpend: 45200, discrepancyAmount: 45200, discrepancyPct: 100.0, score: 5, rating: "Critical", recoveryPct: 0,
    exceptions: [
      { id: "EX-003", type: "Suspicious Invoice", amount: 45200, date: "2026-02-14", description: "No PO found. Vendor not in approved master. Bank account differs from known vendor records." },
    ],
  },
  {
    id: "VS-002", name: "MedSupply Corp", totalInvoices: 12, totalSpend: 94440, discrepancyAmount: 47320, discrepancyPct: 50.1, score: 22, rating: "Critical", recoveryPct: 65,
    exceptions: [
      { id: "EX-002", type: "Duplicate Billing", amount: 47320, date: "2026-01-21", description: "Near-duplicate of MS-2026-0847 ($47,120). Amount altered by $200 (0.42%)." },
    ],
  },
  {
    id: "VS-003", name: "BioMed Equipment Inc.", totalInvoices: 23, totalSpend: 623890, discrepancyAmount: 123890, discrepancyPct: 19.9, score: 30, rating: "High Risk", recoveryPct: 80,
    exceptions: [
      { id: "EX-001", type: "Contract Overage", amount: 123890, date: "2026-03-28", description: "Spend exceeded $500K annual cap by $123,890. Contract CTR-2024-BIO-009 expired." },
    ],
  },
  {
    id: "VS-004", name: "Cardinal Health", totalInvoices: 47, totalSpend: 892400, discrepancyAmount: 141690, discrepancyPct: 15.9, score: 35, rating: "High Risk", recoveryPct: 72,
    exceptions: [
      { id: "EX-004", type: "Missing Rebate", amount: 89430, date: "2026-03-31", description: "Q1 rebate of $26,554 not applied. Volume discount adjustments of $62,876 outstanding." },
      { id: "EX-005", type: "Tier Pricing Error", amount: 52260, date: "2026-03-15", description: "Billed at $85/unit (Tier 1) instead of $72/unit (Tier 2) for 2,340 units. 3 months × $17,420 = $52,260." },
    ],
  },
  {
    id: "VS-005", name: "Henry Schein", totalInvoices: 8, totalSpend: 70000, discrepancyAmount: 8750, discrepancyPct: 12.5, score: 55, rating: "Medium Risk", recoveryPct: 100,
    exceptions: [
      { id: "EX-008", type: "Duplicate Billing", amount: 8750, date: "2026-01-30", description: "Exact duplicate invoice. Same amount, same line items, submitted 4 days apart." },
    ],
  },
  {
    id: "VS-006", name: "Vizient Inc.", totalInvoices: 12, totalSpend: 94200, discrepancyAmount: 6850, discrepancyPct: 7.3, score: 65, rating: "Low Risk", recoveryPct: 100,
    exceptions: [
      { id: "EX-009", type: "Missing Rebate", amount: 6850, date: "2026-03-31", description: "7.25% rebate on $14,200 excess ($1,030) plus 3% early payment discount on $194K ($5,820)." },
    ],
  },
  {
    id: "VS-007", name: "Steris Corporation", totalInvoices: 23, totalSpend: 228750, discrepancyAmount: 4600, discrepancyPct: 2.0, score: 72, rating: "Low Risk", recoveryPct: 45,
    exceptions: [
      { id: "EX-006", type: "Match Exception", amount: 4600, date: "2026-02-28", description: "Price mismatch on STE-4821-A. PO: $2.10/unit, Invoice: $2.50/unit. 23 occurrences." },
    ],
  },
  {
    id: "VS-008", name: "Owens & Minor", totalInvoices: 15, totalSpend: 84000, discrepancyAmount: 3890, discrepancyPct: 4.6, score: 75, rating: "Low Risk", recoveryPct: 100,
    exceptions: [
      { id: "EX-010", type: "Match Exception", amount: 3890, date: "2026-02-05", description: "UOM mismatch. PO ordered 'cases', invoice billed 'cartons' at higher per-unit price." },
    ],
  },
  {
    id: "VS-009", name: "Medline Industries", totalInvoices: 18, totalSpend: 156000, discrepancyAmount: 14200, discrepancyPct: 9.1, score: 58, rating: "Medium Risk", recoveryPct: 60,
    exceptions: [
      { id: "EX-007", type: "Match Exception", amount: 14200, date: "2026-03-10", description: "Multiple line item quantity mismatches across 3 invoices. Total variance: $14,200." },
    ],
  },
  {
    id: "VS-010", name: "Stryker Medical", totalInvoices: 31, totalSpend: 412000, discrepancyAmount: 18540, discrepancyPct: 4.5, score: 68, rating: "Low Risk", recoveryPct: 88,
    exceptions: [
      { id: "EX-011", type: "Match Exception", amount: 18540, date: "2026-02-18", description: "Unit price variance on surgical instruments — PO $142/unit vs invoice $148/unit across 31 items." },
    ],
  },
  {
    id: "VS-011", name: "Baxter Healthcare", totalInvoices: 44, totalSpend: 287600, discrepancyAmount: 9420, discrepancyPct: 3.3, score: 74, rating: "Low Risk", recoveryPct: 100,
    exceptions: [
      { id: "EX-012", type: "Duplicate Billing", amount: 9420, date: "2026-01-08", description: "Duplicate IV solution order HS code BX-IV-2026-0108 submitted twice. Second blocked by system." },
    ],
  },
  {
    id: "VS-012", name: "Becton Dickinson", totalInvoices: 19, totalSpend: 156800, discrepancyAmount: 22100, discrepancyPct: 14.1, score: 38, rating: "High Risk", recoveryPct: 55,
    exceptions: [
      { id: "EX-013", type: "Tier Pricing Error", amount: 22100, date: "2026-03-05", description: "Billed Tier 1 syringe pricing on 18,000-unit order qualifying for Tier 3 rate. $1.23/unit delta." },
    ],
  },
  {
    id: "VS-013", name: "Johnson & Johnson MedTech", totalInvoices: 28, totalSpend: 634200, discrepancyAmount: 31800, discrepancyPct: 5.0, score: 61, rating: "Medium Risk", recoveryPct: 70,
    exceptions: [
      { id: "EX-014", type: "Contract Overage", amount: 24600, date: "2026-03-22", description: "Q1 spend $634K vs $600K contract cap. Overage $34K. Procurement notified." },
      { id: "EX-015", type: "Match Exception", amount: 7200, date: "2026-02-11", description: "Description mismatch on suture kits — invoice lists 'enhanced' variant not in PO specification." },
    ],
  },
  {
    id: "VS-014", name: "Abbott Laboratories", totalInvoices: 22, totalSpend: 198400, discrepancyAmount: 5870, discrepancyPct: 3.0, score: 78, rating: "Low Risk", recoveryPct: 100,
    exceptions: [
      { id: "EX-016", type: "Missing Rebate", amount: 5870, date: "2026-03-31", description: "Q1 reagent volume rebate 3.2% on $183K spend = $5,870. Not applied to March statement." },
    ],
  },
  {
    id: "VS-015", name: "McKesson Medical-Surgical", totalInvoices: 67, totalSpend: 923100, discrepancyAmount: 84200, discrepancyPct: 9.1, score: 29, rating: "High Risk", recoveryPct: 62,
    exceptions: [
      { id: "EX-017", type: "Contract Overage", amount: 72400, date: "2026-03-28", description: "Annual supply contract cap $850K exceeded by $72,400. 3 purchase orders processed post-breach." },
      { id: "EX-018", type: "Tier Pricing Error", amount: 11800, date: "2026-02-28", description: "Glove pricing billed at catalogue rate, not contracted GPO rate. Delta $0.23/pair × 51,300 pairs." },
    ],
  },
  {
    id: "VS-016", name: "Philips Healthcare", totalInvoices: 8, totalSpend: 344000, discrepancyAmount: 14400, discrepancyPct: 4.2, score: 65, rating: "Low Risk", recoveryPct: 100,
    exceptions: [
      { id: "EX-019", type: "Match Exception", amount: 14400, date: "2026-01-29", description: "Maintenance contract invoice includes 2 service visits not authorised in PO. $7,200 each." },
    ],
  },
  {
    id: "VS-017", name: "Zimmer Biomet", totalInvoices: 5, totalSpend: 287500, discrepancyAmount: 41300, discrepancyPct: 14.4, score: 33, rating: "High Risk", recoveryPct: 35,
    exceptions: [
      { id: "EX-020", type: "Suspicious Invoice", amount: 41300, date: "2026-02-20", description: "Invoice for orthopaedic implant consignment: PO references a contract number that expired Dec 2025. No renewal on file." },
    ],
  },
  {
    id: "VS-018", name: "Teleflex Medical", totalInvoices: 14, totalSpend: 89600, discrepancyAmount: 4280, discrepancyPct: 4.8, score: 71, rating: "Low Risk", recoveryPct: 90,
    exceptions: [
      { id: "EX-021", type: "Duplicate Billing", amount: 4280, date: "2026-03-14", description: "Vascular access kit invoice duplicated across two cost centres. $2,140 each. One reversed." },
    ],
  },
];

export const severityConfig: Record<Severity, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: "Critical", color: "#ef4444", bg: "#fef2f2", dot: "bg-red-500" },
  high: { label: "High", color: "#f59e0b", bg: "#fffbeb", dot: "bg-amber-500" },
  medium: { label: "Medium", color: "#3b82f6", bg: "#eff6ff", dot: "bg-blue-500" },
  low: { label: "Low", color: "#6b7280", bg: "#f9fafb", dot: "bg-gray-400" },
};

export const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: "#ef4444", bg: "#fef2f2" },
  under_review: { label: "Under Review", color: "#f59e0b", bg: "#fffbeb" },
  escalated: { label: "Escalated", color: "#8b5cf6", bg: "#f5f3ff" },
  resolved: { label: "Resolved", color: "#10b981", bg: "#ecfdf5" },
};

export const typeConfig: Record<ExceptionType, { label: string; icon: string }> = {
  duplicate: { label: "Duplicate Billing", icon: "Copy" },
  match_exception: { label: "Match Exception", icon: "GitCompare" },
  missing_rebate: { label: "Missing Rebate", icon: "Tag" },
  contract_overage: { label: "Contract Overage", icon: "AlertTriangle" },
  suspicious_invoice: { label: "Suspicious Invoice", icon: "ShieldAlert" },
  tier_pricing: { label: "Tier Pricing Error", icon: "Layers" },
  // SOM types — flow into unified inbox per plan §5.4
  som_address_mismatch: { label: "Address Mismatch", icon: "MapPin" },
  som_license_invalid: { label: "License Invalid", icon: "ScrollText" },
  som_price_deviation: { label: "Price Deviation", icon: "DollarSign" },
  som_quantity_outlier: { label: "Volume Outlier", icon: "BarChart3" },
};

// ─── BULK EXCEPTIONS — scaled dataset (15% of 1,847 invoices ≈ 277) ──────────
// These lightweight records fill the exceptions queue to production scale.
// Detail pages only route to the rich EX-001..EX-010 records above.

const VENDORS = [
  "Cardinal Health", "Medline Industries", "Owens & Minor", "Henry Schein",
  "Steris Corporation", "BioMed Equipment Inc.", "MedSupply Corp",
  "Vizient Inc.", "Becton Dickinson", "Stryker Medical", "Baxter Healthcare",
  "Johnson & Johnson MedTech", "Abbott Laboratories",
];

const TYPES: ExceptionType[] = [
  "duplicate", "match_exception", "missing_rebate",
  "contract_overage", "tier_pricing", "suspicious_invoice",
];

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const STATUSES: Status[] = ["open", "under_review", "escalated", "resolved"];

function seed(n: number) {
  let x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
}

function pickSeeded<T>(arr: T[], n: number): T {
  return arr[Math.floor(seed(n) * arr.length)];
}

function fmtInvoiceNum(vendor: string, idx: number): string {
  const prefix = vendor.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 3);
  return `${prefix}-2026-${String(idx + 1000).padStart(5, "0")}`;
}

function isoDate(dayOfYear: number): string {
  const d = new Date(2026, 0, 1);
  d.setDate(d.getDate() + (dayOfYear % 89));
  return d.toISOString().split("T")[0];
}

function flaggedAmt(type: ExceptionType, i: number): number {
  const base: Record<ExceptionType, number> = {
    duplicate: 8000, match_exception: 3500, missing_rebate: 12000,
    contract_overage: 25000, tier_pricing: 9000, suspicious_invoice: 18000,
    som_address_mismatch: 2000, som_license_invalid: 5000,
    som_price_deviation: 6000, som_quantity_outlier: 14000,
  };
  return Math.round(base[type] * (0.6 + seed(i + 50) * 0.9));
}

function descFor(type: ExceptionType, vendor: string): string {
  const map: Record<ExceptionType, string> = {
    duplicate: `Duplicate invoice detected for ${vendor}. Same PO reference, amount delta < 0.5%.`,
    match_exception: `Three-way match failed for ${vendor}. Price or quantity variance exceeds 5% tolerance.`,
    missing_rebate: `Quarterly rebate not applied for ${vendor}. Contract terms require volume discount adjustment.`,
    contract_overage: `Spend cap breached for ${vendor}. Contract annual limit exceeded by flagged amount.`,
    tier_pricing: `Tier pricing error for ${vendor}. Billed at Tier 1 rate despite volume qualifying for Tier 2.`,
    suspicious_invoice: `Suspicious invoice from ${vendor}. PO reference missing or vendor not in approved master list.`,
    som_address_mismatch: `Address mismatch for ${vendor}. Geocoded location does not match declared address.`,
    som_license_invalid: `License validation failed for ${vendor}. State board record shows expired or inactive permit.`,
    som_price_deviation: `Price deviation for ${vendor}. Ordered unit price exceeds contracted rate by >10%.`,
    som_quantity_outlier: `Volume outlier for ${vendor}. Order quantity exceeds 3x monthly baseline.`,
  };
  return map[type];
}

export const bulkExceptions: Exception[] = Array.from({ length: 174 }, (_, i) => {
  const idx = i + 11;
  const vendor = pickSeeded(VENDORS, i * 7);
  const type = pickSeeded(TYPES, i * 3);
  const severityIdx = Math.floor(seed(i * 5) * 4);
  const severity = SEVERITIES[severityIdx];
  const statusIdx = Math.floor(seed(i * 11) * 4);
  const status = STATUSES[statusIdx];
  return {
    id: `EX-${String(idx).padStart(3, "0")}`,
    type,
    severity,
    status,
    vendor,
    invoiceNumber: fmtInvoiceNum(vendor, idx),
    invoiceDate: isoDate(i * 2),
    amount: flaggedAmt(type, i) * (1 + Math.floor(seed(i * 13) * 8)),
    flaggedAmount: flaggedAmt(type, i),
    description: descFor(type, vendor),
    detectedAt: `2026-${String(1 + Math.floor((i % 89) / 30)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}T${String(8 + (i % 10)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}:00Z`,
  };
});

export const allExceptions: Exception[] = [...exceptions, ...bulkExceptions];
