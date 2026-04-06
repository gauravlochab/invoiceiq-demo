// ─── NORTHFIELD MEDICAL CENTER — DEMO DATA ───────────────────────────────────
// Q1 2026 Invoice Intelligence Demo
// Total exceptions caught: $392,720

export type Severity = "critical" | "high" | "medium" | "low";
export type ExceptionType =
  | "duplicate"
  | "match_exception"
  | "missing_rebate"
  | "contract_overage"
  | "suspicious_invoice"
  | "tier_pricing";
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
  poQty: number;
  poUnitPrice: number;
  invoiceQty: number;
  invoiceUnitPrice: number;
  packingSlipQty: number;
  status: "match" | "price_mismatch" | "qty_mismatch" | "both_mismatch";
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
    assignee: "Sarah Chen",
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
    assignee: "Sarah Chen",
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
    flaggedAmount: 52680,
    description:
      "Contract specifies tiered pricing: $85/unit ≤1,000 units/month, $72/unit >1,000 units/month. March order: 2,340 units. Invoice billed all 2,340 units at $85 = $198,900. Correct: 1,000×$85 + 1,340×$72 = $181,480. Overcharge: $17,420. Same error repeated across 3 prior months: total $52,680.",
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
    amount: 28750,
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
    amount: 22400,
    flaggedAmount: 14200,
    description:
      "Quantity mismatch: PO authorised 300 units of exam gloves, packing slip confirms 300 delivered, but invoice bills 365 units. 65 units unbilled in PO. $14,200 overbilled.",
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
    assignee: "Sarah Chen",
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
    flaggedAmount: 6840,
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
    amount: 5600,
    flaggedAmount: 3890,
    description:
      "Unit of measure mismatch. PO ordered 24 'cases' of IV tubing. Invoice billed 24 'cartons' at a higher per-unit price. Price variance: $3,890. Resolved: vendor issued credit memo.",
    detectedAt: "2026-02-06T08:30:00Z",
    assignee: "Sarah Chen",
  },
];

// ─── THREE-WAY MATCH DETAIL (for EX-006 Steris) ──────────────────────────────

export const sterisLineItems: InvoiceLineItem[] = [
  {
    itemCode: "STE-4821-A",
    description: "Sterile Surgical Drape Set / Surgical Draping Kit Pro",
    poQty: 500,
    poUnitPrice: 2.1,
    invoiceQty: 500,
    invoiceUnitPrice: 2.5,
    packingSlipQty: 500,
    status: "price_mismatch",
  },
  {
    itemCode: "STE-2200-C",
    description: "Surgical Gowns Level 3 (XL)",
    poQty: 200,
    poUnitPrice: 8.75,
    invoiceQty: 200,
    invoiceUnitPrice: 8.75,
    packingSlipQty: 200,
    status: "match",
  },
  {
    itemCode: "STE-9940-B",
    description: "Disposable Face Shield Pro",
    poQty: 1000,
    poUnitPrice: 1.2,
    invoiceQty: 1000,
    invoiceUnitPrice: 1.2,
    packingSlipQty: 980,
    status: "qty_mismatch",
  },
  {
    itemCode: "STE-3310-D",
    description: "Sterile Gauze Pads 4x4 (pkg/100)",
    poQty: 150,
    poUnitPrice: 14.5,
    invoiceQty: 150,
    invoiceUnitPrice: 14.5,
    packingSlipQty: 150,
    status: "match",
  },
];

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
    rebateMissed: 6840,
    status: "compliant",
    category: "GPO — General",
  },
];

// ─── KPI SUMMARY ─────────────────────────────────────────────────────────────

export const kpiSummary = {
  totalInvoicesProcessed: 1847,
  totalExceptions: 10,
  openExceptions: 7,
  totalFlagged: 392720,
  totalRecovered: 56670, // resolved exceptions
  duplicatesBlocked: 2,
  contractsAtRisk: 2,
  avgProcessingTime: 2.4, // hours
  vendorsScanned: 5,
};

// ─── CHART DATA ───────────────────────────────────────────────────────────────

export const exceptionsByMonth = [
  { month: "Jan", duplicate: 2, match_exception: 1, missing_rebate: 0, suspicious: 1, tier_pricing: 0 },
  { month: "Feb", duplicate: 0, match_exception: 2, missing_rebate: 0, suspicious: 0, tier_pricing: 1 },
  { month: "Mar", duplicate: 1, match_exception: 1, missing_rebate: 2, suspicious: 0, tier_pricing: 2 },
];

export const flaggedByType = [
  { name: "Contract Overage", value: 123890, color: "#ef4444" },
  { name: "Missing Rebate", value: 89430, color: "#f59e0b" },
  { name: "Tier Pricing", value: 52680, color: "#8b5cf6" },
  { name: "Suspicious Invoice", value: 45200, color: "#ef4444" },
  { name: "Duplicate Billing", value: 56070, color: "#f97316" },
  { name: "Match Exception", value: 22690, color: "#3b82f6" },
];

export const spendTrend = [
  { month: "Oct '25", spend: 187400, exceptions: 18200 },
  { month: "Nov '25", spend: 214300, exceptions: 22100 },
  { month: "Dec '25", spend: 198700, exceptions: 19800 },
  { month: "Jan '26", spend: 312400, exceptions: 55870 },
  { month: "Feb '26", spend: 289100, exceptions: 63950 },
  { month: "Mar '26", spend: 334200, exceptions: 272900 },
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
};
