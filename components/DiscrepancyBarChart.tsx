"use client";

// [Spec: domains/dashboard/spec.md#Forbidden Patterns — shadcn tokens / --chart-*]
// v2.3 theming pass: moved off raw hex + v1 tokens (var(--chart-grid),
// var(--chart-tick), var(--bg-surface), var(--text-muted), bg-white,
// var(--acl-primary)) onto shadcn v2 theme tokens + --chart-* so the chart
// renders correctly in dark mode. Public API unchanged.
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
import { discrepancyTrend, discrepancyByDay, formatCurrency } from "@/lib/data";

// Each category gets a distinct --chart-N token — no two categories share a
// color (WCAG 1.4.1; audit finding C5).
const CATEGORY_KEYS = [
  { key: "equipment", label: "Medical Equipment", color: "var(--chart-1)" },
  { key: "pharma", label: "Pharmaceuticals", color: "var(--chart-6)" },
  { key: "surgical", label: "Surgical Supplies", color: "var(--chart-4)" },
  { key: "sterilization", label: "Sterilization", color: "var(--chart-5)" },
  { key: "gpo", label: "GPO — General", color: "var(--chart-3)" },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StackedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover text-popover-foreground shadow-md px-3 py-2.5 text-xs">
      <p className="text-muted-foreground mb-1.5 text-[11px] font-medium">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.dataKey} className="mb-0.5 flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: p.fill }}
          />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-medium text-foreground ml-auto tabular-nums">
            {formatCurrency(p.value)}
          </span>
        </p>
      ))}
      <p className="border-t border-border pt-1 mt-1 text-foreground font-medium">
        Total:{" "}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {formatCurrency(payload.reduce((s: number, p: any) => s + p.value, 0))}
      </p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DailyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover text-popover-foreground shadow-md px-3 py-2.5 text-xs">
      <p className="text-muted-foreground mb-1.5 text-[11px] font-medium">{label}</p>
      <p className="mb-0 flex items-center gap-1.5">
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: "var(--chart-1)" }}
        />
        <span className="text-muted-foreground">Discrepancy</span>
        <span className="font-medium text-foreground ml-auto tabular-nums">
          {formatCurrency(payload[0].value)}
        </span>
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (data: any) => {
    if (view === "quarterly" && data?.period) {
      setDrillMonth(data.period);
    }
  };

  const handleBackToQuarterly = () => {
    setDrillMonth(null);
  };

  const isDrillMode = drillMonth !== null;

  const segBtnBase =
    "px-3 py-1 text-[11px] font-medium rounded-md border-none transition-colors";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {isDrillMode ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToQuarterly}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            >
              <span className="text-sm leading-none">&larr;</span> Back to Quarterly
            </button>
            <p className="text-sm font-medium text-foreground">
              <span className="text-muted-foreground">{QUARTER_LABEL[drillMonth!]}</span>
              <span className="text-muted-foreground mx-1.5">&rsaquo;</span>
              <span>{drillMonth}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm font-medium text-foreground">
            Discrepancy Analysis by Category
          </p>
        )}
        <div className="flex bg-muted rounded-md p-0.5">
          <button
            onClick={() => { if (!isDrillMode) setView("quarterly"); }}
            className={`${segBtnBase} ${
              isDrillMode
                ? "bg-transparent text-muted-foreground opacity-40 cursor-not-allowed"
                : view === "quarterly"
                  ? "bg-card text-foreground shadow-sm cursor-pointer"
                  : "bg-transparent text-muted-foreground hover:text-foreground cursor-pointer"
            }`}
            disabled={isDrillMode}
          >
            Quarterly
          </button>
          <button
            onClick={() => { if (!isDrillMode) setView("daily"); }}
            className={`${segBtnBase} ${
              isDrillMode
                ? "bg-transparent text-muted-foreground opacity-40 cursor-not-allowed"
                : view === "daily"
                  ? "bg-card text-foreground shadow-sm cursor-pointer"
                  : "bg-transparent text-muted-foreground hover:text-foreground cursor-pointer"
            }`}
            disabled={isDrillMode}
          >
            Mar 2026
          </button>
        </div>
      </div>

      {isDrillMode ? (
        <div role="img" aria-label={`Daily discrepancy amounts for ${drillMonth}, horizontal bar chart`}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={drillDailyData} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" horizontal={false} vertical={true} stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={50} interval={0} />
            <Tooltip content={<DailyTooltip />} cursor={{ fill: "var(--accent)" }} />
            <Bar dataKey="amount" name="Discrepancy" fill="var(--chart-1)" radius={[0, 3, 3, 0]} barSize={6} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      ) : view === "quarterly" ? (
        <>
          <div role="img" aria-label="Discrepancy amount by product category, stacked by month from October 2025 to March 2026">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={discrepancyTrend} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" horizontal={false} vertical={true} stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="period" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<StackedTooltip />} cursor={{ fill: "var(--accent)" }} />
              {CATEGORY_KEYS.map(({ key, label, color }) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={label}
                  stackId="a"
                  fill={color}
                  radius={0}
                  barSize={20}
                  className="cursor-pointer"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            <span className="text-[11px] text-muted-foreground italic">Click a month to drill down</span>
            <span className="flex-1" />
            {CATEGORY_KEYS.map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div role="img" aria-label="Daily discrepancy amounts for March 2026, horizontal bar chart">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={discrepancyByDay} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" horizontal={false} vertical={true} stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<DailyTooltip />} cursor={{ fill: "var(--accent)" }} />
            <Bar dataKey="amount" name="Discrepancy" fill="var(--chart-1)" radius={[0, 3, 3, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
