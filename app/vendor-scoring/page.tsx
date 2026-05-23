// [Spec: domains/vendor-scoring/spec.md v2.0.1] — Vendor risk scorecard table,
// migrated to the shadcn v2.0 design system. Card/Table/Badge/Button/AlertDialog
// primitives, theme tokens only, AA-safe status text (text-warning-text /
// text-success-text), aria-sort on sortable headers. See spec CHANGELOG 2026-05-22.
"use client";

import { Fragment, useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Flag, XCircle, ArrowUpDown } from "lucide-react";
import { vendorScores, formatCurrency, formatDate } from "@/lib/data";
import { useToast } from "@/components/Toast";
import { VendorBadge } from "@/components/VendorBadge";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// ─── COLOR DISCIPLINE ─────────────────────────────────────────────────────────
// [Spec: domains/vendor-scoring/spec.md#Business Rules]
// Status TEXT uses the AA-safe *-text tokens (ui-standard.md v2.0.1).

function scoreColor(score: number): string {
  if (score < 30) return "text-destructive-text";
  if (score < 60) return "text-warning-text";
  return "text-success-text";
}

function discrepancyColor(pct: number): string {
  if (pct > 15) return "text-destructive-text";
  if (pct > 5) return "text-warning-text";
  return "text-muted-foreground";
}

function recoveryColor(pct: number): string {
  if (pct >= 80) return "text-success-text";
  if (pct >= 40) return "text-warning-text";
  return "text-destructive-text";
}

// Row tint by discrepancy — non-text fill, paired with the colored % column.
function rowRiskClass(discrepancyPct: number): string {
  if (discrepancyPct > 15) return "bg-destructive/5";
  if (discrepancyPct > 5) return "bg-warning/5";
  return "";
}

function ratingBadge(rating: string) {
  if (rating === "Critical") return <Badge variant="destructive">{rating}</Badge>;
  if (rating === "High Risk")
    return (
      <Badge className="border-warning bg-warning/10 text-warning-text">
        {rating}
      </Badge>
    );
  if (rating === "Medium Risk") return <Badge variant="secondary">{rating}</Badge>;
  return (
    <Badge className="border-success bg-success/10 text-success-text">
      {rating}
    </Badge>
  );
}

type VendorSortKey =
  | "score"
  | "discrepancyPct"
  | "discrepancyAmount"
  | "totalSpend"
  | "recoveryPct";

