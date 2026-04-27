"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  sterisLineItems,
  sterisLineItemsByPO,
  sterisLineItemsByPS,
  formatCurrency,
  exceptions,
  medlineLineItems,
  owensLineItems,
  exceptionContracts,
  exceptionDuplicates,
  duplicatePairs,
} from "@/lib/data";
import type { Exception, InvoiceLineItem } from "@/lib/data";
import { Check, X, ChevronDown } from "lucide-react";
import { useToast } from "@/components/Toast";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function FileIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      className="flex-shrink-0"
    >
      <path
        d="M4 2h5.5L12 4.5V14H4V2z"
        stroke="#9ca3af"
        strokeWidth="1.25"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9.5 2v2.5H12"
        stroke="#9ca3af"
        strokeWidth="1.25"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const variantClasses: Record<string, string> = {
  "primary-red":
    "block w-full text-xs font-medium px-3 py-2 rounded-md cursor-pointer text-center mb-2 transition-colors bg-red-600 text-white border-none hover:bg-red-700",
  "outline-red":
    "block w-full text-xs font-medium px-3 py-2 rounded-md cursor-pointer text-center mb-2 transition-colors bg-white text-red-600 border border-red-600 hover:bg-red-50",
  "outline-gray":
    "block w-full text-xs font-medium px-3 py-2 rounded-md cursor-pointer text-center mb-2 transition-colors bg-white text-[#4b5563] border border-[#d1d5db] hover:bg-[#f0f2f5]",
  ghost:
    "block w-full text-xs font-medium px-3 py-2 rounded-md cursor-pointer text-center mb-2 transition-colors bg-transparent text-[#9ca3af] border-none hover:text-[#4b5563]",
};

