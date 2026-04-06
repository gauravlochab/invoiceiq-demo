"use client";

import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  FileWarning,
  ArrowRight,
  Download,
  ScanSearch,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import {
  exceptions,
  flaggedByType,
  spendTrend,
  formatCurrency,
  severityConfig,
  statusConfig,
  typeConfig,
  kpiSummary,
} from "@/lib/data";

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAxisK(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function SpendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-900 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.stroke }} className="font-medium leading-6">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Derived data ─────────────────────────────────────────────────────────────

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const topExceptions = [...exceptions]
  .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  .slice(0, 5);

const criticalOpen = exceptions.filter(
  (e) => e.severity === "critical" && e.status !== "resolved"
);

const vendorRisk = [
  { vendor: "BioMed Equipment Inc.", exceptions: 1, risk: "critical" as const },
  { vendor: "MedSupply Corp", exceptions: 1, risk: "critical" as const },
  { vendor: "Cardinal Health", exceptions: 2, risk: "high" as const },
  { vendor: "Steris Corporation", exceptions: 1, risk: "high" as const },
  { vendor: "Medline Industries", exceptions: 1, risk: "medium" as const },
];

const riskDotMap = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  low: "bg-emerald-500",
} as const;

const riskBadgeMap = {
  critical: "text-red-600 bg-red-50 border border-red-100",
  high: "text-amber-600 bg-amber-50 border border-amber-100",
  medium: "text-blue-600 bg-blue-50 border border-blue-100",
  low: "text-emerald-600 bg-emerald-50 border border-emerald-100",
} as const;

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  valueClass: string;
  borderClass: string;
  hero?: boolean;
  sub?: string;
}

