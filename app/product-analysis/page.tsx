"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, TrendingUp, Package, AlertTriangle, ArrowUpDown } from "lucide-react";
import { allExceptions, formatCurrency, CATEGORY_CONFIG } from "@/lib/data";
import { CategoryBadge } from "@/components/CategoryBadge";
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

function trendIcon(trend: "up" | "down" | "flat") {
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-red-500 inline" />;
  if (trend === "down") return <TrendingUp className="w-3.5 h-3.5 text-emerald-500 inline rotate-180" />;
  return <span className="text-[var(--text-muted)] text-xs">--</span>;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--border)] rounded-md shadow-md px-3 py-2.5 text-xs">
      <p className="text-[var(--text-muted)] mb-1 text-[11px] font-medium">{label}</p>
      <p className="mb-0 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: payload[0]?.fill }} />
        <span className="text-[var(--text-secondary)]">Exceptions</span>
        <span className="font-medium text-[var(--text-primary)] ml-auto">{payload[0].value}</span>
      </p>
    </div>
  );
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
        color: CATEGORY_CONFIG[row.category]?.text || "var(--text-tertiary)",
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

  return (
    <div className="bg-[var(--bg-base)] min-h-screen">
      <div className="px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-tight m-0">
              Product Category Analysis
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 m-0">
              Exception distribution across {totalCategories} product categories
            </p>
          </div>
        </div>
      </div>

      <hr className="border-[var(--border)] m-0" />

      {loading ? (
        <div className="px-6 lg:px-8 py-6">
          <div className="flex border border-[var(--border)] rounded-lg bg-white">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex-1 px-6 py-4 ${i < 4 ? "border-r border-[var(--border)]" : ""}`}>
                <div className="h-3 w-20 bg-[var(--border)] rounded animate-pulse mb-3" />
                <div className="h-7 w-14 bg-[var(--border)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-6 lg:px-8 py-6">
          <div className="flex border border-[var(--border)] rounded-lg bg-white">
            <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
              <p className="section-label flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Total Categories
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 m-0">{totalCategories}</p>
            </div>
            <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
              <p className="section-label flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Most Flagged Category
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1 m-0">{mostFlagged.name}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 m-0">{mostFlagged.count} exceptions</p>
            </div>
            <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
              <p className="section-label flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Highest Value Category
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1 m-0">{highestValue.name}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 m-0">{formatCurrency(highestValue.amount)}</p>
            </div>
            <div className="flex-1 px-6 py-4">
              <p className="section-label flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Avg Resolution Time
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1 m-0">3.2 days</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 lg:px-8 pb-6">
        <div className="card overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th
                  className="cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                  onClick={() => handleSortClick("category")}
                >
                  <span className="inline-flex items-center gap-1">
                    Category <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="right cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                  onClick={() => handleSortClick("exceptionCount")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Exception Count <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="right cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                  onClick={() => handleSortClick("totalFlagged")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Total Flagged Amount <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="right">Avg Discrepancy %</th>
                <th className="right">Resolution Rate</th>
                <th>Top Vendor</th>
                <th>Trend</th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td><div className="h-5 w-28 bg-[var(--border)] rounded-full animate-pulse" /></td>
                    <td className="right"><div className="h-3.5 w-8 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-16 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-10 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-10 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                    <td><div className="h-3.5 w-24 bg-[var(--border)] rounded animate-pulse" /></td>
                    <td><div className="h-3.5 w-6 bg-[var(--border)] rounded animate-pulse" /></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.category} className="hover:bg-[var(--bg-base)] transition-colors duration-150">
                    <td>
                      <CategoryBadge category={row.category} />
                    </td>
                    <td className="right text-xs tabular-nums font-medium">{row.exceptionCount}</td>
                    <td className="right text-xs tabular-nums font-medium text-red-600">{formatCurrency(row.totalFlagged)}</td>
                    <td className="right text-xs tabular-nums">{row.avgDiscrepancy.toFixed(1)}%</td>
                    <td className="right">
                      <span className={`text-xs tabular-nums font-semibold ${row.resolutionRate >= 40 ? "text-emerald-600" : row.resolutionRate >= 20 ? "text-amber-600" : "text-red-600"}`}>
                        {row.resolutionRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-xs text-[var(--text-secondary)] truncate max-w-[180px]">{row.topVendor}</td>
                    <td>{trendIcon(row.trend)}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {!loading && (
        <div className="px-6 lg:px-8 pb-8">
          <div className="card p-6">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-4">Exception Distribution by Category</p>
            <div role="img" aria-label="Exception distribution by product category bar chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" horizontal={false} vertical stroke="var(--chart-grid)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} width={130} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="count" name="Exceptions" radius={[0, 3, 3, 0]} barSize={24}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 px-1">
              {chartData.map((entry) => (
                <span key={entry.name} className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
