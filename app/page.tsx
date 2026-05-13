"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowUpDown } from "lucide-react";
import {
  exceptions,
  allExceptions,
  flaggedByType,
  spendTrend,
  formatCurrency,
  severityConfig,
  statusConfig,
  typeConfig,
  recoveryQueue,
  contracts,
} from "@/lib/data";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { useToast } from "@/components/Toast";
import { CategoryBadge } from "@/components/CategoryBadge";
import { VendorBadge } from "@/components/VendorBadge";
import { DiscrepancyBarChart } from "@/components/DiscrepancyBarChart";
import { ExportDialog } from "@/components/ExportDialog";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { PARKLAND_CONFIG } from "@/lib/workflow-config";
import { getGPOComplianceRate, getGPOPotentialSavings } from "@/lib/gpo-contracts";

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const statusOrder: Record<string, number> = { open: 0, under_review: 1, escalated: 2, resolved: 3 };

const topExceptions = exceptions
  .filter((e) => !e.type.startsWith("som_"))
  .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  .slice(0, 6);

const apExceptions = allExceptions.filter((e) => !e.type.startsWith("som_"));
const openCount = apExceptions.filter(
  (e) => e.status === "open" || e.status === "under_review" || e.status === "escalated"
).length;

const totalFlagged = flaggedByType.reduce((s, d) => s + d.value, 0);

type SortKey = "type" | "flaggedAmount" | "severity" | "status";
type SortDir = "asc" | "desc";

function SpendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-md px-3 py-2.5 text-xs text-[var(--text-primary)]">
      <p className="text-[var(--text-muted)] mb-1.5 text-[11px]">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="mb-0.5">
          <span style={{ color: p.dataKey === "spend" ? "var(--chart-spend)" : "var(--chart-flagged)" }}>
            {p.dataKey === "spend" ? "Total spend" : "Flagged"}
          </span>
          {"  "}
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function statusBadgeClass(status: string): string {
  if (status === "open") return "badge critical";
  if (status === "under_review") return "badge warning";
  if (status === "escalated") return "badge blue";
  return "badge success";
}

function flaggedColor(severity: string): string {
  if (severity === "critical" || severity === "high") return "var(--critical)";
  if (severity === "medium") return "var(--warning)";
  return "var(--neutral)";
}

