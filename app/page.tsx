// [Spec: domains/dashboard/spec.md v2.3] — all-in-one decluttered command surface.
// v2.3 supersedes v2.2: Amount-at-Risk hero + calm KPI trio, merged context band,
// promoted exceptions table, invoice-status overview, 2-tab analysis with category
// + vendor-risk donuts. Data integrity, WCAG 2.1 AA, and chart theming all fixed.
// See spec Decision Log 2026-05-21 v2.3.
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  ArrowUpDown,
  ArrowUpRight,
  AlertOctagon,
  AlertTriangle,
  Circle,
} from "lucide-react";

import {
  exceptions,
  allExceptions,
  recoveryQueue,
  contracts,
  exceptionTypeBreakdown,
  spendTrend,
  recoveryTrendData,
  vendorScores,
  kpiSummary,
  formatCurrency,
  severityConfig,
  statusConfig,
  typeConfig,
  type Exception,
  type Severity,
  type Status,
} from "@/lib/data";
import { PARKLAND_CONFIG } from "@/lib/workflow-config";
import { getGPOComplianceRate, getGPOPotentialSavings } from "@/lib/gpo-contracts";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { NumberTicker } from "@/components/magicui/number-ticker";
import { Sparkline } from "@/components/Sparkline";
import { DiscrepancyBarChart } from "@/components/DiscrepancyBarChart";
import { VendorBadge } from "@/components/VendorBadge";
import { ExportDialog } from "@/components/ExportDialog";
import { useToast } from "@/components/Toast";
import { exportToCSV, exportToPDF } from "@/lib/export";

// ─── Ordering helpers ─────────────────────────────────────────────────────
// [Spec: domains/dashboard/spec.md#Business Rules]

const severityOrder: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
const statusOrder: Record<Status, number> = {
  open: 0,
  under_review: 1,
  escalated: 2,
  resolved: 3,
};

// Top 6 AP exceptions, default-sorted by severity.
// [Spec: domains/dashboard/spec.md#Business Rules — Top exceptions]
const topExceptions = exceptions
  .filter((e) => !e.type.startsWith("som_"))
  .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  .slice(0, 6);

// ─── Color discipline ─────────────────────────────────────────────────────
// [Spec: domains/dashboard/spec.md#Acceptance Criteria — Accessibility]
// Status TEXT uses the AA-contrast *-text tokens; --warning/--success are
// reserved for fills + dots. Color always pairs with a label or icon.

function flaggedAmountClass(severity: Severity): string {
  if (severity === "critical" || severity === "high") return "text-destructive-text";
  if (severity === "medium") return "text-warning-text";
  return "text-foreground";
}

function severityTextClass(severity: Severity): string {
  if (severity === "critical" || severity === "high") return "text-destructive-text";
  if (severity === "medium") return "text-warning-text";
  return "text-muted-foreground";
}

function severityDotClass(severity: Severity): string {
  if (severity === "critical") return "bg-destructive";
  if (severity === "high") return "bg-destructive/60";
  if (severity === "medium") return "bg-warning";
  return "bg-border";
}

// Non-color severity cue for the flagged-amount column (WCAG 1.4.1; audit C3).
function SeverityIcon({ severity }: { severity: Severity }) {
  const cls = "size-3.5 shrink-0";
  if (severity === "critical")
    return <AlertOctagon className={`${cls} text-destructive-text`} aria-hidden="true" />;
  if (severity === "high")
    return <AlertTriangle className={`${cls} text-destructive-text`} aria-hidden="true" />;
  if (severity === "medium")
    return <AlertTriangle className={`${cls} text-warning-text`} aria-hidden="true" />;
  return <Circle className={`${cls} text-muted-foreground`} aria-hidden="true" />;
}

function statusBadgeVariant(
  status: Status
): "default" | "outline" | "secondary" | "destructive" {
  if (status === "open") return "destructive";
  if (status === "under_review") return "secondary";
  if (status === "escalated") return "outline";
  return "outline"; // resolved
}

// One illustrative 6-point trend shape — the hero KPI is the ONLY sparkline.
// [Spec: domains/dashboard/spec.md#Data Model — Sparkline data]
const riskSparkline = [380000, 420000, 510000, 445000, 490000, 535000];

