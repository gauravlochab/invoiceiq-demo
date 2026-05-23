// [Spec: domains/contracts/spec.md v2.0.1] — Contract Compliance, migrated to
// the shadcn v2.0 design system. Card/Alert/Badge/Button/Table primitives,
// theme tokens only (no v1 vars, no hardcoded surfaces, no raw hex), AA-safe status
// text via text-warning-text / text-success-text. See spec CHANGELOG 2026-05-22.
"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { contracts, formatCurrency, Contract } from "@/lib/data";
import { VendorBadge } from "@/components/VendorBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function pct(spend: number, cap: number): number {
  return (spend / cap) * 100;
}

function fmtPeriod(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

const STATUS_ORDER: Record<Contract["status"], number> = {
  breached: 0,
  expired: 0,
  warning: 1,
  compliant: 2,
};

// [Spec: domains/contracts/spec.md#Business Rules — Contract Sorting]
const sortedContracts = [...contracts].sort(
  (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
);

// Spend-vs-cap fill color by threshold (theme tokens — non-text, AA 3:1 fills).
// [Spec: domains/contracts/spec.md#Business Rules — Spend-vs-Cap Progress Bar]
function spendFillClass(p: number): string {
  if (p >= 100) return "bg-destructive";
  if (p >= 70) return "bg-warning";
  return "bg-primary";
}

// ─── SPEND BAR ────────────────────────────────────────────────────────────────
// Token-driven meter: a muted track with a status-colored fill. The fill color
// is a non-text element (AA 3:1) and is always paired with the % text below.
// [Spec: domains/contracts/spec.md#Acceptance Criteria — Spend-vs-cap progress]

function SpendBar({
  spend,
  cap,
  label,
  unit,
}: {
  spend: number;
  cap: number;
  label: string;
  unit?: "currency" | "units";
}) {
  const p = pct(spend, cap);
  const overLimit = p >= 100;
  const fmtVal = (v: number) =>
    unit === "units" ? `${v.toLocaleString()} units` : formatCurrency(v);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          <span className="text-foreground">{fmtVal(spend)}</span>{" "}
          <span aria-hidden="true">/</span> {fmtVal(cap)}
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(p)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${p.toFixed(1)} percent of cap`}
      >
        <div
          className={`h-full rounded-full ${spendFillClass(p)}`}
          style={{ width: `${Math.min(p, 100)}%` }}
        />
      </div>
      <p
        className={`mt-1 text-xs ${overLimit ? "text-destructive-text" : "text-muted-foreground"}`}
      >
        {overLimit
          ? `${p.toFixed(1)}% of cap — ${formatCurrency(spend - cap)} over limit`
          : `${p.toFixed(1)}% of cap`}
      </p>
    </div>
  );
}

// ─── CONTRACT CARD ────────────────────────────────────────────────────────────

function ContractCard({ contract }: { contract: Contract }) {
  const isBreached = contract.status === "breached";
  const isCardinalWarning =
    contract.vendor === "Cardinal Health" && contract.status === "warning";

  // [Spec: domains/contracts/spec.md#Business Rules — Contract Sorting]
  const leftBorderClass = isBreached
    ? "border-l-4 border-l-destructive"
    : contract.status === "warning"
      ? "border-l-4 border-l-warning"
      : "border-l-4 border-l-border";

  const statusBadge =
    isBreached ? (
      <Badge variant="destructive">Breached</Badge>
    ) : contract.status === "warning" ? (
      <Badge className="border-warning bg-warning/10 text-warning-text">
        At Risk
      </Badge>
    ) : (
      <Badge className="border-success bg-success/10 text-success-text">
        Compliant
      </Badge>
    );

  const hasQuantityCap =
    contract.capType === "both" &&
    contract.capQuantity !== undefined &&
    contract.currentQuantity !== undefined;

  return (
    <Card className={`mb-3 py-0 ${leftBorderClass}`}>
      {/* Card header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div>
          <div className="mb-1">
            {/* VendorBadge carries the contract's heading-level identity */}
            <h3 className="m-0 text-base font-medium">
              <VendorBadge name={contract.vendor} size="md" />
            </h3>
          </div>
          <div className="mt-0.5 pl-[42px] font-mono text-xs text-muted-foreground">
            {contract.contractNumber}
          </div>
          <div className="mt-1.5 pl-[42px]">
            <Badge variant="secondary">{contract.category}</Badge>
          </div>
        </div>
        <div className="text-right">
          {statusBadge}
          <div className="mt-1 text-xs text-muted-foreground">
            {fmtPeriod(contract.startDate, contract.endDate)}
          </div>
        </div>
      </div>

      {/* Spend section — cap source labelled (GPO contract #) for context */}
      <div className="border-b border-border px-5 pb-3">
        {hasQuantityCap ? (
          <div className="flex flex-col gap-4">
            <SpendBar
              spend={contract.currentSpend}
              cap={contract.capValue}
              label="Value spend vs cap"
              unit="currency"
            />
            {contract.capQuantity !== undefined &&
              contract.currentQuantity !== undefined && (
                <SpendBar
                  spend={contract.currentQuantity}
                  cap={contract.capQuantity}
                  label="Quantity vs cap"
                  unit="units"
                />
              )}
          </div>
        ) : (
          <SpendBar
            spend={contract.currentSpend}
            cap={contract.capValue}
            label="Spend vs cap"
            unit="currency"
          />
        )}
      </div>

      {/* Rebate alert — AA-safe warning text */}
      {contract.rebateMissed !== undefined && contract.rebateMissed > 0 && (
        <div className="border-b border-border px-5 py-2.5">
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="text-warning-text" />
            <AlertTitle className="text-warning-text">
              Unclaimed rebate
            </AlertTitle>
            <AlertDescription className="text-warning-text">
              {formatCurrency(contract.rebateMissed)} not received — No credit
              memo for Q1 2026
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Tier pricing — qualifying volume tier shown alongside each rate */}
      {contract.tieredPricing && (
        <div className="border-b border-border px-5 py-2.5">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tiered pricing
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xs text-muted-foreground">
              Tier 1: ≤ 1,000 units/month &rarr; $85.00/unit
            </div>
            <div className="text-xs text-muted-foreground">
              Tier 2: &gt; 1,000 units/month &rarr; $72.00/unit{" "}
              <span className="text-warning-text">
                &larr; should apply (2,340 units in Mar)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Breach block — destructive Alert + commit actions */}
      {isBreached && (
        <div className="px-5 py-3">
          <Alert variant="destructive" className="border-destructive">
            <AlertTriangle />
            <AlertTitle>Contract breached</AlertTitle>
            <AlertDescription>
              23 invoices processed after cap exceeded &middot;{" "}
              {formatCurrency(contract.currentSpend - contract.capValue)}{" "}
              overspend &middot; Contract expired{" "}
              {new Date(contract.endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </AlertDescription>
          </Alert>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="destructive" size="sm">
              Pause Vendor Payments
            </Button>
            <Button variant="outline" size="sm">
              Contact Vendor
            </Button>
            <Button variant="outline" size="sm">
              Notify CFO
            </Button>
          </div>
        </div>
      )}

      {/* Cardinal Health warning actions */}
      {isCardinalWarning && (
        <div className="flex flex-wrap gap-2 px-5 pt-3 pb-4">
          <Button variant="outline" size="sm">
            Request Rebate Credit Memo
          </Button>
          <Button variant="outline" size="sm">
            Submit Pricing Correction
          </Button>
        </div>
      )}
    </Card>
  );
}

// ─── RENEWAL TIMELINE ─────────────────────────────────────────────────────────
// [Spec: domains/contracts/spec.md#Business Rules — Renewal Timeline]

const renewals: {
  vendor: string;
  contractNumber: string;
  expires: string;
  status: "Expired" | "Expiring" | "Active";
}[] = [
  {
    vendor: "BioMed Equipment Inc.",
    contractNumber: "CTR-2024-BIO-009",
    expires: "Dec 31, 2025",
    status: "Expired",
  },
  {
    vendor: "Cardinal Health",
    contractNumber: "CTR-2025-CAR-003",
    expires: "Mar 31, 2026",
    status: "Expiring",
  },
  {
    vendor: "Steris Corporation",
    contractNumber: "CTR-2025-STE-007",
    expires: "May 31, 2026",
    status: "Active",
  },
];

function renewalStatusBadge(status: "Expired" | "Expiring" | "Active") {
  if (status === "Expired") return <Badge variant="destructive">Expired</Badge>;
  if (status === "Expiring")
    return (
      <Badge className="border-warning bg-warning/10 text-warning-text">
        Expiring
      </Badge>
    );
  return <Badge variant="secondary">Active</Badge>;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ContractCompliancePage() {
  const [loading, setLoading] = useState(true);

  // [Spec: domains/contracts/spec.md#Acceptance Criteria — Loading]
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const totalValue = contracts.reduce((s, c) => s + c.capValue, 0);
  const totalSpend = contracts.reduce((s, c) => s + c.currentSpend, 0);
  const totalUnclaimed = contracts.reduce(
    (s, c) => s + (c.rebateMissed ?? 0),
    0
  );
  const breachedCount = contracts.filter((c) => c.status === "breached").length;
  const atRiskCount = contracts.filter((c) => c.status === "warning").length;
  const vendorsWithRebates = contracts.filter(
    (c) => (c.rebateMissed ?? 0) > 0
  ).length;

  return (
    <main className="@container/main flex flex-1 flex-col bg-background">
      {/* ── Header ── */}
      <div className="px-4 pt-8 pb-6 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              Contract Compliance
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {contracts.length} active contracts &middot; {atRiskCount} at risk
              &middot; {breachedCount} breached
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Download Report
            </Button>
            <Button variant="default" size="sm">
              Add Contract
            </Button>
          </div>
        </div>
        <hr className="mt-5 border-border" />
      </div>

      {/* ── Summary strip ── */}
      <section aria-labelledby="summary-heading" className="px-4 pb-6 lg:px-6">
        <h2 id="summary-heading" className="sr-only">
          Contract summary
        </h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Card className="py-0">
            <div className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
              <div className="flex-1 px-5 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Contract Value
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums">
                  {formatCurrency(totalValue)}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {contracts.length} contracts
                </div>
              </div>
              <div className="flex-1 px-5 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Spend
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums">
                  {formatCurrency(totalSpend)}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Q1 2026
                </div>
              </div>
              <div className="flex-1 px-5 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Unclaimed Rebates
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-warning-text">
                  {formatCurrency(totalUnclaimed)}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {vendorsWithRebates} vendors
                </div>
              </div>
              <div className="flex-1 px-5 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Contracts Breached
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-destructive-text">
                  {breachedCount}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Immediate action
                </div>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* ── Contract cards ── */}
      <section aria-labelledby="contracts-heading" className="px-4 lg:px-6">
        <h2 id="contracts-heading" className="sr-only">
          Contract cards
        </h2>
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                className="mb-3 border-l-4 border-l-border px-5 py-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-4 h-2 w-full" />
                <Skeleton className="mt-2 h-3 w-16" />
              </Card>
            ))}
          </>
        ) : (
          sortedContracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))
        )}
      </section>

      {/* ── Renewal timeline ── */}
      <section aria-labelledby="renewals-heading" className="px-4 pt-2 pb-8 lg:px-6">
        <h2
          id="renewals-heading"
          className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Upcoming renewals
        </h2>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renewals.map((r) => (
                    <TableRow key={r.contractNumber}>
                      <TableCell>
                        <VendorBadge name={r.vendor} size="sm" />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.contractNumber}
                      </TableCell>
                      <TableCell className="text-sm">{r.expires}</TableCell>
                      <TableCell>{renewalStatusBadge(r.status)}</TableCell>
                      <TableCell>
                        <a
                          href="#"
                          className="text-xs font-medium text-primary no-underline transition-colors hover:underline"
                        >
                          Renew &rarr;
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
