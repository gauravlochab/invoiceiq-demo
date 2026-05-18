// [Spec: domains/dashboard/spec.md v2.1] — triage-first inbox for AP analyst
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  FileDown,
  FileText,
} from "lucide-react";

import {
  allExceptions,
  recoveryQueue,
  formatCurrency,
  typeConfig,
  type Exception,
  type Severity,
} from "@/lib/data";

import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { VendorBadge } from "@/components/VendorBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { useToast } from "@/components/Toast";

// ─── Color discipline helpers (per spec v2.1) ────────────────────────────
// Color = action required. Counts, totals, currencies stay neutral unless
// they're a problem.

function flaggedAmountClass(severity: Severity): string {
  // [Spec: dashboard.md#Acceptance Criteria — Color discipline]
  if (severity === "critical" || severity === "high") return "text-destructive";
  if (severity === "medium") return "text-warning";
  return "text-foreground";
}

function severityDotClass(severity: Severity): string {
  // [Spec: dashboard.md#Triage list] — colored only if critical/high
  if (severity === "critical") return "bg-destructive";
  if (severity === "high") return "bg-destructive/60";
  if (severity === "medium") return "bg-warning";
  return "bg-border";
}

const AMOUNT_AT_RISK_THRESHOLD = 1_000_000;

export default function DashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // ─── Computed values ─────────────────────────────────────────────
  const {
    topSix,
    openCount,
    criticalCount,
    totalOpen,
    amountAtRisk,
    recoveredAmount,
    slaOverdueCount,
  } = useMemo(() => {
    const apExceptions = allExceptions.filter((e) => !e.type.startsWith("som_"));

    const openExceptions = apExceptions.filter(
      (e) => e.status === "open" || e.status === "under_review" || e.status === "escalated"
    );

    const severityOrder: Record<Severity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const sortedOpen = [...openExceptions].sort((a, b) => {
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return b.flaggedAmount - a.flaggedAmount;
    });

    const now = Date.now();

    return {
      topSix: sortedOpen.slice(0, 6),
      openCount: openExceptions.length,
      criticalCount: openExceptions.filter((e) => e.severity === "critical").length,
      totalOpen: openExceptions.length,
      amountAtRisk: openExceptions.reduce((s, e) => s + e.flaggedAmount, 0),
      recoveredAmount: recoveryQueue
        .filter((r) => r.status === "recovered")
        .reduce((s, r) => s + (r.recoveredAmount ?? 0), 0),
      slaOverdueCount: recoveryQueue.filter((r) => {
        if (r.status === "recovered" || r.status === "closed") return false;
        if (!r.slaDeadline) return false;
        return new Date(r.slaDeadline).getTime() < now;
      }).length,
    };
  }, []);

  function handleRunScan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      showToast("Scan complete — 2 new exceptions identified", "success");
    }, 2000);
  }

  function handleExport(format: "csv" | "pdf") {
    showToast(`Export started — generating ${format.toUpperCase()}…`, "info");
  }

  return (
    <main className="@container/main flex flex-1 flex-col">
      {/* Header strip */}
      <div className="flex items-start justify-between gap-4 px-4 lg:px-6 pt-6 pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          {loading ? (
            <Skeleton className="mt-2 h-4 w-72" />
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {openCount} open · {criticalCount} critical · Q1 2026
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleRunScan} disabled={scanning}>
              <Sparkles className="size-4" />
              {scanning ? "Scanning…" : "Run Scan"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              <FileDown className="size-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              <FileText className="size-4" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* HERO — triage list */}
      <div className="px-4 lg:px-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Top {Math.min(6, topSix.length)} exceptions</CardTitle>
            {!loading && totalOpen > 6 && (
              <CardAction>
                <Button
                  variant="link"
                  size="sm"
                  render={<Link href="/exceptions">View all {totalOpen} →</Link>}
                />
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-4">
                    <Skeleton className="size-2 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48 ml-2" />
                    <Skeleton className="ml-auto h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : topSix.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Inbox zero — no open exceptions.
              </div>
            ) : (
              <ul className="m-0 list-none divide-y divide-border p-0">
                {topSix.map((ex) => (
                  <TriageRow key={ex.id} ex={ex} />
                ))}
              </ul>
            )}
          </CardContent>
          {!loading && totalOpen > 6 && (
            <CardFooter className="justify-center text-xs text-muted-foreground">
              Showing {topSix.length} of {totalOpen} open exceptions ·{" "}
              <Link href="/exceptions" className="ml-1 text-primary hover:underline">
                View all →
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Secondary metrics strip — compact, no Card decoration */}
      <div className="px-4 lg:px-6 pb-6">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex divide-x divide-border overflow-hidden rounded-lg border bg-card">
            <StatCell
              label="Open Exceptions"
              value={String(openCount)}
              href="/exceptions"
              tone="neutral"
            />
            <StatCell
              label="Amount at Risk"
              value={formatCurrency(amountAtRisk)}
              href="/exceptions"
              tone={amountAtRisk > AMOUNT_AT_RISK_THRESHOLD ? "destructive" : "neutral"}
            />
            <StatCell
              label="Recovered (Q1)"
              value={formatCurrency(recoveredAmount)}
              href="/recovery"
              tone="success"
            />
            <StatCell
              label="SLA Overdue"
              value={String(slaOverdueCount)}
              href="/recovery"
              tone={slaOverdueCount > 0 ? "destructive" : "neutral"}
            />
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Triage row ──────────────────────────────────────────────────────────

function TriageRow({ ex }: { ex: Exception }) {
  const typeLabel = typeConfig[ex.type]?.label ?? ex.type;

  return (
    <li className="p-0">
      <Link
        href={`/exceptions/${ex.id}`}
        className="group flex items-center gap-4 px-6 py-4 no-underline transition-colors hover:bg-accent"
      >
        {/* Severity dot — colored only when actionable */}
        <span
          className={`size-2 shrink-0 rounded-full ${severityDotClass(ex.severity)}`}
          aria-label={`Severity ${ex.severity}`}
        />

        {/* Vendor + invoice number */}
        <div className="min-w-0 flex-shrink-0">
          <VendorBadge name={ex.vendor} size="sm" />
          <div className="mt-0.5 font-mono text-xs text-muted-foreground">
            {ex.invoiceNumber}
          </div>
        </div>

        {/* Type + category */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm text-foreground">{typeLabel}</span>
          {ex.category && <CategoryBadge category={ex.category} />}
        </div>

        {/* Flagged amount — color per discipline rule */}
        <div className={`shrink-0 text-base font-semibold tabular-nums ${flaggedAmountClass(ex.severity)}`}>
          {formatCurrency(ex.flaggedAmount)}
        </div>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground" />
      </Link>
    </li>
  );
}

// ─── Secondary stat cell ────────────────────────────────────────────────

function StatCell({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: string;
  href: string;
  tone: "neutral" | "destructive" | "warning" | "success";
}) {
  const toneClass =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
      ? "text-warning"
      : tone === "success"
      ? "text-success"
      : "text-foreground";

  return (
    <Link
      href={href}
      className="group flex flex-1 flex-col gap-1 px-4 py-3 no-underline transition-colors hover:bg-accent/50"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={`text-lg font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </Link>
  );
}
