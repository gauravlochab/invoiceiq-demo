"use client";

import { useState, useRef, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import {
  exceptions,
  flaggedByType,
  spendTrend,
  formatCurrency,
  severityConfig,
  statusConfig,
  typeConfig,
} from "@/lib/data";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { useToast } from "@/components/Toast";

// ─── Derived data ─────────────────────────────────────────────────────────────

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const topExceptions = [...exceptions]
  .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  .slice(0, 6);

const totalFlagged = flaggedByType.reduce((s, d) => s + d.value, 0);

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function SpendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-md shadow-md px-3 py-2.5 text-xs text-[#111827]">
      <p className="text-[#9ca3af] mb-1.5 text-[11px]">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="mb-0.5">
          <span style={{ color: p.dataKey === "spend" ? "#80b8e6" : "#DC2626" }}>
            {p.dataKey === "spend" ? "Total spend" : "Flagged"}
          </span>
          {"  "}
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Status badge style resolution ───────────────────────────────────────────

function statusBadgeClass(status: string): string {
  if (status === "open") return "badge critical";
  if (status === "under_review") return "badge warning";
  if (status === "escalated") return "badge blue";
  return "badge success";
}

function flaggedColor(severity: string): string {
  if (severity === "critical" || severity === "high") return "#DC2626";
  if (severity === "medium") return "#B45309";
  return "#4b5563";
}

// ─── Metric value styles ────────────────────────────────────────────────────

const metricValue = "text-2xl font-bold tracking-tight mt-1 leading-none";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [exportOpen, setExportOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [dateRange, setDateRange] = useState("Q1 2026");
  const [dateDropdown, setDateDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  const exportRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Simulated loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setDateDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#111827] tracking-tight leading-tight">
              Invoice Intelligence
            </h1>
            <p className="text-[13px] text-[#4b5563] mt-1">
              Northfield Medical Center · Q1 2026 · 1,847 invoices processed
            </p>
            <div className="relative inline-block ml-2" ref={dateRef}>
              <button onClick={() => setDateDropdown(!dateDropdown)} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-[#0065cb] bg-[#e8f1fc] rounded-md cursor-pointer border-none hover:bg-[#d0e3f8] transition-colors">
                {dateRange} <ChevronDown className="w-3 h-3" />
              </button>
              {dateDropdown && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-md shadow-md py-1 z-20 w-36">
                  {["Q1 2026", "Q4 2025", "Q3 2025", "Last 30 days", "Last 90 days"].map(opt => (
                    <button key={opt} onClick={() => { setDateRange(opt); setDateDropdown(false); }} className={`block w-full text-left px-3 py-1.5 text-xs cursor-pointer bg-transparent border-none ${dateRange === opt ? "text-[#0065cb] font-medium bg-[#f0f2f5]" : "text-[#4b5563] hover:bg-[#f0f2f5]"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={exportRef}>
              <button onClick={() => setExportOpen(!exportOpen)} className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#d1d5db] bg-white text-[#111827] hover:bg-[#f0f2f5] transition-colors cursor-pointer">
                Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-md shadow-md py-1 z-20 w-44">
                  {["Export as PDF", "Export as CSV", "Email to Stakeholder"].map(opt => (
                    <button key={opt} onClick={() => { setExportOpen(false); showToast(`${opt} — report generated`, "success"); }} className="block w-full text-left px-3 py-1.5 text-xs text-[#4b5563] hover:bg-[#f0f2f5] cursor-pointer bg-transparent border-none">
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setScanning(true); setTimeout(() => { setScanning(false); showToast("Scan complete — 2 new exceptions found", "info"); }, 2000); }}
              disabled={scanning}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#0065cb] text-white hover:bg-[#0057ad] transition-colors cursor-pointer border-none disabled:opacity-60"
            >
              {scanning ? "Scanning..." : "Run Scan"}
            </button>
          </div>
        </div>
      </div>

      <hr className="border-[#e5e7eb] m-0" />

      {/* ── Metrics Strip ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="px-8 py-6">
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card px-5 py-4">
                <div className="h-3 w-20 bg-[#e5e7eb] rounded animate-pulse mb-3" />
                <div className="h-7 w-16 bg-[#e5e7eb] rounded animate-pulse mb-2" />
                <div className="h-2.5 w-14 bg-[#e5e7eb] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-8 py-6">
          <div className="grid grid-cols-5 gap-3">
            {/* 1 — Invoices Processed */}
            <div className="card card-interactive px-5 py-4">
              <p className="section-label">Invoices Processed</p>
              <p className={`${metricValue} text-[#111827]`}>
                <NumberTicker value={1847} />
              </p>
              <p className="text-xs text-[#9ca3af] mt-1.5">Q1 2026</p>
            </div>

            {/* 2 — Exceptions Found */}
            <div className="card card-interactive px-5 py-4">
              <p className="section-label">Exceptions Found</p>
              <p className={`${metricValue} text-[#111827]`}>
                <NumberTicker value={10} />
              </p>
              <p className="text-xs text-[#9ca3af] mt-1.5">7 open</p>
            </div>

            {/* 3 — Amount at Risk */}
            <div className="card card-interactive px-5 py-4">
              <p className="section-label">Amount at Risk</p>
              <p className={`${metricValue} text-[#DC2626]`}>
                <NumberTicker value={396810} prefix="$" delay={0.2} />
              </p>
              <p className="text-xs text-[#9ca3af] mt-1.5">22% of period spend</p>
            </div>

            {/* 4 — Recovered */}
            <div className="card card-interactive px-5 py-4">
              <p className="section-label">Recovered</p>
              <p className={`${metricValue} text-[#15803D]`}>
                <NumberTicker value={12640} prefix="$" delay={0.3} />
              </p>
              <p className="text-xs text-[#9ca3af] mt-1.5">2 resolved</p>
            </div>

            {/* 5 — Contracts at Risk */}
            <div className="card card-interactive px-5 py-4">
              <p className="section-label">Contracts at Risk</p>
              <p className={`${metricValue} text-[#B45309]`}>
                <NumberTicker value={3} delay={0.4} />
              </p>
              <p className="text-xs text-[#9ca3af] mt-1.5">1 breached</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Status Counts */}
      {loading ? (
        <div className="px-8 pb-2 mt-[-8px]">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-[#e5e7eb] rounded-md px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-[#e5e7eb] animate-pulse" />
                <div className="h-3 bg-[#e5e7eb] rounded animate-pulse" style={{ width: `${50 + i * 12}px` }} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-8 pb-2 mt-[-8px]">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Pending Review", count: 5, color: "#B45309" },
              { label: "Waiting on Manager", count: 1, color: "#7c3aed" },
              { label: "Waiting Correction", count: 1, color: "#0065cb" },
              { label: "Approved", count: 2, color: "#15803D" },
              { label: "Resolved", count: 1, color: "#4b5563" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 bg-white border border-[#e5e7eb] rounded-md px-3 py-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-[#4b5563]">{item.label}</span>
                <span className="text-[11px] font-semibold text-[#111827]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      {loading ? (
        <div
          className="px-8 pb-6 grid gap-6"
          style={{ gridTemplateColumns: "1fr 360px" }}
        >
          {/* LEFT skeleton — chart area */}
          <div className="card p-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-40 bg-[#e5e7eb] rounded animate-pulse" />
              <div className="h-3 w-28 bg-[#e5e7eb] rounded animate-pulse" />
            </div>
            <div className="h-[260px] bg-[#e5e7eb] rounded animate-pulse opacity-40" />
          </div>

          {/* RIGHT skeleton — donut area */}
          <div className="card p-5 pb-4 flex flex-col">
            <div className="h-4 w-24 bg-[#e5e7eb] rounded animate-pulse mb-4" />
            <div className="h-[180px] flex items-center justify-center">
              <div className="w-[160px] h-[160px] rounded-full bg-[#e5e7eb] animate-pulse opacity-40" />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#e5e7eb] animate-pulse" />
                  <div className="h-3 flex-1 bg-[#e5e7eb] rounded animate-pulse" />
                  <div className="h-3 w-12 bg-[#e5e7eb] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="px-8 pb-6 grid gap-6"
          style={{ gridTemplateColumns: "1fr 360px" }}
        >

          {/* LEFT — Spend & Exception Trend */}
          <div className="card p-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[#111827]">
                Spend &amp; Exception Trend
              </p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px] text-[#4b5563]">
                  <span className="inline-block w-6 h-0.5 rounded-sm bg-[#80b8e6]" />
                  Total spend
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[#4b5563]">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#DC2626] opacity-70" />
                  Flagged
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={spendTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="0"
                  horizontal={true}
                  vertical={false}
                  stroke="#f0f2f5"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<SpendTooltip />} cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#80b8e6"
                  strokeWidth={1.5}
                  fill="#e8f1fc"
                  dot={false}
                />
                <Bar
                  dataKey="exceptions"
                  fill="#DC2626"
                  opacity={0.7}
                  barSize={16}
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* RIGHT — Exception Breakdown */}
          <div className="card p-5 pb-4 flex flex-col">
            <p className="text-sm font-medium text-[#111827] mb-1">
              By Category
            </p>

            {/* Donut */}
            <div className="relative shrink-0">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={flaggedByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                    onClick={() => {
                      router.push('/exceptions');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {flaggedByType.map((entry, i) => (
                      <Cell key={i} fill={entry.color} style={{ cursor: 'pointer' }} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown, name: unknown) => [formatCurrency(Number(v)), String(name)]}
                    contentStyle={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      fontSize: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      color: "#111827",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-lg font-bold text-[#111827] leading-none tracking-tight">
                  $397K
                </p>
                <p className="text-[10px] text-[#9ca3af] mt-0.5">at risk</p>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex flex-col gap-2 mt-2">
              {flaggedByType.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center cursor-pointer hover:bg-[#f0f2f5] rounded px-1 -mx-1 py-0.5 transition-all duration-150"
                  onClick={() => router.push('/exceptions')}
                >
                  <span
                    className="status-dot shrink-0 mr-2"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs text-[#4b5563] flex-1 min-w-0">
                    {item.name}
                  </span>
                  <span className="text-xs font-medium text-[#111827] tabular-nums ml-auto shrink-0">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Exceptions Table ───────────────────────────────────────────────── */}
      <div className="px-8 pb-8">
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e5e7eb]">
            <p className="text-sm font-semibold text-[#111827]">Recent Exceptions</p>
            <Link
              href="/exceptions"
              className="flex items-center gap-1 text-xs text-[#0065cb] font-medium no-underline hover:underline transition-colors"
            >
              View all 10 <ArrowUpRight size={12} />
            </Link>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Vendor</th>
                  <th className="right">Flagged</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              {loading ? (
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <tr key={i}>
                      <td><div className="h-3.5 w-14 bg-[#e5e7eb] rounded animate-pulse" /></td>
                      <td><div className="h-5 w-24 bg-[#e5e7eb] rounded animate-pulse" /></td>
                      <td>
                        <div className="h-3.5 w-28 bg-[#e5e7eb] rounded animate-pulse mb-1.5" />
                        <div className="h-2.5 w-20 bg-[#e5e7eb] rounded animate-pulse" />
                      </td>
                      <td className="right"><div className="h-3.5 w-16 bg-[#e5e7eb] rounded animate-pulse ml-auto" /></td>
                      <td><div className="h-3.5 w-16 bg-[#e5e7eb] rounded animate-pulse" /></td>
                      <td><div className="h-5 w-20 bg-[#e5e7eb] rounded animate-pulse" /></td>
                      <td><div className="h-3.5 w-12 bg-[#e5e7eb] rounded animate-pulse" /></td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  {topExceptions.map((ex) => {
                    const sev = severityConfig[ex.severity];
                    const sta = statusConfig[ex.status];
                    const typ = typeConfig[ex.type];
                    const isCriticalType =
                      ex.type === "contract_overage" || ex.type === "suspicious_invoice";

                    return (
                      <tr key={ex.id} className="group">
                        {/* ID */}
                        <td className="mono">{ex.id}</td>

                        {/* Type badge */}
                        <td>
                          <span className={isCriticalType ? "badge critical" : "badge neutral"}>
                            {typ.label}
                          </span>
                        </td>

                        {/* Vendor */}
                        <td>
                          <p className="font-medium text-[#111827] text-[13px]">
                            {ex.vendor}
                          </p>
                          <p className="text-[11px] text-[#9ca3af] mt-px">
                            {ex.invoiceNumber}
                          </p>
                        </td>

                        {/* Flagged amount */}
                        <td className="amount right">
                          <span
                            className="font-medium"
                            style={{ color: flaggedColor(ex.severity) }}
                          >
                            {formatCurrency(ex.flaggedAmount)}
                          </span>
                        </td>

                        {/* Severity */}
                        <td>
                          <span className="flex items-center gap-1.5">
                            <span
                              className="status-dot"
                              style={{ background: sev.color }}
                            />
                            <span className="text-xs" style={{ color: sev.color }}>{sev.label}</span>
                          </span>
                        </td>

                        {/* Status badge */}
                        <td>
                          <span className={statusBadgeClass(ex.status)}>{sta.label}</span>
                        </td>

                        {/* Review link */}
                        <td>
                          <Link
                            href={`/exceptions/${ex.id}`}
                            className="text-xs text-[#9ca3af] group-hover:text-[#0065cb] font-medium no-underline hover:underline transition-colors"
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
    </div>
  );
}
