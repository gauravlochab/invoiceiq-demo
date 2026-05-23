"use client";

// ─── SOM Exceptions — Drug Distributor inbox ──────────────────────────────────
//
// SOM-scoped analog of /exceptions. Lists only exceptions whose type starts
// with `som_`, with vocabulary tuned for the drug-distributor vertical:
//   - "Pharmacy" instead of "Vendor"
//   - "Order #" instead of "Invoice #"
//   - "Order amount" instead of "Invoice amount"
//
// Each row deep-links to /exceptions/[id] which already routes SOM-* IDs to
// SomExceptionDetail (built in Phase 2). The unified /exceptions page stays
// untouched and continues to show all verticals.
//
// [Spec: domains/som/spec.md#Page 3: SOM Exceptions] — v2.0 shadcn migration:
// Card/Table/Badge/Button/ToggleGroup primitives, theme tokens, px-4 lg:px-6.

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowUpDown, MapPin } from "lucide-react";
import {
  exceptions,
  formatCurrency,
  formatDate,
  type Severity,
  type Status,
} from "@/lib/data";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// SOM-only filter
const somExceptions = exceptions.filter((e) => e.type.startsWith("som_"));

// ─── Filter options (SOM-scoped) ──────────────────────────────────────────────

type FilterKey =
  | "all"
  | "open"
  | "critical"
  | "high"
  | "som_address_mismatch"
  | "som_license_invalid"
  | "som_price_deviation"
  | "som_quantity_outlier";

function applyFilter(filter: FilterKey) {
  switch (filter) {
    case "open":
      return somExceptions.filter(
        (e) => e.status === "open" || e.status === "under_review" || e.status === "escalated",
      );
    case "critical":
      return somExceptions.filter((e) => e.severity === "critical");
    case "high":
      return somExceptions.filter((e) => e.severity === "high");
    case "som_address_mismatch":
    case "som_license_invalid":
    case "som_price_deviation":
    case "som_quantity_outlier":
      return somExceptions.filter((e) => e.type === filter);
    default:
      return somExceptions;
  }
}

const somTypeLabels: Record<string, string> = {
  som_address_mismatch: "Address Mismatch",
  som_license_invalid: "License Invalid",
  som_price_deviation: "Price Deviation",
  som_quantity_outlier: "Volume Outlier",
};

// ─── Style helpers ────────────────────────────────────────────────────────────

// [Spec: domains/som/spec.md#Business Rules — Type badge colors]
// license_invalid / quantity_outlier = critical → destructive variant.
// address_mismatch / price_deviation = warning → token-styled badge.
function TypeBadge({ type }: { type: string }) {
  const label = somTypeLabels[type] || type;
  if (type === "som_license_invalid" || type === "som_quantity_outlier") {
    return <Badge variant="destructive">{label}</Badge>;
  }
  if (type === "som_address_mismatch" || type === "som_price_deviation") {
    return (
      <Badge className="border-warning bg-warning/10 text-warning-text">{label}</Badge>
    );
  }
  return <Badge variant="secondary">{label}</Badge>;
}

function StatusBadge({ status }: { status: Status }) {
  const label =
    status === "open"
      ? "Open"
      : status === "under_review"
        ? "Under Review"
        : status === "escalated"
          ? "Escalated"
          : "Resolved";
  if (status === "open") return <Badge variant="destructive">{label}</Badge>;
  if (status === "under_review") return <Badge variant="outline">{label}</Badge>;
  if (status === "escalated") return <Badge variant="secondary">{label}</Badge>;
  if (status === "resolved")
    return (
      <Badge className="border-success bg-success/10 text-success-text">{label}</Badge>
    );
  return <Badge variant="secondary">{label}</Badge>;
}

function severityDotClass(severity: Severity): string {
  if (severity === "critical") return "bg-destructive";
  if (severity === "high") return "bg-warning";
  if (severity === "medium") return "bg-primary";
  return "bg-border";
}

// Flagged-amount text — AA-safe status tokens (ui-standard.md v2.0.1).
function flaggedColorClass(severity: Severity): string {
  if (severity === "critical" || severity === "high") return "text-destructive";
  if (severity === "medium") return "text-warning-text";
  return "text-muted-foreground";
}

// ─── Sort ────────────────────────────────────────────────────────────────────

