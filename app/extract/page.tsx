// [Spec: domains/extract/spec.md v2.0] — migrated to shadcn v2.0 design system.
// v1 surface/text/border tokens and white surfaces replaced with shadcn theme tokens;
// raw buttons → Button, .card → Card, .badge.* → Badge, .alert-bar → Alert,
// hand-rolled modal → Dialog, .section-label → real headings/muted labels.
// See spec CHANGELOG 2026-05-22. Behavior unchanged — design-system migration only.
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BorderBeam } from "@/components/magicui/border-beam";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import {
  FileText,
  Bot,
  BarChart3,
  AlertTriangle,
  Upload as UploadIcon,
  Eye,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

// Maps each invoice to its corresponding exception ID for deep-linking
const DOC_TO_EXCEPTION: Record<string, string> = {
  "invoice-STC-2026-19847":   "EX-006",
  "invoice-MS-2026-0923":     "EX-002",
  "invoice-MS-2026-0847":     "EX-002",
  "invoice-MTS-INV-00291":    "EX-003",
  "invoice-CH-2026-0341":     "EX-005",
  "invoice-CH-Q1-2026-REBATE":"EX-004",
  "invoice-BME-2026-Q1-047":  "EX-001",
  "invoice-MDL-2026-44821":   "EX-007",
  "invoice-HS-2026-77341":    "EX-008",
  "invoice-OM-2026-38920":    "EX-010",
};

// ── Types ────────────────────────────────────────────────────────────────────

interface Document {
  id: string;
  label: string;
  sub: string;
  type: "invoice" | "po" | "packing_slip";
  badge: "match_exception" | "duplicate" | "suspicious" | null;
}

interface LineItem {
  code: string;
  description: string;
  qty: number | string;
  unit_price: string;
  total: string;
}

interface ExtractedFlag {
  code: string;
  severity?: string;
}

interface ExtractedData {
  vendor?: {
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  billTo?: {
    name?: string;
    address?: string;
  };
  invoice?: {
    number?: string;
    date?: string;
    po_reference?: string;
    payment_terms?: string;
    total_amount?: string;
  };
  invoiceNumber?: string;
  invoiceDate?: string;
  poReference?: string;
  paymentTerms?: string;
  dueDate?: string;
  totalAmount?: string | number;
  lineItems?: Record<string, unknown>[];
  line_items?: LineItem[];
  flags?: ExtractedFlag[] | string[];
}

// ── Static data ─────────────────────────────────────────────────────────────

const initialDocuments: Document[] = [
  // ── Invoices ────────────────────────────────────────────────────────────────
  { id: "invoice-STC-2026-19847",      label: "Steris Corporation",       sub: "Invoice · Feb 28, 2026",  type: "invoice",      badge: "match_exception" },
  { id: "invoice-MS-2026-0847",         label: "MedSupply Corp",           sub: "Invoice · Jan 15, 2026",  type: "invoice",      badge: null },
  { id: "invoice-MS-2026-0923",         label: "MedSupply Corp",           sub: "Invoice · Jan 21, 2026",  type: "invoice",      badge: "duplicate" },
  { id: "invoice-MTS-INV-00291",        label: "MedTech Solutions",        sub: "Invoice · Feb 14, 2026",  type: "invoice",      badge: "suspicious" },
  { id: "invoice-CH-2026-0341",         label: "Cardinal Health",          sub: "Invoice · Mar 15, 2026",  type: "invoice",      badge: "match_exception" },
  { id: "invoice-CH-2026-0412",         label: "Cardinal Health",          sub: "Invoice · Mar 22, 2026",  type: "invoice",      badge: null },
  { id: "invoice-CH-Q1-2026-REBATE",    label: "Cardinal Health",          sub: "Invoice · Mar 31, 2026",  type: "invoice",      badge: null },
  { id: "invoice-BME-2026-Q1-047",      label: "BioMed Equipment Inc.",    sub: "Invoice · Mar 28, 2026",  type: "invoice",      badge: "match_exception" },
  { id: "invoice-BME-2026-Q1-031",      label: "BioMed Equipment Inc.",    sub: "Invoice · Feb 10, 2026",  type: "invoice",      badge: null },
  { id: "invoice-MDL-2026-44821",       label: "Medline Industries",       sub: "Invoice · Mar 10, 2026",  type: "invoice",      badge: "match_exception" },
  { id: "invoice-MDL-2026-44390",       label: "Medline Industries",       sub: "Invoice · Feb 18, 2026",  type: "invoice",      badge: null },
  { id: "invoice-HS-2026-77341",        label: "Henry Schein",             sub: "Invoice · Jan 30, 2026",  type: "invoice",      badge: "duplicate" },
  { id: "invoice-OM-2026-38920",        label: "Owens & Minor",       sub: "Invoice · Feb 05, 2026",  type: "invoice",      badge: "match_exception" },
  { id: "invoice-BD-2026-50112",        label: "Becton Dickinson",          sub: "Invoice · Jan 08, 2026",  type: "invoice",      badge: null },
  { id: "invoice-BD-2026-50287",        label: "Becton Dickinson",          sub: "Invoice · Feb 19, 2026",  type: "invoice",      badge: null },
  { id: "invoice-STR-2026-61034",       label: "Stryker Medical",           sub: "Invoice · Jan 22, 2026",  type: "invoice",      badge: null },
  { id: "invoice-STR-2026-61198",       label: "Stryker Medical",           sub: "Invoice · Mar 11, 2026",  type: "invoice",      badge: "match_exception" },
  { id: "invoice-BXH-2026-72041",       label: "Baxter Healthcare",         sub: "Invoice · Feb 03, 2026",  type: "invoice",      badge: null },
  { id: "invoice-BXH-2026-72355",       label: "Baxter Healthcare",         sub: "Invoice · Mar 18, 2026",  type: "invoice",      badge: null },
  { id: "invoice-JNJ-2026-83019",       label: "Johnson & Johnson MedTech", sub: "Invoice · Jan 14, 2026",  type: "invoice",      badge: null },
  { id: "invoice-JNJ-2026-83274",       label: "Johnson & Johnson MedTech", sub: "Invoice · Mar 05, 2026",  type: "invoice",      badge: null },
  { id: "invoice-ABT-2026-90421",       label: "Abbott Laboratories",       sub: "Invoice · Feb 11, 2026",  type: "invoice",      badge: null },
  { id: "invoice-GEH-2026-10538",       label: "GE Healthcare",             sub: "Invoice · Jan 29, 2026",  type: "invoice",      badge: null },
  { id: "invoice-GEH-2026-10742",       label: "GE Healthcare",             sub: "Invoice · Mar 24, 2026",  type: "invoice",      badge: "match_exception" },
  { id: "invoice-MKS-2026-21093",       label: "McKesson Medical-Surgical",  sub: "Invoice · Feb 07, 2026",  type: "invoice",      badge: null },
  { id: "invoice-MKS-2026-21340",       label: "McKesson Medical-Surgical",  sub: "Invoice · Mar 14, 2026",  type: "invoice",      badge: null },
  { id: "invoice-PHL-2026-31587",       label: "Philips Healthcare",        sub: "Invoice · Jan 19, 2026",  type: "invoice",      badge: null },
  { id: "invoice-ZBM-2026-40219",       label: "Zimmer Biomet",             sub: "Invoice · Feb 26, 2026",  type: "invoice",      badge: "duplicate" },
  { id: "invoice-TFX-2026-55034",       label: "Teleflex Medical",          sub: "Invoice · Mar 02, 2026",  type: "invoice",      badge: null },
  { id: "invoice-TFX-2026-55198",       label: "Teleflex Medical",          sub: "Invoice · Jan 11, 2026",  type: "invoice",      badge: null },
  { id: "invoice-CH-2026-0587",         label: "Cardinal Health",           sub: "Invoice · Feb 14, 2026",  type: "invoice",      badge: null },
  { id: "invoice-MDL-2026-44952",       label: "Medline Industries",        sub: "Invoice · Jan 27, 2026",  type: "invoice",      badge: "match_exception" },
  { id: "invoice-BME-2026-Q1-063",      label: "BioMed Equipment Inc.",     sub: "Invoice · Mar 21, 2026",  type: "invoice",      badge: null },
  { id: "invoice-HS-2026-77502",        label: "Henry Schein",              sub: "Invoice · Feb 09, 2026",  type: "invoice",      badge: null },
  { id: "invoice-OM-2026-39104",        label: "Owens & Minor",            sub: "Invoice · Mar 07, 2026",  type: "invoice",      badge: null },
  // ── Supporting Documents ────────────────────────────────────────────────────
  { id: "po-NMC-2026-PO-2847",          label: "Northfield Medical",       sub: "Purchase Order",               type: "po",           badge: null },
  { id: "packingslip-STC-PS-2026-0392", label: "Steris Corporation",       sub: "Packing Slip · Feb 25, 2026", type: "packing_slip", badge: null },
];

// ── Cached extraction results ────────────────────────────────────────────────

const CACHED_EXTRACTIONS: Record<string, ExtractedData> = {
  "invoice-STC-2026-19847": {
    vendor: { name: "Steris Corporation", address: "5960 Heisley Road, Mentor, OH 44060", email: "invoices@steris.com", phone: "(440) 555-0198" },
    billTo: { name: "Northfield Medical Center", address: "8900 N Michigan Ave, Chicago, IL 60611" },
    invoiceNumber: "STC-2026-19847",
    invoiceDate: "February 28, 2026",
    poReference: "NMC-PO-2026-2847",
    paymentTerms: "Net 30",
    dueDate: "March 30, 2026",
    totalAmount: 27750.00,
    lineItems: [
      { itemCode: "STE-4821-A", description: "Surgical Draping Kit Pro - Sterile (individually wrapped)", quantity: 500, unit: "ea", unitPrice: 2.50, total: 1250.00 },
      { itemCode: "STE-2200-C", description: "Surgical Isolation Gown AAMI Level 3 XL", quantity: 800, unit: "ea", unitPrice: 8.75, total: 7000.00 },
      { itemCode: "STE-9940-B", description: "Disposable Full-Face Shield with Anti-Fog Coating", quantity: 3000, unit: "ea", unitPrice: 1.20, total: 3600.00 },
      { itemCode: "STE-3310-D", description: "Sterile Gauze Pad 4x4 inch (pkg/100)", quantity: 500, unit: "pkg", unitPrice: 14.50, total: 7250.00 },
      { itemCode: "STE-7710-A", description: "Sterilization Wrap CSR 24x24 (case/500)", quantity: 1000, unit: "sheet", unitPrice: 4.85, total: 4850.00 },
      { itemCode: "STE-1100-C", description: "Bouffant Surgical Cap Disposable (case/100)", quantity: 2000, unit: "ea", unitPrice: 1.90, total: 3800.00 },
    ] as unknown as Record<string, unknown>[],
    flags: [
      { code: "price_mismatch", severity: "critical" },
      { code: "quantity_mismatch", severity: "warning" },
    ],
  },
  "invoice-MS-2026-0923": {
    vendor: { name: "MedSupply Corp", address: "2100 Commerce Dr, Suite 400, Chicago, IL 60607", email: "billing@medsupplycorp.com", phone: "(312) 555-0198" },
    billTo: { name: "Northfield Medical Center", address: "8900 N Michigan Ave, Chicago, IL 60611" },
    invoiceNumber: "MS-2026-0923",
    invoiceDate: "January 21, 2026",
    poReference: "NMC-PO-2026-0847",
    paymentTerms: "Net 30",
    dueDate: "February 20, 2026",
    totalAmount: 47320.00,
    lineItems: [
      { itemCode: "MSG-NL-100", description: "Surgical Gloves Nitrile L (Box/100)", quantity: 200, unit: "box", unitPrice: 24.50, total: 4900.00 },
      { itemCode: "SGP-44-200", description: "Sterile Gauze Pads 4x4", quantity: 500, unit: "box", unitPrice: 3.75, total: 1875.00 },
      { itemCode: "AW-200", description: "Antiseptic Wipes (Box/200)", quantity: 100, unit: "box", unitPrice: 18.90, total: 1890.00 },
      { itemCode: "DS-10-50", description: "Disposable Syringes 10mL (Box/50)", quantity: 300, unit: "box", unitPrice: 32.80, total: 9840.00 },
      { itemCode: "SM-N95-20", description: "Surgical Masks N95 (Box/20)", quantity: 150, unit: "box", unitPrice: 44.52, total: 6678.00 },
      { itemCode: "EGV-M-100", description: "Exam Gloves Vinyl M (Box/100)", quantity: 400, unit: "box", unitPrice: 12.50, total: 5000.00 },
      { itemCode: "AB-100", description: "Adhesive Bandages Assorted (Box/100)", quantity: 250, unit: "box", unitPrice: 8.40, total: 2100.00 },
      { itemCode: "CA-1000", description: "Cotton Applicators (Box/1000)", quantity: 100, unit: "box", unitPrice: 14.20, total: 1420.00 },
      { itemCode: "TPD-50", description: "Tongue Depressors (Box/500)", quantity: 80, unit: "box", unitPrice: 9.60, total: 768.00 },
      { itemCode: "SH-FEE", description: "Shipping & Handling", quantity: 1, unit: "lot", unitPrice: 12849.00, total: 12849.00 },
    ] as unknown as Record<string, unknown>[],
    flags: [
      { code: "duplicate_invoice", severity: "critical" },
    ],
  },
  "invoice-MS-2026-0847": {
    vendor: { name: "MedSupply Corp", address: "2100 Commerce Dr, Suite 400, Chicago, IL 60607", email: "billing@medsupplycorp.com", phone: "(312) 555-0198" },
    billTo: { name: "Northfield Medical Center", address: "8900 N Michigan Ave, Chicago, IL 60611" },
    invoiceNumber: "MS-2026-0847",
    invoiceDate: "January 15, 2026",
    poReference: "NMC-PO-2026-0847",
    paymentTerms: "Net 30",
    dueDate: "February 14, 2026",
    totalAmount: 47120.00,
    lineItems: [
      { itemCode: "MSG-NL-100", description: "Surgical Gloves Nitrile L (Box/100)", quantity: 200, unit: "box", unitPrice: 24.50, total: 4900.00 },
      { itemCode: "SGP-44-200", description: "Sterile Gauze Pads 4x4", quantity: 500, unit: "box", unitPrice: 3.75, total: 1875.00 },
      { itemCode: "AW-200", description: "Antiseptic Wipes (Box/200)", quantity: 100, unit: "box", unitPrice: 18.90, total: 1890.00 },
      { itemCode: "DS-10-50", description: "Disposable Syringes 10mL (Box/50)", quantity: 300, unit: "box", unitPrice: 32.80, total: 9840.00 },
      { itemCode: "SM-N95-20", description: "Surgical Masks N95 (Box/20)", quantity: 150, unit: "box", unitPrice: 44.52, total: 6678.00 },
      { itemCode: "EGV-M-100", description: "Exam Gloves Vinyl M (Box/100)", quantity: 400, unit: "box", unitPrice: 12.50, total: 5000.00 },
      { itemCode: "AB-100", description: "Adhesive Bandages Assorted (Box/100)", quantity: 250, unit: "box", unitPrice: 8.40, total: 2100.00 },
      { itemCode: "CA-1000", description: "Cotton Applicators (Box/1000)", quantity: 100, unit: "box", unitPrice: 14.20, total: 1420.00 },
      { itemCode: "TPD-50", description: "Tongue Depressors (Box/500)", quantity: 80, unit: "box", unitPrice: 9.60, total: 768.00 },
      { itemCode: "SH-FEE", description: "Shipping & Handling", quantity: 1, unit: "lot", unitPrice: 12649.00, total: 12649.00 },
    ] as unknown as Record<string, unknown>[],
    flags: [],
  },
  "invoice-MTS-INV-00291": {
    vendor: { name: "MedTech Solutions LLC", address: "4400 Lake Shore Dr, Suite 1200, Chicago, IL 60613", email: "accounts@medtechsolutions.net", phone: "(773) 555-0412" },
    billTo: { name: "Northfield Medical Center", address: "8900 N Michigan Ave, Chicago, IL 60611" },
    invoiceNumber: "MTS-INV-00291",
    invoiceDate: "February 14, 2026",
    poReference: "",
    paymentTerms: "Net 15",
    dueDate: "March 1, 2026",
    totalAmount: 45200.00,
    lineItems: [
      { itemCode: "MTS-IVK-20", description: "IV Catheter Kit Premium (Box/20)", quantity: 100, unit: "box", unitPrice: 145.00, total: 14500.00 },
      { itemCode: "MTS-IPT-01", description: "Infusion Pump Tubing Set", quantity: 200, unit: "ea", unitPrice: 62.00, total: 12400.00 },
      { itemCode: "MTS-CLD-10", description: "Central Line Dressing Kit", quantity: 50, unit: "box", unitPrice: 89.00, total: 4450.00 },
      { itemCode: "MTS-PTD-50", description: "Pressure Transducer Dome", quantity: 75, unit: "ea", unitPrice: 38.00, total: 2850.00 },
      { itemCode: "MTS-CON-01", description: "Consulting Services — Implementation", quantity: 1, unit: "lot", unitPrice: 8500.00, total: 8500.00 },
      { itemCode: "MTS-SH-01", description: "Express Shipping & Handling", quantity: 1, unit: "lot", unitPrice: 2500.00, total: 2500.00 },
    ] as unknown as Record<string, unknown>[],
    flags: [
      { code: "no_po_reference", severity: "critical" },
      { code: "vendor_not_standard", severity: "critical" },
      { code: "non_standard_payment_terms", severity: "warning" },
      { code: "mixed_product_and_services", severity: "warning" },
    ],
  },
};

// ── Processing step status labels ────────────────────────────────────────────

const PROCESSING_STEP_LABELS: Record<number, string> = {
  0: "Preparing extraction...",
  1: "Reading invoice PDF...",
  2: "Extracting with AI...",
  3: "Structuring data...",
  4: "Checking for exceptions...",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function flattenFields(obj: unknown): unknown[] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== "object") return [obj];
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => flattenFields(item));
  }
  return Object.values(obj as Record<string, unknown>).flatMap((v) =>
    flattenFields(v)
  );
}

