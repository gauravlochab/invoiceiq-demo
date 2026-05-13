"use client";

import { useState, useEffect, useMemo } from "react";
import { Shield, ChevronDown, ChevronRight, AlertTriangle, Flag, XCircle, ArrowUpDown } from "lucide-react";
import { vendorScores, formatCurrency, formatDate } from "@/lib/data";
import { useToast } from "@/components/Toast";
import { VendorBadge } from "@/components/VendorBadge";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

function scoreColor(score: number): string {
  if (score < 30) return "text-red-600";
  if (score < 60) return "text-amber-600";
  return "text-emerald-600";
}

function ratingBadge(rating: string): string {
  if (rating === "Critical") return "badge critical";
  if (rating === "High Risk") return "badge warning";
  if (rating === "Medium Risk") return "badge neutral";
  return "badge success";
}

function discrepancyColor(pct: number): string {
  if (pct > 15) return "text-red-600";
  if (pct > 5) return "text-amber-600";
  return "text-[var(--text-secondary)]";
}

function rowRiskBg(discrepancyPct: number): string {
  if (discrepancyPct > 15) return "bg-red-50/50";
  if (discrepancyPct > 5) return "bg-amber-50/30";
  return "";
}

function recoveryColor(pct: number): string {
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 40) return "text-amber-600";
  return "text-red-600";
}

type VendorSortKey = "score" | "discrepancyPct" | "discrepancyAmount" | "totalSpend" | "recoveryPct" | null;

