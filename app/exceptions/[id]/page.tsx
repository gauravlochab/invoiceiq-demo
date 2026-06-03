// [Spec: domains/invoice-detail/spec.md] — Exception / invoice-detail view.
// v2.0 shadcn migration (cluster 1, 2026-05-22): off the v1 token set per the
// ui-standard.md v1→v2 map. All 9 per-exception-type templates migrated —
// Ex003Page, Ex006Page, MatchExceptionDetail, DuplicateDetail,
// ContractOverageDetail, MissingRebateDetail, TierPricingDetail,
// GenericExceptionPage, SomExceptionDetail. .card→Card, .data-table→Table,
// .badge.*→Badge, .alert-bar→Alert, raw <button>→Button, hand-rolled
// `fixed inset-0` modals→shadcn Dialog. AA-safe status text via
// text-destructive-text / text-warning-text / text-success-text. Real h1/h2/h3
// document outline. Dark mode works on every template.
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
import { ArrowLeft, Check, X, ChevronDown, ChevronRight, FileText, ExternalLink } from "lucide-react";
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

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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

// Section heading — renders a real <h2>/<h3> so the document outline is correct.
// [Spec: domains/invoice-detail/spec.md#Acceptance Criteria — heading hierarchy]
function SectionLabel({
  children,
  as: As = "h2",
  className = "",
}: {
  children: React.ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <As
      className={`m-0 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground ${className}`}
    >
      {children}
    </As>
  );
}

// Back-to-list button — shadcn ghost Button. [Spec: domains/invoice-detail/spec.md#Breadcrumb]
function BackButton() {
  const router = useRouter();
  return (
    <Button variant="ghost" size="sm" className="-ml-2.5 px-2.5" onClick={() => router.back()}>
      <ArrowLeft className="size-3.5" />
      Back
    </Button>
  );
}

// Destructive alert bar. [Spec: domains/invoice-detail/spec.md#Alert Bar]
function AlertBar({ children }: { children: React.ReactNode }) {
  return (
    <Alert
      variant="destructive"
      className="border-l-4 border-l-destructive bg-destructive/10"
    >
      <AlertDescription className="text-destructive-text">{children}</AlertDescription>
    </Alert>
  );
}

// Status-token Badge for the exception status pill. [Spec: domains/invoice-detail/spec.md#Header]
function StatusBadge({ status }: { status: Exception["status"] }) {
  if (status === "resolved") {
    return <Badge className="border-success bg-success/10 text-success-text">Resolved</Badge>;
  }
  if (status === "open") {
    return <Badge variant="destructive">Open</Badge>;
  }
  if (status === "escalated") {
    return <Badge variant="outline">Escalated</Badge>;
  }
  return <Badge className="border-warning bg-warning/10 text-warning-text">Under Review</Badge>;
}

// Type Badge — amber/warning styling for the exception-type pill.
function TypeBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge className="border-warning bg-warning/10 text-warning-text">{children}</Badge>
  );
}

// Severity Badge — maps severity to a token-styled Badge.
function SeverityBadge({ severity, children }: { severity: string; children: React.ReactNode }) {
  if (severity === "critical") return <Badge variant="destructive">{children}</Badge>;
  if (severity === "high")
    return <Badge className="border-warning bg-warning/10 text-warning-text">{children}</Badge>;
  if (severity === "low")
    return <Badge className="border-success bg-success/10 text-success-text">{children}</Badge>;
  return <Badge variant="secondary">{children}</Badge>;
}