function flagLabel(flag: string): { label: string; severity: "critical" | "warning" } {
  const map: Record<string, { label: string; severity: "critical" | "warning" }> = {
    no_po_reference:             { label: "No PO Reference",          severity: "critical" },
    non_standard_payment_terms:  { label: "Net 15 (non-standard)",    severity: "warning"  },
    vendor_not_standard:         { label: "Vendor not in master",     severity: "critical" },
    mixed_product_and_services:  { label: "Mixed product + services", severity: "warning"  },
    duplicate_invoice:           { label: "Duplicate Invoice",        severity: "critical" },
    price_mismatch:              { label: "Price Mismatch",           severity: "critical" },
    quantity_mismatch:           { label: "Quantity Mismatch",        severity: "warning"  },
  };
  return map[flag] ?? { label: flag.replace(/_/g, " "), severity: "warning" };
}

function getFlagCodes(flags: ExtractedData["flags"]): string[] {
  if (!flags) return [];
  return flags.map((f) => (typeof f === "string" ? f : f.code ?? ""));
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KVRow({ label, value, revealed }: { label: string; value?: string; revealed: boolean }) {
  if (!revealed) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-border">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground font-medium max-w-[200px] truncate text-right">
        {value ?? "—"}
      </span>
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SkeletonLoading() {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground m-0">
          Extracting with Invoice Agent
        </h2>
      </div>
      <div className="space-y-3">
        {["w-full", "w-3/4", "w-1/2", "w-full", "w-2/3", "w-4/5", "w-1/2", "w-3/4"].map((w, i) => (
          <Skeleton key={i} className={`${w} h-3`} />
        ))}
      </div>
    </div>
  );
}

// Document status badge — Mismatch uses the warning role; Duplicate/Suspicious
// use the destructive variant. [Spec: domains/extract/spec.md#Business Rules]
function DocBadge({ badge }: { badge: Document["badge"] }) {
  if (!badge) return null;
  if (badge === "match_exception") {
    return (
      <Badge variant="outline" className="bg-warning/10 text-warning-text border-warning">
        Mismatch
      </Badge>
    );
  }
  if (badge === "duplicate") {
    return <Badge variant="destructive">Duplicate</Badge>;
  }
  if (badge === "suspicious") {
    return <Badge variant="destructive">Suspicious</Badge>;
  }
  return null;
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ExtractPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<string>("invoice-STC-2026-19847");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);

  // ── Stage management ──────────────────────────────────────────────────────
  const [stage, setStage] = useState<"upload" | "processing" | "results">("upload");

  // ── Processing step animation (for cached docs) ───────────────────────────
  const [processingStep, setProcessingStep] = useState(0);

  // ── Preview overlay ───────────────────────────────────────────────────────
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  // ── Document list loading shimmer ─────────────────────────────────────────
  const [docListLoading, setDocListLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDocListLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // ── File upload state ──────────────────────────────────────────────────────
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Mutable document list ──────────────────────────────────────────────────
  const [documentList, setDocumentList] = useState<Document[]>(initialDocuments);

  // ── AnimatedBeam pipeline refs ──────────────────────────────────────────────
  const pipelineRef = useRef<HTMLDivElement>(null);
  const node1Ref = useRef<HTMLDivElement>(null);
  const node2Ref = useRef<HTMLDivElement>(null);
  const node3Ref = useRef<HTMLDivElement>(null);
  const node4Ref = useRef<HTMLDivElement>(null);

  const selectedDocMeta = documentList.find((d) => d.id === selectedDoc) ?? null;

  // Sequential reveal animation
  useEffect(() => {
    if (!extracted) return;
    const total = flattenFields(extracted).length;
    if (revealIndex >= total) {
      setAllRevealed(true);
      return;
    }
    const timer = setTimeout(() => setRevealIndex((i) => i + 1), 120);
    return () => clearTimeout(timer);
  }, [extracted, revealIndex]);

  // ── Core extraction handler (uses selectedDoc from state) ──────────────────
  const handleExtract = useCallback(async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setExtracted(null);
    setExtractError(null);
    setRevealIndex(0);
    setAllRevealed(false);
    setProcessingStep(0);
    setStage("processing");

    // Check cache first
    const cached = CACHED_EXTRACTIONS[selectedDoc];
    if (cached) {
      setProcessingStep(1);
      await new Promise(r => setTimeout(r, 800));
      setProcessingStep(2);
      await new Promise(r => setTimeout(r, 1000));
      setProcessingStep(3);
      await new Promise(r => setTimeout(r, 800));
      setProcessingStep(4);
      await new Promise(r => setTimeout(r, 400));
      setExtracted(cached);
      setLoading(false);
      setStage("results");
      setProcessingStep(0);
      showToast("Invoice extracted — " + (cached.lineItems?.length || 0) + " line items found", "success");
      return;
    }

    // No cache -- call real API
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: selectedDoc }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setExtractError(json.error ?? `Server error ${res.status}`);
        showToast(json.error ?? "Extraction failed", "error");
        setStage("upload");
      } else {
        setExtracted(json.data ?? null);
        showToast("Extraction complete", "success");
        setStage("results");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error — is the server running?";
      setExtractError(msg);
      showToast(msg, "error");
      setStage("upload");
    } finally {
      setLoading(false);
      setProcessingStep(0);
    }
  }, [selectedDoc, showToast]);

  // ── Extract a specific document by ID (avoids stale closure on selectedDoc) ─
  const handleExtractDoc = useCallback(async (docId: string) => {
    setSelectedDoc(docId);
    setExtracted(null);
    setExtractError(null);
    setRevealIndex(0);
    setAllRevealed(false);
    setProcessingStep(0);
    setStage("processing");

    // Check cache first
    const cached = CACHED_EXTRACTIONS[docId];
    if (cached) {
      setProcessingStep(1);
      await new Promise(r => setTimeout(r, 800));
      setProcessingStep(2);
      await new Promise(r => setTimeout(r, 1000));
      setProcessingStep(3);
      await new Promise(r => setTimeout(r, 800));
      setProcessingStep(4);
      await new Promise(r => setTimeout(r, 400));
      setExtracted(cached);
      setLoading(false);
      setStage("results");
      setProcessingStep(0);
      showToast("Invoice extracted — " + (cached.lineItems?.length || 0) + " line items found", "success");
      return;
    }

    // No cache -- call real API
    setLoading(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: docId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setExtractError(json.error ?? `Server error ${res.status}`);
        showToast(json.error ?? "Extraction failed", "error");
        setStage("upload");
      } else {
        setExtracted(json.data ?? null);
        showToast("Extraction complete", "success");
        setStage("results");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error — is the server running?";
      setExtractError(msg);
      showToast(msg, "error");
      setStage("upload");
    } finally {
      setLoading(false);
      setProcessingStep(0);
    }
  }, [showToast]);

  // Kept for parity with the original handler set (cached extraction entry point).
  void handleExtract;

  // ── File upload handlers ────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === "application/pdf") {
      setUploadedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadAndExtract = async () => {
    if (!uploadedFile) return;
    setUploading(true);
    setUploadProgress(0);
    setExtracted(null);
    setExtractError(null);
    setRevealIndex(0);
    setAllRevealed(false);
    setProcessingStep(0);
    setStage("processing");

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const json = await res.json();
      if (!res.ok || !json.success) {
        setExtractError(json.error ?? "Extraction failed");
        showToast(json.error ?? "Extraction failed", "error");
        setStage("upload");
      } else {
        setExtracted(json.data ?? null);
        const newDoc: Document = {
          id: "uploaded-" + Date.now(),
          label: uploadedFile.name.replace(".pdf", ""),
          sub: "Uploaded just now",
          type: "invoice" as const,
          badge: null,
        };
        setDocumentList((prev) => [newDoc, ...prev]);
        setSelectedDoc(newDoc.id);
        showToast("Upload and extraction complete", "success");
        setStage("results");
      }
    } catch {
      setExtractError("Upload failed — check your connection");
      showToast("Upload failed", "error");
      setStage("upload");
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadedFile(null);
    }
  };

  const handleBackToUpload = () => {
    setStage("upload");
    setExtracted(null);
    setExtractError(null);
    setRevealIndex(0);
    setAllRevealed(false);
    setLoading(false);
    setProcessingStep(0);
  };

  // Field reveal counter
  let fieldCounter = 0;
  function isRevealed() {
    fieldCounter += 1;
    return fieldCounter <= revealIndex;
  }

  const flagCodes = extracted ? getFlagCodes(extracted.flags) : [];
  const hasNoPO = flagCodes.includes("no_po_reference");

  // Split documents into invoices vs supporting docs
  const invoiceDocs = documentList.filter((d) => d.type === "invoice");
  const supportingDocs = documentList.filter((d) => d.type !== "invoice");

  // ── Pipeline node styling helpers ──────────────────────────────────────────
  // Node visual state is driven by Tailwind token classes (bg-primary / bg-card /
  // bg-muted / border-border) so it follows the active theme in light and dark.
  // [Spec: domains/extract/spec.md#Stage 2: Processing]
  const pipelineNodeClass = (nodeIndex: number) =>
    `flex h-12 w-12 items-center justify-center rounded-[10px] border transition-all duration-300 ${
      processingStep >= nodeIndex
        ? "bg-primary border-primary text-primary-foreground"
        : "bg-card border-border text-muted-foreground"
    }`;

  const pipelineLabelClass = (nodeIndex: number) =>
    `text-[11px] font-semibold uppercase tracking-[0.06em] whitespace-nowrap transition-colors duration-300 ${
      processingStep >= nodeIndex ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">

      {/* ═══════════════════════════════════════════════════════════════════════
          STAGE 1 -- UPLOAD / SELECT
          ═══════════════════════════════════════════════════════════════════════ */}
      {stage === "upload" && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">

            {/* Page header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">Extract Invoice</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upload an invoice PDF or select from recent invoices below to begin AI-powered extraction.
              </p>
            </div>

            {/* ── Upload area ─────────────────────────────────────────────── */}
            {/* [Spec: domains/extract/spec.md#Stage 1: Upload / Select] */}
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />
            <Card
              role="button"
              tabIndex={0}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !uploading) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file?.type === "application/pdf") setUploadedFile(file);
              }}
              className={`min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer border-2 transition-all duration-200 ${
                isDragOver
                  ? "border-primary border-solid bg-accent"
                  : uploadedFile
                    ? "border-primary border-solid"
                    : "border-dashed border-border hover:border-muted-foreground hover:bg-muted/40"
              }`}
            >
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-3 px-4 py-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{uploadedFile.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {(uploadedFile.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  {!uploading && (
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleUploadAndExtract(); }}
                    >
                      Upload &amp; Extract
                    </Button>
                  )}
                  {uploading && (
                    <div className="w-64">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Uploading...</span>
                        <span className="tabular-nums">{uploadProgress.toFixed(0)}%</span>
                      </div>
                      <div
                        className="w-full h-1.5 bg-muted rounded-full overflow-hidden"
                        role="progressbar"
                        aria-label="Upload progress"
                        aria-valuenow={Math.round(uploadProgress)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <UploadIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Upload Invoice</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Drag and drop your invoice PDF here, or click to browse files
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Supported: PDF up to 10MB</div>
                </div>
              )}
            </Card>

            {/* ── Error display ────────────────────────────────────────────── */}
            {extractError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle />
                <AlertTitle>Extraction failed</AlertTitle>
                <AlertDescription>{extractError}</AlertDescription>
              </Alert>
            )}

            {/* ── Section divider ─────────────────────────────────────────── */}
            <div className="mt-8 mb-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground m-0">
                Recent Invoices
              </h2>
            </div>

            {/* ── Invoice cards grid ──────────────────────────────────────── */}
            {docListLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-4 gap-0">
                    <Skeleton className="w-8 h-8 rounded mb-3" />
                    <Skeleton className="h-3.5 rounded mb-2" style={{ width: `${60 + i * 8}%` }} />
                    <Skeleton className="h-2.5 w-3/4 rounded mb-3" />
                    <div className="flex gap-2 mt-3">
                      <Skeleton className="h-7 flex-1 rounded" />
                      <Skeleton className="h-7 flex-1 rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {invoiceDocs.map((doc) => (
                  <Card key={doc.id} className="p-4 gap-0 flex flex-col">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3">
                      <FileText className="w-[18px] h-[18px] text-muted-foreground" />
                    </div>
                    <div className="text-sm font-semibold text-foreground leading-tight">
                      {doc.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{doc.sub}</div>
                    {doc.badge && (
                      <div className="mt-2">
                        <DocBadge badge={doc.badge} />
                      </div>
                    )}
                    <div className="flex-1 min-h-[12px]" />
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleExtractDoc(doc.id)}
                      >
                        Extract
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* ── Supporting documents ─────────────────────────────────────── */}
            {supportingDocs.length > 0 && !docListLoading && (
              <>
                <div className="mt-6 mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground m-0">
                    Supporting Documents
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {supportingDocs.map((doc) => (
                    <Card key={doc.id} className="p-4 gap-0 flex flex-col">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3">
                        <FileText className="w-[18px] h-[18px] text-muted-foreground" />
                      </div>
                      <div className="text-sm font-semibold text-foreground leading-tight">
                        {doc.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{doc.sub}</div>
                      <div className="flex-1 min-h-[12px]" />
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye className="w-3 h-3" />
                          Preview
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          STAGE 2 -- PROCESSING
          ═══════════════════════════════════════════════════════════════════════ */}
      {/* [Spec: domains/extract/spec.md#Stage 2: Processing] */}
      {stage === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 lg:px-6">
          <Card
            ref={pipelineRef}
            className="relative w-full max-w-3xl flex-row items-center justify-center gap-0 py-8 px-10"
          >
            {/* Node 1 - Invoice PDF */}
            <div ref={node1Ref} className="flex flex-col items-center gap-1.5 z-[1]">
              <div className={pipelineNodeClass(1)}>
                <FileText size={22} />
              </div>
              <span className={pipelineLabelClass(1)}>Invoice PDF</span>
            </div>
            <div className="flex-1 min-w-[56px]" />
            {/* Node 2 - AI Extraction */}
            <div ref={node2Ref} className="flex flex-col items-center gap-1.5 z-[1]">
              <div className={pipelineNodeClass(2)}>
                <Bot size={22} />
              </div>
              <span className={pipelineLabelClass(2)}>AI Extraction</span>
            </div>
            <div className="flex-1 min-w-[56px]" />
            {/* Node 3 - Structured Data */}
            <div ref={node3Ref} className="flex flex-col items-center gap-1.5 z-[1]">
              <div className={pipelineNodeClass(3)}>
                <BarChart3 size={22} />
              </div>
              <span className={pipelineLabelClass(3)}>Structured Data</span>
            </div>
            <div className="flex-1 min-w-[56px]" />
            {/* Node 4 - Exception Queue */}
            <div ref={node4Ref} className="flex flex-col items-center gap-1.5 z-[1]">
              <div className={pipelineNodeClass(4)}>
                <AlertTriangle size={22} />
              </div>
              <span className={pipelineLabelClass(4)}>Exception Queue</span>
            </div>

            {/* Beams */}
            <AnimatedBeam containerRef={pipelineRef} fromRef={node1Ref} toRef={node2Ref} duration={2} delay={0} colorFrom="var(--muted-foreground)" colorTo="var(--primary)" />
            <AnimatedBeam containerRef={pipelineRef} fromRef={node2Ref} toRef={node3Ref} duration={2} delay={0.7} colorFrom="var(--muted-foreground)" colorTo="var(--primary)" />
            <AnimatedBeam containerRef={pipelineRef} fromRef={node3Ref} toRef={node4Ref} duration={2} delay={1.4} colorFrom="var(--primary)" colorTo="var(--destructive)" />
          </Card>

          {/* Progress indicator */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm font-medium text-foreground">
                {uploading ? "Uploading and extracting..." : (PROCESSING_STEP_LABELS[processingStep] || "Extracting with AI agent...")}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {selectedDocMeta ? selectedDocMeta.label : "Processing document"}
            </span>
            {uploading && (
              <div className="w-64 mt-1">
                <div
                  className="w-full h-1.5 bg-muted rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label="Upload progress"
                  aria-valuenow={Math.round(uploadProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-center mt-1 tabular-nums">
                  {uploadProgress.toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          STAGE 3 -- RESULTS
          ═══════════════════════════════════════════════════════════════════════ */}
      {/* [Spec: domains/extract/spec.md#Stage 3: Results] */}
      {stage === "results" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left column: PDF preview (60%) */}
          <div className="flex flex-col overflow-hidden" style={{ flex: "0 0 60%", maxWidth: "60%" }}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToUpload}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Upload
                </Button>
                <div className="w-px h-4 bg-border" />
                <span className="text-sm font-semibold text-foreground">
                  {selectedDocMeta ? selectedDocMeta.label : "Document"}
                </span>
                {selectedDocMeta && <DocBadge badge={selectedDocMeta.badge} />}
              </div>
            </div>

            {/* PDF embed */}
            <div className="flex-1 p-4 overflow-hidden min-h-0 bg-muted/30">
              {selectedDoc ? (
                <div className="relative overflow-hidden w-full h-full rounded-lg min-h-[500px]">
                  <iframe
                    title={`Invoice PDF — ${selectedDocMeta ? selectedDocMeta.label : selectedDoc}`}
                    src={`/documents/pdfs/${selectedDoc}.pdf`}
                    className="w-full h-full rounded-lg border border-border min-h-[500px] bg-card"
                  />
                  {loading && (
                    <BorderBeam
                      duration={3}
                      colorFrom="var(--primary)"
                      colorTo="var(--primary)"
                      borderWidth={2}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full rounded-lg flex items-center justify-center bg-card border border-border min-h-[500px]">
                  <span className="text-sm text-muted-foreground">No document loaded</span>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Extracted data (40%) */}
          <div
            className="flex flex-col overflow-hidden border-l border-border bg-card"
            style={{ flex: "0 0 40%", maxWidth: "40%" }}
          >
            <div className="flex-1 overflow-auto">
              {loading && <SkeletonLoading />}

              {!loading && !extracted && extractError && (
                <div className="flex items-center justify-center h-full px-6">
                  <div className="text-center">
                    <div className="text-xs text-destructive mb-1 font-medium">Extraction failed</div>
                    <div className="text-xs text-muted-foreground">{extractError}</div>
                  </div>
                </div>
              )}

              {!loading && extracted && (
                <div className="px-4 py-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4 m-0">
                    Extracted Fields
                  </h2>

                  {extracted.vendor && (
                    <FieldGroup title="Vendor">
                      <KVRow label="Name"    value={extracted.vendor.name}    revealed={isRevealed()} />
                      <KVRow label="Address" value={extracted.vendor.address} revealed={isRevealed()} />
                      <KVRow label="Email"   value={extracted.vendor.email}   revealed={isRevealed()} />
                      {extracted.vendor.phone && (
                        <KVRow label="Phone" value={extracted.vendor.phone}   revealed={isRevealed()} />
                      )}
                    </FieldGroup>
                  )}

                  {extracted.billTo && (
                    <FieldGroup title="Bill To">
                      <KVRow label="Name"    value={extracted.billTo.name}    revealed={isRevealed()} />
                      <KVRow label="Address" value={extracted.billTo.address} revealed={isRevealed()} />
                    </FieldGroup>
                  )}

                  {extracted.invoiceNumber && (
                    <FieldGroup title="Invoice">
                      <KVRow label="Invoice #"     value={String(extracted.invoiceNumber)}           revealed={isRevealed()} />
                      <KVRow label="Date"          value={String(extracted.invoiceDate ?? "")}       revealed={isRevealed()} />
                      <KVRow label="PO Reference"  value={String(extracted.poReference ?? "")}       revealed={isRevealed()} />
                      <KVRow label="Payment Terms" value={String(extracted.paymentTerms ?? "")}      revealed={isRevealed()} />
                      <KVRow label="Due Date"      value={String(extracted.dueDate ?? "")}           revealed={isRevealed()} />
                      {extracted.totalAmount != null && (
                        <KVRow
                          label="Total Amount"
                          value={`$${Number(extracted.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                          revealed={isRevealed()}
                        />
                      )}
                    </FieldGroup>
                  )}

                  {Array.isArray(extracted.lineItems) && extracted.lineItems.length > 0 && (
                    <FieldGroup title={`Line Items (${extracted.lineItems.length})`}>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="bg-muted border-b border-border">
                              {["ITEM CODE", "DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"].map((h) => (
                                <th
                                  key={h}
                                  className="px-1.5 py-1.5 text-[10px] font-medium tracking-wide uppercase text-muted-foreground text-left whitespace-nowrap"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {extracted.lineItems.map((item: Record<string, unknown>, idx: number) => {
                              const rowRevealed = isRevealed();
                              if (!rowRevealed) return null;
                              return (
                                <tr key={idx} className="border-b border-border">
                                  <td className="px-1.5 py-1.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                                    {String(item.itemCode ?? "")}
                                  </td>
                                  <td className="px-1.5 py-1.5 text-xs text-foreground max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                                    {String(item.description ?? "")}
                                  </td>
                                  <td className="px-1.5 py-1.5 text-foreground text-right tabular-nums">
                                    {String(item.quantity ?? "")}
                                  </td>
                                  <td className="px-1.5 py-1.5 text-foreground whitespace-nowrap text-right tabular-nums">
                                    ${Number(item.unitPrice ?? 0).toFixed(2)}
                                  </td>
                                  <td className="px-1.5 py-1.5 text-foreground whitespace-nowrap text-right font-medium tabular-nums">
                                    ${Number(item.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {isRevealed() && (
                        <div className="border-t border-border mt-1 pt-2 flex justify-between">
                          <span className="text-xs text-muted-foreground">TOTAL AMOUNT</span>
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            ${Number(extracted.totalAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </FieldGroup>
                  )}

                  {flagCodes.length > 0 && (
                    <FieldGroup title="Flags Detected">
                      <div className="flex flex-col gap-1.5 items-start">
                        {flagCodes.map((code, idx) => {
                          const flagRevealed = isRevealed();
                          if (!flagRevealed) return null;
                          const { label, severity } = flagLabel(code);
                          return (
                            <div key={idx}>
                              {severity === "critical" ? (
                                <Badge variant="destructive">{label}</Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-warning/10 text-warning-text border-warning"
                                >
                                  {label}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </FieldGroup>
                  )}
                </div>
              )}
            </div>

            {/* Bottom action bar */}
            {!loading && extracted && allRevealed && (
              <div className="px-4 py-3 flex flex-col gap-2 border-t border-border bg-card shrink-0">
                {hasNoPO ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => router.push("/exceptions/EX-003")}
                  >
                    Search for PO Match &rarr;
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      const exId = selectedDoc ? DOC_TO_EXCEPTION[selectedDoc] : null;
                      router.push(exId ? `/exceptions/${exId}` : "/exceptions");
                    }}
                  >
                    Match Against PO &rarr;
                  </Button>
                )}
                <Button
                  variant="link"
                  size="sm"
                  className="w-full"
                  render={
                    <Link
                      href={
                        selectedDoc && DOC_TO_EXCEPTION[selectedDoc]
                          ? `/exceptions/${DOC_TO_EXCEPTION[selectedDoc]}`
                          : "/exceptions"
                      }
                    />
                  }
                >
                  View in Exception Queue &rarr;
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PDF PREVIEW OVERLAY
          ═══════════════════════════════════════════════════════════════════════ */}
      {/* [Spec: domains/extract/spec.md#Preview Overlay] */}
      <Dialog
        open={previewDoc !== null}
        onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}
      >
        {previewDoc && (
          <DialogContent
            showCloseButton={false}
            className="w-[800px] sm:max-w-[90vw] h-[85vh] p-0 gap-0 flex flex-col"
          >
            <DialogHeader className="flex-row items-center justify-between px-5 py-3 border-b border-border space-y-0">
              <DialogTitle className="text-sm font-medium text-foreground">
                {previewDoc.label} &mdash; {previewDoc.sub}
              </DialogTitle>
              <div className="flex gap-2 items-center">
                {previewDoc.type === "invoice" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const docId = previewDoc.id;
                      setPreviewDoc(null);
                      handleExtractDoc(docId);
                    }}
                  >
                    Extract this invoice
                  </Button>
                )}
                <DialogClose
                  render={<Button variant="ghost" size="icon-sm" aria-label="Close preview" />}
                >
                  <X className="w-4 h-4" />
                </DialogClose>
              </div>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              <iframe
                title={`PDF preview — ${previewDoc.label}`}
                src={`/documents/pdfs/${previewDoc.id}.pdf`}
                className="w-full h-full border-none"
              />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
