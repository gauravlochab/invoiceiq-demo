"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BorderBeam } from "@/components/magicui/border-beam";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { FileText, Bot, BarChart3, AlertTriangle, Upload as UploadIcon, X, Eye, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/Toast";

// Maps each demo document to its corresponding exception ID
const DOC_TO_EXCEPTION: Record<string, string> = {
  "invoice-STC-2026-19847": "EX-006",   // Steris -- price mismatch
  "invoice-MS-2026-0923":   "EX-002",   // MedSupply -- duplicate
  "invoice-MS-2026-0847":   "EX-002",   // MedSupply -- duplicate (original)
  "invoice-MTS-INV-00291":  "EX-003",   // MedTech -- no PO / suspicious
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
  { id: "invoice-STC-2026-19847",      label: "Steris Corporation",  sub: "Invoice \u00b7 Feb 28, 2026",       type: "invoice",      badge: "match_exception" },
  { id: "invoice-MS-2026-0847",         label: "MedSupply Corp",      sub: "Invoice \u00b7 Jan 15, 2026",       type: "invoice",      badge: null },
  { id: "invoice-MS-2026-0923",         label: "MedSupply Corp",      sub: "Invoice \u00b7 Jan 21, 2026",       type: "invoice",      badge: "duplicate" },
  { id: "invoice-MTS-INV-00291",        label: "MedTech Solutions",   sub: "Invoice \u00b7 Feb 14, 2026",       type: "invoice",      badge: "suspicious" },
  { id: "po-NMC-2026-PO-2847",          label: "Northfield Medical",  sub: "Purchase Order",               type: "po",           badge: null },
  { id: "packingslip-STC-PS-2026-0392", label: "Steris Corporation",  sub: "Packing Slip \u00b7 Feb 25, 2026", type: "packing_slip", badge: null },
];

// ── Cached extraction results for sample invoices ────────────────────────────

const CACHED_EXTRACTIONS: Record<string, ExtractedData> = {
  "invoice-STC-2026-19847": {
    vendor: { name: "Steris Corporation", address: "5960 Heisley Road, Mentor, OH 44060", email: "invoices@steris.com", phone: "(440) 555-0198" },
    billTo: { name: "Northfield Medical Center", address: "8900 N Michigan Ave, Chicago, IL 60611" },
    invoiceNumber: "STC-2026-19847",
    invoiceDate: "February 28, 2026",
    poReference: "NMC-PO-2026-2847",
    paymentTerms: "Net 30",
    dueDate: "March 30, 2026",
    totalAmount: 28750.00,
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
    <div className="flex justify-between py-1.5 border-b border-[#f0f2f5]">
      <span className="text-xs text-[#9ca3af]">{label}</span>
      <span className="text-xs text-[#111827] font-medium max-w-[200px] truncate text-right">
        {value ?? "\u2014"}
      </span>
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="section-label mb-2">{title}</div>
      {children}
    </div>
  );
}

function SkeletonLoading() {
  const widths = ["w-full", "w-3/4", "w-1/2", "w-full", "w-2/3", "w-4/5", "w-1/2", "w-3/4"];
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full animate-spin"
          style={{ border: "1px solid #d1d5db", borderTopColor: "#0065cb" }}
        />
        <span className="section-label">EXTRACTING WITH INVOICE AGENT</span>
      </div>
      <div className="space-y-3">
        {widths.map((w, i) => (
          <div key={i} className={`${w} h-3 rounded animate-pulse bg-[#f0f2f5]`} />
        ))}
      </div>
    </div>
  );
}