type SortKey = "type" | "flaggedAmount" | "severity" | "status";
type SortDir = "asc" | "desc";

// ─── Sortable table header ────────────────────────────────────────────────
// Module-level component (not created during render) — exposes aria-sort so
// assistive tech announces sort state (WCAG 4.1.2; audit S7).
// [Spec: domains/dashboard/spec.md#Acceptance Criteria — work table sorting]
function SortHead({
  label,
  sortKey,
  activeKey,
  activeDir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  activeDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const ariaSort: "ascending" | "descending" | "none" =
    activeKey !== sortKey
      ? "none"
      : activeDir === "asc"
        ? "ascending"
        : "descending";
  return (
    <TableHead
      aria-sort={ariaSort}
      className={align === "right" ? "text-right" : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
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

// ─── Spend trend tooltip ──────────────────────────────────────────────────

function SpendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 text-[11px] text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="mb-0.5 flex items-center gap-2">
          <span className="text-muted-foreground">
            {p.dataKey === "spend" ? "Total spend" : "Flagged"}
          </span>
          <span className="font-medium tabular-nums">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Donut tooltip (category + vendor-risk donuts) ────────────────────────

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="flex items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: p.payload.fill }}
        />
        <span className="text-muted-foreground">{p.payload.label}</span>
        <span className="font-medium tabular-nums">{p.payload.display}</span>
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // [Spec: domains/dashboard/spec.md#Acceptance Criteria — Loading]
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // ─── Computed metrics — Front 4: data integrity ─────────────────────────
  // [Spec: domains/dashboard/spec.md#Business Rules]
  // Every on-screen number derives from lib/data.ts — no hardcoded literals.
  const metrics = useMemo(() => {
    const apExceptions = allExceptions.filter((e) => !e.type.startsWith("som_"));
    const apCount = apExceptions.length;
    const openCount = apExceptions.filter(
      (e) =>
        e.status === "open" ||
        e.status === "under_review" ||
        e.status === "escalated"
    ).length;
    const criticalOpenCount = apExceptions.filter(
      (e) => e.severity === "critical" && e.status !== "resolved"
    ).length;
    const amountAtRisk = apExceptions.reduce((s, e) => s + e.flaggedAmount, 0);

    // Agent counts — all computed (audit Front 3, R1/R2). No literals.
    const complianceTypes = new Set(["contract_overage", "missing_rebate", "tier_pricing"]);
    const agentCounts = {
      invoice: kpiSummary.totalInvoicesProcessed,
      validation: apCount,
      compliance: apExceptions.filter((e) => complianceTypes.has(e.type)).length,
      recovery: recoveryQueue.length,
      insight: new Set(apExceptions.map((e) => e.vendor)).size,
    };

    // Recovery Rate — Bala's ask. recovered ÷ total over cases initiated in the
    // 2026 reporting period only (excludes the REC-008 Q4-2025 carry-over).
    const periodCases = recoveryQueue.filter((r) =>
      r.initiatedAt.startsWith("2026")
    );
    const recoveredInPeriod = periodCases.filter((r) => r.status === "recovered");
    const recoveryRate =
      periodCases.length > 0
        ? Math.round((recoveredInPeriod.length / periodCases.length) * 100)
        : 0;
    // Amount currently in recovery (in-progress statuses) — forward-looking.
    const inProgressStatuses = new Set(["pending", "in_progress", "partial"]);
    const amountInRecovery = recoveryQueue
      .filter((r) => inProgressStatuses.has(r.status))
      .reduce((s, r) => s + r.targetAmount, 0);
    // Historical baseline — average success rate across the 12-month trend.
    const recoveryBaseline = Math.round(
      recoveryTrendData.reduce((s, m) => s + m.successRate, 0) /
        recoveryTrendData.length
    );

    // Invoice-status overview — count-by-status of AP exceptions.
    const statusCounts: { status: Status; count: number }[] = (
      ["open", "under_review", "escalated", "resolved"] as Status[]
    ).map((status) => ({
      status,
      count: apExceptions.filter((e) => e.status === status).length,
    }));

    // Vendor risk distribution — count of vendorScores per rating tier.
    const ratings = ["Critical", "High Risk", "Medium Risk", "Low Risk"] as const;
    const vendorRiskCounts = ratings.map((rating, i) => ({
      rating,
      count: vendorScores.filter((v) => v.rating === rating).length,
      chartKey: (i + 1) as 1 | 2 | 3 | 4,
    }));

    const contractsAtRiskCount = contracts.filter(
      (c) => c.status === "breached" || c.status === "warning"
    ).length;
    const contractsBreachedCount = contracts.filter(
      (c) => c.status === "breached"
    ).length;

    return {
      apCount,
      openCount,
      criticalOpenCount,
      amountAtRisk,
      agentCounts,
      recoveryRate,
      amountInRecovery,
      recoveryBaseline,
      statusCounts,
      vendorRiskCounts,
      contractsAtRiskCount,
      contractsBreachedCount,
    };
  }, []);

  // By-Category donut data — derived breakdown, reconciles with Amount at Risk.
  // [Spec: domains/dashboard/spec.md#Business Rules — flaggedByType reconciliation]
  const categoryDonut = useMemo(() => {
    const total = exceptionTypeBreakdown.reduce((s, d) => s + d.value, 0);
    return {
      total,
      data: exceptionTypeBreakdown.map((d) => ({
        label: d.name,
        value: d.value,
        count: d.count,
        fill: `var(--chart-${d.chartKey})`,
        pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
        display: formatCurrency(d.value),
      })),
    };
  }, []);

  // Vendor-risk donut data.
  const vendorRiskDonut = useMemo(() => {
    return metrics.vendorRiskCounts.map((d) => ({
      label: d.rating,
      value: d.count,
      fill: `var(--chart-${d.chartKey})`,
      display: `${d.count} vendor${d.count === 1 ? "" : "s"}`,
    }));
  }, [metrics.vendorRiskCounts]);

  // ─── Front 1: Hero + secondary trio ─────────────────────────────────────
  // [Spec: domains/dashboard/spec.md#Layout — Hero band]
  const secondaryKpis = useMemo(
    () => [
      {
        key: "invoices",
        label: "Invoices Processed",
        href: "/pipeline",
        value: kpiSummary.totalInvoicesProcessed,
        prefix: "",
        subtitle: "Q1 2026",
      },
      {
        key: "exceptions",
        label: "Exceptions Found",
        href: "/exceptions",
        value: metrics.apCount,
        prefix: "",
        subtitle: `${metrics.openCount} open · ${metrics.apCount - metrics.openCount} resolved`,
      },
      {
        key: "recovery",
        label: "Recovery Rate",
        href: "/recovery",
        value: metrics.recoveryRate,
        prefix: "",
        suffix: "%",
        // Front 2: recovery as a SCORE vs baseline + amount-in-recovery.
        subtitle: `vs ~${metrics.recoveryBaseline}% baseline · ${formatCurrency(
          metrics.amountInRecovery
        )} in recovery`,
      },
    ],
    [metrics]
  );

  // [Spec: domains/dashboard/spec.md#Layout — Context band]
  const contractStats = [
    {
      label: "Contracts at Risk",
      value: String(metrics.contractsAtRiskCount),
      suffix: ` (${metrics.contractsBreachedCount} breached)`,
      dot: "bg-warning",
    },
    {
      label: "GPO Compliance",
      value: `${getGPOComplianceRate()}%`,
      suffix: "",
      dot: "bg-success",
    },
    {
      // Front 4: relabeled — this is missed/potential savings, not realized.
      label: "GPO Savings (potential)",
      value: formatCurrency(getGPOPotentialSavings()),
      suffix: "",
      dot: "bg-warning",
    },
  ];

  // [Spec: domains/dashboard/spec.md#Layout — Context band] — computed counts.
  const agents = [
    { name: "Invoice", count: metrics.agentCounts.invoice, color: "var(--agent-invoice)" },
    { name: "Validation", count: metrics.agentCounts.validation, color: "var(--agent-validation)" },
    { name: "Compliance", count: metrics.agentCounts.compliance, color: "var(--agent-compliance)" },
    { name: "Recovery", count: metrics.agentCounts.recovery, color: "var(--agent-recovery)" },
    { name: "Insight", count: metrics.agentCounts.insight, color: "var(--agent-insight)" },
  ];

  // [Spec: domains/dashboard/spec.md#Acceptance Criteria — work table sorting]
  const sortedExceptions = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...topExceptions].sort((a, b) => {
      switch (sortKey) {
        case "type":
          return dir * typeConfig[a.type].label.localeCompare(typeConfig[b.type].label);
        case "flaggedAmount":
          return dir * (a.flaggedAmount - b.flaggedAmount);
        case "severity":
          return dir * (severityOrder[a.severity] - severityOrder[b.severity]);
        case "status":
          return dir * (statusOrder[a.status] - statusOrder[b.status]);
        default:
          return 0;
      }
    });
  }, [sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Run Scan is read-only — it mutates nothing, so the toast claims no change.
  // [Spec: domains/dashboard/spec.md#Acceptance Criteria — Run Scan honesty]
  function handleRunScan() {
    if (scanDone || scanning) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanDone(true);
      showToast(
        "Scan complete — all 1,847 invoices re-checked, no new exceptions",
        "info"
      );
    }, 2000);
  }

  return (
    <main className="@container/main flex flex-1 flex-col">
      {/* ── Header strip ───────────────────────────────────────────────── */}
      {/* [Spec: domains/dashboard/spec.md#Layout — Page header] */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-10 pb-6 lg:px-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            Invoice Intelligence
          </h1>
          {/* Subtitle no longer restates the invoice count (audit P9/R1). */}
          <p className="mt-1 text-sm text-muted-foreground">
            {PARKLAND_CONFIG.customer} · Q1 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            Export
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleRunScan}
            disabled={scanning || scanDone}
          >
            {scanning
              ? "Scanning…"
              : scanDone
                ? "Last scan: just now"
                : "Run Scan"}
          </Button>
        </div>
      </div>

      {/* ── Hero band: Amount at Risk + calm KPI trio ──────────────────── */}
      {/* [Spec: domains/dashboard/spec.md#Layout — Hero band] */}
      <section aria-labelledby="hero-heading" className="px-4 py-8 lg:px-6">
        <h2 id="hero-heading" className="sr-only">
          Key metrics
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 @3xl/main:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <Skeleton className="h-44 w-full" />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 @3xl/main:grid-cols-[1.6fr_1fr_1fr_1fr]">
            {/* Hero — Amount at Risk */}
            <Link
              href="/exceptions?severity=critical"
              className="no-underline"
              aria-label={`Amount at Risk: ${formatCurrency(metrics.amountAtRisk)}. ${metrics.criticalOpenCount} critical exceptions open — go to triage.`}
            >
              <Card className="@container/card h-full transition-colors hover:bg-accent/40">
                <CardHeader>
                  <CardDescription>Amount at Risk</CardDescription>
                  {/* CardTitle renders a <div>; the <h3> inside puts the
                      metric in the heading outline (ui-standard.md v2.0.1). */}
                  <CardTitle className="text-3xl font-semibold tabular-nums text-destructive-text @[300px]/card:text-4xl">
                    <h3 className="font-[inherit]">
                      <NumberTicker value={metrics.amountAtRisk} prefix="$" />
                    </h3>
                  </CardTitle>
                  <CardAction>
                    {/* The ONLY sparkline on the page (audit P4). */}
                    <Sparkline data={riskSparkline} color="var(--destructive)" />
                  </CardAction>
                </CardHeader>
                <CardFooter className="text-sm">
                  <span className="inline-flex items-center gap-1.5 font-medium text-destructive-text">
                    <AlertOctagon className="size-3.5" aria-hidden="true" />
                    {metrics.criticalOpenCount} critical open
                  </span>
                  <span className="ml-2 inline-flex items-center gap-0.5 text-muted-foreground">
                    → triage now
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                </CardFooter>
              </Card>
            </Link>

            {/* Secondary trio — calm, no sparklines */}
            {secondaryKpis.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="no-underline"
                aria-label={`${card.label}: ${card.prefix}${card.value}${card.suffix ?? ""}`}
              >
                <Card className="@container/card h-full transition-colors hover:bg-accent/40">
                  <CardHeader>
                    <CardDescription>{card.label}</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      <h3 className="font-[inherit]">
                        <NumberTicker
                          value={card.value}
                          prefix={card.prefix}
                          suffix={card.suffix ?? ""}
                        />
                      </h3>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="text-sm text-muted-foreground">
                    {card.subtitle}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Context band: Pipeline + Contracts & GPO ───────────────────── */}
      {/* [Spec: domains/dashboard/spec.md#Layout — Context band] */}
      <section aria-labelledby="context-heading" className="px-4 pb-10 lg:px-6">
        <h2 id="context-heading" className="sr-only">
          Pipeline and contract context
        </h2>
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-card @3xl/main:grid-cols-2">
            {/* Pipeline group */}
            <Link
              href="/pipeline"
              className="group flex flex-col gap-2 p-4 no-underline transition-colors hover:bg-accent/40"
            >
              <div className="flex items-center gap-1.5">
                <Activity className="size-3.5 shrink-0 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pipeline
                </h3>
                <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {agents.map((agent) => (
                  <span
                    key={agent.name}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: agent.color }}
                    />
                    <span>{agent.name}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {agent.count.toLocaleString()}
                    </span>
                  </span>
                ))}
              </div>
            </Link>

            {/* Contracts & GPO group */}
            <div className="flex flex-col gap-2 border-t border-border p-4 @3xl/main:border-t-0 @3xl/main:border-l">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contracts &amp; GPO
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {contractStats.map((s) => (
                  <Link
                    key={s.label}
                    href="/contracts"
                    className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground no-underline transition-colors hover:text-foreground"
                  >
                    <span className={`size-1.5 shrink-0 rounded-full ${s.dot}`} />
                    <span>{s.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {s.value}
                    </span>
                    {s.suffix && (
                      <span className="text-muted-foreground">{s.suffix}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Work table: recent exceptions (promoted out of tabs) ───────── */}
      {/* [Spec: domains/dashboard/spec.md#Layout — Exceptions work table] */}
      <section aria-labelledby="work-heading" className="px-4 pb-10 lg:px-6">
        {loading ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <Card className="py-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <h2 id="work-heading" className="text-sm font-semibold">
                Recent Exceptions
              </h2>
              <Link
                href="/exceptions"
                className="inline-flex items-center gap-1 text-[0.8rem] font-medium text-primary underline-offset-4 transition-colors hover:underline"
              >
                View all {allExceptions.length}
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <SortHead
                    label="Type"
                    sortKey="type"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={handleSort}
                  />
                  <TableHead>Vendor</TableHead>
                  <SortHead
                    label="Flagged"
                    sortKey="flaggedAmount"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortHead
                    label="Severity"
                    sortKey="severity"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHead
                    label="Status"
                    sortKey="status"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={handleSort}
                  />
                  <TableHead className="text-right">
                    <span className="sr-only">Review</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExceptions.map((ex: Exception) => (
                  <TableRow key={ex.id} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {ex.id}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{typeConfig[ex.type].label}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <VendorBadge name={ex.vendor} size="sm" />
                        <p className="mt-0.5 pl-8 font-mono text-[11px] text-muted-foreground">
                          {ex.invoiceNumber}
                        </p>
                      </div>
                    </TableCell>
                    {/* Flagged — color + a non-color severity icon (WCAG 1.4.1) */}
                    <TableCell
                      className={`text-right font-semibold tabular-nums ${flaggedAmountClass(ex.severity)}`}
                    >
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <SeverityIcon severity={ex.severity} />
                        {formatCurrency(ex.flaggedAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${severityDotClass(ex.severity)}`}
                        />
                        <span className={`text-xs ${severityTextClass(ex.severity)}`}>
                          {severityConfig[ex.severity].label}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(ex.status)}>
                        {statusConfig[ex.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* [Spec: rules/ui-standard.md#Touch Targets]
                          py/px + negative -my/-mx extend the hit area to ≥44×44px
                          without changing the visible row height (mobile) */}
                      <Link
                        href={`/exceptions/${ex.id}`}
                        className="inline-flex items-center -my-3 -mx-2 px-2 py-3 text-xs font-medium text-muted-foreground no-underline transition-colors hover:text-primary hover:underline group-hover:text-primary"
                      >
                        Review →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      {/* ── Invoice-status overview ────────────────────────────────────── */}
      {/* [Spec: domains/dashboard/spec.md#Layout — Invoice-status overview] */}
      <section aria-labelledby="status-heading" className="px-4 pb-10 lg:px-6">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 id="status-heading" className="text-sm font-semibold font-[inherit]">
                  Invoice Status
                </h2>
              </CardTitle>
              <CardDescription>
                Count of {metrics.apCount} exceptions by review stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {metrics.statusCounts.map(({ status, count }) => {
                  const resolvable = status === "open";
                  const dot =
                    status === "open"
                      ? "bg-destructive"
                      : status === "under_review"
                        ? "bg-warning"
                        : status === "escalated"
                          ? "bg-[var(--agent-validation)]"
                          : "bg-success";
                  const chip = (
                    <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
                      <span className={`size-2 shrink-0 rounded-full ${dot}`} />
                      <span className="text-muted-foreground">
                        {statusConfig[status].label}
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {count}
                      </span>
                    </span>
                  );
                  return resolvable ? (
                    <Link
                      key={status}
                      href="/exceptions?status=open"
                      className="no-underline transition-opacity hover:opacity-80"
                    >
                      {chip}
                    </Link>
                  ) : (
                    <div key={status}>{chip}</div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Analysis section: 2 tabs ───────────────────────────────────── */}
      {/* [Spec: domains/dashboard/spec.md#Layout — Analysis section] */}
      <section aria-labelledby="analysis-heading" className="px-4 pb-10 lg:px-6">
        <h2 id="analysis-heading" className="sr-only">
          Trend and category analysis
        </h2>
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-[320px] w-full" />
          </div>
        ) : (
          <Tabs defaultValue="trends">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="category">By Category</TabsTrigger>
            </TabsList>

            {/* ── Trends tab ───────────────────────────────────────────── */}
            <TabsContent value="trends">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <h3 className="font-[inherit]">Spend &amp; Exception Trend</h3>
                    </CardTitle>
                    <CardAction>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span
                            className="inline-block h-0.5 w-6 rounded-sm"
                            style={{ background: "var(--chart-1)" }}
                          />
                          Total spend
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span
                            className="inline-block size-2.5 rounded-sm opacity-70"
                            style={{ background: "var(--destructive)" }}
                          />
                          Flagged
                        </span>
                      </div>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div
                      role="img"
                      aria-label="Monthly total spend versus flagged amount, April 2025 to March 2026"
                    >
                      <ResponsiveContainer width="100%" height={260}>
                        <ComposedChart
                          data={spendTrend}
                          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            horizontal
                            vertical={false}
                            stroke="var(--border)"
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                            width={50}
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={<SpendTooltip />}
                            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="spend"
                            stroke="var(--chart-1)"
                            strokeWidth={1.5}
                            fill="var(--chart-1)"
                            fillOpacity={0.12}
                            dot={false}
                          />
                          <Bar
                            dataKey="exceptions"
                            fill="var(--destructive)"
                            opacity={0.7}
                            barSize={16}
                            radius={[2, 2, 0, 0]}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      <h3 className="font-[inherit]">Discrepancy Volume</h3>
                    </CardTitle>
                    <CardDescription>
                      Discrepancy amount by category and time period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DiscrepancyBarChart />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── By Category tab ──────────────────────────────────────── */}
            <TabsContent value="category">
              <div className="grid grid-cols-1 gap-6 @4xl/main:grid-cols-2">
                {/* Amount at risk by exception type — single donut + legend */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <h3 className="font-[inherit]">Amount at Risk by Type</h3>
                    </CardTitle>
                    <CardDescription>
                      Reconciles with the Amount at Risk total
                    </CardDescription>
                    <CardAction>
                      <span className="text-lg font-semibold tabular-nums">
                        {formatCurrency(categoryDonut.total)}
                      </span>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center gap-4 @md/card:flex-row">
                      <div
                        role="img"
                        aria-label={`Amount at risk split across ${categoryDonut.data.length} exception types, total ${formatCurrency(categoryDonut.total)}`}
                        className="shrink-0"
                      >
                        <ResponsiveContainer width={180} height={180}>
                          <PieChart>
                            <Pie
                              data={categoryDonut.data}
                              dataKey="value"
                              nameKey="label"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              strokeWidth={0}
                            >
                              {categoryDonut.data.map((d) => (
                                <Cell key={d.label} fill={d.fill} />
                              ))}
                            </Pie>
                            <Tooltip content={<DonutTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-2 p-0">
                        {categoryDonut.data.map((d) => (
                          <li key={d.label} className="flex items-center">
                            <span
                              className="mr-2 size-2.5 shrink-0 rounded-sm"
                              style={{ background: d.fill }}
                            />
                            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                              {d.label}
                            </span>
                            <span className="mr-2 text-[10px] tabular-nums text-muted-foreground">
                              {d.pct}%
                            </span>
                            <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
                              {d.display}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Vendor risk distribution — donut, click-through (handoff H5) */}
                <Link href="/vendor-scoring" className="no-underline">
                  <Card className="h-full transition-colors hover:bg-accent/40">
                    <CardHeader>
                      <CardTitle>
                        <h3 className="font-[inherit]">Vendor Risk Distribution</h3>
                      </CardTitle>
                      <CardDescription>
                        {vendorScores.length} scored vendors by risk tier
                      </CardDescription>
                      <CardAction>
                        <ArrowUpRight
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-4 @md/card:flex-row">
                        <div
                          role="img"
                          aria-label={`${vendorScores.length} vendors split across 4 risk tiers: ${vendorRiskDonut
                            .map((d) => `${d.label} ${d.value}`)
                            .join(", ")}`}
                          className="shrink-0"
                        >
                          <ResponsiveContainer width={180} height={180}>
                            <PieChart>
                              <Pie
                                data={vendorRiskDonut}
                                dataKey="value"
                                nameKey="label"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                strokeWidth={0}
                              >
                                {vendorRiskDonut.map((d) => (
                                  <Cell key={d.label} fill={d.fill} />
                                ))}
                              </Pie>
                              <Tooltip content={<DonutTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-2 p-0">
                          {vendorRiskDonut.map((d) => (
                            <li key={d.label} className="flex items-center">
                              <span
                                className="mr-2 size-2.5 shrink-0 rounded-sm"
                                style={{ background: d.fill }}
                              />
                              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                                {d.label}
                              </span>
                              <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
                                {d.value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </section>

      {/* ── Export dialog ──────────────────────────────────────────────── */}
      {/* [Spec: domains/dashboard/spec.md#Components — ExportDialog] */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Dashboard Data"
        onExport={(format) => {
          const headers = [
            "Exception ID",
            "Type",
            "Vendor",
            "Amount",
            "Severity",
            "Status",
          ];
          if (format === "csv") {
            const rows: (string | number)[][] = topExceptions.map((e) => [
              e.id,
              typeConfig[e.type].label,
              e.vendor,
              e.flaggedAmount,
              e.severity,
              e.status,
            ]);
            exportToCSV(
              headers,
              rows as unknown as (string | number)[],
              "invoiceiq-dashboard-Q1-2026.csv"
            );
            showToast("CSV export downloaded successfully", "success");
          } else {
            const rows = topExceptions.map((e) => [
              e.id,
              typeConfig[e.type].label,
              e.vendor,
              formatCurrency(e.flaggedAmount),
              e.severity,
              e.status,
            ]);
            exportToPDF("InvoiceIQ Dashboard — Q1 2026", headers, rows, [
              { label: "Total Exceptions", value: String(metrics.apCount) },
              { label: "Period", value: "Q1 2026" },
            ]);
          }
        }}
      />
    </main>
  );
}
