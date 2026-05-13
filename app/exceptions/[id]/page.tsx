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
  addToRecoveryQueue,
  updateExceptionStatus,
} from "@/lib/data";
import type { Exception, InvoiceLineItem } from "@/lib/data";
import { Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/components/Toast";
import { LegalDisclaimerDialog } from "@/components/LegalDisclaimerDialog";
import { CategoryBadge } from "@/components/CategoryBadge";
import { VendorBadge } from "@/components/VendorBadge";
import { EscalationBanner } from "@/components/EscalationBanner";
import { PostDisagreeSteps } from "@/components/WorkflowSteps";
import WorkflowStepper from "@/components/WorkflowStepper";
import AuditTrail from "@/components/AuditTrail";
import { getAuditTrail, getWorkflowSteps } from "@/lib/audit-trail";
import { GPOComparisonSection } from "@/components/GPOComparisonSection";

// ─── Agent timelines per exception ───────────────────────────────────────────

const AGENT_TIMELINES: Record<string, Array<{agent: string; color: string; time: string; msg: string}>> = {
  "EX-001": [
    { agent: "Invoice Agent",    color: "var(--agent-invoice)", time: "08:14", msg: "Extracted BME-2026-Q1-047 — 23 line items. Contract CTR-2024-BIO-009 detected." },
    { agent: "Validation Agent", color: "var(--agent-validation)", time: "08:15", msg: "Three-way match passed on all 23 items. No price or qty discrepancies." },
    { agent: "Compliance Agent", color: "var(--agent-compliance)", time: "08:16", msg: "Annual cap check: $623,890 vs $500,000 cap. Overage $123,890 — BREACHED." },
    { agent: "Insight Agent",    color: "var(--agent-insight)", time: "08:17", msg: "BioMed score updated: 30/100 High Risk. Recovery % 80%." },
  ],
  "EX-002": [
    { agent: "Invoice Agent",    color: "var(--agent-invoice)", time: "09:21", msg: "Extracted MS-2026-0923 — duplicate fingerprint 99.6% match vs MS-2026-0847." },
    { agent: "Validation Agent", color: "var(--agent-validation)", time: "09:21", msg: "Duplicate confirmed. Amount delta $200 (0.42%). Same PO, same line items." },
    { agent: "Compliance Agent", color: "var(--agent-compliance)", time: "09:22", msg: "No contract implications. Flagged for immediate block." },
    { agent: "Recovery Agent",   color: "var(--agent-recovery)", time: "09:22", msg: "MedSupply Corp notified. Credit memo requested for $47,320." },
  ],
  "EX-003": [
    { agent: "Invoice Agent",    color: "var(--agent-invoice)", time: "10:04", msg: "Extracted MTS-INV-00291 — no PO reference. Vendor not in approved master (847 checked)." },
    { agent: "Validation Agent", color: "var(--agent-validation)", time: "10:05", msg: "Three-way match failed — no PO. Bank account differs from known vendor records." },
    { agent: "Compliance Agent", color: "var(--agent-compliance)", time: "10:05", msg: "Services billed outside registered category. Non-standard Net 15 terms flagged." },
    { agent: "Insight Agent",    color: "var(--agent-insight)", time: "10:06", msg: "MedTech score: 5/100 Critical. 0% recovery rate. Escalation recommended." },
  ],
  "EX-004": [
    { agent: "Invoice Agent",    color: "var(--agent-invoice)", time: "08:30", msg: "Extracted CH-Q1-2026-REBATE. Contract CTR-2025-CAR-003 referenced." },
    { agent: "Validation Agent", color: "var(--agent-validation)", time: "08:31", msg: "47 invoices reviewed. Volume threshold met. Rebate applicable." },
    { agent: "Compliance Agent", color: "var(--agent-compliance)", time: "08:32", msg: "Rebate shortfall $26,554. Volume discount gap $62,876. Total $89,430 outstanding." },
    { agent: "Recovery Agent",   color: "var(--agent-recovery)", time: "08:33", msg: "Cardinal Health rebates team contacted. 72% historical recovery rate." },
  ],
  "EX-005": [
    { agent: "Invoice Agent",    color: "var(--agent-invoice)", time: "09:10", msg: "Extracted CH-2026-0341 — 2,340 units at $85/unit." },
    { agent: "Validation Agent", color: "var(--agent-validation)", time: "09:11", msg: "PO match passed. Unit price discrepancy vs contract schedule detected." },
    { agent: "Compliance Agent", color: "var(--agent-compliance)", time: "09:12", msg: "Tier 2 at >1,000 units = $72/unit. Billed Tier 1 $85. 3 months × $17,420 = $52,260 overcharge." },
    { agent: "Recovery Agent",   color: "var(--agent-recovery)", time: "09:13", msg: "Tier pricing dispute initiated. Draft credit memo sent." },
  ],
  "EX-006": [
    { agent: "Invoice Agent",    color: "var(--agent-invoice)", time: "10:32", msg: "Extracted STC-2026-19847 — 6 line items. Flags: price_mismatch (critical), qty_mismatch (warning)." },
    { agent: "Validation Agent", color: "var(--agent-validation)", time: "10:33", msg: "Three-way match: STE-4821-A PO $2.10 vs Invoice $2.50 (+19%). STE-9940-B qty -20 units." },
    { agent: "Compliance Agent", color: "var(--agent-compliance)", time: "10:33", msg: "Contract CTR-2025-STE-007 — within annual cap. No rebate clause. Passed." },
  ],
  "EX-007": [
    { agent: "Invoice Agent",    color: "var(--agent-invoice)", time: "11:05", msg: "Extracted MDL-2026-44821 — qty variance on exam gloves." },
    { agent: "Validation Agent", color: "var(--agent-validation)", time: "11:06", msg: "PO 300 units, PS 300 delivered, Invoice billed 365. Overbilled $14,200." },
    { agent: "Compliance Agent", color: "var(--agent-compliance)", time: "11:07", msg: "No contract cap issues. Qty dispute flagged for recovery." },
  ],
  "EX-010": [
    { agent: "Invoice Agent",    color: "var(--agent-invoice)", time: "09:44", msg: "Extracted OM-2026-38920 — UOM mismatch detected on IV tubing." },
    { agent: "Validation Agent", color: "var(--agent-validation)", time: "09:45", msg: "PO ordered 'cases', invoice billed 'cartons' at higher per-unit rate. Variance $3,890." },
    { agent: "Compliance Agent", color: "var(--agent-compliance)", time: "09:45", msg: "No contract cap breach. UOM discrepancy only. Credit memo recommended." },
    { agent: "Recovery Agent",   color: "var(--agent-recovery)", time: "09:46", msg: "Owens & Minor issued credit memo. REC-003 closed — fully recovered." },
  ],
};

const DEFAULT_AGENT_TIMELINE = [
  { agent: "Invoice Agent",    color: "var(--agent-invoice)", time: "08:00", msg: "Invoice extracted and flagged for review." },
  { agent: "Validation Agent", color: "var(--agent-validation)", time: "08:01", msg: "Exception validated and confirmed." },
  { agent: "Insight Agent",    color: "var(--agent-insight)", time: "08:02", msg: "Vendor risk profile updated." },
];

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
        stroke="var(--text-muted)"
        strokeWidth="1.25"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9.5 2v2.5H12"
        stroke="var(--text-muted)"
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
    "block w-full text-xs font-medium px-3 py-2 rounded-md cursor-pointer text-center mb-2 transition-colors bg-white text-[var(--text-secondary)] border border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]",
  ghost:
    "block w-full text-xs font-medium px-3 py-2 rounded-md cursor-pointer text-center mb-2 transition-colors bg-transparent text-[var(--text-muted)] border-none hover:text-[var(--text-secondary)]",
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
  const [disclaimerAction003, setDisclaimerAction003] = useState<{action: string; callback: () => void} | null>(null);

  const poCandidates = [
    { po: "NMC-PO-2026-0891", vendor: "Medline Industries", product: "IV Catheter Kits 18G", amount: "$44,800", pct: "34%", pctColor: "var(--warning)" },
    { po: "NMC-PO-2026-0744", vendor: "Cardinal Health", product: "Peripheral IV Kit", amount: "$38,500", pct: "28%", pctColor: "var(--text-muted)" },
    { po: "NMC-PO-2026-1102", vendor: "Henry Schein", product: "IV Access Kit", amount: "$41,200", pct: "21%", pctColor: "var(--text-muted)" },
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
    <div className="bg-[var(--bg-base)] min-h-screen">
      {/* Breadcrumb */}
      <div className="pt-6 px-8">
        <button
          onClick={() => router.back()}
          className="text-xs text-[var(--acl-primary)] bg-transparent border-none cursor-pointer hover:underline p-0"
        >
          &larr; Back
        </button>
      </div>

      {/* Header */}
      <div className="px-8 pt-3 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">EX-003</span>
          <span className="badge critical">Suspicious Invoice</span>
          <span className="badge blue">Escalated</span>
          <CategoryBadge category="Medical Equipment" />
        </div>
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight m-0 mb-1.5 leading-tight">
          MedTech Solutions LLC
        </h1>
        <p className="text-xs text-[var(--text-secondary)] m-0">
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

      <div className="mx-8">
        <EscalationBanner flaggedAmount={45200} />
      </div>

      {/* Two-column layout */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* LEFT */}
        <div>
          <p className="section-label mb-2">
            PO Match Search
          </p>

          <div className="card overflow-hidden">
            {/* Card header */}
            <div className="px-5 pt-4 pb-3 border-b border-[var(--border)] flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--text-secondary)]">
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
                      step.ok ? "bg-[var(--bg-subtle)]" : "bg-red-50"
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
                    <p className="text-xs text-[var(--text-primary)] m-0 font-medium">
                      {step.title}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 m-0">
                      {step.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* PO Candidates */}
            <div className="border-t border-[var(--border)] px-5 py-4">
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
                          <span className="font-mono text-[11px] text-[var(--text-muted)]">
                            {row.po}
                          </span>
                        </td>
                        <td className="text-xs text-[var(--text-primary)]">{row.vendor}</td>
                        <td className="text-xs text-[var(--text-secondary)]">{row.product}</td>
                        <td className="right text-xs tabular-nums text-[var(--text-primary)]">
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
                i < detailRows.length - 1 ? "border-b border-[var(--bg-subtle)]" : ""
              }`}
            >
              <span className="text-xs text-[var(--text-secondary)]">{row.label}</span>
              <span className="text-xs text-[var(--text-primary)] font-medium">{row.value}</span>
            </div>
          ))}

          {/* Risk level row */}
          <div className="flex justify-between items-center py-2.5 border-t border-[var(--bg-subtle)]">
            <span className="text-xs text-[var(--text-secondary)]">Risk level</span>
            <span className="badge critical">High</span>
          </div>

          {/* Documents */}
          <p className="section-label mt-4 mb-2">
            Documents
          </p>

          <div className="flex items-center justify-between gap-2 py-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileIcon />
              <span className="text-[11px] text-[var(--text-secondary)] overflow-hidden text-ellipsis whitespace-nowrap">
                invoice-MTS-INV-00291.pdf
              </span>
            </div>
            <a
              href="/documents/pdfs/invoice-MTS-INV-00291.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--acl-primary)] no-underline whitespace-nowrap flex-shrink-0 hover:underline"
            >
              Open &rarr;
            </a>
          </div>

          {/* Actions */}
          <p className="section-label mt-5 mb-2.5">
            Actions
          </p>

          {actionTaken003 ? (<>
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
            {(actionTaken003 === "blocked" || actionTaken003 === "reported") && <PostDisagreeSteps />}
            </>
          ) : (
            <>
              <ActionButton variant="primary-red" onClick={() => setDisclaimerAction003({ action: "block", callback: () => { setActionTaken003("blocked"); showToast("Payment authorization for invoice MTS-INV-00291 has been suspended", "warning"); } })}>Block Payment</ActionButton>
              <ActionButton variant="outline-red" onClick={() => setDisclaimerAction003({ action: "report", callback: () => { setActionTaken003("reported"); showToast("Compliance case #CR-2026-0291 filed — referred for investigation", "info"); } })}>Report to Compliance</ActionButton>
              <ActionButton variant="outline-gray" onClick={() => setDisclaimerAction003({ action: "verify", callback: () => { setActionTaken003("verification"); showToast("Vendor verification request dispatched to MedTech Solutions LLC", "success"); } })}>Request Vendor Verification</ActionButton>
              <ActionButton variant="ghost" className="!mb-0" onClick={() => setDisclaimerAction003({ action: "dismiss", callback: () => { setActionTaken003("dismissed"); showToast("Exception EX-003 has been dismissed per analyst determination", "info"); } })}>
                Dismiss (False Positive)
              </ActionButton>
            </>
          )}
        </div>
      </div>

      {/* Legal Disclaimer Dialog for Ex003 actions */}
      <LegalDisclaimerDialog
        open={!!disclaimerAction003}
        onConfirm={() => { disclaimerAction003?.callback(); setDisclaimerAction003(null); }}
        onCancel={() => setDisclaimerAction003(null)}
        action={disclaimerAction003?.action || "block"}
        invoiceNumber="MTS-INV-00291"
      />
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

// ─── Discrepancy type display config ────────────────────────────────────────

const DISCREPANCY_TYPES: Record<string, { label: string; badgeCls: string; color: string }> = {
  price: { label: "Price Mismatch", badgeCls: "badge critical", color: "var(--critical)" },
  qty: { label: "Quantity Mismatch", badgeCls: "badge warning", color: "var(--warning)" },
  description: { label: "Description Variation", badgeCls: "badge blue", color: "var(--info)" },
  unit: { label: "Unit of Measure Mismatch", badgeCls: "badge neutral", color: "var(--text-secondary)" },
};

interface DiscrepancyViewProps {
  lineItems: (InvoiceLineItem & { flags: string[]; packingSlipQty: number; poQty: number; poUnitPrice: number })[];
  showActions?: boolean;
  lineItemStates?: Record<string, "pending" | "accepted" | "rejected">;
  onAccept?: (itemCode: string) => void;
  onReject?: (itemCode: string) => void;
  onUndo?: (itemCode: string) => void;
}

function DiscrepancyView({ lineItems, showActions, lineItemStates, onAccept, onReject, onUndo }: DiscrepancyViewProps) {
  const flaggedItems = lineItems.filter((i) => i.flags && i.flags.length > 0);
  const matchedItems = lineItems.filter((i) => !i.flags || i.flags.length === 0);

  const grouped: Record<string, typeof flaggedItems> = {};
  for (const item of flaggedItems) {
    for (const flag of item.flags) {
      if (!grouped[flag]) grouped[flag] = [];
      if (!grouped[flag].some((g) => g.itemCode === item.itemCode)) {
        grouped[flag].push(item);
      }
    }
  }

  const groupOrder = ["price", "qty", "description", "unit"];
  const activeGroups = groupOrder.filter((g) => grouped[g]?.length);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(activeGroups.map((g) => [g, true]))
  );
  const [matchedExpanded, setMatchedExpanded] = useState(false);

  const toggleGroup = (g: string) => setExpandedGroups((prev) => ({ ...prev, [g]: !prev[g] }));

  const totalDiscrepancies = flaggedItems.reduce((sum, item) => sum + item.flags.length, 0);

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      <div className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)]">
          This invoice has <span className="font-semibold text-[var(--text-primary)]">{lineItems.length}</span> line items.
          {flaggedItems.length > 0 ? (
            <> Showing <span className="font-semibold text-[var(--critical)]">{flaggedItems.length}</span> with {totalDiscrepancies} {totalDiscrepancies === 1 ? "discrepancy" : "discrepancies"}.</>
          ) : (
            <> All items matched — no discrepancies.</>
          )}
        </span>
        <div className="flex gap-2">
          {activeGroups.map((g) => {
            const dt = DISCREPANCY_TYPES[g];
            return dt ? <span key={g} className={dt.badgeCls}>{grouped[g].length} {dt.label}</span> : null;
          })}
        </div>
      </div>

      {/* Grouped discrepancy sections */}
      {activeGroups.map((groupKey) => {
        const dt = DISCREPANCY_TYPES[groupKey];
        const items = grouped[groupKey];
        if (!dt || !items) return null;
        const isExpanded = expandedGroups[groupKey] !== false;

        return (
          <div key={groupKey} className="card overflow-hidden">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(groupKey)}
              className="w-full flex items-center justify-between px-5 py-3 bg-[var(--bg-subtle)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-base)] transition-colors duration-150"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
                <span className="text-xs font-semibold text-[var(--text-primary)]">{dt.label}</span>
                <span className="text-[10px] text-[var(--text-muted)]">— {items.length} {items.length === 1 ? "item" : "items"}</span>
              </div>
              <span className={dt.badgeCls}>{items.length}</span>
            </button>

            {/* Expanded items */}
            {isExpanded && (
              <div className="divide-y divide-[var(--border)]">
                {items.map((item) => {
                  const state = lineItemStates?.[item.itemCode] ?? "pending";
                  return (
                    <div key={`${groupKey}-${item.itemCode}`} className={`px-5 py-4 ${rowBgClass(item.flags)}`}>
                      <div className="flex items-start justify-between gap-4">
                        {/* Col 1: Item identification */}
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[11px] text-[var(--text-muted)] block">{item.itemCode}</span>
                          <span className="text-xs font-medium text-[var(--text-primary)] block mt-0.5">
                            {item.invoiceDescription || item.description}
                          </span>
                        </div>

                        {/* Col 2+3: Discrepancy detail */}
                        <div className="flex-1 min-w-[280px]">
                          {groupKey === "price" && (
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[80px]">PO Price</span>
                                <span className="text-xs tabular-nums text-[var(--text-primary)]">${item.poUnitPrice.toFixed(2)}/unit</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[80px]">Invoice Price</span>
                                <span className="text-xs tabular-nums font-medium text-red-600">${item.invoiceUnitPrice.toFixed(2)}/unit</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[80px]">Variance</span>
                                <span className="text-xs tabular-nums font-medium text-red-600">
                                  {item.invoiceUnitPrice - item.poUnitPrice > 0 ? "+" : ""}${(item.invoiceUnitPrice - item.poUnitPrice).toFixed(2)}/unit
                                  ({((item.invoiceUnitPrice - item.poUnitPrice) / item.poUnitPrice * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          )}

                          {groupKey === "qty" && (
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[100px]">PO Qty</span>
                                <span className="text-xs tabular-nums text-[var(--text-primary)]">{item.poQty.toLocaleString()} units</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[100px]">Packing Slip Qty</span>
                                <span className="text-xs tabular-nums font-medium text-amber-700">{item.packingSlipQty.toLocaleString()} units</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[100px]">Invoice Qty</span>
                                <span className="text-xs tabular-nums text-[var(--text-primary)]">{item.invoiceQty.toLocaleString()} units</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[100px]">Variance</span>
                                <span className="text-xs tabular-nums font-medium text-amber-700">
                                  {item.packingSlipQty - item.invoiceQty > 0 ? "+" : ""}{item.packingSlipQty - item.invoiceQty} units (PS vs Invoice)
                                </span>
                              </div>
                            </div>
                          )}

                          {groupKey === "description" && (
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[60px]">PO</span>
                                <span className="text-xs text-[var(--text-primary)]">&ldquo;{item.poDescription}&rdquo;</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[60px]">Invoice</span>
                                <span className="text-xs font-medium text-purple-600">&ldquo;{item.invoiceDescription}&rdquo;</span>
                              </div>
                            </div>
                          )}

                          {groupKey === "unit" && (
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[80px]">PO Unit</span>
                                <span className="text-xs text-[var(--text-primary)]">{item.poUnit}</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="text-[10px] text-[var(--text-muted)] w-[80px]">Invoice Unit</span>
                                <span className="text-xs font-medium text-blue-600">{item.invoiceUnit}</span>
                              </div>
                            </div>
                          )}

                          {/* Show other flags for this item */}
                          {item.flags.filter((f) => f !== groupKey).length > 0 && (
                            <div className="mt-2 flex gap-1.5">
                              <span className="text-[10px] text-[var(--text-muted)]">Also flagged:</span>
                              {item.flags.filter((f) => f !== groupKey).map((f) => {
                                const fb = FLAG_BADGES[f];
                                return fb ? <span key={f} className={`${fb.cls} text-[9px]`}>{fb.label}</span> : null;
                              })}
                            </div>
                          )}
                        </div>

                        {/* Action buttons (EX-006 only) */}
                        {showActions && (
                          <div className="flex-shrink-0 w-[140px] flex items-start justify-end">
                            {state === "pending" ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onAccept?.(item.itemCode)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors duration-150 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" /> Agree
                                </button>
                                <button
                                  onClick={() => onReject?.(item.itemCode)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors duration-150 cursor-pointer"
                                >
                                  <X className="w-3 h-3" /> Disagree
                                </button>
                              </div>
                            ) : state === "accepted" ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Agreed
                                </span>
                                <button
                                  onClick={() => onUndo?.(item.itemCode)}
                                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-transparent border-none cursor-pointer transition-colors"
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
                                  onClick={() => onUndo?.(item.itemCode)}
                                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-transparent border-none cursor-pointer transition-colors"
                                  title="Change decision"
                                >
                                  undo
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Matched items — collapsed by default */}
      {matchedItems.length > 0 && (
        <div className="card overflow-hidden">
          <button
            onClick={() => setMatchedExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-3 bg-[var(--bg-base)] cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors duration-150"
          >
            <div className="flex items-center gap-2">
              {matchedExpanded ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
              <span className="text-xs text-[var(--text-secondary)]">
                {matchedItems.length} {matchedItems.length === 1 ? "item" : "items"} matched — no discrepancies
              </span>
            </div>
            <span className="badge success">{matchedItems.length} OK</span>
          </button>
          {matchedExpanded && (
            <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
              {matchedItems.map((item) => (
                <div key={item.itemCode} className="px-5 py-2.5 flex items-center gap-4">
                  <span className="font-mono text-[11px] text-[var(--text-muted)] w-[100px]">{item.itemCode}</span>
                  <span className="text-xs text-[var(--text-primary)] flex-1">{item.invoiceDescription || item.description}</span>
                  <span className="text-xs tabular-nums text-[var(--text-muted)]">{item.invoiceQty} × ${item.invoiceUnitPrice.toFixed(2)}</span>
                  <span className="badge success text-[9px]">Match</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const REJECT_REASONS = [
  "Pricing compliant per contract amendment",
  "Quantity variance within acceptable tolerance threshold",
  "Item authorized under separate purchase agreement",
  "Charge reconciled with supplementary documentation",
  "Purchase order amendment pending vendor acknowledgment",
  "Additional fulfillment in transit — variance to reconcile upon delivery",
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
  const [historyOpen006, setHistoryOpen006] = useState(false);

  // Invoice status tracking
  const [invoiceStatus, setInvoiceStatus] = useState<"pending_review" | "waiting_manager" | "waiting_correction" | "approved_override">("pending_review");

  const statusSteps = [
    { key: "pending_review", label: "Pending Review", color: "var(--warning)" },
    { key: "waiting_correction", label: "Waiting on Correction", color: "var(--agent-invoice)" },
    { key: "waiting_manager", label: "Escalated to Manager", color: "var(--agent-validation)" },
    { key: "approved_override", label: "Approved", color: "var(--agent-recovery)" },
  ] as const;

  const allResolved = dynamicLineItems.every((item) => lineItemStates[item.itemCode] !== "pending");
  const hasAnyRejection = dynamicLineItems.some((item) => lineItemStates[item.itemCode] === "rejected");

  // "Going against finding" state — needs reason popup
  const [reasonPopup, setReasonPopup] = useState<{ itemCode: string; action: "accept" | "reject" } | null>(null);
  const [reasonNote, setReasonNote] = useState("");
  const [disclaimerPending, setDisclaimerPending] = useState<{itemCode: string; action: "accept" | "reject"} | null>(null);

  const handleLineItemAction = (itemCode: string, action: "accept" | "reject") => {
    setDisclaimerPending({ itemCode, action });
  };

  const handleDisclaimerConfirm = () => {
    if (!disclaimerPending) return;
    const { itemCode, action } = disclaimerPending;
    setDisclaimerPending(null);

    if (action === "reject") {
      // Disagree requires a reason — user is overriding the AI
      setReasonPopup({ itemCode, action });
      setReasonNote("");
    } else {
      // Accept — original logic
      setLineItemStates((prev) => ({ ...prev, [itemCode]: "accepted" }));
      showToast(`Line item ${itemCode} accepted — no discrepancy noted`, "success");
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
    <div className="bg-[var(--bg-base)] min-h-screen">
      {/* Breadcrumb */}
      <div className="pt-6 px-8">
        <button
          onClick={() => router.back()}
          className="text-xs text-[var(--acl-primary)] bg-transparent border-none cursor-pointer hover:underline p-0"
        >
          &larr; Back
        </button>
      </div>

      {/* Header */}
      <div className="px-8 pt-3 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">EX-006</span>
          <span className="badge warning">Match Exception</span>
          <span className="badge warning">Under Review</span>
          <CategoryBadge category="Sterilization" />
        </div>
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight m-0 mb-1.5 leading-tight">
          Steris Corporation
        </h1>
        <p className="text-xs text-[var(--text-secondary)] m-0">
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

      <div className="mx-8">
        <EscalationBanner flaggedAmount={4600} />
      </div>

      {/* Two-column layout */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* LEFT: Three-way match */}
        <div>
          <p className="section-label mb-2">
            Three-Way Match Analysis
          </p>

          <DiscrepancyView
            lineItems={dynamicLineItems}
            showActions={true}
            lineItemStates={lineItemStates}
            onAccept={handleAccept}
            onReject={handleRejectOpen}
            onUndo={(code) => setLineItemStates((prev) => ({ ...prev, [code]: "pending" }))}
          />

          <div className="card overflow-hidden mt-3">
            {/* Reason popup — shown when going against AI finding */}
            {reasonPopup && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setReasonPopup(null)} />
                <div className="relative bg-white border border-[var(--border)] shadow-md rounded-lg w-full max-w-md">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">
                      Override Automated Determination: {reasonPopup.itemCode}
                    </h3>
                    <button onClick={() => setReasonPopup(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-5 py-4">
                    <div className="px-3 py-2.5 rounded-md text-xs mb-4 bg-amber-50 border border-amber-200 text-amber-800">
                      You are overriding the system&apos;s automated determination for this line item. This action will be recorded in the compliance audit log and may be subject to review.
                    </div>

                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Provide justification for determination override
                    </label>
                    <textarea
                      value={reasonNote}
                      onChange={(e) => setReasonNote(e.target.value)}
                      placeholder={reasonPopup.action === "accept"
                        ? "e.g., Vendor confirmed new pricing, PO amendment pending..."
                        : "e.g., Extraction error, wrong item matched, data entry issue..."}
                      rows={3}
                      className="w-full px-3 py-2 text-xs border border-[var(--border)] rounded-md bg-white text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--acl-primary)]/20 focus:border-[var(--acl-primary)]"
                    />
                  </div>

                  <div className="flex gap-2 justify-end px-5 py-3 border-t border-[var(--border)]">
                    <button
                      onClick={() => setReasonPopup(null)}
                      className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--border-strong)] text-[var(--text-secondary)] bg-white hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
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
            <div className="border-t border-[var(--border)] px-6 py-4 flex gap-10">
              <div>
                <p className="section-label mb-1">PO Total</p>
                <p className="text-lg font-semibold text-[var(--text-primary)] m-0 tabular-nums">
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
              <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3">
                <p className="section-label mb-1.5">AI Recommendation</p>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  Hold invoice. Request revised invoice from Steris at contracted rate of
                  $2.10/unit (PO #NMC-PO-2026-2847). Price variance of $0.40/unit has
                  recurred 23x this quarter = $4,600 total overcharge.
                </p>
              </div>
            </div>
          </div>
          <GPOComparisonSection exceptionId="EX-006" />
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
                              : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                        }`}
                        style={isActive || isPast ? { backgroundColor: step.color } : undefined}
                      >
                        {isPast ? <Check className="w-3 h-3" /> : i + 1}
                      </div>
                      <span className={`text-[10px] mt-1.5 text-center whitespace-nowrap ${
                        isActive ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-4 ${
                        isPast ? "bg-[var(--acl-primary)]" : "bg-[var(--border)]"
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
                i < arr.length - 1 ? "border-b border-[var(--bg-subtle)]" : ""
              }`}
            >
              <span className="text-xs text-[var(--text-secondary)]">{row.label}</span>
              <span className="text-xs text-[var(--text-primary)] font-medium">{row.value}</span>
            </div>
          ))}

          {/* Documents */}
          <p className="section-label mt-5 mb-2">Documents</p>

          {documents.map((doc) => (
            <div key={doc.href} className="relative py-2 border-b border-[var(--bg-subtle)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileIcon />
                  <span className="text-[11px] text-[var(--text-secondary)] overflow-hidden text-ellipsis whitespace-nowrap">
                    {docOverrides[doc.href]?.label || doc.label}
                  </span>
                  {docOverrides[doc.href] && docOverrides[doc.href].label !== doc.label && (
                    <span className="text-[9px] text-[var(--acl-primary)] font-medium ml-1">changed</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={docOverrides[doc.href]?.href || doc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[var(--acl-primary)] no-underline whitespace-nowrap hover:underline"
                  >
                    Open
                  </a>
                  {altDocuments[doc.href] && (
                    <button
                      onClick={() => setChangingDoc(changingDoc === doc.href ? null : doc.href)}
                      className="text-[11px] text-[var(--text-muted)] bg-transparent border-none cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>
              {changingDoc === doc.href && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-md shadow-md py-1 z-20 w-[240px]">
                  {(altDocuments[doc.href] || []).map((alt) => (
                    <button
                      key={alt.label}
                      onClick={() => {
                        setDocOverrides((prev) => ({ ...prev, [doc.href]: { label: alt.label, href: alt.href } }));
                        setChangingDoc(null);
                        if (alt.label.startsWith("po-")) setSelectedPO(alt.label);
                        if (alt.label.startsWith("packingslip-")) setSelectedPS(alt.label);
                        showToast(`Source document updated to ${alt.label} — line items recalculated`, "info");
                      }}
                      className={`flex items-center w-full text-left px-3 py-1.5 text-[11px] cursor-pointer border-none transition-colors ${
                        (docOverrides[doc.href]?.label || doc.label) === alt.label
                          ? "bg-[var(--acl-primary)]/5 text-[var(--acl-primary)] font-medium"
                          : "bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
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
            <div className="flex flex-col gap-2">
              <div className={`px-3 py-2.5 rounded-md text-xs font-medium text-center ${
                actionTaken === "correction" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                actionTaken === "override" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                "bg-purple-50 text-purple-700 border border-purple-200"
              }`}>
                {actionTaken === "correction" ? "Recovery Initiated — Email Sent" :
                 actionTaken === "override" ? "Approved with Override" :
                 "Escalated to Manager"}
              </div>
              {actionTaken === "correction" && (
                <Link
                  href="/recovery"
                  className="block text-center text-[11px] text-[var(--acl-primary)] no-underline hover:underline"
                >
                  View in Recovery Queue →
                </Link>
              )}
              {(actionTaken === "escalated" || actionTaken === "override") && <PostDisagreeSteps />}
            </div>
          ) : (
            <>
              {!allResolved && (
                <p className="text-[10px] text-[var(--text-muted)] mb-2 italic">
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
                    ? "bg-white text-[var(--text-secondary)] border-[var(--border-strong)] cursor-pointer hover:bg-[var(--bg-subtle)]"
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
                className="block w-full bg-white text-[var(--text-secondary)] text-xs font-medium px-3 py-2 rounded-md border border-[var(--border-strong)] cursor-pointer text-center transition-colors hover:bg-[var(--bg-subtle)]"
              >
                Escalate to Manager
              </button>
            </>
          )}

          {/* Agent History */}
          <div className="mt-4 pt-3 border-t border-[var(--bg-subtle)]">
            <button
              onClick={() => setHistoryOpen006(!historyOpen006)}
              className="flex items-center gap-1.5 w-full text-left bg-transparent border-none cursor-pointer p-0"
            >
              <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200 ${historyOpen006 ? "" : "-rotate-90"}`} />
              <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--text-secondary)]">Agent History</span>
            </button>
            {historyOpen006 && (
              <div className="mt-2 space-y-2">
                {(() => {
                  const base = AGENT_TIMELINES["EX-006"] ?? DEFAULT_AGENT_TIMELINE;
                  const timeline = (actionTaken === "correction")
                    ? [...base, { agent: "Recovery Agent", color: "var(--agent-recovery)", time: "Now", msg: "Recovery initiated. Email sent to ap@steris.com. Awaiting vendor response." }]
                    : base;
                  return timeline.map((e, i) => (
                    <div key={i} className="flex gap-2 text-[11px]">
                      <div className="w-0.5 rounded-full flex-shrink-0 self-stretch" style={{ backgroundColor: e.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] uppercase tracking-wide font-semibold px-1 py-0.5 rounded"
                            style={{ backgroundColor: e.color + "22", color: e.color }}>
                            {e.agent}
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)]">{e.time}</span>
                        </div>
                        <p className="text-[var(--text-secondary)] m-0 leading-relaxed">{e.msg}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ACTION MODALS ──────────────────────────────────────────────────── */}

      {/* Initiate Recovery Modal */}
      {activeModal === "correction" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white border border-[var(--border)] shadow-md rounded-lg w-full max-w-lg max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">Initiate Recovery from Vendor</h3>
              <button onClick={() => setActiveModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Vendor Email</label>
              <input type="text" readOnly value="ap@steris.com" className="w-full px-3 py-2 text-xs border border-[var(--border)] rounded-md bg-[var(--bg-base)] text-[var(--text-secondary)] mb-3" />

              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Subject</label>
              <input type="text" readOnly value="Recovery Request: Invoice #STC-2026-19847 — Price Discrepancy" className="w-full px-3 py-2 text-xs border border-[var(--border)] rounded-md bg-[var(--bg-base)] text-[var(--text-secondary)] mb-3" />

              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Message</label>
              <textarea
                value={modalNote || "Dear Steris Accounts Receivable,\n\nWe have identified a pricing discrepancy on Invoice #STC-2026-19847.\n\nThe contracted rate for Sterile Surgical Drape Sets (STE-4821-A) is $2.10/unit per PO #NMC-PO-2026-2847, but the invoice reflects $2.50/unit.\n\nPlease issue a revised invoice at the contracted rate, or provide documentation supporting the rate change.\n\nRegards,\nNorthfield Medical Center — Accounts Payable"}
                onChange={(e) => setModalNote(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 text-xs border border-[var(--border)] rounded-md bg-white text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--acl-primary)]/20 focus:border-[var(--acl-primary)] leading-relaxed"
              />
            </div>
            <div className="flex gap-2 justify-end px-5 py-3 border-t border-[var(--border)]">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--border-strong)] text-[var(--text-secondary)] bg-white hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => {
                  const rec = addToRecoveryQueue({
                    exceptionId: "EX-006",
                    vendor: "Steris Corporation",
                    invoiceNumber: "STC-2026-19847",
                    targetAmount: 4600,
                    status: "pending",
                    initiatedAt: new Date().toISOString(),
                    emailSentTo: "ap@steris.com",
                    analystNote: "Recovery initiated from EX-006. Price mismatch on STE-4821-A: PO $2.10/unit vs Invoice $2.50/unit. $4,600 at risk.",
                  });
                  updateExceptionStatus("EX-006", "under_review");
                  setActiveModal(null);
                  setActionTaken("correction");
                  setInvoiceStatus("waiting_correction");
                  showToast(`Recovery process ${rec.id} initiated — vendor notification dispatched`, "success");
                }}
                className="px-4 py-2 text-xs font-medium rounded-md bg-[var(--acl-primary)] text-white border-none hover:bg-[var(--acl-primary-hover)] transition-colors cursor-pointer"
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
          <div className="relative bg-white border border-[var(--border)] shadow-md rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">Approve Invoice with Override</h3>
              <button onClick={() => setActiveModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5 mb-4">
                <p className="text-xs text-amber-800 m-0 font-medium">This will approve the invoice despite identified discrepancies.</p>
                <p className="text-[11px] text-amber-700 m-0 mt-1">Invoice #STC-2026-19847 · Steris Corporation · $27,750.00</p>
              </div>

              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Override reason (required)</label>
              <textarea
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Explain why this override is justified..."
                rows={4}
                className="w-full px-3 py-2 text-xs border border-[var(--border)] rounded-md bg-white text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--acl-primary)]/20 focus:border-[var(--acl-primary)]"
              />
            </div>
            <div className="flex gap-2 justify-end px-5 py-3 border-t border-[var(--border)]">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--border-strong)] text-[var(--text-secondary)] bg-white hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => { setActiveModal(null); updateExceptionStatus("EX-006", "resolved"); setActionTaken("override"); setInvoiceStatus("approved_override"); showToast("Invoice STC-2026-19847 approved with managerial override — logged for audit", "warning"); }}
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
          <div className="relative bg-white border border-[var(--border)] shadow-md rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">Escalate to Manager</h3>
              <button onClick={() => setActiveModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Select Manager</label>
              <div className="relative mb-3">
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[var(--border)] rounded-md bg-white text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--acl-primary)]/20 focus:border-[var(--acl-primary)]"
                >
                  <option value="">Choose a manager...</option>
                  <option value="david">David Kim — VP Finance</option>
                  <option value="lisa">Lisa Rodriguez — Director, AP</option>
                  <option value="michael">Michael Chang — CFO</option>
                  <option value="jennifer">Jennifer Walsh — Compliance Officer</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
              </div>

              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Note</label>
              <textarea
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Describe the situation and any urgency..."
                rows={4}
                className="w-full px-3 py-2 text-xs border border-[var(--border)] rounded-md bg-white text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--acl-primary)]/20 focus:border-[var(--acl-primary)]"
              />
            </div>
            <div className="flex gap-2 justify-end px-5 py-3 border-t border-[var(--border)]">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--border-strong)] text-[var(--text-secondary)] bg-white hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => { setActiveModal(null); setActionTaken("escalate"); setInvoiceStatus("waiting_manager"); showToast("Exception escalated for managerial review — assigned to " + (selectedManager === "david" ? "David Kim" : selectedManager === "lisa" ? "Lisa Rodriguez" : selectedManager === "michael" ? "Michael Chang" : "Jennifer Walsh"), "info"); }}
                disabled={!selectedManager || !modalNote.trim()}
                className="px-4 py-2 text-xs font-medium rounded-md bg-[var(--acl-primary)] text-white border-none hover:bg-[var(--acl-primary-hover)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Disclaimer Dialog for line-item agree/disagree */}
      <LegalDisclaimerDialog
        open={!!disclaimerPending}
        onConfirm={handleDisclaimerConfirm}
        onCancel={() => setDisclaimerPending(null)}
        action={disclaimerPending?.action === "accept" ? "agree" : "disagree"}
        itemCode={disclaimerPending?.itemCode}
        invoiceNumber="STC-2026-19847"
      />
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [disclaimerAction, setDisclaimerAction] = useState<{action: string; callback: () => void} | null>(null);
  const detailRows = [
    { label: "Assigned to", value: ex.assignee || "Unassigned" },
    { label: "Detected", value: new Date(ex.detectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
    { label: "Severity", value: ex.severity.charAt(0).toUpperCase() + ex.severity.slice(1) },
    { label: "Type", value: typeLabels[ex.type] || ex.type },
    { label: "Invoice Amount", value: formatCurrency(ex.amount) },
    { label: "Flagged Amount", value: formatCurrency(ex.flaggedAmount) },
  ];

  return (
    <>
    <div className="card p-5">
      <p className="section-label mb-0">Exception Details</p>
      {detailRows.map((row, i, arr) => (
        <div
          key={row.label}
          className={`flex justify-between items-baseline py-2.5 ${i < arr.length - 1 ? "border-b border-[var(--bg-subtle)]" : ""}`}
        >
          <span className="text-xs text-[var(--text-secondary)]">{row.label}</span>
          <span className="text-xs text-[var(--text-primary)] font-medium">{row.value}</span>
        </div>
      ))}

      <p className="section-label mt-5 mb-2.5">Actions</p>

      {actionTaken ? (
        <div className="flex flex-col gap-2">
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
          {actionTaken === "recovery" && (
            <Link
              href="/recovery"
              className="block text-center text-[11px] text-[var(--acl-primary)] no-underline hover:underline"
            >
              View in Recovery Queue →
            </Link>
          )}
          {(actionTaken === "blocked" || actionTaken === "escalated") && <PostDisagreeSteps />}
        </div>
      ) : (
        <>
          <ActionButton variant="primary-red" onClick={() => setDisclaimerAction({ action: "block", callback: () => { setActionTaken("blocked"); updateExceptionStatus(ex.id, "under_review"); showToast(`Payment authorization for invoice ${ex.invoiceNumber} has been suspended`, "warning"); } })}>
            Block Payment
          </ActionButton>
          <ActionButton variant="outline-red" onClick={() => setDisclaimerAction({ action: "recover", callback: () => {
            const rec = addToRecoveryQueue({
              exceptionId: ex.id,
              vendor: ex.vendor,
              invoiceNumber: ex.invoiceNumber,
              targetAmount: ex.flaggedAmount,
              status: "pending",
              initiatedAt: new Date().toISOString(),
              emailSentTo: `ap@${ex.vendor.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12)}.com`,
              analystNote: `Recovery initiated from exception ${ex.id}. Amount at risk: ${formatCurrency(ex.flaggedAmount)}.`,
            });
            updateExceptionStatus(ex.id, "under_review");
            setActionTaken("recovery");
            showToast(`Recovery process ${rec.id} initiated — vendor notification dispatched`, "success");
          } })}>
            Initiate Recovery
          </ActionButton>
          <ActionButton variant="outline-gray" onClick={() => setDisclaimerAction({ action: "escalate", callback: () => { setActionTaken("escalated"); updateExceptionStatus(ex.id, "escalated"); showToast(`Exception ${ex.id} escalated for managerial review`, "info"); } })}>
            Escalate to Manager
          </ActionButton>
          <ActionButton variant="ghost" className="!mb-0" onClick={() => setDisclaimerAction({ action: "dismiss", callback: () => { setActionTaken("dismissed"); updateExceptionStatus(ex.id, "resolved"); showToast(`Exception ${ex.id} has been dismissed per analyst determination`, "info"); } })}>
            Dismiss
          </ActionButton>
        </>
      )}

      {/* Agent History */}
      <div className="mt-4 pt-3 border-t border-[var(--bg-subtle)]">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex items-center gap-1.5 w-full text-left bg-transparent border-none cursor-pointer p-0 mb-0"
        >
          <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200 ${historyOpen ? "" : "-rotate-90"}`} />
          <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--text-secondary)]">Agent History</span>
        </button>
        {historyOpen && (
          <div className="mt-2 space-y-2">
            {(() => {
              const base = AGENT_TIMELINES[ex.id] ?? DEFAULT_AGENT_TIMELINE;
              const timeline = (actionTaken === "correction" || actionTaken === "recovery")
                ? [...base, { agent: "Recovery Agent", color: "var(--agent-recovery)", time: "Now", msg: "Recovery initiated. Email sent to vendor. Awaiting response." }]
                : base;
              return timeline.map((e, i) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <div className="w-0.5 rounded-full flex-shrink-0 self-stretch" style={{ backgroundColor: e.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[9px] uppercase tracking-wide font-semibold px-1 py-0.5 rounded"
                        style={{ backgroundColor: e.color + "22", color: e.color }}
                      >
                        {e.agent}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)]">{e.time}</span>
                    </div>
                    <p className="text-[var(--text-secondary)] m-0 leading-relaxed">{e.msg}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
    <LegalDisclaimerDialog
      open={!!disclaimerAction}
      onConfirm={() => { disclaimerAction?.callback(); setDisclaimerAction(null); }}
      onCancel={() => setDisclaimerAction(null)}
      action={disclaimerAction?.action || "block"}
      invoiceNumber={ex.invoiceNumber}
    />
    </>
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
    <div className="bg-[var(--bg-base)] min-h-screen">
      <div className="pt-6 px-8">
        <button onClick={() => router.back()} className="text-xs text-[var(--acl-primary)] bg-transparent border-none cursor-pointer hover:underline p-0">
          &larr; Back
        </button>
      </div>

      <div className="px-8 pt-3 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">{ex.id}</span>
          <span className={severityColors[ex.severity] || "badge neutral"}>{typeLabels[ex.type] || ex.type}</span>
          <span className={`badge ${ex.status === "open" ? "critical" : ex.status === "resolved" ? "success" : ex.status === "escalated" ? "blue" : "warning"}`}>
            {ex.status === "open" ? "Open" : ex.status === "resolved" ? "Resolved" : ex.status === "escalated" ? "Escalated" : "Under Review"}
          </span>
          {ex.category && <CategoryBadge category={ex.category} />}
        </div>
        <div className="mb-1.5">
          <VendorBadge name={ex.vendor} size="lg" />
        </div>
        <p className="text-xs text-[var(--text-secondary)] m-0">
          Invoice #{ex.invoiceNumber} · {new Date(ex.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Flagged: {formatCurrency(ex.flaggedAmount)}
        </p>
      </div>

      <div className="mx-8 mb-6">
        <div className="border-l-4 border-red-600 bg-red-50 px-5 py-3.5 rounded-md">
          <span className="text-xs text-red-900">{ex.description}</span>
        </div>
      </div>

      <div className="mx-8">
        <EscalationBanner flaggedAmount={ex.flaggedAmount} />
      </div>

      {/* Workflow Stepper */}
      <div className="mx-8 mb-6">
        <div className="card px-8 py-5">
          <WorkflowStepper steps={getWorkflowSteps(ex.id)} />
        </div>
      </div>

      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        <div>{children}</div>
        <div className="flex flex-col gap-5">
          {rightPanel}
          {/* Audit Trail */}
          <div className="card p-5">
            <AuditTrail entries={getAuditTrail(ex.id)} />
          </div>
        </div>
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
      <DiscrepancyView
        lineItems={lineItems.map((item) => ({ ...item, flags: item.flags || [] }))}
        showActions={false}
      />

      <div className="card overflow-hidden mt-3">
        {/* Totals */}
        <div className="border-t border-[var(--border)] px-6 py-4 flex gap-10">
          <div>
            <p className="section-label mb-1">PO Total</p>
            <p className="text-lg font-semibold text-[var(--text-primary)] m-0 tabular-nums">{formatCurrency(poTotal)}</p>
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
          <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3">
            <p className="section-label mb-1.5">AI Recommendation</p>
            <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
              {ex.id === "EX-007"
                ? "Hold invoice. Invoice bills 365 units but PO and packing slip both confirm 300 units. Request revised invoice for 300 units from Medline Industries. Overage of 65 units = $14,200 overbilled."
                : "Resolved. Unit of measure mismatch between PO (cases) and invoice (cartons) caused $3,890 price variance. Vendor Owens & Minor issued credit memo. Recommend standardising UOM in vendor master."}
            </p>
          </div>
        </div>
      </div>
      <GPOComparisonSection exceptionId={ex.id} />
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
  const similarityColor = pair.similarity >= 99 ? "var(--critical)" : pair.similarity >= 95 ? "var(--warning)" : "var(--info)";

  return (
    <PageShell ex={ex} rightPanel={<ActionPanel ex={ex} actionTaken={actionTaken} setActionTaken={setActionTaken} />}>
      <p className="section-label mb-2">Duplicate Invoice Comparison</p>
      <div className="card overflow-hidden">
        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
          {/* Invoice A */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge success">Original</span>
              <span className="text-xs font-medium text-[var(--text-primary)]">Invoice A</span>
            </div>
            {[
              { label: "Invoice #", value: inv1.number },
              { label: "Date", value: new Date(inv1.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Amount", value: formatCurrency(inv1.amount) },
              { label: "Submitted via", value: inv1.submittedVia },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex justify-between items-baseline py-2 ${i < arr.length - 1 ? "border-b border-[var(--bg-subtle)]" : ""}`}>
                <span className="text-xs text-[var(--text-secondary)]">{row.label}</span>
                <span className="text-xs text-[var(--text-primary)] font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Invoice B */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge critical">Suspected Duplicate</span>
              <span className="text-xs font-medium text-[var(--text-primary)]">Invoice B</span>
            </div>
            {[
              { label: "Invoice #", value: inv2.number },
              { label: "Date", value: new Date(inv2.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Amount", value: formatCurrency(inv2.amount) },
              { label: "Submitted via", value: inv2.submittedVia },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex justify-between items-baseline py-2 ${i < arr.length - 1 ? "border-b border-[var(--bg-subtle)]" : ""}`}>
                <span className="text-xs text-[var(--text-secondary)]">{row.label}</span>
                <span className="text-xs text-[var(--text-primary)] font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Similarity score */}
        <div className="border-t border-[var(--border)] px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="section-label">Content Similarity</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: similarityColor }}>{pair.similarity}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pair.similarity}%`, backgroundColor: similarityColor }} />
          </div>
          <div className="flex gap-6 mt-3">
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Amount delta</span>
              <p className="text-xs font-medium text-[var(--text-primary)] m-0 mt-0.5">{formatCurrency(pair.amountDelta)} ({((pair.amountDelta / inv1.amount) * 100).toFixed(2)}%)</p>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Days apart</span>
              <p className="text-xs font-medium text-[var(--text-primary)] m-0 mt-0.5">{pair.daysDelta} days</p>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Different channel</span>
              <p className="text-xs font-medium text-[var(--text-primary)] m-0 mt-0.5">{inv1.submittedVia !== inv2.submittedVia ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="px-5 pb-5">
          <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3">
            <p className="section-label mb-1.5">AI Analysis</p>
            <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
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
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Contract Summary</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              { label: "Contract #", value: contract.contractNumber },
              { label: "Period", value: `${new Date(contract.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${new Date(contract.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` },
              { label: "Cap Amount", value: formatCurrency(capAmount) },
              { label: "Current Spend", value: formatCurrency(currentSpend) },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-baseline py-1.5 border-b border-[var(--bg-subtle)]">
                <span className="text-xs text-[var(--text-secondary)]">{row.label}</span>
                <span className="text-xs text-[var(--text-primary)] font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="border-t border-[var(--border)] pt-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="section-label">Spend vs Cap</span>
            <span className="text-sm font-semibold text-red-600 tabular-nums">{pct}% of cap</span>
          </div>
          <div className="w-full h-4 bg-[var(--bg-subtle)] rounded-full overflow-hidden relative">
            {/* Cap marker at 100% */}
            <div className="absolute top-0 bottom-0 border-r-2 border-dashed border-[var(--text-muted)]" style={{ left: `${(100 / parseFloat(pct)) * 100}%` }} />
            <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${Math.min((barWidth / 150) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[var(--text-muted)]">$0</span>
            <span className="text-[10px] text-[var(--text-muted)]">Cap: {formatCurrency(capAmount)}</span>
          </div>
        </div>

        {/* Overage calculation */}
        <div className="border-t border-[var(--border)] pt-4 mb-5">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Overage Calculation</p>
          <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[var(--text-secondary)]">Current Spend</span>
              <span className="text-xs font-medium text-[var(--text-primary)] tabular-nums">{formatCurrency(currentSpend)}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[var(--text-secondary)]">Contract Cap</span>
              <span className="text-xs font-medium text-[var(--text-primary)] tabular-nums">- {formatCurrency(capAmount)}</span>
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
          <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3">
            <p className="section-label mb-1.5">AI Recommendation</p>
            <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
              Flag for procurement review. The contract cap of {formatCurrency(capAmount)} has been exceeded by {formatCurrency(overage)} ({pct}% utilisation). Contract has expired with no auto-renewal. 23 invoices were processed after the cap was breached. Consider renegotiation or competitive bidding for future orders.
            </p>
          </div>
        </div>
      </div>
      <GPOComparisonSection exceptionId={ex.id} />
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
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Contract Terms</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              { label: "Contract #", value: contract.contractNumber },
              { label: "Vendor", value: contract.vendor },
              { label: "Rebate Rate", value: `${contract.rebateRate}%` },
              { label: "Threshold", value: formatCurrency(contract.rebateThreshold || 0) },
              { label: "Q1 Spend", value: isEX004 ? "$312,400" : "$94,200" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-baseline py-1.5 border-b border-[var(--bg-subtle)]">
                <span className="text-xs text-[var(--text-secondary)]">{row.label}</span>
                <span className="text-xs text-[var(--text-primary)] font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rebate calculation */}
        <div className="border-t border-[var(--border)] pt-4 mb-5">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Rebate Calculation Breakdown</p>
          <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3">
            {isEX004 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Q1 Spend</span>
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">$312,400</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Quarterly rebate (8.5% × $312,400)</span>
                  <span className="text-amber-700 font-medium tabular-nums">$26,554</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Volume discounts (47 line items)</span>
                  <span className="text-amber-700 font-medium tabular-nums">$62,876</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[var(--border)] pt-2">
                  <span className="text-[var(--text-primary)] font-medium">Total owed to Northfield</span>
                  <span className="text-red-600 font-bold tabular-nums text-sm">$89,430</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Q1 Spend</span>
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">$94,200</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Threshold</span>
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">- $80,000</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[var(--border)] pt-2">
                  <span className="text-[var(--text-secondary)]">Excess spend</span>
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">= $14,200</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Rebate (7.25% of excess)</span>
                  <span className="text-amber-700 font-medium tabular-nums">$1,030</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Early payment discount (3% on $194K)</span>
                  <span className="text-amber-700 font-medium tabular-nums">$5,820</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[var(--border)] pt-2">
                  <span className="text-[var(--text-primary)] font-medium">Total owed to Northfield</span>
                  <span className="text-red-600 font-bold tabular-nums text-sm">$6,850</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3">
          <p className="section-label mb-1.5">AI Recommendation</p>
          <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
            {isEX004
              ? "Contact Cardinal Health to claim the outstanding rebate credit of $26,554 plus $62,876 in volume discount adjustments (total $89,430). Reference contract #CTR-2025-CAR-003. No credit memo has been received."
              : "Contact Vizient Inc. to claim $1,030 rebate on Q1 excess spend and $5,820 in missed early-payment discounts across 12 invoices. Reference contract #CTR-2025-VZT-002."}
          </p>
        </div>
      </div>
      <GPOComparisonSection exceptionId={ex.id} />
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
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Contract Tier Pricing</p>
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
                    <td className="text-xs text-[var(--text-primary)] font-medium">{tier.label}</td>
                    <td className="right text-xs tabular-nums text-[var(--text-secondary)]">
                      {i === 0 ? `Up to ${tier.maxQty.toLocaleString()} units/month` : `> ${tiers[i - 1].maxQty.toLocaleString()} units/month`}
                    </td>
                    <td className="right text-xs tabular-nums text-[var(--text-primary)] font-medium">${tier.unitPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actual calculation */}
        <div className="border-t border-[var(--border)] pt-4 mb-5">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">March Invoice Calculation</p>
          <div className="grid grid-cols-2 gap-4">
            {/* What was charged */}
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
              <p className="section-label text-red-600 mb-2">What Was Charged</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">March units</span>
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">2,340</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Rate applied</span>
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">$85.00/unit (Tier 1 only)</span>
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
                  <span className="text-[var(--text-secondary)]">Tier 1: 1,000 units x $85</span>
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">$85,000</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Tier 2: 1,340 units x $72</span>
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">$96,480</span>
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
        <div className="border-t border-[var(--border)] pt-4 mb-5">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Overcharge Summary</p>
          <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Jan 2026 overcharge (2,340 units)</span>
                <span className="text-red-600 font-medium tabular-nums">$17,420</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Feb 2026 overcharge (2,340 units)</span>
                <span className="text-red-600 font-medium tabular-nums">$17,420</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Mar 2026 overcharge (2,340 units)</span>
                <span className="text-red-600 font-medium tabular-nums">$17,420</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[var(--border)] pt-2">
                <span className="text-[var(--text-primary)] font-medium">Total overcharge (3 months)</span>
                <span className="text-red-600 font-bold tabular-nums text-sm">$52,260</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3">
          <p className="section-label mb-1.5">AI Recommendation</p>
          <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
            Request pricing correction from Cardinal Health. Contract #CTR-2025-CAR-003 specifies tiered pricing: $85/unit up to 1,000 units, $72/unit above 1,000 units. Jan–Mar 2026: 2,340 units/month all billed at Tier 1. Monthly overcharge: $17,420. Total retroactive adjustment: $52,260 (3 months).
          </p>
        </div>
      </div>
      <GPOComparisonSection exceptionId={ex.id} />
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
  som_address_mismatch: "Address Mismatch",
  som_license_invalid: "License Invalid",
  som_price_deviation: "Price Deviation",
  som_quantity_outlier: "Volume Outlier",
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
  const [disclaimerActionGeneric, setDisclaimerActionGeneric] = useState<{action: string; callback: () => void} | null>(null);

  const ex = exceptions.find((e) => e.id === exceptionId);
  if (!ex) {
    return (
      <div className="bg-[var(--bg-base)] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[var(--text-muted)]">Exception {exceptionId} not found</p>
          <button onClick={() => router.back()} className="mt-3 text-xs text-[var(--acl-primary)] bg-transparent border-none cursor-pointer hover:underline">
            &larr; Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-base)] min-h-screen">
      {/* Breadcrumb */}
      <div className="pt-6 px-8">
        <button onClick={() => router.back()} className="text-xs text-[var(--acl-primary)] bg-transparent border-none cursor-pointer hover:underline p-0">
          &larr; Back
        </button>
      </div>

      {/* Header */}
      <div className="px-8 pt-3 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">{ex.id}</span>
          <span className={severityColors[ex.severity] || "badge neutral"}>{typeLabels[ex.type] || ex.type}</span>
          <span className={`badge ${ex.status === "open" ? "critical" : ex.status === "resolved" ? "success" : ex.status === "escalated" ? "blue" : "warning"}`}>
            {ex.status === "open" ? "Open" : ex.status === "resolved" ? "Resolved" : ex.status === "escalated" ? "Escalated" : "Under Review"}
          </span>
          {ex.category && <CategoryBadge category={ex.category} />}
        </div>
        <div className="mb-1.5">
          <VendorBadge name={ex.vendor} size="lg" />
        </div>
        <p className="text-xs text-[var(--text-secondary)] m-0">
          Invoice #{ex.invoiceNumber} · {new Date(ex.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Flagged: {formatCurrency(ex.flaggedAmount)}
        </p>
      </div>

      {/* Alert bar */}
      <div className="mx-8 mb-6">
        <div className="border-l-4 border-red-600 bg-red-50 px-5 py-3.5 rounded-md">
          <span className="text-xs text-red-900">{ex.description}</span>
        </div>
      </div>

      <div className="mx-8">
        <EscalationBanner flaggedAmount={ex.flaggedAmount} />
      </div>

      {/* Workflow Stepper */}
      <div className="mx-8 mb-6">
        <div className="card px-8 py-5">
          <WorkflowStepper steps={getWorkflowSteps(ex.id)} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* LEFT: Exception Details */}
        <div>
          <p className="section-label mb-2">Exception Analysis</p>
          <div className="card p-6">
            <div className="mb-5">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">What was detected</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{ex.description}</p>
            </div>

            <div className="border-t border-[var(--border)] pt-4 mb-5">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Key Figures</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[var(--bg-base)] rounded-md px-4 py-3">
                  <p className="section-label mb-1">Invoice Amount</p>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">{formatCurrency(ex.amount)}</p>
                </div>
                <div className="bg-red-50 rounded-md px-4 py-3">
                  <p className="section-label mb-1">Flagged Amount</p>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(ex.flaggedAmount)}</p>
                </div>
                <div className="bg-[var(--bg-base)] rounded-md px-4 py-3">
                  <p className="section-label mb-1">Risk Percentage</p>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">{((ex.flaggedAmount / ex.amount) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">AI Recommendation</p>
              <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
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
              className={`flex justify-between items-baseline py-2.5 ${i < arr.length - 1 ? "border-b border-[var(--bg-subtle)]" : ""}`}
            >
              <span className="text-xs text-[var(--text-secondary)]">{row.label}</span>
              <span className="text-xs text-[var(--text-primary)] font-medium">{row.value}</span>
            </div>
          ))}

          {/* Actions */}
          <p className="section-label mt-5 mb-2.5">Actions</p>

          {actionTaken ? (<>
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
            {actionTaken === "recovery" && (
              <Link href="/recovery" className="block text-center text-[11px] text-[var(--acl-primary)] no-underline hover:underline mt-2">
                View in Recovery Queue →
              </Link>
            )}
            {(actionTaken === "blocked" || actionTaken === "escalated") && <PostDisagreeSteps />}
            </>
          ) : (
            <>
              <button
                onClick={() => setDisclaimerActionGeneric({ action: "block", callback: () => { setActionTaken("blocked"); updateExceptionStatus(ex.id, "under_review"); showToast(`Payment authorization for invoice ${ex.invoiceNumber} has been suspended`, "warning"); } })}
                className="block w-full bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-md border-none cursor-pointer text-center mb-2 transition-colors hover:bg-red-700"
              >
                Block Payment
              </button>
              <button
                onClick={() => setDisclaimerActionGeneric({ action: "recover", callback: () => {
                  const rec = addToRecoveryQueue({
                    exceptionId: ex.id,
                    vendor: ex.vendor,
                    invoiceNumber: ex.invoiceNumber,
                    targetAmount: ex.flaggedAmount,
                    status: "pending",
                    initiatedAt: new Date().toISOString(),
                    emailSentTo: `ap@${ex.vendor.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12)}.com`,
                    analystNote: `Recovery initiated from exception ${ex.id}. Amount at risk: ${formatCurrency(ex.flaggedAmount)}.`,
                  });
                  updateExceptionStatus(ex.id, "under_review");
                  setActionTaken("recovery");
                  showToast(`Recovery process ${rec.id} initiated — vendor notification dispatched`, "success");
                } })}
                className="block w-full bg-white text-amber-700 text-xs font-medium px-3 py-2 rounded-md border border-amber-700 cursor-pointer text-center mb-2 transition-colors hover:bg-amber-50"
              >
                Initiate Recovery
              </button>
              <button
                onClick={() => setDisclaimerActionGeneric({ action: "escalate", callback: () => { setActionTaken("escalated"); updateExceptionStatus(ex.id, "escalated"); showToast(`Exception ${ex.id} escalated for managerial review`, "info"); } })}
                className="block w-full bg-white text-[var(--text-secondary)] text-xs font-medium px-3 py-2 rounded-md border border-[var(--border-strong)] cursor-pointer text-center mb-2 transition-colors hover:bg-[var(--bg-subtle)]"
              >
                Escalate to Manager
              </button>
              <button
                onClick={() => setDisclaimerActionGeneric({ action: "dismiss", callback: () => { setActionTaken("dismissed"); updateExceptionStatus(ex.id, "resolved"); showToast(`Exception ${ex.id} has been dismissed per analyst determination`, "info"); } })}
                className="block w-full bg-transparent text-[var(--text-muted)] text-xs font-medium px-3 py-2 rounded-md border-none cursor-pointer text-center transition-colors hover:text-[var(--text-secondary)]"
              >
                Dismiss
              </button>
            </>
          )}

          {/* Audit Trail */}
          <div className="border-t border-[var(--border)] mt-5 pt-5">
            <AuditTrail entries={getAuditTrail(ex.id)} />
          </div>
        </div>
      </div>

      {/* Legal Disclaimer Dialog for generic exception actions */}
      <LegalDisclaimerDialog
        open={!!disclaimerActionGeneric}
        onConfirm={() => { disclaimerActionGeneric?.callback(); setDisclaimerActionGeneric(null); }}
        onCancel={() => setDisclaimerActionGeneric(null)}
        action={disclaimerActionGeneric?.action || "block"}
        invoiceNumber={ex.invoiceNumber}
      />
    </div>
  );
}

// ─── Template: SOM exception detail (drug-distributor vertical) ─────────────
//
// Handles all 4 som_* types. Renders a check-specific evidence panel and
// deep-links back to the SOM workflow runner at /som/order/[orderId]. Action
// buttons mirror the runner's Approve/Hold/Escalate (NOT the hospital flow's
// Approve / Request Correction / Escalate).

function SomExceptionDetail({ exception: ex }: { exception: Exception }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [decision, setDecision] = useState<"approved" | "held" | "escalated" | null>(
    ex.status === "escalated" ? "escalated" : null,
  );
  const [disclaimerActionSom, setDisclaimerActionSom] = useState<{action: string; callback: () => void} | null>(null);

  // The SOM exception's invoiceNumber field holds the order ID (ORD-*).
  const orderId = ex.invoiceNumber;

  // Per-type evidence rendering.
  function CheckSpecificEvidence() {
    if (ex.type === "som_address_mismatch") {
      return (
        <>
          <EvidenceField label="Check that flagged" value="Address Verification" />
          <EvidenceField label="Pharmacy on file" value={ex.vendor} />
          <EvidenceField label="Outcome" value="Declared coordinates do not match the geocoded address" />
          <EvidenceField label="Data sources" value="Pharmacy Address Database + Google Maps geocode" />
        </>
      );
    }
    if (ex.type === "som_license_invalid") {
      return (
        <>
          <EvidenceField label="Check that flagged" value="License Verification" />
          <EvidenceField label="Pharmacy on file" value={ex.vendor} />
          <EvidenceField label="Outcome" value="State Board permit not in active status" />
          <EvidenceField label="Data sources" value="State Board of Pharmacy + NPI Registry (live)" />
        </>
      );
    }
    if (ex.type === "som_price_deviation") {
      return (
        <>
          <EvidenceField label="Check that flagged" value="Price Deviation" />
          <EvidenceField label="Pharmacy on file" value={ex.vendor} />
          <EvidenceField label="Outcome" value="One or more line items priced outside contract tolerance" />
          <EvidenceField label="Data source" value="Manufacturer contract pricing" />
        </>
      );
    }
    if (ex.type === "som_quantity_outlier") {
      return (
        <>
          <EvidenceField label="Check that flagged" value="Volume Outliers" />
          <EvidenceField label="Pharmacy on file" value={ex.vendor} />
          <EvidenceField label="Outcome" value="Controlled-substance volume anomalous for catchment population" />
          <EvidenceField label="Data source" value="DEA ARCOS Regional Baseline" />
        </>
      );
    }
    return null;
  }

  function handleDecision(kind: "approved" | "held" | "escalated") {
    setDecision(kind);
    showToast(
      kind === "approved"
        ? "Order approved — released to fulfilment."
        : kind === "held"
        ? "Order placed on hold."
        : "Order escalated to compliance manager.",
      kind === "approved" ? "success" : kind === "held" ? "warning" : "info",
    );
  }

  return (
    <div className="bg-[var(--bg-base)] min-h-screen">
      {/* Breadcrumb */}
      <div className="pt-6 px-8">
        <button
          onClick={() => router.back()}
          className="text-xs text-[var(--acl-primary)] bg-transparent border-none cursor-pointer hover:underline p-0"
        >
          &larr; Back
        </button>
      </div>

      {/* Header */}
      <div className="px-8 pt-3 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">{ex.id}</span>
          <span className="text-[10px] uppercase tracking-wide font-semibold text-[var(--acl-primary)]">
            SOM · Drug Distributor
          </span>
          <span className={severityColors[ex.severity] || "badge neutral"}>{typeLabels[ex.type] || ex.type}</span>
          <span className={`badge ${ex.status === "open" ? "critical" : ex.status === "resolved" ? "success" : ex.status === "escalated" ? "blue" : "warning"}`}>
            {ex.status === "open" ? "Open" : ex.status === "resolved" ? "Resolved" : ex.status === "escalated" ? "Escalated" : "Under Review"}
          </span>
          {ex.category && <CategoryBadge category={ex.category} />}
        </div>
        <div className="mb-1.5">
          <VendorBadge name={ex.vendor} size="lg" />
        </div>
        <p className="text-xs text-[var(--text-secondary)] m-0">
          Order #{orderId} · Detected {new Date(ex.detectedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · Flagged {formatCurrency(ex.flaggedAmount)}
        </p>
      </div>

      <div className="mx-8">
        <EscalationBanner flaggedAmount={ex.flaggedAmount} />
      </div>

      {/* Body grid */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* LEFT: Description + evidence */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <p className="section-label mb-3">Description</p>
            <p className="text-sm text-[var(--text-primary)] m-0 leading-relaxed">{ex.description}</p>
          </div>

          <div className="card p-5">
            <p className="section-label mb-3">Evidence summary</p>
            <div className="flex flex-col gap-2.5">
              <CheckSpecificEvidence />
            </div>
            <Link
              href={`/som/order/${orderId}`}
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-[var(--acl-primary)] no-underline hover:underline"
            >
              View full SOM workflow run →
            </Link>
          </div>
        </div>

        {/* RIGHT: Meta + actions */}
        <div className="flex flex-col gap-4 sticky top-4">
          <div className="card p-5">
            <p className="section-label mb-3">Exception details</p>
            {[
              { label: "Order ID", value: orderId, mono: true },
              { label: "Pharmacy", value: ex.vendor },
              { label: "Severity", value: ex.severity.charAt(0).toUpperCase() + ex.severity.slice(1) },
              { label: "Order amount", value: formatCurrency(ex.amount) },
              { label: "Flagged amount", value: formatCurrency(ex.flaggedAmount) },
              { label: "Assignee", value: ex.assignee || "Unassigned" },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex justify-between items-baseline py-2 ${i < arr.length - 1 ? "border-b border-[var(--bg-subtle)]" : ""}`}
              >
                <span className="text-[11px] text-[var(--text-secondary)]">{row.label}</span>
                <span className={`text-[11px] text-[var(--text-primary)] font-medium ${row.mono ? "font-mono" : ""}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <p className="section-label mb-3">Analyst decision</p>
            {decision ? (
              <div className={`px-3 py-2.5 rounded-md text-xs font-medium text-center ${
                decision === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                decision === "held" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {decision === "approved" && "Approved — released to fulfilment"}
                {decision === "held" && "On hold — awaiting analyst follow-up"}
                {decision === "escalated" && "Escalated to compliance manager"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setDisclaimerActionSom({ action: "approve", callback: () => handleDecision("approved") })}
                  className="text-xs font-medium px-3 py-2 rounded-md border border-emerald-600 bg-white text-emerald-700 cursor-pointer hover:bg-emerald-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => setDisclaimerActionSom({ action: "hold", callback: () => handleDecision("held") })}
                  className="text-xs font-medium px-3 py-2 rounded-md border border-amber-600 bg-white text-amber-700 cursor-pointer hover:bg-amber-50"
                >
                  Hold
                </button>
                <button
                  onClick={() => setDisclaimerActionSom({ action: "escalate", callback: () => handleDecision("escalated") })}
                  className="text-xs font-medium px-3 py-2 rounded-md border border-[var(--acl-primary)] bg-white text-[var(--acl-primary)] cursor-pointer hover:bg-blue-50"
                >
                  Escalate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legal Disclaimer Dialog for SOM actions */}
      <LegalDisclaimerDialog
        open={!!disclaimerActionSom}
        onConfirm={() => { disclaimerActionSom?.callback(); setDisclaimerActionSom(null); }}
        onCancel={() => setDisclaimerActionSom(null)}
        action={disclaimerActionSom?.action || "approve"}
        invoiceNumber={ex.invoiceNumber}
      />
    </div>
  );
}

function EvidenceField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-[11px] text-[var(--text-secondary)] flex-shrink-0">{label}</span>
      <span className="text-[11px] text-[var(--text-primary)] font-medium text-right">{value}</span>
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
  if (ex.type.startsWith("som_")) return <SomExceptionDetail exception={ex} />;

  return <GenericExceptionPage exceptionId={id} />;
}