function ActionButton({
  children,
  variant,
  className: extraClassName,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "primary-red" | "outline-red" | "outline-gray" | "ghost";
}) {
  return (
    <button
      className={`${variantClasses[variant]}${extraClassName ? ` ${extraClassName}` : ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── EX-003: MedTech Solutions — Suspicious Invoice ──────────────────────────

function Ex003Page() {
  const router = useRouter();
  const { showToast } = useToast();
  const [actionTaken003, setActionTaken003] = useState<string | null>(null);

  const poCandidates = [
    { po: "NMC-PO-2026-0891", vendor: "Medline Industries", product: "IV Catheter Kits 18G", amount: "$44,800", pct: "34%", pctColor: "#B45309" },
    { po: "NMC-PO-2026-0744", vendor: "Cardinal Health", product: "Peripheral IV Kit", amount: "$38,500", pct: "28%", pctColor: "#9ca3af" },
    { po: "NMC-PO-2026-1102", vendor: "Henry Schein", product: "IV Access Kit", amount: "$41,200", pct: "21%", pctColor: "#9ca3af" },
  ];

  const steps = [
    {
      ok: true,
      title: "Vendor name lookup",
      sub: "Searched: 'MedTech Solutions LLC' · No exact match in vendor master (847 vendors)",
    },
    {
      ok: true,
      title: "Fuzzy vendor matching",
      sub: "Closest: 'MedTech Corp Inc.' (62% similarity) · Different EIN, different address",
    },
    {
      ok: true,
      title: "Open PO search by product",
      sub: "Searched: IV Catheter Kits (HCPCS A4221) · 3 open POs found for this product",
    },
    {
      ok: false,
      title: "PO cross-match",
      sub: "None of the 3 POs match this vendor · Highest confidence: 34% (insufficient)",
    },
  ];

  const detailRows = [
    { label: "Detected", value: "Feb 14, 2026" },
    { label: "Assigned to", value: "Compliance Team" },
    { label: "Invoice amount", value: "$45,200" },
    { label: "PO match", value: "None found" },
    { label: "Vendor in master", value: "No" },
  ];

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Breadcrumb */}
      <div className="pt-6 px-8">
        <button
          onClick={() => router.back()}
          className="text-xs text-[#0065cb] bg-transparent border-none cursor-pointer hover:underline p-0"
        >
          &larr; Back
        </button>
      </div>

      {/* Header */}
      <div className="px-8 pt-3 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-[#9ca3af]">EX-003</span>
          <span className="badge critical">Suspicious Invoice</span>
          <span className="badge blue">Escalated</span>
        </div>
        <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight m-0 mb-1.5 leading-tight">
          MedTech Solutions LLC
        </h1>
        <p className="text-xs text-[#4b5563] m-0">
          Invoice #MTS-INV-00291 · February 14, 2026 · $45,200.00
        </p>
      </div>

      {/* Alert bar */}
      <div className="mx-8 mb-6">
        <div className="border-l-4 border-red-600 bg-red-50 px-5 py-3.5 rounded-lg">
          <span className="text-xs text-red-900">
            Vendor not in approved master · No PO found · Mixed product and services billing · Routed to Compliance
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="px-8 pb-8 grid grid-cols-[1fr_280px] gap-6 items-start">
        {/* LEFT */}
        <div>
          <p className="section-label mb-2">
            PO Match Search
          </p>

          <div className="card overflow-hidden">
            {/* Card header */}
            <div className="px-5 pt-4 pb-3 border-b border-[#e5e7eb] flex items-center justify-between gap-3">
              <span className="text-xs text-[#4b5563]">
                Searching vendor master and open POs for invoice #MTS-INV-00291
              </span>
              <span className="badge critical flex-shrink-0">
                No Match Found
              </span>
            </div>

            {/* Search steps */}
            <div className="px-5 py-4">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2"
                >
                  {/* Step indicator */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-px ${
                      step.ok ? "bg-[#f0f2f5]" : "bg-red-50"
                    }`}
                  >
                    <span
                      className={`leading-none ${
                        step.ok ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {step.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </span>
                  </div>

                  {/* Step text */}
                  <div>
                    <p className="text-xs text-[#111827] m-0 font-medium">
                      {step.title}
                    </p>
                    <p className="text-[11px] text-[#9ca3af] mt-0.5 m-0">
                      {step.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* PO Candidates */}
            <div className="border-t border-[#e5e7eb] px-5 py-4">
              <p className="section-label mb-2.5">
                Closest PO Candidates (Insufficient Confidence)
              </p>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Vendor on PO</th>
                      <th>Product</th>
                      <th className="right">Amount</th>
                      <th className="right">Match %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poCandidates.map((row) => (
                      <tr key={row.po}>
                        <td>
                          <span className="font-mono text-[11px] text-[#9ca3af]">
                            {row.po}
                          </span>
                        </td>
                        <td className="text-xs text-[#111827]">{row.vendor}</td>
                        <td className="text-xs text-[#4b5563]">{row.product}</td>
                        <td className="right text-xs tabular-nums text-[#111827]">
                          {row.amount}
                        </td>
                        <td className="right">
                          <span
                            className="text-xs font-medium tabular-nums"
                            style={{ color: row.pctColor }}
                          >
                            {row.pct}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vendor not in master note */}
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mt-4">
                <p className="section-label text-red-600 mb-1.5">
                  Vendor Not in Approved Master
                </p>
                <p className="text-xs text-red-900 m-0 leading-relaxed">
                  MedTech Solutions LLC (EIN: 84-2917441) does not appear in Northfield Medical&apos;s
                  approved vendor registry. The invoice references IV Catheter Kits but this
                  vendor&apos;s registered business category is &apos;Management Consulting&apos;. Bank account
                  provided (routing 071923828) does not match any known vendor on record.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT panel */}
        <div className="card p-5">
          {/* Exception details */}
          <p className="section-label mb-0">
            Exception Details
          </p>

          {detailRows.map((row, i) => (
            <div
              key={row.label}
              className={`flex justify-between items-baseline py-2.5 ${
                i < detailRows.length - 1 ? "border-b border-[#f0f2f5]" : ""
              }`}
            >
              <span className="text-xs text-[#4b5563]">{row.label}</span>
              <span className="text-xs text-[#111827] font-medium">{row.value}</span>
            </div>
          ))}

          {/* Risk level row */}
          <div className="flex justify-between items-center py-2.5 border-t border-[#f0f2f5]">
            <span className="text-xs text-[#4b5563]">Risk level</span>
            <span className="badge critical">High</span>
          </div>

          {/* Documents */}
          <p className="section-label mt-4 mb-2">
            Documents
          </p>

          <div className="flex items-center justify-between gap-2 py-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileIcon />
              <span className="text-[11px] text-[#4b5563] overflow-hidden text-ellipsis whitespace-nowrap">
                invoice-MTS-INV-00291.pdf
              </span>
            </div>
            <a
              href="/documents/pdfs/invoice-MTS-INV-00291.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#0065cb] no-underline whitespace-nowrap flex-shrink-0 hover:underline"
            >
              Open &rarr;
            </a>
          </div>

          {/* Actions */}
          <p className="section-label mt-5 mb-2.5">
            Actions
          </p>

          {actionTaken003 ? (
            <div className={`px-3 py-2.5 rounded-md text-xs font-medium text-center ${
              actionTaken003 === "blocked" ? "bg-red-50 text-red-700 border border-red-200" :
              actionTaken003 === "reported" ? "bg-purple-50 text-purple-700 border border-purple-200" :
              actionTaken003 === "verification" ? "bg-blue-50 text-blue-700 border border-blue-200" :
              "bg-gray-50 text-gray-500 border border-gray-200"
            }`}>
              {actionTaken003 === "blocked" ? "Payment Blocked" :
               actionTaken003 === "reported" ? "Reported to Compliance" :
               actionTaken003 === "verification" ? "Verification Requested" :
               "Dismissed — False Positive"}
            </div>
          ) : (
            <>
              <ActionButton variant="primary-red" onClick={() => { setActionTaken003("blocked"); showToast("Payment blocked for MTS-INV-00291", "warning"); }}>Block Payment</ActionButton>
              <ActionButton variant="outline-red" onClick={() => { setActionTaken003("reported"); showToast("Reported to compliance — case #CR-2026-0291", "info"); }}>Report to Compliance</ActionButton>
              <ActionButton variant="outline-gray" onClick={() => { setActionTaken003("verification"); showToast("Verification request sent to MedTech Solutions LLC", "success"); }}>Request Vendor Verification</ActionButton>
              <ActionButton variant="ghost" className="!mb-0" onClick={() => { if (confirm("Dismiss this exception as a false positive?")) { setActionTaken003("dismissed"); showToast("Exception EX-003 dismissed as false positive", "info"); } }}>
                Dismiss (False Positive)
              </ActionButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EX-006: Steris Corporation — Match Exception ────────────────────────────

function rowBgClass(flags?: string[]): string {
  if (!flags || flags.length === 0) return "";
  if (flags.includes("price")) return "bg-red-50";
  if (flags.includes("qty") || flags.includes("unit") || flags.includes("description")) return "bg-amber-50";
  return "";
}

const FLAG_BADGES: Record<string, { cls: string; label: string }> = {
  price: { cls: "badge critical", label: "Price" },
  qty: { cls: "badge warning", label: "Qty" },
  description: { cls: "badge blue", label: "Description" },
  unit: { cls: "badge neutral", label: "Unit" },
};

const REJECT_REASONS = [
  "Incorrect pricing — vendor applied wrong rate",
  "Wrong quantity — does not match packing slip",
  "Item not ordered — not on original PO",
  "Duplicate charge — already billed previously",
  "Wrong PO referenced — need to match against correct PO",
  "Additional shipment pending — quantity will reconcile",
  "Other",
];

function Ex006Page() {
  const router = useRouter();
  const { showToast } = useToast();

  // Line-item accept/reject state
  const [lineItemStates, setLineItemStates] = useState<Record<string, "pending" | "accepted" | "rejected">>(
    Object.fromEntries(sterisLineItems.map((item) => [item.itemCode, "pending"]))
  );
  const [rejectingItem, setRejectingItem] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectComment, setRejectComment] = useState("");

  // Document change state
  const [changingDoc, setChangingDoc] = useState<string | null>(null);
  const [docOverrides, setDocOverrides] = useState<Record<string, { label: string; href: string }>>({});

  // Selected PO/PS for dynamic three-way match recalculation
  const [selectedPO, setSelectedPO] = useState("po-NMC-2026-PO-2847.pdf");
  const [selectedPS, setSelectedPS] = useState("packingslip-STC-PS-2026-0392.pdf");

  // Compute dynamic line items based on selected PO and PS
  const dynamicLineItems = sterisLineItems.map((item) => {
    const poData = sterisLineItemsByPO[selectedPO]?.[item.itemCode];
    const psQty = sterisLineItemsByPS[selectedPS]?.[item.itemCode];
    const poQty = poData?.poQty ?? item.poQty;
    const poUnitPrice = poData?.poUnitPrice ?? item.poUnitPrice;
    const packingSlipQty = psQty ?? item.packingSlipQty;
    const priceMismatch = item.invoiceUnitPrice !== poUnitPrice;
    const qtyMismatch = packingSlipQty !== item.invoiceQty;
    const descMismatch = item.poDescription && item.invoiceDescription && item.poDescription !== item.invoiceDescription;
    const unitMismatch = item.poUnit && item.invoiceUnit && item.poUnit !== item.invoiceUnit;
    const flags: ("price" | "qty" | "description" | "unit")[] = [];
    if (priceMismatch) flags.push("price");
    if (qtyMismatch) flags.push("qty");
    if (descMismatch) flags.push("description");
    if (unitMismatch) flags.push("unit");
    const status = priceMismatch && qtyMismatch ? "both_mismatch" as const
      : priceMismatch ? "price_mismatch" as const
      : qtyMismatch ? "qty_mismatch" as const
      : "match" as const;
    return { ...item, poQty, poUnitPrice, packingSlipQty, status, flags };
  });

  // Invoice is the baseline — only PO and Packing Slip can be changed
  const altDocuments: Record<string, { label: string; href: string }[]> = {
    "/documents/pdfs/po-NMC-2026-PO-2847.pdf": [
      { label: "po-NMC-2026-PO-2847.pdf", href: "/documents/pdfs/po-NMC-2026-PO-2847.pdf" },
      { label: "po-NMC-2026-PO-2651.pdf", href: "/documents/pdfs/po-NMC-2026-PO-2651.pdf" },
      { label: "po-NMC-2026-PO-2499.pdf", href: "/documents/pdfs/po-NMC-2026-PO-2499.pdf" },
    ],
    "/documents/pdfs/packingslip-STC-PS-2026-0392.pdf": [
      { label: "packingslip-STC-PS-2026-0392.pdf", href: "/documents/pdfs/packingslip-STC-PS-2026-0392.pdf" },
      { label: "packingslip-STC-PS-2026-0371.pdf", href: "/documents/pdfs/packingslip-STC-PS-2026-0371.pdf" },
      { label: "packingslip-STC-PS-2026-0350.pdf", href: "/documents/pdfs/packingslip-STC-PS-2026-0350.pdf" },
    ],
  };

  // Action modal state
  const [activeModal, setActiveModal] = useState<"correction" | "override" | "escalate" | null>(null);
  const [modalNote, setModalNote] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  // Invoice status tracking
  const [invoiceStatus, setInvoiceStatus] = useState<"pending_review" | "waiting_manager" | "waiting_correction" | "approved_override">("pending_review");

  const statusSteps = [
    { key: "pending_review", label: "Pending Review", color: "#B45309" },
    { key: "waiting_correction", label: "Waiting on Correction", color: "#0065cb" },
    { key: "waiting_manager", label: "Escalated to Manager", color: "#7c3aed" },
    { key: "approved_override", label: "Approved", color: "#15803D" },
  ] as const;

  const allResolved = dynamicLineItems.every((item) => lineItemStates[item.itemCode] !== "pending");
  const hasAnyRejection = dynamicLineItems.some((item) => lineItemStates[item.itemCode] === "rejected");

  // "Going against finding" state — needs reason popup
  const [reasonPopup, setReasonPopup] = useState<{ itemCode: string; action: "accept" | "reject" } | null>(null);
  const [reasonNote, setReasonNote] = useState("");

  const handleLineItemAction = (itemCode: string, action: "accept" | "reject") => {
    const item = dynamicLineItems.find((i) => i.itemCode === itemCode);
    if (!item) return;

    if (action === "reject") {
      // Disagree always requires a reason — user is overriding the AI
      setReasonPopup({ itemCode, action });
      setReasonNote("");
    } else {
      // Agree is instant — no reason needed
      setLineItemStates((prev) => ({ ...prev, [itemCode]: "accepted" }));
    }
  };

  const handleReasonConfirm = () => {
    if (!reasonPopup || !reasonNote.trim()) return;
    setLineItemStates((prev) => ({ ...prev, [reasonPopup.itemCode]: reasonPopup.action === "accept" ? "accepted" : "rejected" }));
    setReasonPopup(null);
  };

  // Keep legacy handlers for compatibility
  const handleAccept = (itemCode: string) => handleLineItemAction(itemCode, "accept");
  const handleRejectOpen = (itemCode: string) => handleLineItemAction(itemCode, "reject");

  const handleRejectConfirm = () => {
    if (!rejectingItem || !rejectReason) return;
    setLineItemStates((prev) => ({ ...prev, [rejectingItem]: "rejected" }));
    setRejectingItem(null);
  };

  const poTotal = dynamicLineItems.reduce(
    (sum, item) => sum + item.poQty * item.poUnitPrice,
    0
  );
  const invTotal = dynamicLineItems.reduce(
    (sum, item) => sum + item.invoiceQty * item.invoiceUnitPrice,
    0
  );
  const variance = invTotal - poTotal;
  const variancePct = ((variance / poTotal) * 100).toFixed(1);

  const documents = [
    { label: "invoice-STC-2026-19847.pdf", href: "/documents/pdfs/invoice-STC-2026-19847.pdf" },
    { label: "po-NMC-2026-PO-2847.pdf", href: "/documents/pdfs/po-NMC-2026-PO-2847.pdf" },
    { label: "packingslip-STC-PS-2026-0392.pdf", href: "/documents/pdfs/packingslip-STC-PS-2026-0392.pdf" },
  ];

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Breadcrumb */}
      <div className="pt-6 px-8">
        <button
          onClick={() => router.back()}
          className="text-xs text-[#0065cb] bg-transparent border-none cursor-pointer hover:underline p-0"
        >
          &larr; Back
        </button>
      </div>

      {/* Header */}
      <div className="px-8 pt-3 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-[#9ca3af]">EX-006</span>
          <span className="badge warning">Match Exception</span>
          <span className="badge warning">Under Review</span>
        </div>
        <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight m-0 mb-1.5 leading-tight">
          Steris Corporation
        </h1>
        <p className="text-xs text-[#4b5563] m-0">
          Invoice #STC-2026-19847 · February 28, 2026 · PO #NMC-PO-2026-2847
        </p>
      </div>

      {/* Alert bar */}
      <div className="mx-8 mb-6">
        <div className="border-l-4 border-red-600 bg-red-50 px-5 py-3.5 rounded-md">
          <span className="text-xs text-red-900">
            {dynamicLineItems.reduce((sum, item) => sum + (item.flags?.length || 0), 0)} discrepancies detected — $4,600 flagged this invoice · recurrence · AI confidence 98.7%
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="px-8 pb-8 grid grid-cols-[1fr_280px] gap-6 items-start">
        {/* LEFT: Three-way match */}
        <div>
          <p className="section-label mb-2">
            Three-Way Match Analysis
          </p>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Description</th>
                    <th className="right">PO Qty</th>
                    <th className="right">PS Qty</th>
                    <th className="right">Inv Qty</th>
                    <th className="right">PO Price</th>
                    <th className="right">Inv Price</th>
                    <th className="right">Variance</th>
                    <th>Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dynamicLineItems.map((item) => {
                    const itemFlags = item.flags || [];
                    const isPriceMismatch = itemFlags.includes("price");
                    const isQtyMismatch = itemFlags.includes("qty");
                    const isDescMismatch = itemFlags.includes("description");
                    const isUnitMismatch = itemFlags.includes("unit");
                    const hasAnyIssue = itemFlags.length > 0;

                    let varianceNode: React.ReactNode = (
                      <span className="text-[#9ca3af]">&mdash;</span>
                    );
                    if (isPriceMismatch) {
                      const delta = item.invoiceUnitPrice - item.poUnitPrice;
                      varianceNode = (
                        <span className="text-red-600 font-medium tabular-nums">
                          {delta > 0 ? "+" : ""}${delta.toFixed(2)}/unit
                        </span>
                      );
                    } else if (isQtyMismatch) {
                      const delta = item.packingSlipQty - item.invoiceQty;
                      varianceNode = (
                        <span className="text-amber-700 font-medium tabular-nums">
                          {delta > 0 ? "+" : ""}
                          {delta} units
                        </span>
                      );
                    }

                    return (
                      <tr key={item.itemCode} className={rowBgClass(item.flags)}>
                        <td>
                          <span className="font-mono text-[11px] text-[#9ca3af]">
                            {item.itemCode}
                          </span>
                        </td>
                        <td className="max-w-[220px]">
                          <span className="text-xs text-[#111827] block">
                            {item.invoiceDescription || item.description}
                          </span>
                          {isDescMismatch && item.poDescription && (
                            <span className="text-[10px] text-purple-600 block mt-0.5">
                              PO: {item.poDescription}
                            </span>
                          )}
                          {isUnitMismatch && (
                            <span className="text-[10px] text-blue-600 block mt-0.5">
                              PO unit: {item.poUnit} / Invoice unit: {item.invoiceUnit}
                            </span>
                          )}
                        </td>
                        <td className="right text-xs tabular-nums">
                          {item.poQty}
                        </td>
                        <td className="right text-xs tabular-nums">
                          {item.packingSlipQty}
                        </td>
                        <td className="right text-xs tabular-nums">
                          {item.invoiceQty}
                        </td>
                        <td className="right text-xs tabular-nums">
                          ${item.poUnitPrice.toFixed(2)}
                        </td>
                        <td className="right">
                          <span
                            className={`text-xs tabular-nums ${
                              isPriceMismatch ? "font-medium text-red-600" : "text-[#111827]"
                            }`}
                          >
                            ${item.invoiceUnitPrice.toFixed(2)}
                          </span>
                        </td>
                        <td className="right">{varianceNode}</td>
                        <td>
                          {hasAnyIssue ? (
                            <div className="flex flex-wrap gap-1">
                              {itemFlags.map((flag) => {
                                const fb = FLAG_BADGES[flag];
                                return fb ? <span key={flag} className={fb.cls}>{fb.label}</span> : null;
                              })}
                            </div>
                          ) : (
                            <span className="badge success">Match</span>
                          )}
                        </td>
                        <td className="text-center relative">
                          {lineItemStates[item.itemCode] === "pending" ? (
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={() => handleAccept(item.itemCode)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Agree
                              </button>
                              <button
                                onClick={() => handleRejectOpen(item.itemCode)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" /> Disagree
                              </button>
                            </div>
                          ) : lineItemStates[item.itemCode] === "accepted" ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" /> Agreed
                              </span>
                              <button
                                onClick={() => setLineItemStates((prev) => ({ ...prev, [item.itemCode]: "pending" }))}
                                className="text-[10px] text-[#9ca3af] hover:text-[#4b5563] bg-transparent border-none cursor-pointer transition-colors"
                                title="Change decision"
                              >
                                undo
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-50 text-red-700 border border-red-200">
                                <X className="w-3 h-3" /> Disagreed
                              </span>
                              <button
                                onClick={() => setLineItemStates((prev) => ({ ...prev, [item.itemCode]: "pending" }))}
                                className="text-[10px] text-[#9ca3af] hover:text-[#4b5563] bg-transparent border-none cursor-pointer transition-colors"
                                title="Change decision"
                              >
                                undo
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Reason popup — shown when going against AI finding */}
            {reasonPopup && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setReasonPopup(null)} />
                <div className="relative bg-white border border-[#e5e7eb] shadow-md rounded-lg w-full max-w-md">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
                    <h3 className="text-sm font-semibold text-[#111827] m-0">
                      Disagree with AI Finding: {reasonPopup.itemCode}
                    </h3>
                    <button onClick={() => setReasonPopup(null)} className="text-[#9ca3af] hover:text-[#111827] cursor-pointer bg-transparent border-none p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-5 py-4">
                    <div className="px-3 py-2.5 rounded-md text-xs mb-4 bg-amber-50 border border-amber-200 text-amber-800">
                      You are disagreeing with the AI finding for this line item. Please provide a reason for your override.
                    </div>

                    <label className="block text-xs font-medium text-[#4b5563] mb-1.5">
                      Why do you disagree with the AI finding?
                    </label>
                    <textarea
                      value={reasonNote}
                      onChange={(e) => setReasonNote(e.target.value)}
                      placeholder={reasonPopup.action === "accept"
                        ? "e.g., Vendor confirmed new pricing, PO amendment pending..."
                        : "e.g., Extraction error, wrong item matched, data entry issue..."}
                      rows={3}
                      className="w-full px-3 py-2 text-xs border border-[#e5e7eb] rounded-md bg-white text-[#111827] resize-none focus:outline-none focus:ring-2 focus:ring-[#0065cb]/20 focus:border-[#0065cb]"
                    />
                  </div>

                  <div className="flex gap-2 justify-end px-5 py-3 border-t border-[#e5e7eb]">
                    <button
                      onClick={() => setReasonPopup(null)}
                      className="px-4 py-2 text-xs font-medium rounded-md border border-[#d1d5db] text-[#4b5563] bg-white hover:bg-[#f0f2f5] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReasonConfirm}
                      disabled={!reasonNote.trim()}
                      className="px-4 py-2 text-xs font-medium rounded-md text-white border-none transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-700"
                    >
                      Confirm Override
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Totals summary */}
            <div className="border-t border-[#e5e7eb] px-6 py-4 flex gap-10">
              <div>
                <p className="section-label mb-1">PO Total</p>
                <p className="text-lg font-semibold text-[#111827] m-0 tabular-nums">
                  {formatCurrency(poTotal)}
                </p>
              </div>
              <div>
                <p className="section-label mb-1">Invoice Total</p>
                <p className="text-lg font-semibold text-red-600 m-0 tabular-nums">
                  {formatCurrency(invTotal)}
                </p>
              </div>
              <div>
                <p className="section-label mb-1">Variance</p>
                <p className="text-lg font-semibold text-red-600 m-0 tabular-nums">
                  +{formatCurrency(variance)}{" "}
                  <span className="text-[13px] font-normal">
                    (+{variancePct}%)
                  </span>
                </p>
              </div>
            </div>

            {/* AI recommendation */}
            <div className="px-6 pb-5">
              <div className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-md px-4 py-3">
                <p className="section-label mb-1.5">AI Recommendation</p>
                <p className="text-xs text-[#4b5563] m-0 leading-relaxed">
                  Hold invoice. Request revised invoice from Steris at contracted rate of
                  $2.10/unit (PO #NMC-PO-2026-2847). Price variance of $0.40/unit has
                  recurred 23x this quarter = $4,600 total overcharge.
                </p>
              </div>
            </div>
          </div>
          {/* Invoice Status Stepper */}
          <div className="card px-6 py-4 mt-4">
            <p className="section-label mb-3">Invoice Status</p>
            <div className="flex items-center">
              {statusSteps.map((step, i) => {
                const isActive = invoiceStatus === step.key;
                const isPast = statusSteps.findIndex(s => s.key === invoiceStatus) > i;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? "text-white"
                            : isPast
                              ? "text-white"
                              : "bg-[#f0f2f5] text-[#9ca3af]"
                        }`}
                        style={isActive || isPast ? { backgroundColor: step.color } : undefined}
                      >
                        {isPast ? <Check className="w-3 h-3" /> : i + 1}
                      </div>
                      <span className={`text-[10px] mt-1.5 text-center whitespace-nowrap ${
                        isActive ? "font-semibold text-[#111827]" : "text-[#9ca3af]"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-4 ${
                        isPast ? "bg-[#0065cb]" : "bg-[#e5e7eb]"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Info panel */}
        <div className="card p-5">
          <p className="section-label mb-0">Exception Details</p>

          {[
            { label: "Assigned to", value: "Rajesh Jaluka" },
            { label: "Detected", value: "Mar 1, 2026" },
            { label: "Recurrences", value: "23 invoices this quarter" },
            { label: "Cumulative impact", value: "$4,600" },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex justify-between items-baseline py-2.5 ${
                i < arr.length - 1 ? "border-b border-[#f0f2f5]" : ""
              }`}
            >
              <span className="text-xs text-[#4b5563]">{row.label}</span>
              <span className="text-xs text-[#111827] font-medium">{row.value}</span>
            </div>
          ))}

          {/* Documents */}
          <p className="section-label mt-5 mb-2">Documents</p>

          {documents.map((doc) => (
            <div key={doc.href} className="relative py-2 border-b border-[#f0f2f5]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileIcon />
                  <span className="text-[11px] text-[#4b5563] overflow-hidden text-ellipsis whitespace-nowrap">
                    {docOverrides[doc.href]?.label || doc.label}
                  </span>
                  {docOverrides[doc.href] && docOverrides[doc.href].label !== doc.label && (
                    <span className="text-[9px] text-[#0065cb] font-medium ml-1">changed</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={docOverrides[doc.href]?.href || doc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#0065cb] no-underline whitespace-nowrap hover:underline"
                  >
                    Open
                  </a>
                  {altDocuments[doc.href] && (
                    <button
                      onClick={() => setChangingDoc(changingDoc === doc.href ? null : doc.href)}
                      className="text-[11px] text-[#9ca3af] bg-transparent border-none cursor-pointer hover:text-[#111827] transition-colors"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>
              {changingDoc === doc.href && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-md shadow-md py-1 z-20 w-[240px]">
                  {(altDocuments[doc.href] || []).map((alt) => (
                    <button
                      key={alt.label}
                      onClick={() => {
                        setDocOverrides((prev) => ({ ...prev, [doc.href]: { label: alt.label, href: alt.href } }));
                        setChangingDoc(null);
                        if (alt.label.startsWith("po-")) setSelectedPO(alt.label);
                        if (alt.label.startsWith("packingslip-")) setSelectedPS(alt.label);
                        showToast(`Document changed to ${alt.label} — table recalculated`, "info");
                      }}
                      className={`flex items-center w-full text-left px-3 py-1.5 text-[11px] cursor-pointer border-none transition-colors ${
                        (docOverrides[doc.href]?.label || doc.label) === alt.label
                          ? "bg-[#0065cb]/5 text-[#0065cb] font-medium"
                          : "bg-white text-[#4b5563] hover:bg-[#f0f2f5]"
                      }`}
                    >
                      {(docOverrides[doc.href]?.label || doc.label) === alt.label && <Check className="w-3 h-3 inline mr-1" />}{alt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Actions */}
          <p className="section-label mt-5 mb-2.5">Actions</p>

          {actionTaken ? (
            <div className={`px-3 py-2.5 rounded-md text-xs font-medium text-center ${
              actionTaken === "correction" ? "bg-blue-50 text-blue-700 border border-blue-200" :
              actionTaken === "override" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
              "bg-purple-50 text-purple-700 border border-purple-200"
            }`}>
              {actionTaken === "correction" ? "Recovery Initiated — Email Sent" :
               actionTaken === "override" ? "Approved with Override" :
               "Escalated to Manager"}
            </div>
          ) : (
            <>
              {!allResolved && (
                <p className="text-[10px] text-[#9ca3af] mb-2 italic">
                  Review all line items above to unlock actions
                </p>
              )}

              <button
                disabled={!allResolved}
                onClick={() => { setActiveModal("correction"); setModalNote(""); }}
                className={`block w-full text-xs font-medium px-3 py-2 rounded-md text-center mb-2 transition-colors border ${
                  allResolved
                    ? "bg-white text-amber-700 border-amber-700 cursor-pointer hover:bg-amber-50"
                    : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
              >
                Initiate Recovery
              </button>

              <button
                disabled={!allResolved || hasAnyRejection}
                onClick={() => { setActiveModal("override"); setModalNote(""); }}
                className={`block w-full text-xs font-medium px-3 py-2 rounded-md text-center mb-2 transition-colors border ${
                  allResolved && !hasAnyRejection
                    ? "bg-white text-[#4b5563] border-[#d1d5db] cursor-pointer hover:bg-[#f0f2f5]"
                    : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
                title={hasAnyRejection ? "Cannot approve — one or more line items have disagreements" : ""}
              >
                Approve with Override
                {allResolved && hasAnyRejection && (
                  <span className="block text-[10px] text-red-400 font-normal mt-0.5">Blocked — disagreement exists</span>
                )}
              </button>

              <button
                onClick={() => { setActiveModal("escalate"); setModalNote(""); setSelectedManager(""); }}
                className="block w-full bg-white text-[#4b5563] text-xs font-medium px-3 py-2 rounded-md border border-[#d1d5db] cursor-pointer text-center transition-colors hover:bg-[#f0f2f5]"
              >
                Escalate to Manager
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── ACTION MODALS ──────────────────────────────────────────────────── */}

      {/* Initiate Recovery Modal */}
      {activeModal === "correction" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white border border-[#e5e7eb] shadow-md rounded-lg w-full max-w-lg max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
              <h3 className="text-sm font-semibold text-[#111827] m-0">Initiate Recovery from Vendor</h3>
              <button onClick={() => setActiveModal(null)} className="text-[#9ca3af] hover:text-[#111827] cursor-pointer bg-transparent border-none p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <label className="block text-xs font-medium text-[#4b5563] mb-1">Vendor Email</label>
              <input type="text" readOnly value="ap@steris.com" className="w-full px-3 py-2 text-xs border border-[#e5e7eb] rounded-md bg-[#f7f8fa] text-[#4b5563] mb-3" />

              <label className="block text-xs font-medium text-[#4b5563] mb-1">Subject</label>
              <input type="text" readOnly value="Recovery Request: Invoice #STC-2026-19847 — Price Discrepancy" className="w-full px-3 py-2 text-xs border border-[#e5e7eb] rounded-md bg-[#f7f8fa] text-[#4b5563] mb-3" />

              <label className="block text-xs font-medium text-[#4b5563] mb-1">Message</label>
              <textarea
                value={modalNote || "Dear Steris Accounts Receivable,\n\nWe have identified a pricing discrepancy on Invoice #STC-2026-19847.\n\nThe contracted rate for Sterile Surgical Drape Sets (STE-4821-A) is $2.10/unit per PO #NMC-PO-2026-2847, but the invoice reflects $2.50/unit.\n\nPlease issue a revised invoice at the contracted rate, or provide documentation supporting the rate change.\n\nRegards,\nNorthfield Medical Center — Accounts Payable"}
                onChange={(e) => setModalNote(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 text-xs border border-[#e5e7eb] rounded-md bg-white text-[#111827] resize-none focus:outline-none focus:ring-2 focus:ring-[#0065cb]/20 focus:border-[#0065cb] leading-relaxed"
              />
            </div>
            <div className="flex gap-2 justify-end px-5 py-3 border-t border-[#e5e7eb]">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-medium rounded-md border border-[#d1d5db] text-[#4b5563] bg-white hover:bg-[#f0f2f5] transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => { setActiveModal(null); setActionTaken("correction"); setInvoiceStatus("waiting_correction"); showToast("Recovery request sent to ap@steris.com", "success"); }}
                className="px-4 py-2 text-xs font-medium rounded-md bg-[#0065cb] text-white border-none hover:bg-[#0057ad] transition-colors cursor-pointer"
              >
                Send Recovery Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve with Override Modal */}
      {activeModal === "override" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white border border-[#e5e7eb] shadow-md rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
              <h3 className="text-sm font-semibold text-[#111827] m-0">Approve Invoice with Override</h3>
              <button onClick={() => setActiveModal(null)} className="text-[#9ca3af] hover:text-[#111827] cursor-pointer bg-transparent border-none p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5 mb-4">
                <p className="text-xs text-amber-800 m-0 font-medium">This will approve the invoice despite identified discrepancies.</p>
                <p className="text-[11px] text-amber-700 m-0 mt-1">Invoice #STC-2026-19847 · Steris Corporation · $28,750.00</p>
              </div>

              <label className="block text-xs font-medium text-[#4b5563] mb-1.5">Override reason (required)</label>
              <textarea
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Explain why this override is justified..."
                rows={4}
                className="w-full px-3 py-2 text-xs border border-[#e5e7eb] rounded-md bg-white text-[#111827] resize-none focus:outline-none focus:ring-2 focus:ring-[#0065cb]/20 focus:border-[#0065cb]"
              />
            </div>
            <div className="flex gap-2 justify-end px-5 py-3 border-t border-[#e5e7eb]">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-medium rounded-md border border-[#d1d5db] text-[#4b5563] bg-white hover:bg-[#f0f2f5] transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => { setActiveModal(null); setActionTaken("override"); setInvoiceStatus("approved_override"); showToast("Invoice STC-2026-19847 approved with override", "warning"); }}
                disabled={!modalNote.trim()}
                className="px-4 py-2 text-xs font-medium rounded-md bg-amber-600 text-white border-none hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Approve with Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate to Manager Modal */}
      {activeModal === "escalate" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white border border-[#e5e7eb] shadow-md rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
              <h3 className="text-sm font-semibold text-[#111827] m-0">Escalate to Manager</h3>
              <button onClick={() => setActiveModal(null)} className="text-[#9ca3af] hover:text-[#111827] cursor-pointer bg-transparent border-none p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <label className="block text-xs font-medium text-[#4b5563] mb-1.5">Select Manager</label>
              <div className="relative mb-3">
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#e5e7eb] rounded-md bg-white text-[#111827] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0065cb]/20 focus:border-[#0065cb]"
                >
                  <option value="">Choose a manager...</option>
                  <option value="david">David Kim — VP Finance</option>
                  <option value="lisa">Lisa Rodriguez — Director, AP</option>
                  <option value="michael">Michael Chang — CFO</option>
                  <option value="jennifer">Jennifer Walsh — Compliance Officer</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af] pointer-events-none" />
              </div>

              <label className="block text-xs font-medium text-[#4b5563] mb-1.5">Note</label>
              <textarea
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Describe the situation and any urgency..."
                rows={4}
                className="w-full px-3 py-2 text-xs border border-[#e5e7eb] rounded-md bg-white text-[#111827] resize-none focus:outline-none focus:ring-2 focus:ring-[#0065cb]/20 focus:border-[#0065cb]"
              />
            </div>
            <div className="flex gap-2 justify-end px-5 py-3 border-t border-[#e5e7eb]">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-medium rounded-md border border-[#d1d5db] text-[#4b5563] bg-white hover:bg-[#f0f2f5] transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => { setActiveModal(null); setActionTaken("escalate"); setInvoiceStatus("waiting_manager"); showToast("Escalated to " + (selectedManager === "david" ? "David Kim" : selectedManager === "lisa" ? "Lisa Rodriguez" : selectedManager === "michael" ? "Michael Chang" : "Jennifer Walsh"), "info"); }}
                disabled={!selectedManager || !modalNote.trim()}
                className="px-4 py-2 text-xs font-medium rounded-md bg-[#0065cb] text-white border-none hover:bg-[#0057ad] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared: Right Panel with Action Buttons ─────────────────────────────────

function ActionPanel({
  ex,
  actionTaken,
  setActionTaken,
}: {
  ex: Exception;
  actionTaken: string | null;
  setActionTaken: (v: string) => void;
}) {
  const { showToast } = useToast();
  const detailRows = [
    { label: "Assigned to", value: ex.assignee || "Unassigned" },
    { label: "Detected", value: new Date(ex.detectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
    { label: "Severity", value: ex.severity.charAt(0).toUpperCase() + ex.severity.slice(1) },
    { label: "Type", value: typeLabels[ex.type] || ex.type },
    { label: "Invoice Amount", value: formatCurrency(ex.amount) },
    { label: "Flagged Amount", value: formatCurrency(ex.flaggedAmount) },
  ];

  return (
    <div className="card p-5">
      <p className="section-label mb-0">Exception Details</p>
      {detailRows.map((row, i, arr) => (
        <div
          key={row.label}
          className={`flex justify-between items-baseline py-2.5 ${i < arr.length - 1 ? "border-b border-[#f0f2f5]" : ""}`}
        >
          <span className="text-xs text-[#4b5563]">{row.label}</span>
          <span className="text-xs text-[#111827] font-medium">{row.value}</span>
        </div>
      ))}

      <p className="section-label mt-5 mb-2.5">Actions</p>

      {actionTaken ? (
        <div className={`px-3 py-2.5 rounded-md text-xs font-medium text-center ${
          actionTaken === "blocked" ? "bg-red-50 text-red-700 border border-red-200" :
          actionTaken === "recovery" ? "bg-blue-50 text-blue-700 border border-blue-200" :
          actionTaken === "escalated" ? "bg-purple-50 text-purple-700 border border-purple-200" :
          "bg-gray-50 text-gray-500 border border-gray-200"
        }`}>
          {actionTaken === "blocked" ? "Payment Blocked" :
           actionTaken === "recovery" ? "Recovery Initiated" :
           actionTaken === "escalated" ? "Escalated to Manager" :
           "Dismissed"}
        </div>
      ) : (
        <>
          <ActionButton variant="primary-red" onClick={() => { setActionTaken("blocked"); showToast(`Payment blocked for ${ex.invoiceNumber}`, "warning"); }}>
            Block Payment
          </ActionButton>
          <ActionButton variant="outline-red" onClick={() => { setActionTaken("recovery"); showToast(`Recovery initiated for ${formatCurrency(ex.flaggedAmount)}`, "success"); }}>
            Initiate Recovery
          </ActionButton>
          <ActionButton variant="outline-gray" onClick={() => { setActionTaken("escalated"); showToast(`${ex.id} escalated to manager`, "info"); }}>
            Escalate to Manager
          </ActionButton>
          <ActionButton variant="ghost" className="!mb-0" onClick={() => { if (confirm("Dismiss this exception?")) { setActionTaken("dismissed"); showToast(`${ex.id} dismissed`, "info"); } }}>
            Dismiss
          </ActionButton>
        </>
      )}
    </div>
  );
}

// ─── Shared: Page Shell (header + alert + two-col layout) ────────────────────

function PageShell({
  ex,
  children,
  rightPanel,
}: {
  ex: Exception;
  children: React.ReactNode;
  rightPanel: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <div className="pt-6 px-8">
        <button onClick={() => router.back()} className="text-xs text-[#0065cb] bg-transparent border-none cursor-pointer hover:underline p-0">
          &larr; Back
        </button>
      </div>

      <div className="px-8 pt-3 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-[#9ca3af]">{ex.id}</span>
          <span className={severityColors[ex.severity] || "badge neutral"}>{typeLabels[ex.type] || ex.type}</span>
          <span className={`badge ${ex.status === "open" ? "critical" : ex.status === "resolved" ? "success" : ex.status === "escalated" ? "blue" : "warning"}`}>
            {ex.status === "open" ? "Open" : ex.status === "resolved" ? "Resolved" : ex.status === "escalated" ? "Escalated" : "Under Review"}
          </span>
        </div>
        <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight m-0 mb-1.5 leading-tight">
          {ex.vendor}
        </h1>
        <p className="text-xs text-[#4b5563] m-0">
          Invoice #{ex.invoiceNumber} · {new Date(ex.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Flagged: {formatCurrency(ex.flaggedAmount)}
        </p>
      </div>

      <div className="mx-8 mb-6">
        <div className="border-l-4 border-red-600 bg-red-50 px-5 py-3.5 rounded-md">
          <span className="text-xs text-red-900">{ex.description}</span>
        </div>
      </div>

      <div className="px-8 pb-8 grid grid-cols-[1fr_280px] gap-6 items-start">
        <div>{children}</div>
        {rightPanel}
      </div>
    </div>
  );
}

// ─── Template 1: MatchExceptionDetail (EX-007, EX-010) ──────────────────────

function MatchExceptionDetail({ exception: ex }: { exception: Exception }) {
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const lineItems = ex.id === "EX-007" ? medlineLineItems : owensLineItems;

  const poTotal = lineItems.reduce((s, it) => s + it.poQty * it.poUnitPrice, 0);
  const invTotal = lineItems.reduce((s, it) => s + it.invoiceQty * it.invoiceUnitPrice, 0);
  const variance = invTotal - poTotal;
  const variancePct = poTotal > 0 ? ((variance / poTotal) * 100).toFixed(1) : "0.0";

  return (
    <PageShell ex={ex} rightPanel={<ActionPanel ex={ex} actionTaken={actionTaken} setActionTaken={setActionTaken} />}>
      <p className="section-label mb-2">Three-Way Match Analysis</p>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Description</th>
                <th className="right">PO Qty</th>
                <th className="right">PS Qty</th>
                <th className="right">Inv Qty</th>
                <th className="right">PO Price</th>
                <th className="right">Inv Price</th>
                <th className="right">Variance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => {
                const itemFlags = item.flags || [];
                const isPriceMismatch = itemFlags.includes("price");
                const isQtyMismatch = itemFlags.includes("qty");
                const isDescMismatch = itemFlags.includes("description");
                const isUnitMismatch = itemFlags.includes("unit");
                const hasAnyIssue = itemFlags.length > 0;

                let varianceNode: React.ReactNode = <span className="text-[#9ca3af]">&mdash;</span>;
                if (isPriceMismatch) {
                  const delta = item.invoiceUnitPrice - item.poUnitPrice;
                  varianceNode = <span className="text-red-600 font-medium tabular-nums">{delta > 0 ? "+" : ""}${delta.toFixed(2)}/unit</span>;
                } else if (isQtyMismatch) {
                  const delta = item.packingSlipQty - item.invoiceQty;
                  varianceNode = <span className="text-amber-700 font-medium tabular-nums">{delta > 0 ? "+" : ""}{delta} units</span>;
                }

                return (
                  <tr key={item.itemCode} className={rowBgClass(item.flags)}>
                    <td><span className="font-mono text-[11px] text-[#9ca3af]">{item.itemCode}</span></td>
                    <td className="max-w-[220px]">
                      <span className="text-xs text-[#111827] block">{item.invoiceDescription || item.description}</span>
                      {isDescMismatch && item.poDescription && (
                        <span className="text-[10px] text-purple-600 block mt-0.5">PO: {item.poDescription}</span>
                      )}
                      {isUnitMismatch && (
                        <span className="text-[10px] text-blue-600 block mt-0.5">PO unit: {item.poUnit} / Invoice unit: {item.invoiceUnit}</span>
                      )}
                    </td>
                    <td className="right text-xs tabular-nums">{item.poQty}</td>
                    <td className="right text-xs tabular-nums">{item.packingSlipQty}</td>
                    <td className="right text-xs tabular-nums">{item.invoiceQty}</td>
                    <td className="right text-xs tabular-nums">${item.poUnitPrice.toFixed(2)}</td>
                    <td className="right">
                      <span className={`text-xs tabular-nums ${isPriceMismatch ? "font-medium text-red-600" : "text-[#111827]"}`}>
                        ${item.invoiceUnitPrice.toFixed(2)}
                      </span>
                    </td>
                    <td className="right">{varianceNode}</td>
                    <td>
                      {hasAnyIssue ? (
                        <div className="flex flex-wrap gap-1">
                          {itemFlags.map((flag) => {
                            const fb = FLAG_BADGES[flag];
                            return fb ? <span key={flag} className={fb.cls}>{fb.label}</span> : null;
                          })}
                        </div>
                      ) : (
                        <span className="badge success">Match</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-[#e5e7eb] px-6 py-4 flex gap-10">
          <div>
            <p className="section-label mb-1">PO Total</p>
            <p className="text-lg font-semibold text-[#111827] m-0 tabular-nums">{formatCurrency(poTotal)}</p>
          </div>
          <div>
            <p className="section-label mb-1">Invoice Total</p>
            <p className="text-lg font-semibold text-red-600 m-0 tabular-nums">{formatCurrency(invTotal)}</p>
          </div>
          <div>
            <p className="section-label mb-1">Variance</p>
            <p className="text-lg font-semibold text-red-600 m-0 tabular-nums">
              {variance >= 0 ? "+" : ""}{formatCurrency(variance)} <span className="text-[13px] font-normal">({variance >= 0 ? "+" : ""}{variancePct}%)</span>
            </p>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="px-6 pb-5">
          <div className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-md px-4 py-3">
            <p className="section-label mb-1.5">AI Recommendation</p>
            <p className="text-xs text-[#4b5563] m-0 leading-relaxed">
              {ex.id === "EX-007"
                ? "Hold invoice. Invoice bills 365 units but PO and packing slip both confirm 300 units. Request revised invoice for 300 units from Medline Industries. Overage of 65 units = $14,200 overbilled."
                : "Resolved. Unit of measure mismatch between PO (cases) and invoice (cartons) caused $3,890 price variance. Vendor Owens & Minor issued credit memo. Recommend standardising UOM in vendor master."}
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Template 2: DuplicateDetail (EX-002, EX-008) ───────────────────────────

function DuplicateDetail({ exception: ex }: { exception: Exception }) {
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const dupId = exceptionDuplicates[ex.id];
  const pair = duplicatePairs.find((d) => d.id === dupId);

  if (!pair) return <GenericExceptionPage exceptionId={ex.id} />;

  const inv1 = pair.invoice1;
  const inv2 = pair.invoice2;
  const similarityColor = pair.similarity >= 99 ? "#ef4444" : pair.similarity >= 95 ? "#f59e0b" : "#3b82f6";

  return (
    <PageShell ex={ex} rightPanel={<ActionPanel ex={ex} actionTaken={actionTaken} setActionTaken={setActionTaken} />}>
      <p className="section-label mb-2">Duplicate Invoice Comparison</p>
      <div className="card overflow-hidden">
        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 divide-x divide-[#e5e7eb]">
          {/* Invoice A */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge success">Original</span>
              <span className="text-xs font-medium text-[#111827]">Invoice A</span>
            </div>
            {[
              { label: "Invoice #", value: inv1.number },
              { label: "Date", value: new Date(inv1.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Amount", value: formatCurrency(inv1.amount) },
              { label: "Submitted via", value: inv1.submittedVia },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex justify-between items-baseline py-2 ${i < arr.length - 1 ? "border-b border-[#f0f2f5]" : ""}`}>
                <span className="text-xs text-[#4b5563]">{row.label}</span>
                <span className="text-xs text-[#111827] font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Invoice B */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge critical">Suspected Duplicate</span>
              <span className="text-xs font-medium text-[#111827]">Invoice B</span>
            </div>
            {[
              { label: "Invoice #", value: inv2.number },
              { label: "Date", value: new Date(inv2.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Amount", value: formatCurrency(inv2.amount) },
              { label: "Submitted via", value: inv2.submittedVia },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex justify-between items-baseline py-2 ${i < arr.length - 1 ? "border-b border-[#f0f2f5]" : ""}`}>
                <span className="text-xs text-[#4b5563]">{row.label}</span>
                <span className="text-xs text-[#111827] font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Similarity score */}
        <div className="border-t border-[#e5e7eb] px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="section-label">Content Similarity</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: similarityColor }}>{pair.similarity}%</span>
          </div>
          <div className="w-full h-2 bg-[#f0f2f5] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pair.similarity}%`, backgroundColor: similarityColor }} />
          </div>
          <div className="flex gap-6 mt-3">
            <div>
              <span className="text-[11px] text-[#9ca3af]">Amount delta</span>
              <p className="text-xs font-medium text-[#111827] m-0 mt-0.5">{formatCurrency(pair.amountDelta)} ({((pair.amountDelta / inv1.amount) * 100).toFixed(2)}%)</p>
            </div>
            <div>
              <span className="text-[11px] text-[#9ca3af]">Days apart</span>
              <p className="text-xs font-medium text-[#111827] m-0 mt-0.5">{pair.daysDelta} days</p>
            </div>
            <div>
              <span className="text-[11px] text-[#9ca3af]">Different channel</span>
              <p className="text-xs font-medium text-[#111827] m-0 mt-0.5">{inv1.submittedVia !== inv2.submittedVia ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="px-5 pb-5">
          <div className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-md px-4 py-3">
            <p className="section-label mb-1.5">AI Analysis</p>
            <p className="text-xs text-[#4b5563] m-0 leading-relaxed">
              {ex.id === "EX-002"
                ? "Near-identical invoices from MedSupply Corp submitted through different channels (postal mail vs email) within 6 days. Amount differs by only $200 (0.42%), consistent with manual re-entry error. Same line items, same PO reference. Recommend blocking the duplicate and confirming with vendor."
                : "Exact duplicate from Henry Schein submitted via EDI and then again via email attachment 4 days later. Amounts are identical ($8,750). Second invoice was blocked before payment was processed."}
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Template 3: ContractOverageDetail (EX-001) ─────────────────────────────

function ContractOverageDetail({ exception: ex }: { exception: Exception }) {
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const contract = exceptionContracts[ex.id];
  if (!contract) return <GenericExceptionPage exceptionId={ex.id} />;

  const capAmount = contract.cap;
  const currentSpend = contract.currentSpend;
  const overage = currentSpend - capAmount;
  const pct = ((currentSpend / capAmount) * 100).toFixed(1);
  const barWidth = Math.min(parseFloat(pct), 150);

  return (
    <PageShell ex={ex} rightPanel={<ActionPanel ex={ex} actionTaken={actionTaken} setActionTaken={setActionTaken} />}>
      <p className="section-label mb-2">Contract Overage Analysis</p>
      <div className="card p-6">
        {/* Contract summary */}
        <div className="mb-5">
          <p className="text-sm font-medium text-[#111827] mb-3">Contract Summary</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              { label: "Contract #", value: contract.contractNumber },
              { label: "Period", value: `${new Date(contract.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${new Date(contract.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` },
              { label: "Cap Amount", value: formatCurrency(capAmount) },
              { label: "Current Spend", value: formatCurrency(currentSpend) },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-baseline py-1.5 border-b border-[#f0f2f5]">
                <span className="text-xs text-[#4b5563]">{row.label}</span>
                <span className="text-xs text-[#111827] font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="border-t border-[#e5e7eb] pt-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="section-label">Spend vs Cap</span>
            <span className="text-sm font-semibold text-red-600 tabular-nums">{pct}% of cap</span>
          </div>
          <div className="w-full h-4 bg-[#f0f2f5] rounded-full overflow-hidden relative">
            {/* Cap marker at 100% */}
            <div className="absolute top-0 bottom-0 border-r-2 border-dashed border-[#9ca3af]" style={{ left: `${(100 / parseFloat(pct)) * 100}%` }} />
            <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${Math.min((barWidth / 150) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#9ca3af]">$0</span>
            <span className="text-[10px] text-[#9ca3af]">Cap: {formatCurrency(capAmount)}</span>
          </div>
        </div>

        {/* Overage calculation */}
        <div className="border-t border-[#e5e7eb] pt-4 mb-5">
          <p className="text-sm font-medium text-[#111827] mb-3">Overage Calculation</p>
          <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#4b5563]">Current Spend</span>
              <span className="text-xs font-medium text-[#111827] tabular-nums">{formatCurrency(currentSpend)}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#4b5563]">Contract Cap</span>
              <span className="text-xs font-medium text-[#111827] tabular-nums">- {formatCurrency(capAmount)}</span>
            </div>
            <div className="border-t border-red-200 pt-2 mt-2 flex items-center gap-2">
              <span className="text-xs font-medium text-red-700">Overage</span>
              <span className="text-sm font-bold text-red-600 tabular-nums">= {formatCurrency(overage)}</span>
            </div>
          </div>
        </div>

        {/* Contract note */}
        {contract.terms && (
          <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
            <p className="text-xs text-amber-800 m-0 leading-relaxed">{contract.terms}</p>
          </div>
        )}

        {/* AI Recommendation */}
        <div className="mt-5">
          <div className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-md px-4 py-3">
            <p className="section-label mb-1.5">AI Recommendation</p>
            <p className="text-xs text-[#4b5563] m-0 leading-relaxed">
              Flag for procurement review. The contract cap of {formatCurrency(capAmount)} has been exceeded by {formatCurrency(overage)} ({pct}% utilisation). Contract has expired with no auto-renewal. 23 invoices were processed after the cap was breached. Consider renegotiation or competitive bidding for future orders.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Template 4: MissingRebateDetail (EX-004, EX-009) ───────────────────────

function MissingRebateDetail({ exception: ex }: { exception: Exception }) {
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const contract = exceptionContracts[ex.id];
  if (!contract) return <GenericExceptionPage exceptionId={ex.id} />;

  const isEX004 = ex.id === "EX-004";

  return (
    <PageShell ex={ex} rightPanel={<ActionPanel ex={ex} actionTaken={actionTaken} setActionTaken={setActionTaken} />}>
      <p className="section-label mb-2">Missing Rebate Analysis</p>
      <div className="card p-6">
        {/* Contract terms */}
        <div className="mb-5">
          <p className="text-sm font-medium text-[#111827] mb-3">Contract Terms</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              { label: "Contract #", value: contract.contractNumber },
              { label: "Vendor", value: contract.vendor },
              { label: "Rebate Rate", value: `${contract.rebateRate}%` },
              { label: "Threshold", value: formatCurrency(contract.rebateThreshold || 0) },
              { label: "Q1 Spend", value: isEX004 ? "$312,400" : "$94,200" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-baseline py-1.5 border-b border-[#f0f2f5]">
                <span className="text-xs text-[#4b5563]">{row.label}</span>
                <span className="text-xs text-[#111827] font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rebate calculation */}
        <div className="border-t border-[#e5e7eb] pt-4 mb-5">
          <p className="text-sm font-medium text-[#111827] mb-3">Rebate Calculation Breakdown</p>
          <div className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-md px-4 py-3">
            {isEX004 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Q1 Spend</span>
                  <span className="text-[#111827] font-medium tabular-nums">$312,400</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Threshold</span>
                  <span className="text-[#111827] font-medium tabular-nums">- $200,000</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#e5e7eb] pt-2">
                  <span className="text-[#4b5563]">Excess spend</span>
                  <span className="text-[#111827] font-medium tabular-nums">= $112,400</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Rebate (8.5% of excess)</span>
                  <span className="text-amber-700 font-medium tabular-nums">$9,554</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Volume discounts (47 line items)</span>
                  <span className="text-amber-700 font-medium tabular-nums">$62,876</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#e5e7eb] pt-2">
                  <span className="text-[#111827] font-medium">Total owed to Northfield</span>
                  <span className="text-red-600 font-bold tabular-nums text-sm">$89,430</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Q1 Spend</span>
                  <span className="text-[#111827] font-medium tabular-nums">$94,200</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Threshold</span>
                  <span className="text-[#111827] font-medium tabular-nums">- $80,000</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#e5e7eb] pt-2">
                  <span className="text-[#4b5563]">Excess spend</span>
                  <span className="text-[#111827] font-medium tabular-nums">= $14,200</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Rebate (7.25% of excess)</span>
                  <span className="text-amber-700 font-medium tabular-nums">$1,030</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Early payment discount (3% on $194K)</span>
                  <span className="text-amber-700 font-medium tabular-nums">$5,820</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#e5e7eb] pt-2">
                  <span className="text-[#111827] font-medium">Total owed to Northfield</span>
                  <span className="text-red-600 font-bold tabular-nums text-sm">$6,850</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-md px-4 py-3">
          <p className="section-label mb-1.5">AI Recommendation</p>
          <p className="text-xs text-[#4b5563] m-0 leading-relaxed">
            {isEX004
              ? "Contact Cardinal Health to claim the outstanding rebate credit of $9,554 plus $62,876 in volume discount adjustments. Reference contract #CTR-2025-CAR-003 and Q1 quarterly spend threshold of $200K. No credit memo has been received."
              : "Contact Vizient Inc. to claim $1,030 rebate on Q1 excess spend and $5,820 in missed early-payment discounts across 12 invoices. Reference contract #CTR-2025-VZT-002."}
          </p>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Template 5: TierPricingDetail (EX-005) ─────────────────────────────────

function TierPricingDetail({ exception: ex }: { exception: Exception }) {
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const contract = exceptionContracts[ex.id];
  if (!contract) return <GenericExceptionPage exceptionId={ex.id} />;

  const tiers = contract.tiers || [];

  return (
    <PageShell ex={ex} rightPanel={<ActionPanel ex={ex} actionTaken={actionTaken} setActionTaken={setActionTaken} />}>
      <p className="section-label mb-2">Tier Pricing Analysis</p>
      <div className="card p-6">
        {/* Tier pricing table */}
        <div className="mb-5">
          <p className="text-sm font-medium text-[#111827] mb-3">Contract Tier Pricing</p>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th className="right">Volume</th>
                  <th className="right">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, i) => (
                  <tr key={tier.label}>
                    <td className="text-xs text-[#111827] font-medium">{tier.label}</td>
                    <td className="right text-xs tabular-nums text-[#4b5563]">
                      {i === 0 ? `Up to ${tier.maxQty.toLocaleString()} units/month` : `> ${tiers[i - 1].maxQty.toLocaleString()} units/month`}
                    </td>
                    <td className="right text-xs tabular-nums text-[#111827] font-medium">${tier.unitPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actual calculation */}
        <div className="border-t border-[#e5e7eb] pt-4 mb-5">
          <p className="text-sm font-medium text-[#111827] mb-3">March Invoice Calculation</p>
          <div className="grid grid-cols-2 gap-4">
            {/* What was charged */}
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
              <p className="section-label text-red-600 mb-2">What Was Charged</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">March units</span>
                  <span className="text-[#111827] font-medium tabular-nums">2,340</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Rate applied</span>
                  <span className="text-[#111827] font-medium tabular-nums">$85.00/unit (Tier 1 only)</span>
                </div>
                <div className="flex justify-between text-xs border-t border-red-200 pt-1.5">
                  <span className="text-red-700 font-medium">Total billed</span>
                  <span className="text-red-600 font-bold tabular-nums">$198,900</span>
                </div>
              </div>
            </div>

            {/* What should have been charged */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3">
              <p className="section-label text-emerald-700 mb-2">Correct Pricing</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Tier 1: 1,000 units x $85</span>
                  <span className="text-[#111827] font-medium tabular-nums">$85,000</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b5563]">Tier 2: 1,340 units x $72</span>
                  <span className="text-[#111827] font-medium tabular-nums">$96,480</span>
                </div>
                <div className="flex justify-between text-xs border-t border-emerald-200 pt-1.5">
                  <span className="text-emerald-700 font-medium">Correct total</span>
                  <span className="text-emerald-700 font-bold tabular-nums">$181,480</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overcharge summary */}
        <div className="border-t border-[#e5e7eb] pt-4 mb-5">
          <p className="text-sm font-medium text-[#111827] mb-3">Overcharge Summary</p>
          <div className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-md px-4 py-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#4b5563]">March overcharge</span>
                <span className="text-red-600 font-medium tabular-nums">$17,420</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#4b5563]">Same error in 3 prior months</span>
                <span className="text-red-600 font-medium tabular-nums">$35,260</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[#e5e7eb] pt-2">
                <span className="text-[#111827] font-medium">Total overcharge (4 months)</span>
                <span className="text-red-600 font-bold tabular-nums text-sm">$52,680</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-md px-4 py-3">
          <p className="section-label mb-1.5">AI Recommendation</p>
          <p className="text-xs text-[#4b5563] m-0 leading-relaxed">
            Request pricing correction from Cardinal Health. Contract #CTR-2025-CAR-003 specifies tiered pricing but all 4 monthly invoices applied the Tier 1 rate ($85/unit) to the entire volume instead of applying Tier 2 ($72/unit) above 1,000 units. Total retroactive adjustment: $52,680.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Generic Exception Detail (fallback for unknown types) ──────────────────

const typeLabels: Record<string, string> = {
  duplicate: "Duplicate Billing",
  match_exception: "Match Exception",
  missing_rebate: "Missing Rebate",
  contract_overage: "Contract Overage",
  suspicious_invoice: "Suspicious Invoice",
  tier_pricing: "Tier Pricing Error",
};

const severityColors: Record<string, string> = {
  critical: "badge critical",
  high: "badge warning",
  medium: "badge neutral",
  low: "badge success",
};

function GenericExceptionPage({ exceptionId }: { exceptionId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const ex = exceptions.find((e) => e.id === exceptionId);
  if (!ex) {
    return (
      <div className="bg-[#f7f8fa] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[#9ca3af]">Exception {exceptionId} not found</p>
          <button onClick={() => router.back()} className="mt-3 text-xs text-[#0065cb] bg-transparent border-none cursor-pointer hover:underline">
            &larr; Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Breadcrumb */}
      <div className="pt-6 px-8">
        <button onClick={() => router.back()} className="text-xs text-[#0065cb] bg-transparent border-none cursor-pointer hover:underline p-0">
          &larr; Back
        </button>
      </div>

      {/* Header */}
      <div className="px-8 pt-3 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-[#9ca3af]">{ex.id}</span>
          <span className={severityColors[ex.severity] || "badge neutral"}>{typeLabels[ex.type] || ex.type}</span>
          <span className={`badge ${ex.status === "open" ? "critical" : ex.status === "resolved" ? "success" : ex.status === "escalated" ? "blue" : "warning"}`}>
            {ex.status === "open" ? "Open" : ex.status === "resolved" ? "Resolved" : ex.status === "escalated" ? "Escalated" : "Under Review"}
          </span>
        </div>
        <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight m-0 mb-1.5 leading-tight">
          {ex.vendor}
        </h1>
        <p className="text-xs text-[#4b5563] m-0">
          Invoice #{ex.invoiceNumber} · {new Date(ex.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Flagged: {formatCurrency(ex.flaggedAmount)}
        </p>
      </div>

      {/* Alert bar */}
      <div className="mx-8 mb-6">
        <div className="border-l-4 border-red-600 bg-red-50 px-5 py-3.5 rounded-md">
          <span className="text-xs text-red-900">{ex.description}</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="px-8 pb-8 grid grid-cols-[1fr_280px] gap-6 items-start">
        {/* LEFT: Exception Details */}
        <div>
          <p className="section-label mb-2">Exception Analysis</p>
          <div className="card p-6">
            <div className="mb-5">
              <p className="text-sm font-medium text-[#111827] mb-2">What was detected</p>
              <p className="text-xs text-[#4b5563] leading-relaxed">{ex.description}</p>
            </div>

            <div className="border-t border-[#e5e7eb] pt-4 mb-5">
              <p className="text-sm font-medium text-[#111827] mb-3">Key Figures</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#f7f8fa] rounded-md px-4 py-3">
                  <p className="section-label mb-1">Invoice Amount</p>
                  <p className="text-lg font-semibold text-[#111827]">{formatCurrency(ex.amount)}</p>
                </div>
                <div className="bg-red-50 rounded-md px-4 py-3">
                  <p className="section-label mb-1">Flagged Amount</p>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(ex.flaggedAmount)}</p>
                </div>
                <div className="bg-[#f7f8fa] rounded-md px-4 py-3">
                  <p className="section-label mb-1">Risk Percentage</p>
                  <p className="text-lg font-semibold text-[#111827]">{((ex.flaggedAmount / ex.amount) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#e5e7eb] pt-4">
              <p className="text-sm font-medium text-[#111827] mb-2">AI Recommendation</p>
              <div className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-md px-4 py-3">
                <p className="text-xs text-[#4b5563] leading-relaxed">
                  {ex.type === "duplicate" && "Block the duplicate invoice and initiate recovery for the flagged amount. Verify vendor billing channel to prevent recurrence."}
                  {ex.type === "missing_rebate" && "Contact vendor to claim the outstanding rebate credit. Reference the contract terms and quarterly spend threshold."}
                  {ex.type === "contract_overage" && "Flag for procurement review. The contract cap has been exceeded. Consider renegotiation or competitive bidding for future orders."}
                  {ex.type === "tier_pricing" && "Request pricing correction from vendor. The wrong tier was applied. Calculate retroactive adjustment for affected invoices."}
                  {ex.type === "match_exception" && "Investigate the line-item discrepancy. Compare against PO and packing slip to determine root cause."}
                  {ex.type === "suspicious_invoice" && "Escalate to compliance. This invoice has multiple red flags and requires manual verification before payment."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Info panel */}
        <div className="card p-5">
          <p className="section-label mb-0">Exception Details</p>

          {[
            { label: "Assigned to", value: ex.assignee || "Unassigned" },
            { label: "Detected", value: new Date(ex.detectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
            { label: "Severity", value: ex.severity.charAt(0).toUpperCase() + ex.severity.slice(1) },
            { label: "Type", value: typeLabels[ex.type] || ex.type },
            { label: "Invoice Amount", value: formatCurrency(ex.amount) },
            { label: "Flagged Amount", value: formatCurrency(ex.flaggedAmount) },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex justify-between items-baseline py-2.5 ${i < arr.length - 1 ? "border-b border-[#f0f2f5]" : ""}`}
            >
              <span className="text-xs text-[#4b5563]">{row.label}</span>
              <span className="text-xs text-[#111827] font-medium">{row.value}</span>
            </div>
          ))}

          {/* Actions */}
          <p className="section-label mt-5 mb-2.5">Actions</p>

          {actionTaken ? (
            <div className={`px-3 py-2.5 rounded-md text-xs font-medium text-center ${
              actionTaken === "blocked" ? "bg-red-50 text-red-700 border border-red-200" :
              actionTaken === "recovery" ? "bg-blue-50 text-blue-700 border border-blue-200" :
              actionTaken === "escalated" ? "bg-purple-50 text-purple-700 border border-purple-200" :
              "bg-gray-50 text-gray-500 border border-gray-200"
            }`}>
              {actionTaken === "blocked" ? "Payment Blocked" :
               actionTaken === "recovery" ? "Recovery Initiated" :
               actionTaken === "escalated" ? "Escalated to Manager" :
               "Dismissed"}
            </div>
          ) : (
            <>
              <button
                onClick={() => { setActionTaken("blocked"); showToast(`Payment blocked for ${ex.invoiceNumber}`, "warning"); }}
                className="block w-full bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-md border-none cursor-pointer text-center mb-2 transition-colors hover:bg-red-700"
              >
                Block Payment
              </button>
              <button
                onClick={() => { setActionTaken("recovery"); showToast(`Recovery initiated for ${formatCurrency(ex.flaggedAmount)}`, "success"); }}
                className="block w-full bg-white text-amber-700 text-xs font-medium px-3 py-2 rounded-md border border-amber-700 cursor-pointer text-center mb-2 transition-colors hover:bg-amber-50"
              >
                Initiate Recovery
              </button>
              <button
                onClick={() => { setActionTaken("escalated"); showToast(`${ex.id} escalated to manager`, "info"); }}
                className="block w-full bg-white text-[#4b5563] text-xs font-medium px-3 py-2 rounded-md border border-[#d1d5db] cursor-pointer text-center mb-2 transition-colors hover:bg-[#f0f2f5]"
              >
                Escalate to Manager
              </button>
              <button
                onClick={() => { if (confirm("Dismiss this exception?")) { setActionTaken("dismissed"); showToast(`${ex.id} dismissed`, "info"); } }}
                className="block w-full bg-transparent text-[#9ca3af] text-xs font-medium px-3 py-2 rounded-md border-none cursor-pointer text-center transition-colors hover:text-[#4b5563]"
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Router: dispatch by id ───────────────────────────────────────────────────

export default function ExceptionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";

  if (id === "EX-003") return <Ex003Page />;
  if (id === "EX-006") return <Ex006Page />;

  const ex = exceptions.find((e) => e.id === id);
  if (!ex) return <GenericExceptionPage exceptionId={id} />;

  if (ex.type === "match_exception") return <MatchExceptionDetail exception={ex} />;
  if (ex.type === "duplicate") return <DuplicateDetail exception={ex} />;
  if (ex.type === "contract_overage") return <ContractOverageDetail exception={ex} />;
  if (ex.type === "missing_rebate") return <MissingRebateDetail exception={ex} />;
  if (ex.type === "tier_pricing") return <TierPricingDetail exception={ex} />;

  return <GenericExceptionPage exceptionId={id} />;
}