function DocBadge({ badge }: { badge: Document["badge"] }) {
  if (!badge) return null;
  const config: Record<string, { text: string; cls: string }> = {
    match_exception: { text: "Mismatch", cls: "warning" },
    duplicate:       { text: "Duplicate", cls: "critical" },
    suspicious:      { text: "Suspicious", cls: "critical" },
  };
  const c = config[badge];
  if (!c) return null;
  return <span className={`badge ${c.cls}`}>{c.text}</span>;
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
      showToast("Invoice extracted \u2014 " + (cached.lineItems?.length || 0) + " line items found", "success");
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
      const msg = err instanceof Error ? err.message : "Network error \u2014 is the server running?";
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
      showToast("Invoice extracted \u2014 " + (cached.lineItems?.length || 0) + " line items found", "success");
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
      const msg = err instanceof Error ? err.message : "Network error \u2014 is the server running?";
      setExtractError(msg);
      showToast(msg, "error");
      setStage("upload");
    } finally {
      setLoading(false);
      setProcessingStep(0);
    }
  }, [showToast]);

  const handleDocSelect = (id: string) => {
    setSelectedDoc(id);
    setExtracted(null);
    setRevealIndex(0);
    setAllRevealed(false);
    setLoading(false);
  };

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
      setExtractError("Upload failed \u2014 check your connection");
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
  const pipelineNodeStyle = (nodeIndex: number, defaultBg: string, defaultBorder: string) => {
    if (processingStep >= nodeIndex) {
      return {
        width: 48,
        height: 48,
        borderRadius: 10,
        background: "#0065cb",
        border: "1px solid #0065cb",
        display: "flex" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        transition: "all 0.3s ease",
      };
    }
    return {
      width: 48,
      height: 48,
      borderRadius: 10,
      background: defaultBg,
      border: `1px solid ${defaultBorder}`,
      display: "flex" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      transition: "all 0.3s ease",
    };
  };

  const pipelineIconColor = (nodeIndex: number, defaultColor: string) => {
    return processingStep >= nodeIndex ? "#ffffff" : defaultColor;
  };

  const pipelineLabelColor = (nodeIndex: number, defaultColor: string) => {
    return processingStep >= nodeIndex ? "#0065cb" : defaultColor;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f7f8fa]">

      {/* ═══════════════════════════════════════════════════════════════════════
          STAGE 1 -- UPLOAD / SELECT
          ═══════════════════════════════════════════════════════════════════════ */}
      {stage === "upload" && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">

            {/* Page header */}
            <div className="mb-6">
              <h1 className="text-lg font-semibold text-[#111827]">Extract Invoice</h1>
              <p className="text-sm text-[#4b5563] mt-0.5">
                Upload your own invoice or select a sample to begin AI-powered extraction.
              </p>
            </div>

            {/* ── Upload area ─────────────────────────────────────────────── */}
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file?.type === "application/pdf") setUploadedFile(file);
              }}
              className={`card min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-[#0065cb] bg-[#e8f1fc] border-solid"
                  : uploadedFile
                    ? "border-[#0065cb] border-solid bg-white"
                    : "border-dashed border-[#d1d5db] hover:border-[#9ca3af] hover:bg-[#f0f2f5] bg-white"
              }`}
              style={{ borderWidth: 2 }}
            >
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-3 px-4 py-2">
                  <div className="w-12 h-12 rounded-full bg-[#e8f1fc] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#0065cb]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#111827]">{uploadedFile.name}</div>
                    <div className="text-xs text-[#9ca3af] mt-0.5">
                      {(uploadedFile.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUploadAndExtract(); }}
                      className="px-5 py-2 text-sm font-medium rounded-md bg-[#0065cb] text-white hover:bg-[#0057ad] transition-colors cursor-pointer border-none"
                    >
                      Upload &amp; Extract
                    </button>
                  )}
                  {uploading && (
                    <div className="w-64">
                      <div className="flex justify-between text-xs text-[#9ca3af] mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0065cb] rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-[#f0f2f5] flex items-center justify-center">
                    <UploadIcon className="w-6 h-6 text-[#9ca3af]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#111827]">Upload Invoice</div>
                    <div className="text-xs text-[#9ca3af] mt-1">
                      Drag and drop your invoice PDF here, or click to browse files
                    </div>
                  </div>
                  <div className="text-xs text-[#d1d5db]">Supported: PDF up to 10MB</div>
                </div>
              )}
            </div>

            {/* ── Error display ────────────────────────────────────────────── */}
            {extractError && (
              <div className="alert-bar critical mt-4">
                <div className="text-xs font-medium">Extraction failed</div>
                <div className="text-xs mt-0.5 opacity-80">{extractError}</div>
              </div>
            )}

            {/* ── Section divider ─────────────────────────────────────────── */}
            <div className="mt-8 mb-5">
              <div className="section-label">SAMPLE INVOICES &mdash; Try with demo data</div>
            </div>

            {/* ── Invoice cards grid ──────────────────────────────────────── */}
            {docListLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card p-4">
                    <div className="w-8 h-8 bg-[#f0f2f5] rounded animate-pulse mb-3" />
                    <div
                      className="h-3.5 bg-[#e5e7eb] rounded animate-pulse mb-2"
                      style={{ width: `${60 + i * 8}%` }}
                    />
                    <div className="h-2.5 w-3/4 bg-[#e5e7eb] rounded animate-pulse mb-3" />
                    <div className="flex gap-2 mt-3">
                      <div className="h-7 flex-1 bg-[#f0f2f5] rounded animate-pulse" />
                      <div className="h-7 flex-1 bg-[#f0f2f5] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {invoiceDocs.map((doc) => (
                  <div key={doc.id} className="card p-4 flex flex-col">
                    <div className="w-9 h-9 rounded-lg bg-[#f0f2f5] flex items-center justify-center mb-3">
                      <FileText className="w-[18px] h-[18px] text-[#4b5563]" />
                    </div>
                    <div className="text-sm font-semibold text-[#111827] leading-tight">
                      {doc.label}
                    </div>
                    <div className="text-xs text-[#9ca3af] mt-0.5">{doc.sub}</div>
                    {doc.badge && (
                      <div className="mt-2">
                        <DocBadge badge={doc.badge} />
                      </div>
                    )}
                    <div className="flex-1 min-h-[12px]" />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md bg-[#f0f2f5] text-[#4b5563] hover:bg-[#e5e7eb] transition-colors cursor-pointer border-none"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleExtractDoc(doc.id)}
                        className="flex-1 px-2 py-1.5 text-xs font-medium rounded-md bg-[#0065cb] text-white hover:bg-[#0057ad] transition-colors cursor-pointer border-none"
                      >
                        Extract
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Supporting documents ─────────────────────────────────────── */}
            {supportingDocs.length > 0 && !docListLoading && (
              <>
                <div className="mt-6 mb-3">
                  <div className="section-label">SUPPORTING DOCUMENTS</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {supportingDocs.map((doc) => (
                    <div key={doc.id} className="card p-4 flex flex-col">
                      <div className="w-9 h-9 rounded-lg bg-[#f0f2f5] flex items-center justify-center mb-3">
                        <FileText className="w-[18px] h-[18px] text-[#9ca3af]" />
                      </div>
                      <div className="text-sm font-semibold text-[#111827] leading-tight">
                        {doc.label}
                      </div>
                      <div className="text-xs text-[#9ca3af] mt-0.5">{doc.sub}</div>
                      <div className="flex-1 min-h-[12px]" />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md bg-[#f0f2f5] text-[#4b5563] hover:bg-[#e5e7eb] transition-colors cursor-pointer border-none"
                        >
                          <Eye className="w-3 h-3" />
                          Preview
                        </button>
                      </div>
                    </div>
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
      {stage === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            ref={pipelineRef}
            className="relative w-full max-w-3xl"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
              padding: "32px 40px",
              background: "white",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {/* Node 1 - Invoice PDF */}
            <div ref={node1Ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 1 }}>
              <div style={pipelineNodeStyle(1, "white", "#e5e7eb")}>
                <FileText size={22} color={pipelineIconColor(1, "#4b5563")} />
              </div>
              <span style={{ fontSize: 11, color: pipelineLabelColor(1, "#9ca3af"), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", transition: "color 0.3s ease" }}>Invoice PDF</span>
            </div>
            <div style={{ flex: 1, minWidth: 56 }} />
            {/* Node 2 - AI Extraction */}
            <div ref={node2Ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 1 }}>
              <div style={pipelineNodeStyle(2, "#e8f1fc", "#b0d0f0")}>
                <Bot size={22} color={pipelineIconColor(2, "#0065cb")} />
              </div>
              <span style={{ fontSize: 11, color: pipelineLabelColor(2, "#0065cb"), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", transition: "color 0.3s ease" }}>AI Extraction</span>
            </div>
            <div style={{ flex: 1, minWidth: 56 }} />
            {/* Node 3 - Structured Data */}
            <div ref={node3Ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 1 }}>
              <div style={pipelineNodeStyle(3, "white", "#e5e7eb")}>
                <BarChart3 size={22} color={pipelineIconColor(3, "#0065cb")} />
              </div>
              <span style={{ fontSize: 11, color: pipelineLabelColor(3, "#9ca3af"), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", transition: "color 0.3s ease" }}>Structured Data</span>
            </div>
            <div style={{ flex: 1, minWidth: 56 }} />
            {/* Node 4 - Exception Queue */}
            <div ref={node4Ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 1 }}>
              <div style={pipelineNodeStyle(4, "#FEF2F2", "#FECACA")}>
                <AlertTriangle size={22} color={pipelineIconColor(4, "#DC2626")} />
              </div>
              <span style={{ fontSize: 11, color: pipelineLabelColor(4, "#DC2626"), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", transition: "color 0.3s ease" }}>Exception Queue</span>
            </div>

            {/* Beams */}
            <AnimatedBeam containerRef={pipelineRef} fromRef={node1Ref} toRef={node2Ref} duration={2} delay={0} colorFrom="#9ca3af" colorTo="#0065cb" />
            <AnimatedBeam containerRef={pipelineRef} fromRef={node2Ref} toRef={node3Ref} duration={2} delay={0.7} colorFrom="#9ca3af" colorTo="#0065cb" />
            <AnimatedBeam containerRef={pipelineRef} fromRef={node3Ref} toRef={node4Ref} duration={2} delay={1.4} colorFrom="#0065cb" colorTo="#DC2626" />
          </div>

          {/* Progress indicator */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full animate-spin"
                style={{ border: "2px solid #e5e7eb", borderTopColor: "#0065cb" }}
              />
              <span className="text-sm font-medium text-[#111827]">
                {uploading ? "Uploading and extracting..." : (PROCESSING_STEP_LABELS[processingStep] || "Extracting with AI agent...")}
              </span>
            </div>
            <span className="text-xs text-[#9ca3af]">
              {selectedDocMeta ? selectedDocMeta.label : "Processing document"}
            </span>
            {uploading && (
              <div className="w-64 mt-1">
                <div className="w-full h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0065cb] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-xs text-[#9ca3af] text-center mt-1">
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
      {stage === "results" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left column: PDF preview (60%) */}
          <div className="flex flex-col overflow-hidden" style={{ flex: "0 0 60%", maxWidth: "60%" }}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#e5e7eb] shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToUpload}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#4b5563] hover:text-[#111827] transition-colors cursor-pointer bg-transparent border-none px-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Upload
                </button>
                <div className="w-px h-4 bg-[#e5e7eb]" />
                <span className="text-xs font-medium text-[#111827]">
                  {selectedDocMeta ? selectedDocMeta.label : "Document"}
                </span>
                {selectedDocMeta && <DocBadge badge={selectedDocMeta.badge} />}
              </div>
            </div>

            {/* PDF embed */}
            <div className="flex-1 p-4 overflow-hidden min-h-0 bg-[#f0f2f5]">
              {selectedDoc ? (
                <div className="relative overflow-hidden w-full h-full rounded-lg min-h-[500px]">
                  <iframe
                    src={`/documents/pdfs/${selectedDoc}.pdf`}
                    className="w-full h-full rounded-lg border border-[#e5e7eb] min-h-[500px] bg-white"
                  />
                  {loading && (
                    <BorderBeam
                      duration={3}
                      colorFrom="#0065cb"
                      colorTo="#0057ad"
                      borderWidth={2}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full rounded-lg flex items-center justify-center bg-white border border-[#e5e7eb] min-h-[500px]">
                  <span className="text-sm text-[#9ca3af]">No document loaded</span>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Extracted data (40%) */}
          <div
            className="flex flex-col overflow-hidden border-l border-[#e5e7eb] bg-white"
            style={{ flex: "0 0 40%", maxWidth: "40%" }}
          >
            <div className="flex-1 overflow-auto">
              {loading && <SkeletonLoading />}

              {!loading && !extracted && extractError && (
                <div className="flex items-center justify-center h-full px-6">
                  <div className="text-center">
                    <div className="text-xs text-red-600 mb-1 font-medium">Extraction failed</div>
                    <div className="text-xs text-[#9ca3af]">{extractError}</div>
                  </div>
                </div>
              )}

              {!loading && extracted && (
                <div className="px-4 py-4">
                  <div className="section-label mb-4">EXTRACTED FIELDS</div>

                  {extracted.vendor && (
                    <FieldGroup title="VENDOR">
                      <KVRow label="Name"    value={extracted.vendor.name}    revealed={isRevealed()} />
                      <KVRow label="Address" value={extracted.vendor.address} revealed={isRevealed()} />
                      <KVRow label="Email"   value={extracted.vendor.email}   revealed={isRevealed()} />
                      {extracted.vendor.phone && (
                        <KVRow label="Phone" value={extracted.vendor.phone}   revealed={isRevealed()} />
                      )}
                    </FieldGroup>
                  )}

                  {extracted.billTo && (
                    <FieldGroup title="BILL TO">
                      <KVRow label="Name"    value={extracted.billTo.name}    revealed={isRevealed()} />
                      <KVRow label="Address" value={extracted.billTo.address} revealed={isRevealed()} />
                    </FieldGroup>
                  )}

                  {extracted.invoiceNumber && (
                    <FieldGroup title="INVOICE">
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
                    <FieldGroup title={`LINE ITEMS (${extracted.lineItems.length})`}>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#f0f2f5] border-b border-[#e5e7eb]">
                              {["ITEM CODE", "DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"].map((h) => (
                                <th
                                  key={h}
                                  className="px-1.5 py-1.5 text-[10px] font-medium tracking-wide uppercase text-[#9ca3af] text-left whitespace-nowrap"
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
                                <tr key={idx} className="border-b border-[#f0f2f5]">
                                  <td className="px-1.5 py-1.5 font-mono text-[10px] text-[#4b5563] whitespace-nowrap">
                                    {String(item.itemCode ?? "")}
                                  </td>
                                  <td className="px-1.5 py-1.5 text-xs text-[#111827] max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                                    {String(item.description ?? "")}
                                  </td>
                                  <td className="px-1.5 py-1.5 text-[#111827] text-right">
                                    {String(item.quantity ?? "")}
                                  </td>
                                  <td className="px-1.5 py-1.5 text-[#111827] whitespace-nowrap text-right">
                                    ${Number(item.unitPrice ?? 0).toFixed(2)}
                                  </td>
                                  <td className="px-1.5 py-1.5 text-[#111827] whitespace-nowrap text-right font-medium">
                                    ${Number(item.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {isRevealed() && (
                        <div className="border-t border-[#e5e7eb] mt-1 pt-2 flex justify-between">
                          <span className="text-xs text-[#9ca3af]">TOTAL AMOUNT</span>
                          <span className="text-sm font-semibold text-[#111827]">
                            ${Number(extracted.totalAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </FieldGroup>
                  )}

                  {flagCodes.length > 0 && (
                    <FieldGroup title="FLAGS DETECTED">
                      <div className="flex flex-col gap-1.5">
                        {flagCodes.map((code, idx) => {
                          const flagRevealed = isRevealed();
                          if (!flagRevealed) return null;
                          const { label, severity } = flagLabel(code);
                          return (
                            <div key={idx}>
                              <span className={`badge ${severity}`}>{label}</span>
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
              <div className="px-4 py-3 flex flex-col gap-2 border-t border-[#e5e7eb] bg-white shrink-0">
                {hasNoPO ? (
                  <button
                    onClick={() => router.push("/exceptions/EX-003")}
                    className="w-full bg-red-600 text-white text-xs font-medium py-1.5 px-3 rounded-md border-none cursor-pointer hover:bg-red-700 transition-colors"
                  >
                    Search for PO Match &rarr;
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const exId = selectedDoc ? DOC_TO_EXCEPTION[selectedDoc] : null;
                      router.push(exId ? `/exceptions/${exId}` : "/exceptions");
                    }}
                    className="w-full bg-[#0065cb] text-white text-xs font-medium py-1.5 px-3 rounded-md border-none cursor-pointer hover:bg-[#0057ad] transition-colors"
                  >
                    Match Against PO &rarr;
                  </button>
                )}
                <Link
                  href={
                    selectedDoc && DOC_TO_EXCEPTION[selectedDoc]
                      ? `/exceptions/${DOC_TO_EXCEPTION[selectedDoc]}`
                      : "/exceptions"
                  }
                  className="text-xs text-[#0065cb] text-center no-underline hover:underline"
                >
                  View in Exception Queue &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PDF PREVIEW OVERLAY
          ═══════════════════════════════════════════════════════════════════════ */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setPreviewDoc(null)}
          />
          <div
            className="relative bg-white rounded-lg shadow-lg w-[800px] h-[85vh] flex flex-col"
            style={{ maxWidth: "90vw" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e7eb]">
              <span className="text-sm font-medium text-[#111827]">
                {previewDoc.label} &mdash; {previewDoc.sub}
              </span>
              <div className="flex gap-2 items-center">
                {previewDoc.type === "invoice" && (
                  <button
                    onClick={() => {
                      const docId = previewDoc.id;
                      setPreviewDoc(null);
                      handleExtractDoc(docId);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#0065cb] text-white hover:bg-[#0057ad] cursor-pointer border-none transition-colors"
                  >
                    Extract this invoice
                  </button>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-md hover:bg-[#f0f2f5] cursor-pointer bg-transparent border-none transition-colors"
                >
                  <X className="w-4 h-4 text-[#9ca3af]" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <iframe
                src={`/documents/pdfs/${previewDoc.id}.pdf`}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