function KpiCard({ label, value, icon, iconClass, valueClass, borderClass, hero, sub }: KpiCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      className={`relative bg-white rounded-xl border ${borderClass} shadow-sm p-5 flex flex-col gap-3 overflow-hidden`}
    >
      {hero && (
        <>
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-400 via-red-500 to-red-400" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/40 to-transparent pointer-events-none" />
        </>
      )}
      <div className="flex items-start justify-between relative">
        <div className={`p-2.5 rounded-lg ${iconClass}`}>{icon}</div>
        {hero && (
          <span className="text-[10px] font-bold tracking-widest uppercase text-red-500 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
            Priority
          </span>
        )}
      </div>
      <div className="relative">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className={`font-bold leading-none ${hero ? "text-3xl" : "text-2xl"} ${valueClass}`}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
        <div className="px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-900 leading-tight">
                Q1 2026
              </h1>
              <span className="text-slate-300">·</span>
              <h1 className="text-base font-semibold text-slate-900 leading-tight">
                Invoice Intelligence
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Last updated: Today at 09:14 AM</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Download size={13} />
              Export Report
            </button>
            <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              <ScanSearch size={13} />
              Run Full Scan
            </button>
          </div>
        </div>

        {/* Amber warning banner */}
        <div className="bg-amber-50 border-t border-amber-200 px-8 py-2.5 flex items-center gap-3">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping-slow" />
          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs font-medium text-amber-800">
            3 critical exceptions require immediate review —{" "}
            <span className="font-bold">$216,410 at risk</span>
          </p>
          <Link
            href="/exceptions"
            className="ml-auto text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 whitespace-nowrap"
          >
            Review now <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      <div className="px-8 py-6 space-y-5 max-w-screen-2xl mx-auto">

        {/* ── KPI Row ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-5 gap-4"
        >
          <KpiCard
            label="Invoices Processed"
            value={kpiSummary.totalInvoicesProcessed.toLocaleString()}
            icon={<FileText size={17} />}
            iconClass="bg-slate-100 text-slate-600"
            valueClass="text-slate-900"
            borderClass="border-slate-200"
            sub="Q1 2026 total"
          />
          <KpiCard
            label="Total Exceptions"
            value={String(kpiSummary.totalExceptions)}
            icon={<AlertTriangle size={17} />}
            iconClass="bg-amber-50 text-amber-600"
            valueClass="text-amber-700"
            borderClass="border-amber-200"
            sub={`${kpiSummary.openExceptions} open · ${kpiSummary.totalExceptions - kpiSummary.openExceptions} resolved`}
          />
          <KpiCard
            label="Amount at Risk"
            value={formatCurrency(kpiSummary.totalFlagged)}
            icon={<DollarSign size={17} />}
            iconClass="bg-red-50 text-red-600"
            valueClass="text-red-600"
            borderClass="border-red-300"
            hero
            sub="Across all exception types"
          />
          <KpiCard
            label="Recovered This Quarter"
            value={formatCurrency(kpiSummary.totalRecovered)}
            icon={<TrendingUp size={17} />}
            iconClass="bg-emerald-50 text-emerald-600"
            valueClass="text-emerald-600"
            borderClass="border-slate-200"
            sub="From 2 resolved exceptions"
          />
          <KpiCard
            label="Contracts at Risk"
            value={String(kpiSummary.contractsAtRisk)}
            icon={<FileWarning size={17} />}
            iconClass="bg-red-50 text-red-600"
            valueClass="text-red-600"
            borderClass="border-red-200"
            sub="Breached or warning status"
          />
        </motion.div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-5 gap-4">

          {/* Area Chart (60%) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Exception Breakdown</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monthly spend vs. total flagged amount · Oct 2025 – Mar 2026
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-medium mt-0.5">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="inline-block w-4 h-0.5 rounded bg-indigo-500" />
                  Total Spend
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="inline-block w-4 h-0.5 rounded bg-red-400" />
                  Flagged Amount
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={248}>
              <AreaChart data={spendTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="gradFlag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "var(--font-inter)" }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tickFormatter={formatAxisK}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "var(--font-inter)" }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                />
                <Tooltip content={<SpendTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="spend"
                  name="Total Spend"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradSpend)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="exceptions"
                  name="Flagged Amount"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#gradFlag)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Donut Chart (40%) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.5 }}
            className="col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col"
          >
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-slate-900">Exceptions by Type</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total: {formatCurrency(kpiSummary.totalFlagged)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={flaggedByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {flaggedByType.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), "Flagged"]}
                    contentStyle={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex-1 space-y-2 mt-1">
              {flaggedByType.map((item) => {
                const pct = ((item.value / kpiSummary.totalFlagged) * 100).toFixed(0);
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600 min-w-0">
                      <span
                        className="flex-shrink-0 w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-slate-400">{pct}%</span>
                      <span className="font-semibold text-slate-800 w-20 text-right">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Exceptions Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.5 }}
          className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Exceptions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Top 5 by severity</p>
            </div>
            <Link
              href="/exceptions"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              View All ({exceptions.length}) <ArrowRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    "Exception ID",
                    "Type",
                    "Vendor",
                    "Flagged Amount",
                    "Severity",
                    "Status",
                    "",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topExceptions.map((ex) => {
                  const sev = severityConfig[ex.severity];
                  const sta = statusConfig[ex.status];
                  const typ = typeConfig[ex.type];
                  const isUrgent = ex.severity === "critical" || ex.severity === "high";
                  return (
                    <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {ex.id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ color: sev.color, backgroundColor: sev.bg }}
                        >
                          {typ.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium text-xs whitespace-nowrap">
                        {ex.vendor}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-bold text-sm tabular-nums ${
                            isUrgent ? "text-red-600" : "text-slate-700"
                          }`}
                        >
                          {formatCurrency(ex.flaggedAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                          <span className="text-xs font-semibold" style={{ color: sev.color }}>
                            {sev.label}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ color: sta.color, backgroundColor: sta.bg }}
                        >
                          {sta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href="/exceptions"
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                        >
                          Review <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-2 gap-4 pb-6">

          {/* Vendor Risk Summary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.54, duration: 0.5 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Vendor Risk Summary</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {kpiSummary.vendorsScanned} vendors scanned this quarter
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              {vendorRisk.map((v) => (
                <div
                  key={v.vendor}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex-shrink-0 w-2 h-2 rounded-full ${riskDotMap[v.risk]}`}
                    />
                    <span className="text-sm text-slate-700 font-medium truncate">{v.vendor}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    <span className="text-xs text-slate-400">
                      {v.exceptions} exception{v.exceptions !== 1 ? "s" : ""}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${riskBadgeMap[v.risk]}`}
                    >
                      {v.risk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Action Required */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.5 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Action Required</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Critical open exceptions
                </p>
              </div>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                {criticalOpen.length} critical
              </span>
            </div>
            <div className="space-y-3">
              {criticalOpen.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-start gap-3 p-3.5 rounded-lg bg-red-50 border border-red-100"
                >
                  <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] text-slate-400">{ex.id}</span>
                      <span className="text-xs font-semibold text-red-700 truncate">
                        {ex.vendor}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {ex.description.slice(0, 110)}…
                    </p>
                    <p className="text-xs font-bold text-red-600 mt-1.5">
                      {formatCurrency(ex.flaggedAmount)} at risk
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Link
                      href="/exceptions"
                      className="flex items-center gap-1 text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Review <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