// ─── SORTABLE HEADER ──────────────────────────────────────────────────────────
// Module-level component — exposes aria-sort so assistive tech announces sort
// state (WCAG 4.1.2). Mirrors the SortHead idiom in app/page.tsx.
// [Spec: domains/vendor-scoring/spec.md#Acceptance Criteria — aria-sort]
function SortHead({
  label,
  sortKey,
  activeKey,
  activeDir,
  onSort,
}: {
  label: string;
  sortKey: VendorSortKey;
  activeKey: VendorSortKey;
  activeDir: "asc" | "desc";
  onSort: (key: VendorSortKey) => void;
}) {
  const ariaSort: "ascending" | "descending" | "none" =
    activeKey !== sortKey
      ? "none"
      : activeDir === "asc"
        ? "ascending"
        : "descending";
  return (
    <TableHead aria-sort={ariaSort} className="text-right">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex flex-row-reverse items-center gap-1 transition-colors hover:text-foreground"
      >
        {label}
        <ArrowUpDown
          className={`size-3 ${
            activeKey === sortKey ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </button>
    </TableHead>
  );
}

type PendingAction = {
  vendorId: string;
  vendorName: string;
  action: "Flagged" | "Penalized" | "Removed";
} | null;

export default function VendorScoringPage() {
  const { showToast } = useToast();
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [flaggedVendors, setFlaggedVendors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Sort state — default Discrepancy % descending.
  // [Spec: domains/vendor-scoring/spec.md#Business Rules — Sorting]
  const [sortKey, setSortKey] = useState<VendorSortKey>("discrepancyPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // [Spec: domains/vendor-scoring/spec.md#Acceptance Criteria — Loading]
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const sorted = useMemo(
    () =>
      [...vendorScores].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        return sortDir === "desc" ? bVal - aVal : aVal - bVal;
      }),
    [sortKey, sortDir]
  );

  const pageCount = Math.ceil(sorted.length / pageSize);
  const paginatedVendors = sorted.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const totalDiscrepancy = sorted.reduce((s, v) => s + v.discrepancyAmount, 0);
  const highRiskCount = sorted.filter((v) => v.score < 40).length;
  const avgScore = Math.round(
    sorted.reduce((s, v) => s + v.score, 0) / sorted.length
  );
  const avgRecovery = Math.round(
    sorted.reduce((s, v) => s + v.recoveryPct, 0) / sorted.length
  );

  function handleSortClick(key: VendorSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPageIndex(0);
  }

  // [Spec: domains/vendor-scoring/spec.md#Business Rules — Vendor Actions]
  function confirmPendingAction() {
    if (!pendingAction) return;
    const { vendorId, vendorName, action } = pendingAction;
    setFlaggedVendors((prev) => ({ ...prev, [vendorId]: action }));
    if (action === "Flagged") {
      showToast(`${vendorName} flagged as high-risk`, "warning");
    } else if (action === "Penalized") {
      showToast(`${vendorName} recommended for penalty`, "error");
    } else {
      showToast(`${vendorName} removed from approved suppliers`, "error");
    }
    setPendingAction(null);
  }

  const actionCopy: Record<
    NonNullable<PendingAction>["action"],
    { title: string; description: string; cta: string; destructive: boolean }
  > = {
    Flagged: {
      title: "Flag vendor as high-risk?",
      description:
        "This marks the vendor for procurement review. The action is recorded in the audit trail.",
      cta: "Flag Vendor",
      destructive: false,
    },
    Penalized: {
      title: "Recommend a penalty?",
      description:
        "This recommends a contractual penalty for the vendor. A manager must approve before any penalty is applied.",
      cta: "Recommend Penalty",
      destructive: true,
    },
    Removed: {
      title: "Remove vendor as supplier?",
      description:
        "This removes the vendor from the approved supplier list. The action is recorded in the audit trail.",
      cta: "Remove Vendor",
      destructive: true,
    },
  };

  return (
    <main className="@container/main flex flex-1 flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              Vendor Scoring
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Risk assessment across {sorted.length} vendors · Q1 2026
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              showToast("Vendor risk report exported as PDF", "success")
            }
          >
            Export Report
          </Button>
        </div>
      </div>

      <hr className="border-border" />

      {/* Summary strip */}
      <section aria-labelledby="summary-heading" className="px-4 py-6 lg:px-6">
        <h2 id="summary-heading" className="sr-only">
          Vendor scoring summary
        </h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Card className="py-0">
            <div className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
              <div className="flex-1 px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vendors Scored
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {sorted.length}
                </p>
              </div>
              <div className="flex-1 px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  High Risk
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive-text">
                  {highRiskCount}
                </p>
              </div>
              <div className="flex-1 px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Discrepancy
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-warning-text">
                  {formatCurrency(totalDiscrepancy)}
                </p>
              </div>
              <div className="flex-1 px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Avg Score
                </p>
                <p
                  className={`mt-1 text-2xl font-semibold tabular-nums ${scoreColor(avgScore)}`}
                >
                  {avgScore}/100
                </p>
              </div>
              <div className="flex-1 px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Avg Recovery
                </p>
                <p
                  className={`mt-1 text-2xl font-semibold tabular-nums ${recoveryColor(avgRecovery)}`}
                >
                  {avgRecovery}%
                </p>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Vendor table */}
      <section aria-labelledby="table-heading" className="px-4 pb-8 lg:px-6">
        <h2 id="table-heading" className="sr-only">
          Vendor risk table
        </h2>
        <Card className="py-0">
          <CardContent className="px-0">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-7" />
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <SortHead
                    label="Total Spend"
                    sortKey="totalSpend"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={handleSortClick}
                  />
                  <SortHead
                    label="Discrepancy"
                    sortKey="discrepancyAmount"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={handleSortClick}
                  />
                  <SortHead
                    label="Discrepancy %"
                    sortKey="discrepancyPct"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={handleSortClick}
                  />
                  <SortHead
                    label="Recovery %"
                    sortKey="recoveryPct"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={handleSortClick}
                  />
                  <SortHead
                    label="Score"
                    sortKey="score"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={handleSortClick}
                  />
                  <TableHead>Rating</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="mx-auto size-3.5" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-3.5 w-40" />
                      </TableCell>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j} className="text-right">
                          <Skeleton className="ml-auto h-3.5 w-12" />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-3.5 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  paginatedVendors.map((vendor) => {
                    const isExpanded = expandedVendor === vendor.id;
                    const flagAction = flaggedVendors[vendor.id];
                    return (
                      <Fragment key={vendor.id}>
                        <TableRow
                          className={`cursor-pointer ${rowRiskClass(vendor.discrepancyPct)}`}
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setExpandedVendor(isExpanded ? null : vendor.id)
                          }
                        >
                          <TableCell className="text-center">
                            {isExpanded ? (
                              <ChevronDown className="inline size-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="inline size-3.5 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-2">
                              <VendorBadge name={vendor.name} size="sm" />
                              {flagAction && (
                                <Badge variant="destructive">{flagAction}</Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {vendor.totalInvoices}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {formatCurrency(vendor.totalSpend)}
                          </TableCell>
                          <TableCell
                            className={`text-right text-xs font-medium tabular-nums ${discrepancyColor(vendor.discrepancyPct)}`}
                          >
                            {formatCurrency(vendor.discrepancyAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`text-xs font-semibold tabular-nums ${discrepancyColor(vendor.discrepancyPct)}`}
                            >
                              {vendor.discrepancyPct.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`text-xs font-semibold tabular-nums ${recoveryColor(vendor.recoveryPct)}`}
                            >
                              {vendor.recoveryPct}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`text-sm font-bold tabular-nums ${scoreColor(vendor.score)}`}
                            >
                              {vendor.score}
                            </span>
                          </TableCell>
                          <TableCell>{ratingBadge(vendor.rating)}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {!flagAction ? (
                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Flag ${vendor.name} as high-risk`}
                                  title="Flag as high-risk"
                                  onClick={() =>
                                    setPendingAction({
                                      vendorId: vendor.id,
                                      vendorName: vendor.name,
                                      action: "Flagged",
                                    })
                                  }
                                >
                                  <Flag />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Recommend penalty for ${vendor.name}`}
                                  title="Recommend for penalty"
                                  onClick={() =>
                                    setPendingAction({
                                      vendorId: vendor.id,
                                      vendorName: vendor.name,
                                      action: "Penalized",
                                    })
                                  }
                                >
                                  <AlertTriangle />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Remove ${vendor.name} as supplier`}
                                  title="Remove as supplier"
                                  onClick={() =>
                                    setPendingAction({
                                      vendorId: vendor.id,
                                      vendorName: vendor.name,
                                      action: "Removed",
                                    })
                                  }
                                >
                                  <XCircle />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Done
                              </span>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expanded exception history */}
                        {isExpanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell
                              colSpan={10}
                              className="whitespace-normal bg-muted/30 px-8 py-4"
                            >
                              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Exception History
                              </h3>
                              <div className="flex flex-col gap-2">
                                {vendor.exceptions.map((ex) => (
                                  <Card
                                    key={ex.id}
                                    size="sm"
                                    className="flex-row items-start gap-4 px-4 py-3"
                                  >
                                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                                      {ex.id}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                                        <Badge variant="secondary">
                                          {ex.type}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDate(ex.date)}
                                        </span>
                                      </div>
                                      <p className="m-0 text-xs leading-relaxed text-muted-foreground">
                                        {ex.description}
                                      </p>
                                    </div>
                                    <span className="shrink-0 text-xs font-medium tabular-nums text-destructive-text">
                                      {formatCurrency(ex.amount)}
                                    </span>
                                  </Card>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <DataTablePagination
              pageIndex={pageIndex}
              pageCount={pageCount}
              pageSize={pageSize}
              totalRows={sorted.length}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPageIndex(0);
              }}
            />
          </CardContent>
        </Card>
      </section>

      {/* Vendor action confirmation — shadcn AlertDialog (replaces browser confirm) */}
      {/* [Spec: domains/vendor-scoring/spec.md#Business Rules — Vendor Actions] */}
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          {pendingAction && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {actionCopy[pendingAction.action].title}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingAction.vendorName} —{" "}
                  {actionCopy[pendingAction.action].description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant={
                    actionCopy[pendingAction.action].destructive
                      ? "destructive"
                      : "default"
                  }
                  onClick={confirmPendingAction}
                >
                  {actionCopy[pendingAction.action].cta}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
