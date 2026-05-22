// [Spec: domains/product-analysis/spec.md v2.0] — migrated to shadcn v2.0 design system.
// v1 tokens, hex status classes and v1 chart tokens replaced with shadcn theme tokens.
// See spec CHANGELOG 2026-05-22.
"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, TrendingUp, Package, AlertTriangle, ArrowUpDown } from "lucide-react";
import { allExceptions, formatCurrency, CATEGORY_CONFIG } from "@/lib/data";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CategoryRow {
  category: string;
  exceptionCount: number;
  totalFlagged: number;
  avgDiscrepancy: number;
  resolutionRate: number;
  topVendor: string;
  trend: "up" | "down" | "flat";
}

type SortKey = "category" | "exceptionCount" | "totalFlagged" | null;

// Trend icon — color is paired with an aria-label so it is never the only signal.
// [Spec: domains/product-analysis/spec.md#Acceptance Criteria — Trend indicators]
function trendIcon(trend: "up" | "down" | "flat") {
  if (trend === "up")
    return (
      <TrendingUp
        className="w-3.5 h-3.5 text-destructive inline"
        aria-label="Worsening"
      />
    );
  if (trend === "down")
    return (
      <TrendingUp
        className="w-3.5 h-3.5 text-success-text inline rotate-180"
        aria-label="Improving"
      />
    );
  return (
    <span className="text-muted-foreground text-xs" aria-label="No change">
      —
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-md shadow-md px-3 py-2.5 text-xs">
      <p className="text-muted-foreground mb-1 text-[11px] font-medium">{label}</p>
      <p className="mb-0 flex items-center gap-1.5">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: payload[0]?.fill }}
        />
        <span className="text-muted-foreground">Exceptions</span>
        <span className="font-medium text-foreground ml-auto">{payload[0].value}</span>
      </p>
    </div>
  );
}

// Resolution-rate text color — uses the AA-safe -text status tokens.
// [Spec: domains/product-analysis/spec.md#Forbidden Patterns]
function resolutionRateClass(rate: number): string {
  if (rate >= 40) return "text-success-text";
  if (rate >= 20) return "text-warning-text";
  return "text-destructive";
}

