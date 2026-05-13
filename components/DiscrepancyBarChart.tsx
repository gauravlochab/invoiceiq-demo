"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CATEGORY_CONFIG, discrepancyTrend, discrepancyByDay, formatCurrency } from "@/lib/data";

const CATEGORY_KEYS = [
  { key: "equipment", label: "Medical Equipment", configKey: "Medical Equipment" },
  { key: "pharma", label: "Pharmaceuticals", configKey: "Pharmaceuticals" },
  { key: "surgical", label: "Surgical Supplies", configKey: "Surgical Supplies" },
  { key: "sterilization", label: "Sterilization", configKey: "Sterilization" },
  { key: "gpo", label: "GPO — General", configKey: "GPO — General" },
];

const MONTH_DAYS: Record<string, number> = {
  "Oct 2025": 31, "Nov 2025": 30, "Dec 2025": 31,
  "Jan 2026": 31, "Feb 2026": 28, "Mar 2026": 31,
};

const MONTH_SHORT: Record<string, string> = {
  "Oct 2025": "Oct", "Nov 2025": "Nov", "Dec 2025": "Dec",
  "Jan 2026": "Jan", "Feb 2026": "Feb", "Mar 2026": "Mar",
};

const MONTH_NUM: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

const QUARTER_LABEL: Record<string, string> = {
  "Oct 2025": "Q4 2025", "Nov 2025": "Q4 2025", "Dec 2025": "Q4 2025",
  "Jan 2026": "Q1 2026", "Feb 2026": "Q1 2026", "Mar 2026": "Q1 2026",
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateDailyData(month: string) {
  const days = MONTH_DAYS[month] || 30;
  const monthEntry = discrepancyTrend.find((d) => d.period === month);
  const totalAmount = monthEntry ? monthEntry.total : 60000;
  const short = MONTH_SHORT[month] || month.slice(0, 3);

  const seed = month.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng = seededRandom(seed);

  const [monName, year] = month.split(" ");
  const mm = MONTH_NUM[monName] || "01";

  const rawAmounts: number[] = [];
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${mm}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = new Date(dateStr).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const base = isWeekend ? 0.4 + rng() * 0.3 : 0.7 + rng() * 0.6;
    rawAmounts.push(base);
  }

  const rawSum = rawAmounts.reduce((s, v) => s + v, 0);
  return rawAmounts.map((raw, i) => ({
    day: `${short} ${i + 1}`,
    amount: Math.round((raw / rawSum) * totalAmount),
  }));
}

function StackedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--border)] rounded-md shadow-md px-3 py-2.5 text-xs">
      <p className="text-[var(--text-muted)] mb-1.5 text-[11px] font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="mb-0.5 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-[var(--text-secondary)]">{p.name}</span>
          <span className="font-medium text-[var(--text-primary)] ml-auto">{formatCurrency(p.value)}</span>
        </p>
      ))}
      <p className="border-t border-[var(--border)] pt-1 mt-1 text-[var(--text-primary)] font-medium">
        Total: {formatCurrency(payload.reduce((s: number, p: any) => s + p.value, 0))}
      </p>
    </div>
  );
}

function DailyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--border)] rounded-md shadow-md px-3 py-2.5 text-xs">
      <p className="text-[var(--text-muted)] mb-1.5 text-[11px] font-medium">{label}</p>
      <p className="mb-0 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--acl-primary)" }} />
        <span className="text-[var(--text-secondary)]">Discrepancy</span>
        <span className="font-medium text-[var(--text-primary)] ml-auto">{formatCurrency(payload[0].value)}</span>
      </p>
    </div>
  );
}

export function DiscrepancyBarChart() {
  const [view, setView] = useState<"quarterly" | "daily">("quarterly");
  const [drillMonth, setDrillMonth] = useState<string | null>(null);

  const drillDailyData = useMemo(() => {
    if (!drillMonth) return [];
    return generateDailyData(drillMonth);
  }, [drillMonth]);

  const handleBarClick = (data: any) => {
    if (view === "quarterly" && data?.period) {
      setDrillMonth(data.period);
    }
  };

  const handleBackToQuarterly = () => {
    setDrillMonth(null);
  };

  const isDrillMode = drillMonth !== null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {isDrillMode ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToQuarterly}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <span className="text-sm leading-none">&larr;</span> Back to Quarterly
            </button>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              <span className="text-[var(--text-muted)]">{QUARTER_LABEL[drillMonth!]}</span>
              <span className="text-[var(--text-muted)] mx-1.5">&rsaquo;</span>
              <span>{drillMonth}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm font-medium text-[var(--text-primary)]">Discrepancy Analysis by Category</p>
        )}
        <div className="flex bg-[var(--bg-subtle)] rounded-md p-0.5">
          <button
            onClick={() => { if (!isDrillMode) setView("quarterly"); }}
            className={`px-3 py-1 text-[11px] font-medium rounded-md border-none transition-colors ${
              isDrillMode
                ? "bg-transparent text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                : view === "quarterly"
                  ? "bg-white text-[var(--text-primary)] shadow-sm cursor-pointer"
                  : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
            }`}
            disabled={isDrillMode}
          >
            Quarterly
          </button>
          <button
            onClick={() => { if (!isDrillMode) setView("daily"); }}
            className={`px-3 py-1 text-[11px] font-medium rounded-md border-none transition-colors ${
              isDrillMode
                ? "bg-transparent text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                : view === "daily"
                  ? "bg-white text-[var(--text-primary)] shadow-sm cursor-pointer"
                  : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
            }`}
            disabled={isDrillMode}
          >
            Mar 2026
          </button>
        </div>
      </div>

      {isDrillMode ? (
        <div role="img" aria-label="Daily discrepancy drill-down chart for selected month">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={drillDailyData} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" horizontal={false} vertical={true} stroke="var(--chart-grid)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="day" tick={{ fontSize: 10, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} width={50} interval={0} />
            <Tooltip content={<DailyTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="amount" name="Discrepancy" fill="var(--acl-primary)" radius={[0, 3, 3, 0]} barSize={6} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      ) : view === "quarterly" ? (
        <>
          <div role="img" aria-label="Discrepancy analysis by category showing monthly breakdown">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={discrepancyTrend} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" horizontal={false} vertical={true} stroke="var(--chart-grid)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="period" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<StackedTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              {CATEGORY_KEYS.map(({ key, label, configKey }) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={label}
                  stackId="a"
                  fill={CATEGORY_CONFIG[configKey]?.text || "#9ca3af"}
                  radius={0}
                  barSize={20}
                  className="cursor-pointer"
                  onClick={(_data: any, _index: number) => {
                    const entry = discrepancyTrend[_index];
                    if (entry) handleBarClick(entry);
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 px-1">
            <span className="text-[11px] text-[var(--text-muted)] italic">Click a month to drill down</span>
            <span className="flex-1" />
            {CATEGORY_KEYS.map(({ label, configKey }) => (
              <span key={label} className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: CATEGORY_CONFIG[configKey]?.text || "#9ca3af" }} />
                {label}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div role="img" aria-label="Daily discrepancy chart for March 2026">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={discrepancyByDay} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" horizontal={false} vertical={true} stroke="var(--chart-grid)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="day" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<DailyTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="amount" name="Discrepancy" fill="var(--acl-primary)" radius={[0, 3, 3, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