export default function VendorScoringPage() {
  const { showToast } = useToast();
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [flaggedVendors, setFlaggedVendors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Sort state
  const [sortKey, setSortKey] = useState<VendorSortKey>("discrepancyPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Simulated loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const sorted = useMemo(
    () =>
      [...vendorScores].sort((a, b) => {
        if (!sortKey) return b.discrepancyPct - a.discrepancyPct;
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        return sortDir === "desc" ? bVal - aVal : aVal - bVal;
      }),
    [sortKey, sortDir]
  );

  // Pagination derived values
  const pageCount = Math.ceil(sorted.length / pageSize);
  const paginatedVendors = sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const totalDiscrepancy = sorted.reduce((s, v) => s + v.discrepancyAmount, 0);
  const highRiskCount = sorted.filter((v) => v.score < 40).length;
  const avgScore = Math.round(sorted.reduce((s, v) => s + v.score, 0) / sorted.length);
  const avgRecovery = Math.round(sorted.reduce((s, v) => s + v.recoveryPct, 0) / sorted.length);

  const handleFlag = (vendorId: string, action: string) => {
    setFlaggedVendors((prev) => ({ ...prev, [vendorId]: action }));
  };

  function handleSortClick(key: VendorSortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPageIndex(0);
  }

  return (
    <div className="bg-[var(--bg-base)] min-h-screen">
      {/* Header */}
      <div className="px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-tight m-0">
              Vendor Scoring
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 m-0">
              Risk assessment across {sorted.length} vendors · Q1 2026
            </p>
          </div>
          <button
            onClick={() => showToast("Vendor risk report exported as PDF", "success")}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border-strong)] bg-white text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            Export Report
          </button>
        </div>
      </div>

      <hr className="border-[var(--border)] m-0" />

      {/* Summary Strip */}
      {loading ? (
        <div className="px-6 lg:px-8 py-6">
          <div className="flex border border-[var(--border)] rounded-lg bg-white">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex-1 px-6 py-4 ${i < 5 ? "border-r border-[var(--border)]" : ""}`}>
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
              <p className="section-label">Vendors Scored</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 m-0">{sorted.length}</p>
            </div>
            <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
              <p className="section-label">High Risk</p>
              <p className="text-2xl font-bold text-red-600 mt-1 m-0">{highRiskCount}</p>
            </div>
            <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
              <p className="section-label">Total Discrepancy</p>
              <p className="text-2xl font-bold text-amber-600 mt-1 m-0">{formatCurrency(totalDiscrepancy)}</p>
            </div>
            <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
              <p className="section-label">Avg Score</p>
              <p className={`text-2xl font-bold mt-1 m-0 ${scoreColor(avgScore)}`}>{avgScore}/100</p>
            </div>
            <div className="flex-1 px-6 py-4">
              <p className="section-label">Avg Recovery</p>
              <p className={`text-2xl font-bold mt-1 m-0 ${recoveryColor(avgRecovery)}`}>{avgRecovery}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Table */}
      <div className="px-6 lg:px-8 pb-8">
        <div className="card overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th className="w-7"></th>
                <th>Vendor</th>
                <th className="right">Invoices</th>
                <th
                  className="right cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                  onClick={() => handleSortClick("totalSpend")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Total Spend <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="right cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                  onClick={() => handleSortClick("discrepancyAmount")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Discrepancy <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="right cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                  onClick={() => handleSortClick("discrepancyPct")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Discrepancy % <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="right cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                  onClick={() => handleSortClick("recoveryPct")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Recovery % <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="right cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                  onClick={() => handleSortClick("score")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Score <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th>Rating</th>
                <th className="min-w-[100px]">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td><div className="h-3.5 w-3.5 bg-[var(--border)] rounded animate-pulse mx-auto" /></td>
                    <td><div className="h-3.5 bg-[var(--border)] rounded animate-pulse" style={{ width: `${55 + i * 7}%` }} /></td>
                    <td className="right"><div className="h-3.5 w-8 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-16 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-14 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-10 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-10 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-8 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                    <td><div className="h-5 w-20 bg-[var(--border)] rounded animate-pulse" /></td>
                    <td><div className="h-3.5 w-24 bg-[var(--border)] rounded animate-pulse" /></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <>
                {paginatedVendors.map((vendor) => {
                  const isExpanded = expandedVendor === vendor.id;
                  const flagAction = flaggedVendors[vendor.id];

                  return (
                    <tbody key={vendor.id}>
                      <tr
                        className={`cursor-pointer hover:bg-[var(--bg-base)] transition-colors duration-150 ${rowRiskBg(vendor.discrepancyPct)}`}
                        onClick={() => setExpandedVendor(isExpanded ? null : vendor.id)}
                      >
                        <td className="text-center">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] inline" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] inline" />
                          )}
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-2">
                            <VendorBadge name={vendor.name} size="sm" />
                            {flagAction && (
                              <span className="badge critical">
                                {flagAction}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="right text-xs tabular-nums">{vendor.totalInvoices}</td>
                        <td className="right text-xs tabular-nums">{formatCurrency(vendor.totalSpend)}</td>
                        <td className={`right text-xs tabular-nums font-medium ${discrepancyColor(vendor.discrepancyPct)}`}>
                          {formatCurrency(vendor.discrepancyAmount)}
                        </td>
                        <td className="right">
                          <span className={`text-xs tabular-nums font-semibold ${discrepancyColor(vendor.discrepancyPct)}`}>
                            {vendor.discrepancyPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="right">
                          <span className={`text-xs tabular-nums font-semibold ${recoveryColor(vendor.recoveryPct)}`}>
                            {vendor.recoveryPct}%
                          </span>
                        </td>
                        <td className="right">
                          <span className={`text-sm font-bold tabular-nums ${scoreColor(vendor.score)}`}>
                            {vendor.score}
                          </span>
                        </td>
                        <td>
                          <span className={ratingBadge(vendor.rating)}>{vendor.rating}</span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {!flagAction ? (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => { if (confirm("Flag " + vendor.name + " as high-risk vendor?")) { handleFlag(vendor.id, "Flagged"); showToast(vendor.name + " flagged as high-risk", "warning"); } }}
                                className="p-1.5 rounded hover:bg-amber-50 text-[var(--text-muted)] hover:text-amber-600 transition-colors cursor-pointer bg-transparent border-none flex items-center"
                                title="Flag as high-risk"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { if (confirm("Recommend penalty for " + vendor.name + "?")) { handleFlag(vendor.id, "Penalized"); showToast(vendor.name + " recommended for penalty", "error"); } }}
                                className="p-1.5 rounded hover:bg-red-50 text-[var(--text-muted)] hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none flex items-center"
                                title="Recommend for penalty"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { if (confirm("Remove " + vendor.name + " as supplier?")) { handleFlag(vendor.id, "Removed"); showToast(vendor.name + " removed from approved suppliers", "error"); } }}
                                className="p-1.5 rounded hover:bg-red-50 text-[var(--text-muted)] hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none flex items-center"
                                title="Remove as supplier"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">Done</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded exception history */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="bg-[var(--bg-subtle)] px-8 py-4 border-t border-[var(--border)]">
                            <p className="section-label mb-2">Exception History</p>
                            <div className="space-y-2">
                              {vendor.exceptions.map((ex) => (
                                <div key={ex.id} className="card px-4 py-3 flex items-start gap-4">
                                  <div className="flex-shrink-0">
                                    <span className="font-mono text-xs text-[var(--text-muted)]">{ex.id}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="badge warning">{ex.type}</span>
                                      <span className="text-xs text-[var(--text-muted)]">{formatDate(ex.date)}</span>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">{ex.description}</p>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <span className="text-xs font-medium text-red-600 tabular-nums">{formatCurrency(ex.amount)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </>
            )}
          </table>
          <DataTablePagination
            pageIndex={pageIndex}
            pageCount={pageCount}
            pageSize={pageSize}
            totalRows={sorted.length}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
          />
        </div>
      </div>
    </div>
  );
}