export default function ProductAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("exceptionCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const categoryData = useMemo(() => {
    const grouped: Record<string, typeof allExceptions> = {};
    for (const ex of allExceptions) {
      const cat = ex.category || "Uncategorized";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(ex);
    }

    const rows: CategoryRow[] = Object.entries(grouped).map(([category, exs]) => {
      const totalFlagged = exs.reduce((s, e) => s + e.flaggedAmount, 0);
      const totalAmount = exs.reduce((s, e) => s + e.amount, 0);
      const avgDiscrepancy = totalAmount > 0 ? (totalFlagged / totalAmount) * 100 : 0;
      const resolved = exs.filter((e) => e.status === "resolved").length;
      const resolutionRate = exs.length > 0 ? (resolved / exs.length) * 100 : 0;

      const vendorCounts: Record<string, number> = {};
      for (const e of exs) {
        vendorCounts[e.vendor] = (vendorCounts[e.vendor] || 0) + 1;
      }
      const topVendor = Object.entries(vendorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      let trend: "up" | "down" | "flat" = "flat";
      if (exs.length > 5) trend = "up";
      else if (resolutionRate > 50) trend = "down";

      return { category, exceptionCount: exs.length, totalFlagged, avgDiscrepancy, resolutionRate, topVendor, trend };
    });

    return rows;
  }, []);

  const sorted = useMemo(() => {
    return [...categoryData].sort((a, b) => {
      if (!sortKey) return b.exceptionCount - a.exceptionCount;
      if (sortKey === "category") {
        return sortDir === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
      }
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortDir === "desc" ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });
  }, [categoryData, sortKey, sortDir]);

  const totalCategories = categoryData.length;

  // Overall resolution rate — computed from real data (replaces a hard-coded figure).
  // [Spec: domains/product-analysis/spec.md#Acceptance Criteria — Summary strip]
  const resolvedRate =
    allExceptions.length > 0
      ? Math.round(
          (allExceptions.filter((e) => e.status === "resolved").length / allExceptions.length) * 100
        )
      : 0;

  const mostFlagged = useMemo(() => {
    const top = [...categoryData].sort((a, b) => b.exceptionCount - a.exceptionCount)[0];
    return top ? { name: top.category, count: top.exceptionCount } : { name: "N/A", count: 0 };
  }, [categoryData]);

  const highestValue = useMemo(() => {
    const top = [...categoryData].sort((a, b) => b.totalFlagged - a.totalFlagged)[0];
    return top ? { name: top.category, amount: top.totalFlagged } : { name: "N/A", amount: 0 };
  }, [categoryData]);

  const chartData = useMemo(() => {
    return [...categoryData]
      .sort((a, b) => b.exceptionCount - a.exceptionCount)
      .map((row) => ({
        name: row.category,
        count: row.exceptionCount,
        color: CATEGORY_CONFIG[row.category]?.text || "var(--muted-foreground)",
      }));
  }, [categoryData]);

  function handleSortClick(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  // aria-sort value for a sortable header. [Spec: domains/product-analysis/spec.md#Acceptance Criteria]
  function ariaSortFor(key: SortKey): "ascending" | "descending" | "none" {
    if (sortKey !== key) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="px-4 lg:px-6 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-tight m-0">
              Product Category Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1 m-0">
              Exception distribution across {totalCategories} product categories
            </p>
          </div>
        </div>
      </div>

      <hr className="border-border m-0" />

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      {/* [Spec: domains/product-analysis/spec.md#Summary Strip] */}
      <div className="px-4 lg:px-6 py-6">
        <Card className="py-0">
          <div className="flex divide-x divide-border">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 px-6 py-4">
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-7 w-16" />
                </div>
              ))
            ) : (
              <>
                <div className="flex-1 px-6 py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Total Categories
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1 m-0 tabular-nums">
                    {totalCategories}
                  </p>
                </div>
                <div className="flex-1 px-6 py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Most Flagged Category
                  </p>
                  <p className="text-2xl font-bold text-destructive mt-1 m-0">
                    {mostFlagged.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 m-0 tabular-nums">
                    {mostFlagged.count} exceptions
                  </p>
                </div>
                <div className="flex-1 px-6 py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Highest Value Category
                  </p>
                  <p className="text-2xl font-bold text-warning-text mt-1 m-0">
                    {highestValue.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 m-0 tabular-nums">
                    {formatCurrency(highestValue.amount)}
                  </p>
                </div>
                <div className="flex-1 px-6 py-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Resolution Rate
                  </p>
                  <p className="text-2xl font-bold text-success-text mt-1 m-0 tabular-nums">
                    {resolvedRate}%
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ── Category table ────────────────────────────────────────────────── */}
      {/* [Spec: domains/product-analysis/spec.md#Category Table] */}
      <div className="px-4 lg:px-6 pb-6">
        <Card className="py-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead aria-sort={ariaSortFor("category")}>
                    <button
                      type="button"
                      onClick={() => handleSortClick("category")}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      Category
                      <ArrowUpDown
                        className={`w-3 h-3 ${
                          sortKey === "category" ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="text-right" aria-sort={ariaSortFor("exceptionCount")}>
                    <button
                      type="button"
                      onClick={() => handleSortClick("exceptionCount")}
                      className="inline-flex items-center gap-1 flex-row-reverse transition-colors hover:text-foreground"
                    >
                      Exception Count
                      <ArrowUpDown
                        className={`w-3 h-3 ${
                          sortKey === "exceptionCount" ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="text-right" aria-sort={ariaSortFor("totalFlagged")}>
                    <button
                      type="button"
                      onClick={() => handleSortClick("totalFlagged")}
                      className="inline-flex items-center gap-1 flex-row-reverse transition-colors hover:text-foreground"
                    >
                      Total Flagged Amount
                      <ArrowUpDown
                        className={`w-3 h-3 ${
                          sortKey === "totalFlagged" ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Avg Discrepancy %</TableHead>
                  <TableHead className="text-right">Resolution Rate</TableHead>
                  <TableHead>Top Vendor</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? [1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-3.5 w-8 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-3.5 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-3.5 w-10 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-3.5 w-10 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-3.5 w-6" /></TableCell>
                      </TableRow>
                    ))
                  : sorted.map((row) => (
                      <TableRow key={row.category}>
                        <TableCell>
                          <CategoryBadge category={row.category} />
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums font-medium">
                          {row.exceptionCount}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums font-medium text-destructive">
                          {formatCurrency(row.totalFlagged)}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {row.avgDiscrepancy.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`text-xs tabular-nums font-semibold ${resolutionRateClass(
                              row.resolutionRate
                            )}`}
                          >
                            {row.resolutionRate.toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {row.topVendor}
                        </TableCell>
                        <TableCell>{trendIcon(row.trend)}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* ── Exception distribution chart ──────────────────────────────────── */}
      {/* [Spec: domains/product-analysis/spec.md#Exception Distribution Chart] */}
      {!loading && (
        <div className="px-4 lg:px-6 pb-8">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-base font-medium text-foreground m-0">
                  Exception Distribution by Category
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                role="img"
                aria-label={`Horizontal bar chart of exception counts across ${chartData.length} product categories, sorted highest to lowest`}
              >
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" horizontal={false} vertical stroke="var(--border)" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      width={130}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="count" name="Exceptions" radius={[0, 3, 3, 0]} barSize={24}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {chartData.map((entry) => (
                  <span
                    key={entry.name}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.name}
                  </span>
                ))}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