// Document row — file icon, label, open link, optional change dropdown.
function DocumentRow({
  label,
  href,
  changed,
  withBorder = true,
  children,
}: {
  label: string;
  href: string;
  changed?: boolean;
  withBorder?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative py-2 ${withBorder ? "border-b border-border" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <FileText className="size-3 shrink-0 text-muted-foreground" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-muted-foreground">
            {label}
          </span>
          {changed && (
            <span className="ml-1 text-[9px] font-medium text-primary">changed</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-primary no-underline hover:underline"
          >
            Open
            <ExternalLink className="size-2.5" />
          </a>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── EX-003: MedTech Solutions — Suspicious Invoice ──────────────────────────

function Ex003Page() {
  const { showToast } = useToast();
  const [actionTaken003, setActionTaken003] = useState<string | null>(null);
  const [disclaimerAction003, setDisclaimerAction003] = useState<{action: string; callback: () => void} | null>(null);

  const poCandidates = [
    { po: "NMC-PO-2026-0891", vendor: "Medline Industries", product: "IV Catheter Kits 18G", amount: "$44,800", pct: "34%", flagged: true },
    { po: "NMC-PO-2026-0744", vendor: "Cardinal Health", product: "Peripheral IV Kit", amount: "$38,500", pct: "28%", flagged: false },
    { po: "NMC-PO-2026-1102", vendor: "Henry Schein", product: "IV Access Kit", amount: "$41,200", pct: "21%", flagged: false },
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
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="px-4 pt-6 lg:px-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-6 lg:px-6">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">EX-003</span>
          <Badge variant="destructive">Suspicious Invoice</Badge>
          <Badge variant="outline">Escalated</Badge>
          <CategoryBadge category="Medical Equipment" />
        </div>
        <h1 className="m-0 mb-1.5 text-[22px] font-semibold leading-tight tracking-tight text-foreground">
          MedTech Solutions LLC
        </h1>
        <p className="m-0 text-xs text-muted-foreground">
          Invoice #MTS-INV-00291 · February 14, 2026 · $45,200.00
        </p>
      </div>

      {/* Alert bar */}
      <div className="mx-4 mb-6 lg:mx-6">
        <AlertBar>
          Vendor not in approved master · No PO found · Mixed product and services billing · Routed to Compliance
        </AlertBar>
      </div>

      <div className="mx-4 lg:mx-6">
        <EscalationBanner flaggedAmount={45200} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 items-start gap-6 px-4 pb-8 lg:grid-cols-[1fr_280px] lg:px-6">
        {/* LEFT */}
        <div>
          <SectionLabel className="mb-2">PO Match Search</SectionLabel>

          <Card className="gap-0 py-0">
            {/* Card header */}
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 pt-4 pb-3">
              <span className="text-xs text-muted-foreground">
                Searching vendor master and open POs for invoice #MTS-INV-00291
              </span>
              <Badge variant="destructive" className="shrink-0">
                No Match Found
              </Badge>
            </div>

            {/* Search steps */}
            <div className="px-5 py-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  {/* Step indicator */}
                  <div
                    className={`mt-px flex size-5 shrink-0 items-center justify-center rounded-full ${
                      step.ok ? "bg-muted" : "bg-destructive/10"
                    }`}
                  >
                    <span
                      className={`leading-none ${
                        step.ok ? "text-success-text" : "text-destructive-text"
                      }`}
                    >
                      {step.ok ? <Check className="size-3" /> : <X className="size-3" />}
                    </span>
                  </div>

                  {/* Step text */}
                  <div>
                    <p className="m-0 text-xs font-medium text-foreground">{step.title}</p>
                    <p className="m-0 mt-0.5 text-[11px] text-muted-foreground">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* PO Candidates */}
            <div className="border-t border-border px-5 py-4">
              <SectionLabel as="h3" className="mb-2.5">
                Closest PO Candidates (Insufficient Confidence)
              </SectionLabel>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor on PO</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Match %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poCandidates.map((row) => (
                    <TableRow key={row.po}>
                      <TableCell>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {row.po}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-foreground">{row.vendor}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.product}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-foreground">
                        {row.amount}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`text-xs font-medium tabular-nums ${
                            row.flagged ? "text-warning-text" : "text-muted-foreground"
                          }`}
                        >
                          {row.pct}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Vendor not in master note */}
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <SectionLabel as="h3" className="mb-1.5 text-destructive-text">
                  Vendor Not in Approved Master
                </SectionLabel>
                <p className="m-0 text-xs leading-relaxed text-destructive-text">
                  MedTech Solutions LLC (EIN: 84-2917441) does not appear in Northfield Medical&apos;s
                  approved vendor registry. The invoice references IV Catheter Kits but this
                  vendor&apos;s registered business category is &apos;Management Consulting&apos;. Bank account
                  provided (routing 071923828) does not match any known vendor on record.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT panel */}
        <Card className="gap-0 p-5">
          {/* Exception details */}
          <SectionLabel as="h3" className="mb-0">
            Exception Details
          </SectionLabel>

          {detailRows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-baseline justify-between py-2.5 ${
                i < detailRows.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-xs font-medium text-foreground">{row.value}</span>
            </div>
          ))}

          {/* Risk level row */}
          <div className="flex items-center justify-between border-t border-border py-2.5">
            <span className="text-xs text-muted-foreground">Risk level</span>
            <Badge variant="destructive">High</Badge>
          </div>

          {/* Documents */}
          <SectionLabel as="h3" className="mt-4 mb-2">
            Documents
          </SectionLabel>

          <DocumentRow
            label="invoice-MTS-INV-00291.pdf"
            href="/documents/pdfs/invoice-MTS-INV-00291.pdf"
            withBorder={false}
          />

          {/* Actions */}
          <SectionLabel as="h3" className="mt-5 mb-2.5">
            Actions
          </SectionLabel>

          {actionTaken003 ? (
            <>
              <div
                className={`rounded-md border px-3 py-2.5 text-center text-xs font-medium ${
                  actionTaken003 === "blocked"
                    ? "border-destructive/30 bg-destructive/10 text-destructive-text"
                    : actionTaken003 === "reported"
                      ? "border-warning/40 bg-warning/10 text-warning-text"
                      : actionTaken003 === "verification"
                        ? "border-border bg-muted text-foreground"
                        : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {actionTaken003 === "blocked"
                  ? "Payment Blocked"
                  : actionTaken003 === "reported"
                    ? "Reported to Compliance"
                    : actionTaken003 === "verification"
                      ? "Verification Requested"
                      : "Dismissed — False Positive"}
              </div>
              {(actionTaken003 === "blocked" || actionTaken003 === "reported") && <PostDisagreeSteps />}
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() =>
                  setDisclaimerAction003({
                    action: "block",
                    callback: () => {
                      setActionTaken003("blocked");
                      showToast(
                        "Payment authorization for invoice MTS-INV-00291 has been suspended",
                        "warning",
                      );
                    },
                  })
                }
              >
                Block Payment
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setDisclaimerAction003({
                    action: "report",
                    callback: () => {
                      setActionTaken003("reported");
                      showToast(
                        "Compliance case #CR-2026-0291 filed — referred for investigation",
                        "info",
                      );
                    },
                  })
                }
              >
                Report to Compliance
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setDisclaimerAction003({
                    action: "verify",
                    callback: () => {
                      setActionTaken003("verification");
                      showToast(
                        "Vendor verification request dispatched to MedTech Solutions LLC",
                        "success",
                      );
                    },
                  })
                }
              >
                Request Vendor Verification
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() =>
                  setDisclaimerAction003({
                    action: "dismiss",
                    callback: () => {
                      setActionTaken003("dismissed");
                      showToast(
                        "Exception EX-003 has been dismissed per analyst determination",
                        "info",
                      );
                    },
                  })
                }
              >
                Dismiss (False Positive)
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Legal Disclaimer Dialog for Ex003 actions */}
      <LegalDisclaimerDialog
        open={!!disclaimerAction003}
        onConfirm={() => {
          disclaimerAction003?.callback();
          setDisclaimerAction003(null);
        }}
        onCancel={() => setDisclaimerAction003(null)}
        action={disclaimerAction003?.action || "block"}
        invoiceNumber="MTS-INV-00291"
      />
    </main>
  );
}

// ─── EX-006: Steris Corporation — Match Exception ────────────────────────────

// Row background — destructive tint for price-flagged, warning tint otherwise.
// [Spec: domains/invoice-detail/spec.md#Business Rules — Row background]
function rowBgClass(flags?: string[]): string {
  if (!flags || flags.length === 0) return "";
  if (flags.includes("price")) return "bg-destructive/5";
  if (flags.includes("qty") || flags.includes("unit") || flags.includes("description"))
    return "bg-warning/5";
  return "";
}

const FLAG_BADGES: Record<string, { variant: "destructive" | "outline" | "secondary"; label: string }> = {
  price: { variant: "destructive", label: "Price" },
  qty: { variant: "secondary", label: "Qty" },
  description: { variant: "outline", label: "Description" },
  unit: { variant: "secondary", label: "Unit" },
};

// ─── Discrepancy type display config ────────────────────────────────────────

const DISCREPANCY_TYPES: Record<
  string,
  { label: string; variant: "destructive" | "outline" | "secondary" }
> = {
  price: { label: "Price Mismatch", variant: "destructive" },
  qty: { label: "Quantity Mismatch", variant: "secondary" },
  description: { label: "Description Variation", variant: "outline" },
  unit: { label: "Unit of Measure Mismatch", variant: "secondary" },
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
      <div className="flex items-center justify-between rounded-md border border-border bg-muted px-4 py-3">
        <span className="text-xs text-muted-foreground">
          This invoice has <span className="font-semibold text-foreground">{lineItems.length}</span> line items.
          {flaggedItems.length > 0 ? (
            <> Showing <span className="font-semibold text-destructive-text">{flaggedItems.length}</span> with {totalDiscrepancies} {totalDiscrepancies === 1 ? "discrepancy" : "discrepancies"}.</>
          ) : (
            <> All items matched — no discrepancies.</>
          )}
        </span>
        <div className="flex gap-2">
          {activeGroups.map((g) => {
            const dt = DISCREPANCY_TYPES[g];
            return dt ? (
              <Badge key={g} variant={dt.variant}>
                {grouped[g].length} {dt.label}
              </Badge>
            ) : null;
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
          <Card key={groupKey} className="gap-0 py-0">
            {/* Group header */}
            <Button
              variant="ghost"
              onClick={() => toggleGroup(groupKey)}
              aria-expanded={isExpanded}
              className="h-auto w-full justify-between rounded-none rounded-t-xl border-b border-border bg-muted px-5 py-3"
            >
              <span className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                {/* h3 — gives the discrepancy group a document-outline heading */}
                <h3 className="m-0 text-xs font-semibold text-foreground">{dt.label}</h3>
                <span className="text-[10px] font-normal text-muted-foreground">
                  — {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </span>
              <Badge variant={dt.variant}>{items.length}</Badge>
            </Button>

            {/* Expanded items */}
            {isExpanded && (
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const state = lineItemStates?.[item.itemCode] ?? "pending";
                  return (
                    <div key={`${groupKey}-${item.itemCode}`} className={`px-5 py-4 ${rowBgClass(item.flags)}`}>
                      {/* [Spec: domains/invoice-detail/spec.md#Responsive-mobile]
                          Mobile (<sm): stack Col 1 / Col 2 / Col 3 vertically — the
                          desktop horizontal row collapsed to overlapping unreadable
                          text at 375px (2026-05-23 audit P0). sm+: original 3-column row. */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        {/* Col 1: Item identification */}
                        <div className="min-w-0 sm:flex-1">
                          <span className="block font-mono text-[11px] text-muted-foreground">{item.itemCode}</span>
                          <span className="mt-0.5 block text-xs font-medium text-foreground">
                            {item.invoiceDescription || item.description}
                          </span>
                        </div>

                        {/* Col 2+3: Discrepancy detail */}
                        <div className="sm:min-w-[280px] sm:flex-1">
                          {groupKey === "price" && (
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-3">
                                <span className="w-[80px] text-[10px] text-muted-foreground">PO Price</span>
                                <span className="text-xs tabular-nums text-foreground">${item.poUnitPrice.toFixed(2)}/unit</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="w-[80px] text-[10px] text-muted-foreground">Invoice Price</span>
                                <span className="text-xs font-medium tabular-nums text-destructive-text">${item.invoiceUnitPrice.toFixed(2)}/unit</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="w-[80px] text-[10px] text-muted-foreground">Variance</span>
                                <span className="text-xs font-medium tabular-nums text-destructive-text">
                                  {item.invoiceUnitPrice - item.poUnitPrice > 0 ? "+" : ""}${(item.invoiceUnitPrice - item.poUnitPrice).toFixed(2)}/unit
                                  ({((item.invoiceUnitPrice - item.poUnitPrice) / item.poUnitPrice * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          )}

                          {groupKey === "qty" && (
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-3">
                                <span className="w-[100px] text-[10px] text-muted-foreground">PO Qty</span>
                                <span className="text-xs tabular-nums text-foreground">{item.poQty.toLocaleString()} units</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="w-[100px] text-[10px] text-muted-foreground">Packing Slip Qty</span>
                                <span className="text-xs font-medium tabular-nums text-warning-text">{item.packingSlipQty.toLocaleString()} units</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="w-[100px] text-[10px] text-muted-foreground">Invoice Qty</span>
                                <span className="text-xs tabular-nums text-foreground">{item.invoiceQty.toLocaleString()} units</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="w-[100px] text-[10px] text-muted-foreground">Variance</span>
                                <span className="text-xs font-medium tabular-nums text-warning-text">
                                  {item.packingSlipQty - item.invoiceQty > 0 ? "+" : ""}{item.packingSlipQty - item.invoiceQty} units (PS vs Invoice)
                                </span>
                              </div>
                            </div>
                          )}

                          {groupKey === "description" && (
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-3">
                                <span className="w-[60px] text-[10px] text-muted-foreground">PO</span>
                                <span className="text-xs text-foreground">&ldquo;{item.poDescription}&rdquo;</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="w-[60px] text-[10px] text-muted-foreground">Invoice</span>
                                <span className="text-xs font-medium text-warning-text">&ldquo;{item.invoiceDescription}&rdquo;</span>
                              </div>
                            </div>
                          )}

                          {groupKey === "unit" && (
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-3">
                                <span className="w-[80px] text-[10px] text-muted-foreground">PO Unit</span>
                                <span className="text-xs text-foreground">{item.poUnit}</span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="w-[80px] text-[10px] text-muted-foreground">Invoice Unit</span>
                                <span className="text-xs font-medium text-warning-text">{item.invoiceUnit}</span>
                              </div>
                            </div>
                          )}

                          {/* Show other flags for this item */}
                          {item.flags.filter((f) => f !== groupKey).length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">Also flagged:</span>
                              {item.flags.filter((f) => f !== groupKey).map((f) => {
                                const fb = FLAG_BADGES[f];
                                return fb ? (
                                  <Badge key={f} variant={fb.variant} className="h-4 px-1.5 text-[9px]">
                                    {fb.label}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>

                        {/* Action buttons (EX-006 only) — full width on mobile, fixed
                            150px column on sm+ */}
                        {showActions && (
                          <div className="flex w-full items-start justify-start sm:w-[150px] sm:shrink-0 sm:justify-end">
                            {state === "pending" ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onAccept?.(item.itemCode)}
                                  className="min-h-11 border-success bg-success/10 text-success-text hover:bg-success/20 sm:min-h-0 sm:h-7"
                                >
                                  <Check className="size-3" /> Agree
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => onReject?.(item.itemCode)}
                                  className="min-h-11 sm:min-h-0 sm:h-7"
                                >
                                  <X className="size-3" /> Disagree
                                </Button>
                              </div>
                            ) : state === "accepted" ? (
                              <div className="flex items-center gap-1.5">
                                <Badge className="border-success bg-success/10 text-success-text">
                                  <Check className="size-3" /> Agreed
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onUndo?.(item.itemCode)}
                                  className="min-h-11 text-[10px] text-muted-foreground sm:min-h-0 sm:h-7"
                                  title="Change decision"
                                >
                                  undo
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Badge variant="destructive">
                                  <X className="size-3" /> Disagreed
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onUndo?.(item.itemCode)}
                                  className="min-h-11 text-[10px] text-muted-foreground sm:min-h-0 sm:h-7"
                                  title="Change decision"
                                >
                                  undo
                                </Button>
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
          </Card>
        );
      })}

      {/* Matched items — collapsed by default */}
      {matchedItems.length > 0 && (
        <Card className="gap-0 py-0">
          <Button
            variant="ghost"
            onClick={() => setMatchedExpanded((prev) => !prev)}
            aria-expanded={matchedExpanded}
            className="h-auto w-full justify-between rounded-xl px-5 py-3"
          >
            <span className="flex items-center gap-2">
              {matchedExpanded ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
              <span className="text-xs font-normal text-muted-foreground">
                {matchedItems.length} {matchedItems.length === 1 ? "item" : "items"} matched — no discrepancies
              </span>
            </span>
            <Badge className="border-success bg-success/10 text-success-text">{matchedItems.length} OK</Badge>
          </Button>
          {matchedExpanded && (
            <div className="divide-y divide-border border-t border-border">
              {matchedItems.map((item) => (
                <div key={item.itemCode} className="flex items-center gap-4 px-5 py-2.5">
                  <span className="w-[100px] font-mono text-[11px] text-muted-foreground">{item.itemCode}</span>
                  <span className="flex-1 text-xs text-foreground">{item.invoiceDescription || item.description}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{item.invoiceQty} × ${item.invoiceUnitPrice.toFixed(2)}</span>
                  <Badge className="h-4 border-success bg-success/10 px-1.5 text-[9px] text-success-text">Match</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
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
void REJECT_REASONS;

function Ex006Page() {
  const { showToast } = useToast();

  // Line-item accept/reject state
  const [lineItemStates, setLineItemStates] = useState<Record<string, "pending" | "accepted" | "rejected">>(
    Object.fromEntries(sterisLineItems.map((item) => [item.itemCode, "pending"]))
  );

  // Document change state
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

  // Status stepper — semantic theme tokens (past=success, active=primary, future=muted).
  // [Spec: domains/invoice-detail/spec.md#Invoice Status Stepper]
  const statusSteps = [
    { key: "pending_review", label: "Pending Review" },
    { key: "waiting_correction", label: "Waiting on Correction" },
    { key: "waiting_manager", label: "Escalated to Manager" },
    { key: "approved_override", label: "Approved" },
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

  const handleAccept = (itemCode: string) => handleLineItemAction(itemCode, "accept");
  const handleRejectOpen = (itemCode: string) => handleLineItemAction(itemCode, "reject");

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
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="px-4 pt-6 lg:px-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-6 lg:px-6">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">EX-006</span>
          <TypeBadge>Match Exception</TypeBadge>
          <Badge className="border-warning bg-warning/10 text-warning-text">Under Review</Badge>
          <CategoryBadge category="Sterilization" />
        </div>
        <h1 className="m-0 mb-1.5 text-[22px] font-semibold leading-tight tracking-tight text-foreground">
          Steris Corporation
        </h1>
        <p className="m-0 text-xs text-muted-foreground">
          Invoice #STC-2026-19847 · February 28, 2026 · PO #NMC-PO-2026-2847
        </p>
      </div>

      {/* Alert bar */}
      <div className="mx-4 mb-6 lg:mx-6">
        <AlertBar>
          {dynamicLineItems.reduce((sum, item) => sum + (item.flags?.length || 0), 0)} discrepancies detected — $4,600 overbilled across 23 recurrences this quarter · AI confidence 98.7%
        </AlertBar>
      </div>

      <div className="mx-4 lg:mx-6">
        <EscalationBanner flaggedAmount={4600} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 items-start gap-6 px-4 pb-8 lg:grid-cols-[1fr_280px] lg:px-6">
        {/* LEFT: Three-way match */}
        <div>
          <SectionLabel className="mb-2">Three-Way Match Analysis</SectionLabel>

          <DiscrepancyView
            lineItems={dynamicLineItems}
            showActions={true}
            lineItemStates={lineItemStates}
            onAccept={handleAccept}
            onReject={handleRejectOpen}
            onUndo={(code) => setLineItemStates((prev) => ({ ...prev, [code]: "pending" }))}
          />

          <Card className="mt-3 gap-0 py-0">
            {/* Totals summary */}
            <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:gap-10">
              <div>
                <SectionLabel as="h3" className="mb-1">PO Total</SectionLabel>
                <p className="m-0 text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(poTotal)}
                </p>
              </div>
              <div>
                <SectionLabel as="h3" className="mb-1">Invoice Total</SectionLabel>
                <p className="m-0 text-lg font-semibold tabular-nums text-destructive-text">
                  {formatCurrency(invTotal)}
                </p>
              </div>
              <div>
                <SectionLabel as="h3" className="mb-1">Variance</SectionLabel>
                <p className="m-0 text-lg font-semibold tabular-nums text-destructive-text">
                  +{formatCurrency(variance)}{" "}
                  <span className="text-[13px] font-normal">
                    (+{variancePct}%)
                  </span>
                </p>
              </div>
            </div>

            {/* AI recommendation */}
            <div className="px-6 pb-5">
              <div className="rounded-md border border-border bg-muted px-4 py-3">
                <SectionLabel as="h3" className="mb-1.5">AI Recommendation</SectionLabel>
                <p className="m-0 text-xs leading-relaxed text-muted-foreground">
                  Hold invoice. Request revised invoice from Steris at contracted rate of
                  $2.10/unit (PO #NMC-PO-2026-2847). Price variance of $0.40/unit has
                  recurred 23x this quarter = $4,600 total overcharge.
                </p>
              </div>
            </div>
          </Card>
          <GPOComparisonSection exceptionId="EX-006" />
          {/* Invoice Status Stepper */}
          <Card className="mt-4 gap-0 px-6 py-4">
            <SectionLabel as="h2" className="mb-3">Invoice Status</SectionLabel>
            <div className="flex items-center">
              {statusSteps.map((step, i) => {
                const isActive = invoiceStatus === step.key;
                const isPast = statusSteps.findIndex(s => s.key === invoiceStatus) > i;
                return (
                  <div key={step.key} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${
                          isPast
                            ? "bg-success text-success-foreground"
                            : isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isPast ? <Check className="size-3" /> : i + 1}
                      </div>
                      <span className={`mt-1.5 whitespace-nowrap text-center text-[10px] ${
                        isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`mx-2 mb-4 h-0.5 flex-1 ${
                        isPast ? "bg-success" : "bg-border"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT: Info panel */}
        <Card className="gap-0 p-5">
          <SectionLabel as="h2" className="mb-0">Exception Details</SectionLabel>

          {[
            { label: "Assigned to", value: "James Park" },
            { label: "Detected", value: "Mar 1, 2026" },
            { label: "Recurrences", value: "23 invoices this quarter" },
            { label: "Cumulative impact", value: "$4,600" },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex items-baseline justify-between py-2.5 ${
                i < arr.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-xs font-medium text-foreground">{row.value}</span>
            </div>
          ))}

          {/* Documents */}
          <SectionLabel as="h3" className="mt-5 mb-2">Documents</SectionLabel>

          {documents.map((doc) => {
            const current = docOverrides[doc.href]?.label || doc.label;
            const changed = !!docOverrides[doc.href] && docOverrides[doc.href].label !== doc.label;
            const alts = altDocuments[doc.href];
            return (
              <DocumentRow
                key={doc.href}
                label={current}
                href={docOverrides[doc.href]?.href || doc.href}
                changed={changed}
              >
                {alts && (
                  <Select
                    value={current}
                    onValueChange={(label) => {
                      const alt = alts.find((a) => a.label === label);
                      if (!alt) return;
                      setDocOverrides((prev) => ({ ...prev, [doc.href]: { label: alt.label, href: alt.href } }));
                      if (alt.label.startsWith("po-")) setSelectedPO(alt.label);
                      if (alt.label.startsWith("packingslip-")) setSelectedPS(alt.label);
                      showToast(`Source document updated to ${alt.label} — line items recalculated`, "info");
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-6 border-none bg-transparent px-1 text-[11px] text-muted-foreground shadow-none hover:text-foreground"
                      aria-label={`Change ${doc.label}`}
                    >
                      <SelectValue placeholder="Change" />
                    </SelectTrigger>
                    <SelectContent>
                      {alts.map((alt) => (
                        <SelectItem key={alt.label} value={alt.label} className="text-[11px]">
                          {alt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </DocumentRow>
            );
          })}

          {/* Actions */}
          <SectionLabel as="h3" className="mt-5 mb-2.5">Actions</SectionLabel>

          {actionTaken ? (
            <div className="flex flex-col gap-2">
              <div className={`rounded-md border px-3 py-2.5 text-center text-xs font-medium ${
                actionTaken === "correction"
                  ? "border-border bg-muted text-foreground"
                  : actionTaken === "override"
                    ? "border-success/40 bg-success/10 text-success-text"
                    : "border-warning/40 bg-warning/10 text-warning-text"
              }`}>
                {actionTaken === "correction"
                  ? "Recovery Initiated — Email Sent"
                  : actionTaken === "override"
                    ? "Approved with Override"
                    : "Escalated to Manager"}
              </div>
              {actionTaken === "correction" && (
                <Link
                  href="/recovery"
                  className="block text-center text-[11px] text-primary no-underline hover:underline"
                >
                  View in Recovery Queue →
                </Link>
              )}
              {(actionTaken === "escalated" || actionTaken === "override") && <PostDisagreeSteps />}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {!allResolved && (
                <p className="m-0 mb-1 text-[10px] italic text-muted-foreground">
                  Review all line items above to unlock actions
                </p>
              )}

              <Button
                variant="outline"
                disabled={!allResolved}
                onClick={() => { setActiveModal("correction"); setModalNote(""); }}
                className="w-full border-warning text-warning-text hover:bg-warning/10"
              >
                Initiate Recovery
              </Button>

              <Button
                variant="outline"
                disabled={!allResolved || hasAnyRejection}
                onClick={() => { setActiveModal("override"); setModalNote(""); }}
                title={hasAnyRejection ? "Cannot approve — one or more line items have disagreements" : ""}
                className="h-auto w-full flex-col py-2"
              >
                Approve with Override
                {allResolved && hasAnyRejection && (
                  <span className="text-[10px] font-normal text-destructive-text">Blocked — disagreement exists</span>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => { setActiveModal("escalate"); setModalNote(""); setSelectedManager(""); }}
                className="w-full"
              >
                Escalate to Manager
              </Button>
            </div>
          )}

          {/* Agent History */}
          <div className="mt-4 border-t border-border pt-3">
            <Button
              variant="ghost"
              onClick={() => setHistoryOpen006(!historyOpen006)}
              aria-expanded={historyOpen006}
              className="-ml-2 h-auto w-full justify-start gap-1.5 px-2 py-1"
            >
              <ChevronDown className={`size-3 shrink-0 text-muted-foreground transition-transform duration-200 ${historyOpen006 ? "" : "-rotate-90"}`} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Agent History</span>
            </Button>
            {historyOpen006 && (
              <div className="mt-2 space-y-2">
                {(() => {
                  const base = AGENT_TIMELINES["EX-006"] ?? DEFAULT_AGENT_TIMELINE;
                  const timeline = (actionTaken === "correction")
                    ? [...base, { agent: "Recovery Agent", color: "var(--agent-recovery)", time: "Now", msg: "Recovery initiated. Email sent to ap@steris.com. Awaiting vendor response." }]
                    : base;
                  return timeline.map((e, i) => (
                    <div key={i} className="flex gap-2 text-[11px]">
                      <div className="w-0.5 shrink-0 self-stretch rounded-full" style={{ backgroundColor: e.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-1.5">
                          <span className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                            style={{ backgroundColor: e.color + "22", color: e.color }}>
                            {e.agent}
                          </span>
                          <span className="text-[9px] text-muted-foreground">{e.time}</span>
                        </div>
                        <p className="m-0 leading-relaxed text-muted-foreground">{e.msg}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── ACTION MODALS — shadcn Dialog ──────────────────────────────────── */}

      {/* Reason / Override popup — shown when going against AI finding */}
      <Dialog
        open={!!reasonPopup}
        onOpenChange={(open) => { if (!open) setReasonPopup(null); }}
      >
        {reasonPopup && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override Automated Determination: {reasonPopup.itemCode}</DialogTitle>
              <DialogDescription>
                You are overriding the system&apos;s automated determination for this line item.
                This action will be recorded in the compliance audit log and may be subject to review.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="ex006-override-reason"
                className="text-xs font-medium text-muted-foreground"
              >
                Provide justification for determination override
              </label>
              <Textarea
                id="ex006-override-reason"
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                placeholder={reasonPopup.action === "accept"
                  ? "e.g., Vendor confirmed new pricing, PO amendment pending..."
                  : "e.g., Extraction error, wrong item matched, data entry issue..."}
                className="h-24 resize-none"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Cancel
              </DialogClose>
              <Button
                size="sm"
                onClick={handleReasonConfirm}
                disabled={!reasonNote.trim()}
              >
                Confirm Override
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Initiate Recovery Modal */}
      <Dialog
        open={activeModal === "correction"}
        onOpenChange={(open) => { if (!open) setActiveModal(null); }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Initiate Recovery from Vendor</DialogTitle>
            <DialogDescription>
              A formal recovery request will be dispatched to the vendor for the flagged amount.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ex006-vendor-email" className="text-xs font-medium text-muted-foreground">Vendor Email</label>
              <input
                id="ex006-vendor-email"
                type="text"
                readOnly
                value="ap@steris.com"
                className="rounded-lg border border-input bg-muted px-2.5 py-2 text-xs text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ex006-subject" className="text-xs font-medium text-muted-foreground">Subject</label>
              <input
                id="ex006-subject"
                type="text"
                readOnly
                value="Recovery Request: Invoice #STC-2026-19847 — Price Discrepancy"
                className="rounded-lg border border-input bg-muted px-2.5 py-2 text-xs text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ex006-message" className="text-xs font-medium text-muted-foreground">Message</label>
              <Textarea
                id="ex006-message"
                value={modalNote || "Dear Steris Accounts Receivable,\n\nWe have identified a pricing discrepancy on Invoice #STC-2026-19847.\n\nThe contracted rate for Sterile Surgical Drape Sets (STE-4821-A) is $2.10/unit per PO #NMC-PO-2026-2847, but the invoice reflects $2.50/unit.\n\nPlease issue a revised invoice at the contracted rate, or provide documentation supporting the rate change.\n\nRegards,\nNorthfield Medical Center — Accounts Payable"}
                onChange={(e) => setModalNote(e.target.value)}
                className="h-52 resize-none leading-relaxed"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              size="sm"
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
            >
              Send Recovery Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve with Override Modal */}
      <Dialog
        open={activeModal === "override"}
        onOpenChange={(open) => { if (!open) setActiveModal(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Invoice with Override</DialogTitle>
            <DialogDescription>
              Override the identified discrepancies and approve this invoice for payment.
            </DialogDescription>
          </DialogHeader>
          <Alert className="border-warning bg-warning/10">
            <AlertDescription className="text-warning-text">
              This will approve the invoice despite identified discrepancies. Invoice #STC-2026-19847 ·
              Steris Corporation · $27,750.00. A record of this override will be logged for audit purposes.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ex006-override-justification" className="text-xs font-medium text-muted-foreground">
              Override reason (required)
            </label>
            <Textarea
              id="ex006-override-justification"
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Explain why this override is justified..."
              className="h-24 resize-none"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              size="sm"
              onClick={() => { setActiveModal(null); updateExceptionStatus("EX-006", "resolved"); setActionTaken("override"); setInvoiceStatus("approved_override"); showToast("Invoice STC-2026-19847 approved with managerial override — logged for audit", "warning"); }}
              disabled={!modalNote.trim()}
            >
              Approve with Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate to Manager Modal */}
      <Dialog
        open={activeModal === "escalate"}
        onOpenChange={(open) => { if (!open) setActiveModal(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate to Manager</DialogTitle>
            <DialogDescription>
              Send this exception to a manager for final review.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Select Manager</label>
            <Select value={selectedManager} onValueChange={(v) => setSelectedManager(v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a manager..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="david">David Kim — VP Finance</SelectItem>
                <SelectItem value="lisa">Lisa Rodriguez — Director, AP</SelectItem>
                <SelectItem value="michael">Michael Chang — CFO</SelectItem>
                <SelectItem value="jennifer">Jennifer Walsh — Compliance Officer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ex006-escalate-note" className="text-xs font-medium text-muted-foreground">Note</label>
            <Textarea
              id="ex006-escalate-note"
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Describe the situation and any urgency..."
              className="h-24 resize-none"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              size="sm"
              onClick={() => { setActiveModal(null); setActionTaken("escalate"); setInvoiceStatus("waiting_manager"); showToast("Exception escalated for managerial review — assigned to " + (selectedManager === "david" ? "David Kim" : selectedManager === "lisa" ? "Lisa Rodriguez" : selectedManager === "michael" ? "Michael Chang" : "Jennifer Walsh"), "info"); }}
              disabled={!selectedManager || !modalNote.trim()}
            >
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legal Disclaimer Dialog for line-item agree/disagree */}
      <LegalDisclaimerDialog
        open={!!disclaimerPending}
        onConfirm={handleDisclaimerConfirm}
        onCancel={() => setDisclaimerPending(null)}
        action={disclaimerPending?.action === "accept" ? "agree" : "disagree"}
        itemCode={disclaimerPending?.itemCode}
        invoiceNumber="STC-2026-19847"
      />
    </main>
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
      <Card className="gap-0 p-5">
        <SectionLabel as="h2" className="mb-0">Exception Details</SectionLabel>
        {detailRows.map((row, i, arr) => (
          <div
            key={row.label}
            className={`flex items-baseline justify-between py-2.5 ${i < arr.length - 1 ? "border-b border-border" : ""}`}
          >
            <span className="text-xs text-muted-foreground">{row.label}</span>
            <span className="text-xs font-medium text-foreground">{row.value}</span>
          </div>
        ))}

        <SectionLabel as="h3" className="mt-5 mb-2.5">Actions</SectionLabel>

        {actionTaken ? (
          <div className="flex flex-col gap-2">
            <div className={`rounded-md border px-3 py-2.5 text-center text-xs font-medium ${
              actionTaken === "blocked"
                ? "border-destructive/30 bg-destructive/10 text-destructive-text"
                : actionTaken === "recovery"
                  ? "border-border bg-muted text-foreground"
                  : actionTaken === "escalated"
                    ? "border-warning/40 bg-warning/10 text-warning-text"
                    : "border-border bg-muted text-muted-foreground"
            }`}>
              {actionTaken === "blocked"
                ? "Payment Blocked"
                : actionTaken === "recovery"
                  ? "Recovery Initiated"
                  : actionTaken === "escalated"
                    ? "Escalated to Manager"
                    : "Dismissed"}
            </div>
            {actionTaken === "recovery" && (
              <Link
                href="/recovery"
                className="block text-center text-[11px] text-primary no-underline hover:underline"
              >
                View in Recovery Queue →
              </Link>
            )}
            {(actionTaken === "blocked" || actionTaken === "escalated") && <PostDisagreeSteps />}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setDisclaimerAction({ action: "block", callback: () => { setActionTaken("blocked"); updateExceptionStatus(ex.id, "under_review"); showToast(`Payment authorization for invoice ${ex.invoiceNumber} has been suspended`, "warning"); } })}
            >
              Block Payment
            </Button>
            <Button
              variant="outline"
              className="w-full border-warning text-warning-text hover:bg-warning/10"
              onClick={() => setDisclaimerAction({ action: "recover", callback: () => {
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
            >
              Initiate Recovery
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setDisclaimerAction({ action: "escalate", callback: () => { setActionTaken("escalated"); updateExceptionStatus(ex.id, "escalated"); showToast(`Exception ${ex.id} escalated for managerial review`, "info"); } })}
            >
              Escalate to Manager
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setDisclaimerAction({ action: "dismiss", callback: () => { setActionTaken("dismissed"); updateExceptionStatus(ex.id, "resolved"); showToast(`Exception ${ex.id} has been dismissed per analyst determination`, "info"); } })}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Agent History */}
        <div className="mt-4 border-t border-border pt-3">
          <Button
            variant="ghost"
            onClick={() => setHistoryOpen(!historyOpen)}
            aria-expanded={historyOpen}
            className="-ml-2 h-auto w-full justify-start gap-1.5 px-2 py-1"
          >
            <ChevronDown className={`size-3 shrink-0 text-muted-foreground transition-transform duration-200 ${historyOpen ? "" : "-rotate-90"}`} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Agent History</span>
          </Button>
          {historyOpen && (
            <div className="mt-2 space-y-2">
              {(() => {
                const base = AGENT_TIMELINES[ex.id] ?? DEFAULT_AGENT_TIMELINE;
                const timeline = (actionTaken === "correction" || actionTaken === "recovery")
                  ? [...base, { agent: "Recovery Agent", color: "var(--agent-recovery)", time: "Now", msg: "Recovery initiated. Email sent to vendor. Awaiting response." }]
                  : base;
                return timeline.map((e, i) => (
                  <div key={i} className="flex gap-2 text-[11px]">
                    <div className="w-0.5 shrink-0 self-stretch rounded-full" style={{ backgroundColor: e.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-1.5">
                        <span
                          className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                          style={{ backgroundColor: e.color + "22", color: e.color }}
                        >
                          {e.agent}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{e.time}</span>
                      </div>
                      <p className="m-0 leading-relaxed text-muted-foreground">{e.msg}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </Card>
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
  return (
    <main className="min-h-screen bg-background">
      <div className="px-4 pt-6 lg:px-6">
        <BackButton />
      </div>

      <div className="px-4 pt-3 pb-6 lg:px-6">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">{ex.id}</span>
          <SeverityBadge severity={ex.severity}>{typeLabels[ex.type] || ex.type}</SeverityBadge>
          <StatusBadge status={ex.status} />
          {ex.category && <CategoryBadge category={ex.category} />}
        </div>
        <div className="mb-1.5">
          <VendorBadge name={ex.vendor} size="lg" />
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          Invoice #{ex.invoiceNumber} · {new Date(ex.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Flagged: {formatCurrency(ex.flaggedAmount)}
        </p>
      </div>

      <div className="mx-4 mb-6 lg:mx-6">
        <AlertBar>{ex.description}</AlertBar>
      </div>

      <div className="mx-4 lg:mx-6">
        <EscalationBanner flaggedAmount={ex.flaggedAmount} />
      </div>

      {/* Workflow Stepper */}
      <div className="mx-4 mb-6 lg:mx-6">
        <Card className="px-8 py-5">
          <WorkflowStepper steps={getWorkflowSteps(ex.id)} />
        </Card>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 px-4 pb-8 lg:grid-cols-[1fr_280px] lg:px-6">
        <div>{children}</div>
        <div className="flex flex-col gap-5">
          {rightPanel}
          {/* Audit Trail */}
          <Card className="p-5">
            <AuditTrail entries={getAuditTrail(ex.id)} />
          </Card>
        </div>
      </div>
    </main>
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
      <SectionLabel className="mb-2">Three-Way Match Analysis</SectionLabel>
      <DiscrepancyView
        lineItems={lineItems.map((item) => ({ ...item, flags: item.flags || [] }))}
        showActions={false}
      />

      <Card className="mt-3 gap-0 py-0">
        {/* Totals */}
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:gap-10">
          <div>
            <SectionLabel as="h3" className="mb-1">PO Total</SectionLabel>
            <p className="m-0 text-lg font-semibold tabular-nums text-foreground">{formatCurrency(poTotal)}</p>
          </div>
          <div>
            <SectionLabel as="h3" className="mb-1">Invoice Total</SectionLabel>
            <p className="m-0 text-lg font-semibold tabular-nums text-destructive-text">{formatCurrency(invTotal)}</p>
          </div>
          <div>
            <SectionLabel as="h3" className="mb-1">Variance</SectionLabel>
            <p className="m-0 text-lg font-semibold tabular-nums text-destructive-text">
              {variance >= 0 ? "+" : ""}{formatCurrency(variance)} <span className="text-[13px] font-normal">({variance >= 0 ? "+" : ""}{variancePct}%)</span>
            </p>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="px-6 pb-5">
          <div className="rounded-md border border-border bg-muted px-4 py-3">
            <SectionLabel as="h3" className="mb-1.5">AI Recommendation</SectionLabel>
            <p className="m-0 text-xs leading-relaxed text-muted-foreground">
              {ex.id === "EX-007"
                ? "Hold invoice. Invoice bills 365 units but PO and packing slip both confirm 300 units. Request revised invoice for 300 units from Medline Industries. Overage of 65 units = $14,200 overbilled."
                : "Resolved. Unit of measure mismatch between PO (cases) and invoice (cartons) caused $3,890 price variance. Vendor Owens & Minor issued credit memo. Recommend standardising UOM in vendor master."}
            </p>
          </div>
        </div>
      </Card>
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
  // Similarity emphasis — destructive for near-exact, warning otherwise.
  const similarityHigh = pair.similarity >= 99;
  const similarityWarn = pair.similarity >= 95;
  const similarityFill = similarityHigh ? "bg-destructive" : similarityWarn ? "bg-warning" : "bg-primary";
  const similarityText = similarityHigh ? "text-destructive-text" : similarityWarn ? "text-warning-text" : "text-primary";

  return (
    <PageShell ex={ex} rightPanel={<ActionPanel ex={ex} actionTaken={actionTaken} setActionTaken={setActionTaken} />}>
      <SectionLabel className="mb-2">Duplicate Invoice Comparison</SectionLabel>
      <Card className="gap-0 py-0">
        {/* Side-by-side comparison — stacks on mobile (sm:grid-cols-2) */}
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {/* Invoice A */}
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Badge className="border-success bg-success/10 text-success-text">Original</Badge>
              <h3 className="m-0 text-xs font-medium text-foreground">Invoice A</h3>
            </div>
            {[
              { label: "Invoice #", value: inv1.number },
              { label: "Date", value: new Date(inv1.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Amount", value: formatCurrency(inv1.amount) },
              { label: "Submitted via", value: inv1.submittedVia },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-baseline justify-between py-2 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-xs font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Invoice B */}
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="destructive">Suspected Duplicate</Badge>
              <h3 className="m-0 text-xs font-medium text-foreground">Invoice B</h3>
            </div>
            {[
              { label: "Invoice #", value: inv2.number },
              { label: "Date", value: new Date(inv2.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Amount", value: formatCurrency(inv2.amount) },
              { label: "Submitted via", value: inv2.submittedVia },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-baseline justify-between py-2 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-xs font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Similarity score */}
        <div className="border-t border-border px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel as="h3">Content Similarity</SectionLabel>
            <span className={`text-sm font-semibold tabular-nums ${similarityText}`}>{pair.similarity}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all ${similarityFill}`} style={{ width: `${pair.similarity}%` }} />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
            <div>
              <span className="text-[11px] text-muted-foreground">Amount delta</span>
              <p className="m-0 mt-0.5 text-xs font-medium text-foreground">{formatCurrency(pair.amountDelta)} ({((pair.amountDelta / inv1.amount) * 100).toFixed(2)}%)</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Days apart</span>
              <p className="m-0 mt-0.5 text-xs font-medium text-foreground">{pair.daysDelta} days</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Different channel</span>
              <p className="m-0 mt-0.5 text-xs font-medium text-foreground">{inv1.submittedVia !== inv2.submittedVia ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="px-5 pb-5">
          <div className="rounded-md border border-border bg-muted px-4 py-3">
            <SectionLabel as="h3" className="mb-1.5">AI Analysis</SectionLabel>
            <p className="m-0 text-xs leading-relaxed text-muted-foreground">
              {ex.id === "EX-002"
                ? "Near-identical invoices from MedSupply Corp submitted through different channels (postal mail vs email) within 6 days. Amount differs by only $200 (0.42%), consistent with manual re-entry error. Same line items, same PO reference. Recommend blocking the duplicate and confirming with vendor."
                : "Exact duplicate from Henry Schein submitted via EDI and then again via email attachment 4 days later. Amounts are identical ($8,750). Second invoice was blocked before payment was processed."}
            </p>
          </div>
        </div>
      </Card>
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
      <SectionLabel className="mb-2">Contract Overage Analysis</SectionLabel>
      <Card className="p-6">
        {/* Contract summary */}
        <div className="mb-5">
          <h3 className="mb-3 text-sm font-medium text-foreground">Contract Summary</h3>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {[
              { label: "Contract #", value: contract.contractNumber },
              { label: "Period", value: `${new Date(contract.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${new Date(contract.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` },
              { label: "Cap Amount", value: formatCurrency(capAmount) },
              { label: "Current Spend", value: formatCurrency(currentSpend) },
            ].map((row) => (
              <div key={row.label} className="flex items-baseline justify-between border-b border-border py-1.5">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-xs font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5 border-t border-border pt-4">
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel as="h3">Spend vs Cap</SectionLabel>
            <span className="text-sm font-semibold tabular-nums text-destructive-text">{pct}% of cap</span>
          </div>
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
            {/* Cap marker at 100% */}
            <div className="absolute top-0 bottom-0 border-r-2 border-dashed border-muted-foreground" style={{ left: `${(100 / parseFloat(pct)) * 100}%` }} />
            <div className="h-full rounded-full bg-destructive transition-all" style={{ width: `${Math.min((barWidth / 150) * 100, 100)}%` }} />
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-[10px] text-muted-foreground">$0</span>
            <span className="text-[10px] text-muted-foreground">Cap: {formatCurrency(capAmount)}</span>
          </div>
        </div>

        {/* Overage calculation */}
        <div className="mb-5 border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Overage Calculation</h3>
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Current Spend</span>
              <span className="text-xs font-medium tabular-nums text-foreground">{formatCurrency(currentSpend)}</span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Contract Cap</span>
              <span className="text-xs font-medium tabular-nums text-foreground">- {formatCurrency(capAmount)}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 border-t border-destructive/30 pt-2">
              <span className="text-xs font-medium text-destructive-text">Overage</span>
              <span className="text-sm font-bold tabular-nums text-destructive-text">= {formatCurrency(overage)}</span>
            </div>
          </div>
        </div>

        {/* Contract note */}
        {contract.terms && (
          <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3">
            <p className="m-0 text-xs leading-relaxed text-warning-text">{contract.terms}</p>
          </div>
        )}

        {/* AI Recommendation */}
        <div className="mt-5">
          <div className="rounded-md border border-border bg-muted px-4 py-3">
            <SectionLabel as="h3" className="mb-1.5">AI Recommendation</SectionLabel>
            <p className="m-0 text-xs leading-relaxed text-muted-foreground">
              Flag for procurement review. The contract cap of {formatCurrency(capAmount)} has been exceeded by {formatCurrency(overage)} ({pct}% utilisation). Contract has expired with no auto-renewal. 23 invoices were processed after the cap was breached. Consider renegotiation or competitive bidding for future orders.
            </p>
          </div>
        </div>
      </Card>
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
      <SectionLabel className="mb-2">Missing Rebate Analysis</SectionLabel>
      <Card className="p-6">
        {/* Contract terms */}
        <div className="mb-5">
          <h3 className="mb-3 text-sm font-medium text-foreground">Contract Terms</h3>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {[
              { label: "Contract #", value: contract.contractNumber },
              { label: "Vendor", value: contract.vendor },
              { label: "Rebate Rate", value: `${contract.rebateRate}%` },
              { label: "Threshold", value: formatCurrency(contract.rebateThreshold || 0) },
              { label: "Q1 Spend", value: isEX004 ? "$312,400" : "$94,200" },
            ].map((row) => (
              <div key={row.label} className="flex items-baseline justify-between border-b border-border py-1.5">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-xs font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rebate calculation */}
        <div className="mb-5 border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Rebate Calculation Breakdown</h3>
          <div className="rounded-md border border-border bg-muted px-4 py-3">
            {isEX004 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Q1 Spend</span>
                  <span className="font-medium tabular-nums text-foreground">$312,400</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Quarterly rebate (8.5% × $312,400)</span>
                  <span className="font-medium tabular-nums text-warning-text">$26,554</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Volume discounts (47 line items)</span>
                  <span className="font-medium tabular-nums text-warning-text">$62,876</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-xs">
                  <span className="font-medium text-foreground">Total owed to Northfield</span>
                  <span className="text-sm font-bold tabular-nums text-destructive-text">$89,430</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Q1 Spend</span>
                  <span className="font-medium tabular-nums text-foreground">$94,200</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Threshold</span>
                  <span className="font-medium tabular-nums text-foreground">- $80,000</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-xs">
                  <span className="text-muted-foreground">Excess spend</span>
                  <span className="font-medium tabular-nums text-foreground">= $14,200</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Rebate (7.25% of excess)</span>
                  <span className="font-medium tabular-nums text-warning-text">$1,030</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Early payment discount (3% on $194K)</span>
                  <span className="font-medium tabular-nums text-warning-text">$5,820</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-xs">
                  <span className="font-medium text-foreground">Total owed to Northfield</span>
                  <span className="text-sm font-bold tabular-nums text-destructive-text">$6,850</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="rounded-md border border-border bg-muted px-4 py-3">
          <SectionLabel as="h3" className="mb-1.5">AI Recommendation</SectionLabel>
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">
            {isEX004
              ? "Contact Cardinal Health to claim the outstanding rebate credit of $26,554 plus $62,876 in volume discount adjustments (total $89,430). Reference contract #CTR-2025-CAR-003. No credit memo has been received."
              : "Contact Vizient Inc. to claim $1,030 rebate on Q1 excess spend and $5,820 in missed early-payment discounts across 12 invoices. Reference contract #CTR-2025-VZT-002."}
          </p>
        </div>
      </Card>
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
      <SectionLabel className="mb-2">Tier Pricing Analysis</SectionLabel>
      <Card className="p-6">
        {/* Tier pricing table */}
        <div className="mb-5">
          <h3 className="mb-3 text-sm font-medium text-foreground">Contract Tier Pricing</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier, i) => (
                <TableRow key={tier.label}>
                  <TableCell className="text-xs font-medium text-foreground">{tier.label}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {i === 0 ? `Up to ${tier.maxQty.toLocaleString()} units/month` : `> ${tiers[i - 1].maxQty.toLocaleString()} units/month`}
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums text-foreground">${tier.unitPrice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Actual calculation */}
        <div className="mb-5 border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">March Invoice Calculation</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* What was charged */}
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
              <SectionLabel as="h3" className="mb-2 text-destructive-text">What Was Charged</SectionLabel>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">March units</span>
                  <span className="font-medium tabular-nums text-foreground">2,340</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Rate applied</span>
                  <span className="font-medium tabular-nums text-foreground">$85.00/unit (Tier 1 only)</span>
                </div>
                <div className="flex justify-between border-t border-destructive/30 pt-1.5 text-xs">
                  <span className="font-medium text-destructive-text">Total billed</span>
                  <span className="font-bold tabular-nums text-destructive-text">$198,900</span>
                </div>
              </div>
            </div>

            {/* What should have been charged */}
            <div className="rounded-md border border-success/40 bg-success/10 px-4 py-3">
              <SectionLabel as="h3" className="mb-2 text-success-text">Correct Pricing</SectionLabel>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tier 1: 1,000 units x $85</span>
                  <span className="font-medium tabular-nums text-foreground">$85,000</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tier 2: 1,340 units x $72</span>
                  <span className="font-medium tabular-nums text-foreground">$96,480</span>
                </div>
                <div className="flex justify-between border-t border-success/40 pt-1.5 text-xs">
                  <span className="font-medium text-success-text">Correct total</span>
                  <span className="font-bold tabular-nums text-success-text">$181,480</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overcharge summary */}
        <div className="mb-5 border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Overcharge Summary</h3>
          <div className="rounded-md border border-border bg-muted px-4 py-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Jan 2026 overcharge (2,340 units)</span>
                <span className="font-medium tabular-nums text-destructive-text">$17,420</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Feb 2026 overcharge (2,340 units)</span>
                <span className="font-medium tabular-nums text-destructive-text">$17,420</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Mar 2026 overcharge (2,340 units)</span>
                <span className="font-medium tabular-nums text-destructive-text">$17,420</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-xs">
                <span className="font-medium text-foreground">Total overcharge (3 months)</span>
                <span className="text-sm font-bold tabular-nums text-destructive-text">$52,260</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="rounded-md border border-border bg-muted px-4 py-3">
          <SectionLabel as="h3" className="mb-1.5">AI Recommendation</SectionLabel>
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">
            Request pricing correction from Cardinal Health. Contract #CTR-2025-CAR-003 specifies tiered pricing: $85/unit up to 1,000 units, $72/unit above 1,000 units. Jan–Mar 2026: 2,340 units/month all billed at Tier 1. Monthly overcharge: $17,420. Total retroactive adjustment: $52,260 (3 months).
          </p>
        </div>
      </Card>
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

function GenericExceptionPage({ exceptionId }: { exceptionId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [actionTaken, setActionTaken] = useState<string | null>(null);
  const [disclaimerActionGeneric, setDisclaimerActionGeneric] = useState<{action: string; callback: () => void} | null>(null);

  const ex = exceptions.find((e) => e.id === exceptionId);
  if (!ex) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Exception {exceptionId} not found</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => router.back()}>
            <ArrowLeft className="size-3.5" />
            Back
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="px-4 pt-6 lg:px-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-6 lg:px-6">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">{ex.id}</span>
          <SeverityBadge severity={ex.severity}>{typeLabels[ex.type] || ex.type}</SeverityBadge>
          <StatusBadge status={ex.status} />
          {ex.category && <CategoryBadge category={ex.category} />}
        </div>
        <div className="mb-1.5">
          <VendorBadge name={ex.vendor} size="lg" />
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          Invoice #{ex.invoiceNumber} · {new Date(ex.invoiceDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Flagged: {formatCurrency(ex.flaggedAmount)}
        </p>
      </div>

      {/* Alert bar */}
      <div className="mx-4 mb-6 lg:mx-6">
        <AlertBar>{ex.description}</AlertBar>
      </div>

      <div className="mx-4 lg:mx-6">
        <EscalationBanner flaggedAmount={ex.flaggedAmount} />
      </div>

      {/* Workflow Stepper */}
      <div className="mx-4 mb-6 lg:mx-6">
        <Card className="px-8 py-5">
          <WorkflowStepper steps={getWorkflowSteps(ex.id)} />
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 items-start gap-6 px-4 pb-8 lg:grid-cols-[1fr_280px] lg:px-6">
        {/* LEFT: Exception Details */}
        <div>
          <SectionLabel className="mb-2">Exception Analysis</SectionLabel>
          <Card className="p-6">
            <div className="mb-5">
              <h3 className="mb-2 text-sm font-medium text-foreground">What was detected</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{ex.description}</p>
            </div>

            <div className="mb-5 border-t border-border pt-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">Key Figures</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-md bg-muted px-4 py-3">
                  <SectionLabel as="h3" className="mb-1">Invoice Amount</SectionLabel>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(ex.amount)}</p>
                </div>
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
                  <SectionLabel as="h3" className="mb-1">Flagged Amount</SectionLabel>
                  <p className="text-lg font-semibold text-destructive-text">{formatCurrency(ex.flaggedAmount)}</p>
                </div>
                <div className="rounded-md bg-muted px-4 py-3">
                  <SectionLabel as="h3" className="mb-1">Risk Percentage</SectionLabel>
                  <p className="text-lg font-semibold text-foreground">{((ex.flaggedAmount / ex.amount) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="mb-2 text-sm font-medium text-foreground">AI Recommendation</h3>
              <div className="rounded-md border border-border bg-muted px-4 py-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {ex.type === "duplicate" && "Block the duplicate invoice and initiate recovery for the flagged amount. Verify vendor billing channel to prevent recurrence."}
                  {ex.type === "missing_rebate" && "Contact vendor to claim the outstanding rebate credit. Reference the contract terms and quarterly spend threshold."}
                  {ex.type === "contract_overage" && "Flag for procurement review. The contract cap has been exceeded. Consider renegotiation or competitive bidding for future orders."}
                  {ex.type === "tier_pricing" && "Request pricing correction from vendor. The wrong tier was applied. Calculate retroactive adjustment for affected invoices."}
                  {ex.type === "match_exception" && "Investigate the line-item discrepancy. Compare against PO and packing slip to determine root cause."}
                  {ex.type === "suspicious_invoice" && "Escalate to compliance. This invoice has multiple red flags and requires manual verification before payment."}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: Info panel */}
        <Card className="gap-0 p-5">
          <SectionLabel as="h2" className="mb-0">Exception Details</SectionLabel>

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
              className={`flex items-baseline justify-between py-2.5 ${i < arr.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-xs font-medium text-foreground">{row.value}</span>
            </div>
          ))}

          {/* Actions */}
          <SectionLabel as="h3" className="mt-5 mb-2.5">Actions</SectionLabel>

          {actionTaken ? (
            <>
              <div className={`rounded-md border px-3 py-2.5 text-center text-xs font-medium ${
                actionTaken === "blocked"
                  ? "border-destructive/30 bg-destructive/10 text-destructive-text"
                  : actionTaken === "recovery"
                    ? "border-border bg-muted text-foreground"
                    : actionTaken === "escalated"
                      ? "border-warning/40 bg-warning/10 text-warning-text"
                      : "border-border bg-muted text-muted-foreground"
              }`}>
                {actionTaken === "blocked"
                  ? "Payment Blocked"
                  : actionTaken === "recovery"
                    ? "Recovery Initiated"
                    : actionTaken === "escalated"
                      ? "Escalated to Manager"
                      : "Dismissed"}
              </div>
              {actionTaken === "recovery" && (
                <Link href="/recovery" className="mt-2 block text-center text-[11px] text-primary no-underline hover:underline">
                  View in Recovery Queue →
                </Link>
              )}
              {(actionTaken === "blocked" || actionTaken === "escalated") && <PostDisagreeSteps />}
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setDisclaimerActionGeneric({ action: "block", callback: () => { setActionTaken("blocked"); updateExceptionStatus(ex.id, "under_review"); showToast(`Payment authorization for invoice ${ex.invoiceNumber} has been suspended`, "warning"); } })}
              >
                Block Payment
              </Button>
              <Button
                variant="outline"
                className="w-full border-warning text-warning-text hover:bg-warning/10"
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
              >
                Initiate Recovery
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDisclaimerActionGeneric({ action: "escalate", callback: () => { setActionTaken("escalated"); updateExceptionStatus(ex.id, "escalated"); showToast(`Exception ${ex.id} escalated for managerial review`, "info"); } })}
              >
                Escalate to Manager
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setDisclaimerActionGeneric({ action: "dismiss", callback: () => { setActionTaken("dismissed"); updateExceptionStatus(ex.id, "resolved"); showToast(`Exception ${ex.id} has been dismissed per analyst determination`, "info"); } })}
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Audit Trail */}
          <div className="mt-5 border-t border-border pt-5">
            <AuditTrail entries={getAuditTrail(ex.id)} />
          </div>
        </Card>
      </div>

      {/* Legal Disclaimer Dialog for generic exception actions */}
      <LegalDisclaimerDialog
        open={!!disclaimerActionGeneric}
        onConfirm={() => { disclaimerActionGeneric?.callback(); setDisclaimerActionGeneric(null); }}
        onCancel={() => setDisclaimerActionGeneric(null)}
        action={disclaimerActionGeneric?.action || "block"}
        invoiceNumber={ex.invoiceNumber}
      />
    </main>
  );
}

// ─── Template: SOM exception detail (drug-distributor vertical) ─────────────
//
// Handles all 4 som_* types. Renders a check-specific evidence panel and
// deep-links back to the SOM workflow runner at /som/order/[orderId]. Action
// buttons mirror the runner's Approve/Hold/Escalate (NOT the hospital flow's
// Approve / Request Correction / Escalate).

// Per-type evidence rendering — module-level component (hoisted out of the
// SomExceptionDetail render so it is a stable component identity).
function CheckSpecificEvidence({ ex }: { ex: Exception }) {
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

function SomExceptionDetail({ exception: ex }: { exception: Exception }) {
  const { showToast } = useToast();
  const [decision, setDecision] = useState<"approved" | "held" | "escalated" | null>(
    ex.status === "escalated" ? "escalated" : null,
  );
  const [disclaimerActionSom, setDisclaimerActionSom] = useState<{action: string; callback: () => void} | null>(null);

  // The SOM exception's invoiceNumber field holds the order ID (ORD-*).
  const orderId = ex.invoiceNumber;

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
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="px-4 pt-6 lg:px-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-6 lg:px-6">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">{ex.id}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
            SOM · Drug Distributor
          </span>
          <SeverityBadge severity={ex.severity}>{typeLabels[ex.type] || ex.type}</SeverityBadge>
          <StatusBadge status={ex.status} />
          {ex.category && <CategoryBadge category={ex.category} />}
        </div>
        <div className="mb-1.5">
          <VendorBadge name={ex.vendor} size="lg" />
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          Order #{orderId} · Detected {new Date(ex.detectedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · Flagged {formatCurrency(ex.flaggedAmount)}
        </p>
      </div>

      <div className="mx-4 lg:mx-6">
        <EscalationBanner flaggedAmount={ex.flaggedAmount} />
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-1 items-start gap-5 px-4 pb-8 lg:grid-cols-[1fr_320px] lg:px-6">
        {/* LEFT: Description + evidence */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <SectionLabel className="mb-3">Description</SectionLabel>
            <p className="m-0 text-sm leading-relaxed text-foreground">{ex.description}</p>
          </Card>

          <Card className="p-5">
            <SectionLabel className="mb-3">Evidence summary</SectionLabel>
            <div className="flex flex-col gap-2.5">
              <CheckSpecificEvidence ex={ex} />
            </div>
            <Link
              href={`/som/order/${orderId}`}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary no-underline hover:underline"
            >
              View full SOM workflow run →
            </Link>
          </Card>
        </div>

        {/* RIGHT: Meta + actions */}
        <div className="sticky top-4 flex flex-col gap-4">
          <Card className="gap-0 p-5">
            <SectionLabel as="h2" className="mb-3">Exception details</SectionLabel>
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
                className={`flex items-baseline justify-between py-2 ${i < arr.length - 1 ? "border-b border-border" : ""}`}
              >
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className={`text-[11px] font-medium text-foreground ${row.mono ? "font-mono" : ""}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </Card>

          <Card className="gap-0 p-5">
            <SectionLabel as="h2" className="mb-3">Analyst decision</SectionLabel>
            {decision ? (
              <div className={`rounded-md border px-3 py-2.5 text-center text-xs font-medium ${
                decision === "approved"
                  ? "border-success/40 bg-success/10 text-success-text"
                  : decision === "held"
                    ? "border-warning/40 bg-warning/10 text-warning-text"
                    : "border-border bg-muted text-foreground"
              }`}>
                {decision === "approved" && "Approved — released to fulfilment"}
                {decision === "held" && "On hold — awaiting analyst follow-up"}
                {decision === "escalated" && "Escalated to compliance manager"}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-success text-success-text hover:bg-success/10"
                  onClick={() => setDisclaimerActionSom({ action: "approve", callback: () => handleDecision("approved") })}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-warning text-warning-text hover:bg-warning/10"
                  onClick={() => setDisclaimerActionSom({ action: "hold", callback: () => handleDecision("held") })}
                >
                  Hold
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDisclaimerActionSom({ action: "escalate", callback: () => handleDecision("escalated") })}
                >
                  Escalate
                </Button>
              </div>
            )}
          </Card>
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
    </main>
  );
}

function EvidenceField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className="text-right text-[11px] font-medium text-foreground">{value}</span>
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