type SortKey = "flaggedAmount" | "detectedAt" | null;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SomExceptionsPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("detectedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = applyFilter(filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "flaggedAmount") {
      return sortDir === "desc" ? b.flaggedAmount - a.flaggedAmount : a.flaggedAmount - b.flaggedAmount;
    }
    if (sortKey === "detectedAt") {
      const av = new Date(a.detectedAt).getTime();
      const bv = new Date(b.detectedAt).getTime();
      return sortDir === "desc" ? bv - av : av - bv;
    }
    return 0;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  // aria-sort value for a given sortable column.
  function ariaSortFor(key: SortKey): "ascending" | "descending" | "none" {
    if (sortKey !== key) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  // Counts for the filter chips
  const counts = {
    all: somExceptions.length,
    open: somExceptions.filter((e) => e.status === "open" || e.status === "under_review" || e.status === "escalated").length,
    critical: somExceptions.filter((e) => e.severity === "critical").length,
    high: somExceptions.filter((e) => e.severity === "high").length,
    som_address_mismatch: somExceptions.filter((e) => e.type === "som_address_mismatch").length,
    som_license_invalid: somExceptions.filter((e) => e.type === "som_license_invalid").length,
    som_price_deviation: somExceptions.filter((e) => e.type === "som_price_deviation").length,
    som_quantity_outlier: somExceptions.filter((e) => e.type === "som_quantity_outlier").length,
  };

  const filterChips: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "open", label: "Open", count: counts.open },
    { key: "critical", label: "Critical", count: counts.critical },
    { key: "high", label: "High", count: counts.high },
    { key: "som_address_mismatch", label: "Address Mismatch", count: counts.som_address_mismatch },
    { key: "som_license_invalid", label: "License Invalid", count: counts.som_license_invalid },
    { key: "som_price_deviation", label: "Price Deviation", count: counts.som_price_deviation },
    { key: "som_quantity_outlier", label: "Volume Outlier", count: counts.som_quantity_outlier },
  ];

  // Summary metrics
  const totalFlagged = somExceptions.reduce((sum, e) => sum + e.flaggedAmount, 0);
  const openCount = counts.open;
  const criticalCount = counts.critical;

  // [Spec: domains/som/spec.md#Page 3 Layout — Summary Strip]
  const summary: { label: string; value: string; valueClass: string }[] = [
    { label: "Total exceptions", value: String(somExceptions.length), valueClass: "text-foreground" },
    { label: "Open / Under Review", value: String(openCount), valueClass: "text-warning-text" },
    { label: "Critical", value: String(criticalCount), valueClass: "text-destructive" },
    { label: "Total flagged $", value: formatCurrency(totalFlagged), valueClass: "text-destructive" },
  ];

  return (
    <main className="@container/main flex flex-1 flex-col">
      {/* Header — [Spec: domains/som/spec.md#Page 3 Layout] */}
      <div className="px-4 pt-6 pb-4 lg:px-6">
        <div className="mb-1.5 flex items-center gap-2">
          <ShieldAlert className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Drug Distributor · SOM
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Exceptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {somExceptions.length} suspicious-order exceptions across{" "}
          {new Set(somExceptions.map((e) => e.vendor)).size} pharmacies
        </p>
      </div>

      {/* Summary strip — shadcn Card, 4 panels with divide-x */}
      <div className="px-4 py-4 lg:px-6">
        <Card className="py-0">
          <div className="flex flex-col divide-y divide-border @2xl/main:flex-row @2xl/main:divide-x @2xl/main:divide-y-0">
            {summary.map((s) => (
              <div key={s.label} className="flex-1 px-5 py-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${s.valueClass}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Filter chips — shadcn ToggleGroup, single-select. Base UI's
          ToggleGroup is single-select by default (multiple={false}) and
          models value as an array; an empty selection re-selects "all". */}
      <div className="px-4 pb-3 lg:px-6">
        <ToggleGroup
          value={[filter]}
          onValueChange={(v) => {
            const next = v.find((k) => k !== filter) ?? v[0];
            setFilter((next as FilterKey) ?? "all");
          }}
          variant="outline"
          size="sm"
          className="flex-wrap"
          aria-label="Filter exceptions"
        >
          {filterChips.map((f) => (
            <ToggleGroupItem
              key={f.key}
              value={f.key}
              disabled={f.count === 0 && f.key !== "all"}
              className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              {f.label}
              <Badge variant="secondary" className="ml-1">
                {f.count}
              </Badge>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Table */}
      <div className="px-4 pb-6 lg:px-6">
        <Card className="py-0">
          <CardHeader className="border-b py-3.5">
            <CardTitle>
              <h2 className="font-[inherit] text-sm font-semibold">
                Suspicious-order exceptions
              </h2>
            </CardTitle>
            <CardAction className="text-sm text-muted-foreground">
              {sorted.length} shown
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exception</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Pharmacy</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead className="text-right" aria-sort={ariaSortFor("flaggedAmount")}>
                    <button
                      type="button"
                      onClick={() => handleSort("flaggedAmount")}
                      className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      Flagged
                      <ArrowUpDown
                        className={`size-3 ${sortKey === "flaggedAmount" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
                  </TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead aria-sort={ariaSortFor("detectedAt")}>
                    <button
                      type="button"
                      onClick={() => handleSort("detectedAt")}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      Detected
                      <ArrowUpDown
                        className={`size-3 ${sortKey === "detectedAt" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Review</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        No exceptions match this filter.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((ex) => (
                    <TableRow key={ex.id} className="group">
                      <TableCell className="font-mono text-xs text-foreground">
                        {ex.id}
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={ex.type} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {ex.vendor}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {ex.invoiceNumber}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium tabular-nums ${flaggedColorClass(ex.severity)}`}
                      >
                        {formatCurrency(ex.flaggedAmount)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${severityDotClass(ex.severity)}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {ex.severity.charAt(0).toUpperCase() + ex.severity.slice(1)}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ex.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(ex.detectedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* [Spec: rules/ui-standard.md#Touch Targets] — padding+negative-margin
                            extends hit area to ≥44×44px without changing visible row height */}
                        <Link
                          href={`/exceptions/${ex.id}`}
                          className="inline-flex items-center -my-3 -mx-2 px-2 py-3 text-xs font-medium text-muted-foreground no-underline transition-colors hover:text-primary hover:underline group-hover:text-primary"
                        >
                          Review →
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