const metricValue = "text-2xl font-bold tracking-tight mt-1 leading-none";

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [loading, setLoading] = useState(true);

  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const amountAtRisk = apExceptions.reduce((s, e) => s + e.flaggedAmount, 0);
  const recoveredAmount = recoveryQueue.filter(r => r.status === 'recovered').reduce((s, r) => s + (r.recoveredAmount ?? 0), 0);
  const recoveredCount = recoveryQueue.filter(r => r.status === 'recovered').length;
  const contractsAtRiskCount = contracts.filter(c => c.status === 'breached' || c.status === 'warning').length;
  const contractsBreachedCount = contracts.filter(c => c.status === 'breached').length;

  const kpiCards: {
    label: string;
    href: string;
    value: number;
    prefix?: string;
    suffix?: string;
    delay: number;
    subtitle: string;
    valueColor: string;
    accentColor: string;
    bgGradient: string;
    stagger: string;
  }[] = [
    {
      label: "Invoices Processed",
      href: "/pipeline",
      value: 1847,
      delay: 0,
      subtitle: "Q1 2026",
      valueColor: "text-[var(--text-primary)]",
      accentColor: "var(--acl-primary)",
      bgGradient: "linear-gradient(135deg, var(--bg-surface) 80%, rgba(0,101,203,0.03))",
      stagger: "stagger-1",
    },
    {
      label: "Exceptions Found",
      href: "/exceptions",
      value: apExceptions.length,
      delay: 0,
      subtitle: `${openCount} open`,
      valueColor: "text-[var(--text-primary)]",
      accentColor: "var(--warning)",
      bgGradient: "linear-gradient(135deg, var(--bg-surface) 80%, rgba(180,83,9,0.03))",
      stagger: "stagger-2",
    },
    {
      label: "Amount at Risk",
      href: "/exceptions",
      value: amountAtRisk,
      prefix: "$",
      delay: 0.2,
      subtitle: "22% of period spend",
      valueColor: "text-[var(--critical)]",
      accentColor: "var(--critical)",
      bgGradient: "linear-gradient(135deg, var(--bg-surface) 80%, rgba(220,38,38,0.03))",
      stagger: "stagger-3",
    },
    {
      label: "Recovered",
      href: "/recovery",
      value: recoveredAmount,
      prefix: "$",
      delay: 0.3,
      subtitle: `${recoveredCount} resolved`,
      valueColor: "text-[var(--success-text)]",
      accentColor: "var(--success)",
      bgGradient: "linear-gradient(135deg, var(--bg-surface) 80%, rgba(5,150,105,0.03))",
      stagger: "stagger-4",
    },
    {
      label: "Contracts at Risk",
      href: "/contracts",
      value: contractsAtRiskCount,
      delay: 0.4,
      subtitle: `${contractsBreachedCount} breached`,
      valueColor: "text-[var(--warning-text)]",
      accentColor: "var(--agent-validation)",
      bgGradient: "linear-gradient(135deg, var(--bg-surface) 80%, rgba(124,58,237,0.03))",
      stagger: "stagger-5",
    },
    {
      label: "GPO Compliance",
      href: "/contracts",
      value: getGPOComplianceRate(),
      suffix: "%",
      delay: 0.5,
      subtitle: "Premier, Vizient, HealthTrust",
      valueColor: "text-[var(--success-text)]",
      accentColor: "var(--success)",
      bgGradient: "linear-gradient(135deg, var(--bg-surface) 80%, rgba(5,150,105,0.03))",
      stagger: "stagger-5",
    },
    {
      label: "GPO Savings Opportunity",
      href: "/contracts",
      value: getGPOPotentialSavings(),
      prefix: "$",
      delay: 0.6,
      subtitle: "across active contracts",
      valueColor: "text-[var(--warning-text)]",
      accentColor: "var(--warning)",
      bgGradient: "linear-gradient(135deg, var(--bg-surface) 80%, rgba(217,119,6,0.03))",
      stagger: "stagger-5",
    },
  ];

  const primaryKpis = kpiCards.slice(0, 4);
  const secondaryKpis = kpiCards.slice(4);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedExceptions = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...topExceptions].sort((a, b) => {
      switch (sortKey) {
        case "type": {
          const labelA = typeConfig[a.type].label;
          const labelB = typeConfig[b.type].label;
          return dir * labelA.localeCompare(labelB);
        }
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

  const renderKpiCard = (card: typeof kpiCards[0]) => (
    <Link
      key={card.label}
      href={card.href}
      className={`group card-metric card-interactive px-5 py-4 animate-slide-up ${card.stagger} cursor-pointer no-underline border border-transparent hover:border-[var(--acl-primary)] transition-all duration-200 relative`}
      style={{
        "--accent-color": card.accentColor,
        background: card.bgGradient,
      } as React.CSSProperties}
      aria-label={`${card.label}: ${card.prefix ?? ""}${card.value}${card.suffix ?? ""}`}
    >
      <p className="section-label">{card.label}</p>
      <p className={`${metricValue} ${card.valueColor}`}>
        <NumberTicker value={card.value} prefix={card.prefix} suffix={card.suffix} delay={card.delay} />
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-1.5">{card.subtitle}</p>
      <span className="absolute bottom-3 right-4 text-[10px] font-medium text-[var(--acl-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        View details &rarr;
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* ── Dashboard Header ─────────────────────────────────────────────── */}
      <div className="px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="page-header">
              <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight leading-tight">
                Invoice Intelligence
              </h1>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mt-3">
              {PARKLAND_CONFIG.customer} · Q1 2026 · 1,847 invoices processed
            </p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-[var(--acl-primary)] bg-[var(--acl-primary-subtle)] rounded-md ml-2">
              Q1 2026
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportDialogOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] active:scale-[0.98] transition-all cursor-pointer"
            >
              Export
            </button>
            <button
              onClick={() => {
                if (!scanDone) {
                  setScanning(true);
                  setTimeout(() => {
                    setScanning(false);
                    setScanDone(true);
                    showToast("Scan complete — 2 new exceptions identified for review", "info");
                  }, 2000);
                }
              }}
              disabled={scanning || scanDone}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--acl-primary)] text-white hover:bg-[var(--acl-primary-hover)] active:scale-[0.98] transition-all cursor-pointer border-none disabled:opacity-60"
            >
              {scanning ? "Scanning..." : scanDone ? "Last scan: just now" : "Run Scan"}
            </button>
          </div>
        </div>
      </div>

      <hr className="border-[var(--border)] m-0" />

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="px-6 lg:px-8 py-6">
          {/* Primary KPI skeleton row */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card px-5 py-4">
                <div className="h-3 w-20 bg-[var(--border)] rounded animate-pulse mb-3" />
                <div className="h-7 w-16 bg-[var(--border)] rounded animate-pulse mb-2" />
                <div className="h-2.5 w-14 bg-[var(--border)] rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Secondary KPI skeleton row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card px-5 py-4">
                <div className="h-3 w-20 bg-[var(--border)] rounded animate-pulse mb-3" />
                <div className="h-7 w-16 bg-[var(--border)] rounded animate-pulse mb-2" />
                <div className="h-2.5 w-14 bg-[var(--border)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-6 lg:px-8 py-6">
          {/* Primary KPIs: 4 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {primaryKpis.map(renderKpiCard)}
          </div>
          {/* Secondary KPIs: 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {secondaryKpis.map(renderKpiCard)}
          </div>
        </div>
      )}

      {/* ── Agent Status Strip ───────────────────────────────────────────── */}
      {loading ? (
        <div className="px-6 lg:px-8 pb-4">
          <div className="h-3 w-16 bg-[var(--border)] rounded animate-pulse mb-2" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md px-3.5 py-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[var(--border)] animate-pulse flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="h-3 bg-[var(--border)] rounded animate-pulse mb-1.5" style={{ width: `${50 + i * 12}px` }} />
                  <div className="h-2.5 bg-[var(--border)] rounded animate-pulse" style={{ width: `${40 + i * 8}px` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-6 lg:px-8 pb-4">
          <p className="section-label mb-2">AI Agents</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { name: "Invoice Agent",    stat: "1,847 processed", last: "0 errors" },
              { name: "Validation Agent", stat: "188 exceptions",  last: "6 escalated" },
              { name: "Compliance Agent", stat: "12 alerts",        last: "reviewing Cardinal" },
              { name: "Recovery Agent",   stat: "14 in queue",    last: "$470K target" },
              { name: "Insight Agent",    stat: "9 vendors scored", last: "4 high-risk" },
            ].map((agent) => (
              <div key={agent.name} className="flex items-center gap-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md px-3.5 py-3 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "var(--success)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{agent.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{agent.stat} · {agent.last}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts Section ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="px-6 lg:px-8 pb-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="card p-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-40 bg-[var(--border)] rounded animate-pulse" />
              <div className="h-3 w-28 bg-[var(--border)] rounded animate-pulse" />
            </div>
            <div className="h-[260px] bg-[var(--border)] rounded animate-pulse opacity-40" />
          </div>

          <div className="card p-5 pb-4 flex flex-col">
            <div className="h-4 w-24 bg-[var(--border)] rounded animate-pulse mb-4" />
            <div className="h-[180px] flex items-center justify-center">
              <div className="w-full h-8 rounded-md bg-[var(--border)] animate-pulse opacity-40" />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--border)] animate-pulse" />
                  <div className="h-3 flex-1 bg-[var(--border)] rounded animate-pulse" />
                  <div className="h-3 w-12 bg-[var(--border)] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 lg:px-8 pb-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          <div className="card p-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Spend &amp; Exception Trend
              </p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <span className="inline-block w-6 h-0.5 rounded-sm bg-[var(--chart-spend)]" />
                  Total spend
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--chart-flagged)] opacity-70" />
                  Flagged
                </span>
              </div>
            </div>
            <div role="img" aria-label="Spend and exception trend chart showing monthly totals">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={spendTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="0"
                    horizontal={true}
                    vertical={false}
                    stroke="var(--bg-subtle)"
                  />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} width={50} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<SpendTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="var(--chart-spend)"
                    strokeWidth={1.5}
                    fill="var(--chart-area-fill)"
                    dot={false}
                  />
                  <Bar
                    dataKey="exceptions"
                    fill="var(--chart-flagged)"
                    opacity={0.7}
                    barSize={16}
                    radius={[2, 2, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5 pb-4 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                By Category
              </p>
              <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                ${Math.round(totalFlagged / 1000)}K
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mb-4">Amount at risk by exception type</p>

            <div
              role="img"
              aria-label="Exception amount breakdown by category"
              className="w-full h-8 rounded-md overflow-hidden flex cursor-pointer"
              onClick={() => router.push('/exceptions')}
            >
              {flaggedByType.map((item) => (
                <div
                  key={item.name}
                  className="h-full transition-opacity hover:opacity-80"
                  style={{
                    width: `${(item.value / totalFlagged) * 100}%`,
                    backgroundColor: item.color,
                  }}
                  title={`${item.name}: ${formatCurrency(item.value)}`}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {flaggedByType.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center cursor-pointer hover:bg-[var(--bg-subtle)] rounded px-1 -mx-1 py-0.5 transition-all duration-150"
                  onClick={() => router.push('/exceptions')}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0 mr-2"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs text-[var(--text-secondary)] flex-1 min-w-0">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums mr-2">
                    {((item.value / totalFlagged) * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs font-medium text-[var(--text-primary)] tabular-nums shrink-0">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Discrepancy Bar Chart ────────────────────────────────────────── */}
      {!loading && (
        <div className="px-6 lg:px-8 pb-6">
          <div className="card p-5 pb-4">
            <DiscrepancyBarChart />
          </div>
        </div>
      )}

      {/* ── Recent Exceptions Table ──────────────────────────────────────── */}
      <div className="px-6 lg:px-8 pb-8">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Recent Exceptions</p>
            <Link
              href="/exceptions"
              className="flex items-center gap-1 text-xs text-[var(--acl-primary)] font-medium no-underline hover:underline transition-colors"
            >
              View all {allExceptions.length} <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th
                    className="cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                    onClick={() => handleSort("type")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Type
                      <ArrowUpDown size={12} className={sortKey === "type" ? "text-[var(--acl-primary)]" : "text-[var(--text-muted)]"} />
                    </span>
                  </th>
                  <th>Category</th>
                  <th>Vendor</th>
                  <th
                    className="right cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                    onClick={() => handleSort("flaggedAmount")}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">
                      Flagged
                      <ArrowUpDown size={12} className={sortKey === "flaggedAmount" ? "text-[var(--acl-primary)]" : "text-[var(--text-muted)]"} />
                    </span>
                  </th>
                  <th
                    className="cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                    onClick={() => handleSort("severity")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Severity
                      <ArrowUpDown size={12} className={sortKey === "severity" ? "text-[var(--acl-primary)]" : "text-[var(--text-muted)]"} />
                    </span>
                  </th>
                  <th
                    className="cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                    onClick={() => handleSort("status")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Status
                      <ArrowUpDown size={12} className={sortKey === "status" ? "text-[var(--acl-primary)]" : "text-[var(--text-muted)]"} />
                    </span>
                  </th>
                  <th></th>
                </tr>
              </thead>
              {loading ? (
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <tr key={i}>
                      <td><div className="h-3.5 w-14 bg-[var(--border)] rounded animate-pulse" /></td>
                      <td><div className="h-5 w-24 bg-[var(--border)] rounded animate-pulse" /></td>
                      <td><div className="h-5 w-28 bg-[var(--border)] rounded animate-pulse" /></td>
                      <td>
                        <div className="h-3.5 w-28 bg-[var(--border)] rounded animate-pulse mb-1.5" />
                        <div className="h-2.5 w-20 bg-[var(--border)] rounded animate-pulse" />
                      </td>
                      <td className="right"><div className="h-3.5 w-16 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                      <td><div className="h-3.5 w-16 bg-[var(--border)] rounded animate-pulse" /></td>
                      <td><div className="h-5 w-20 bg-[var(--border)] rounded animate-pulse" /></td>
                      <td><div className="h-3.5 w-12 bg-[var(--border)] rounded animate-pulse" /></td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  {sortedExceptions.map((ex) => {
                    const sev = severityConfig[ex.severity];
                    const sta = statusConfig[ex.status];
                    const typ = typeConfig[ex.type];
                    const isCriticalType =
                      ex.type === "contract_overage" || ex.type === "suspicious_invoice";

                    return (
                      <tr key={ex.id} className="group">
                        <td className="mono">{ex.id}</td>

                        <td>
                          <span className={isCriticalType ? "badge critical" : "badge neutral"}>
                            {typ.label}
                          </span>
                        </td>

                        <td>
                          {ex.category && <CategoryBadge category={ex.category} />}
                        </td>

                        <td>
                          <div className="mb-0.5">
                            <VendorBadge name={ex.vendor} size="sm" />
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-px pl-8">
                            {ex.invoiceNumber}
                          </p>
                        </td>

                        <td className="amount right">
                          <span
                            className="font-medium"
                            style={{ color: flaggedColor(ex.severity) }}
                          >
                            {formatCurrency(ex.flaggedAmount)}
                          </span>
                        </td>

                        <td>
                          <span className="flex items-center gap-1.5">
                            <span
                              className="status-dot"
                              style={{ background: sev.color }}
                            />
                            <span className="text-xs" style={{ color: sev.color }}>{sev.label}</span>
                          </span>
                        </td>

                        <td>
                          <span className={statusBadgeClass(ex.status)}>{sta.label}</span>
                        </td>

                        <td>
                          <Link
                            href={`/exceptions/${ex.id}`}
                            className="text-xs text-[var(--text-muted)] group-hover:text-[var(--acl-primary)] font-medium no-underline hover:underline transition-colors"
                          >
                            Review &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        title="Export Dashboard Data"
        onExport={(format) => {
          if (format === "csv") {
            const headers = ["Exception ID", "Type", "Vendor", "Amount", "Severity", "Status"];
            const rows = topExceptions.map((e) => [
              e.id,
              typeConfig[e.type].label,
              e.vendor,
              e.flaggedAmount,
              e.severity,
              e.status,
            ]);
            exportToCSV(headers, rows as any, `invoiceiq-dashboard-Q1-2026.csv`);
            showToast("CSV export downloaded successfully", "success");
          } else {
            const headers = ["Exception ID", "Type", "Vendor", "Amount", "Severity", "Status"];
            const rows = topExceptions.map((e) => [
              e.id,
              typeConfig[e.type].label,
              e.vendor,
              formatCurrency(e.flaggedAmount),
              e.severity,
              e.status,
            ]);
            exportToPDF("InvoiceIQ Dashboard — Q1 2026", headers, rows, [
              { label: "Total Exceptions", value: String(openCount) },
              { label: "Period", value: "Q1 2026" },
            ]);
          }
        }}
      />
    </div>
  );
}
