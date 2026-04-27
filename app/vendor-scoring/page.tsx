"use client";

import { useState, useEffect } from "react";
import { Shield, ChevronDown, ChevronRight, AlertTriangle, Flag, XCircle, ArrowUpDown } from "lucide-react";
import { vendorScores, formatCurrency, formatDate } from "@/lib/data";
import { useToast } from "@/components/Toast";

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
  return "text-[#4b5563]";
}

function rowRiskBg(discrepancyPct: number): string {
  if (discrepancyPct > 15) return "bg-red-50/50";
  if (discrepancyPct > 5) return "bg-amber-50/30";
  return "";
}

type VendorSortKey = "score" | "discrepancyPct" | "discrepancyAmount" | "totalSpend" | null;

export default function VendorScoringPage() {
  const { showToast } = useToast();
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [flaggedVendors, setFlaggedVendors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Sort state
  const [sortKey, setSortKey] = useState<VendorSortKey>("discrepancyPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Simulated loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const sorted = [...vendorScores].sort((a, b) => {
    if (!sortKey) return b.discrepancyPct - a.discrepancyPct;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  const totalDiscrepancy = sorted.reduce((s, v) => s + v.discrepancyAmount, 0);
  const highRiskCount = sorted.filter((v) => v.score < 40).length;
  const avgScore = Math.round(sorted.reduce((s, v) => s + v.score, 0) / sorted.length);

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
  }

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#111827] tracking-tight leading-tight m-0">
              Vendor Scoring
            </h1>
            <p className="text-xs text-[#4b5563] mt-1 m-0">
              Risk assessment across {sorted.length} vendors · Q1 2026
            </p>
          </div>
          <button
            onClick={() => showToast("Vendor risk report exported as PDF", "success")}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#d1d5db] bg-white text-[#111827] hover:bg-[#f0f2f5] transition-colors cursor-pointer"
          >
            Export Report
          </button>
        </div>
      </div>

      <hr className="border-[#e5e7eb] m-0" />

      {/* Summary Strip */}
      {loading ? (
        <div className="px-8 py-6">
          <div className="flex border border-[#e5e7eb] rounded-lg bg-white">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex-1 px-6 py-4 ${i < 4 ? "border-r border-[#e5e7eb]" : ""}`}>
                <div className="h-3 w-20 bg-[#e5e7eb] rounded animate-pulse mb-3" />
                <div className="h-7 w-14 bg-[#e5e7eb] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-8 py-6">
          <div className="flex border border-[#e5e7eb] rounded-lg bg-white">
            <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
              <p className="section-label">Vendors Scored</p>
              <p className="text-2xl font-bold text-[#111827] mt-1 m-0">{sorted.length}</p>
            </div>
            <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
              <p className="section-label">High Risk</p>
              <p className="text-2xl font-bold text-red-600 mt-1 m-0">{highRiskCount}</p>
            </div>
            <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
              <p className="section-label">Total Discrepancy</p>
              <p className="text-2xl font-bold text-amber-600 mt-1 m-0">{formatCurrency(totalDiscrepancy)}</p>
            </div>
            <div className="flex-1 px-6 py-4">
              <p className="section-label">Avg Score</p>
              <p className={`text-2xl font-bold mt-1 m-0 ${scoreColor(avgScore)}`}>{avgScore}/100</p>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Table */}
      <div className="px-8 pb-8">
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th>Vendor</th>
                <th className="right">Invoices</th>
                <th
                  className="right cursor-pointer hover:text-[#111827] transition-colors select-none"
                  onClick={() => handleSortClick("totalSpend")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Total Spend <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="right cursor-pointer hover:text-[#111827] transition-colors select-none"
                  onClick={() => handleSortClick("discrepancyAmount")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Discrepancy <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="right cursor-pointer hover:text-[#111827] transition-colors select-none"
                  onClick={() => handleSortClick("discrepancyPct")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Discrepancy % <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="right cursor-pointer hover:text-[#111827] transition-colors select-none"
                  onClick={() => handleSortClick("score")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Score <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td><div className="h-3.5 w-3.5 bg-[#e5e7eb] rounded animate-pulse mx-auto" /></td>
                    <td><div className="h-3.5 bg-[#e5e7eb] rounded animate-pulse" style={{ width: `${55 + i * 7}%` }} /></td>
                    <td className="right"><div className="h-3.5 w-8 bg-[#e5e7eb] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-16 bg-[#e5e7eb] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-14 bg-[#e5e7eb] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-10 bg-[#e5e7eb] rounded animate-pulse ml-auto" /></td>
                    <td className="right"><div className="h-3.5 w-8 bg-[#e5e7eb] rounded animate-pulse ml-auto" /></td>
                    <td><div className="h-5 w-20 bg-[#e5e7eb] rounded animate-pulse" /></td>
                    <td><div className="h-3.5 w-24 bg-[#e5e7eb] rounded animate-pulse" /></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <>
                {sorted.map((vendor) => {
                  const isExpanded = expandedVendor === vendor.id;
                  const flagAction = flaggedVendors[vendor.id];

                  return (
                    <tbody key={vendor.id}>
                      <tr
                        className={`cursor-pointer hover:bg-[#f7f8fa] transition-colors duration-100 ${rowRiskBg(vendor.discrepancyPct)}`}
                        onClick={() => setExpandedVendor(isExpanded ? null : vendor.id)}
                      >
                        <td className="text-center">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af] inline" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af] inline" />
                          )}
                        </td>
                        <td>
                          <span className="text-xs font-medium text-[#111827]">{vendor.name}</span>
                          {flagAction && (
                            <span className="badge critical ml-2">
                              {flagAction}
                            </span>
                          )}
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
                          <span className={`text-sm font-bold tabular-nums ${scoreColor(vendor.score)}`}>
                            {vendor.score}
                          </span>
                        </td>
                        <td>
                          <span className={ratingBadge(vendor.rating)}>{vendor.rating}</span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {!flagAction ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => { if (confirm("Flag " + vendor.name + " as high-risk vendor?")) { handleFlag(vendor.id, "Flagged"); showToast(vendor.name + " flagged as high-risk", "warning"); } }}
                                className="p-1 rounded hover:bg-amber-50 text-[#9ca3af] hover:text-amber-600 transition-colors cursor-pointer bg-transparent border-none text-[10px] gap-0.5 flex items-center"
                                title="Red Flag Vendor"
                              >
                                <Flag className="w-3.5 h-3.5" />
                                Flag
                              </button>
                              <button
                                onClick={() => { if (confirm("Recommend penalty for " + vendor.name + "?")) { handleFlag(vendor.id, "Penalized"); showToast(vendor.name + " recommended for penalty", "error"); } }}
                                className="p-1 rounded hover:bg-red-50 text-[#9ca3af] hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none text-[10px] gap-0.5 flex items-center"
                                title="Recommend for Penalty"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Penalize
                              </button>
                              <button
                                onClick={() => { if (confirm("Remove " + vendor.name + " as supplier?")) { handleFlag(vendor.id, "Removed"); showToast(vendor.name + " removed from approved suppliers", "error"); } }}
                                className="p-1 rounded hover:bg-red-50 text-[#9ca3af] hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none text-[10px] gap-0.5 flex items-center"
                                title="Remove as Supplier"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#9ca3af]">Done</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded exception history */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="bg-[#f0f2f5] px-8 py-4 border-t border-[#e5e7eb]">
                            <p className="section-label mb-2">Exception History</p>
                            <div className="space-y-2">
                              {vendor.exceptions.map((ex) => (
                                <div key={ex.id} className="card px-4 py-3 flex items-start gap-4">
                                  <div className="flex-shrink-0">
                                    <span className="font-mono text-xs text-[#9ca3af]">{ex.id}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="badge warning">{ex.type}</span>
                                      <span className="text-xs text-[#9ca3af]">{formatDate(ex.date)}</span>
                                    </div>
                                    <p className="text-xs text-[#4b5563] m-0 leading-relaxed">{ex.description}</p>
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
        </div>
      </div>
    </div>
  );
}
