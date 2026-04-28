"use client";

// ─── Pharmacy Scoring (SOM) ──────────────────────────────────────────────────
//
// SOM analog of /vendor-scoring. Same UX language: sortable table, expandable
// rows showing each pharmacy's SOM exception history, flag/penalize/remove
// actions. Score derives from license + address + price + volume + identity
// (see lib/som/data/pharmacyScoring.ts for weights).

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert, ChevronDown, ChevronRight, AlertTriangle, Flag, XCircle,
  ArrowUpDown, MapPin, ScrollText, DollarSign, BarChart3, Fingerprint,
} from "lucide-react";
import { pharmacyScores, type PharmacyScore } from "@/lib/som/data/pharmacyScoring";
import { formatCurrency } from "@/lib/data";
import { useToast } from "@/components/Toast";

function scoreColor(score: number): string {
  if (score < 30) return "text-red-600";
  if (score < 60) return "text-amber-600";
  if (score < 80) return "text-blue-600";
  return "text-emerald-600";
}

function ratingBadge(rating: string): string {
  if (rating === "Critical") return "badge critical";
  if (rating === "High Risk") return "badge warning";
  if (rating === "Medium Risk") return "badge neutral";
  return "badge success";
}

function rowRiskBg(score: number): string {
  if (score < 30) return "bg-red-50/50";
  if (score < 60) return "bg-amber-50/30";
  return "";
}

function flaggedColor(pct: number): string {
  if (pct > 25) return "text-red-600";
  if (pct > 5) return "text-amber-600";
  return "text-[#4b5563]";
}

const exceptionTypeLabels: Record<string, string> = {
  som_address_mismatch: "Address Mismatch",
  som_license_invalid: "License Invalid",
  som_price_deviation: "Price Deviation",
  som_quantity_outlier: "Volume Outlier",
};

type SortKey = "score" | "flaggedPct" | "flaggedAmount" | "totalSpend" | null;

export default function PharmacyScoringPage() {
  const { showToast } = useToast();
  const [expandedPharmacy, setExpandedPharmacy] = useState<string | null>(null);
  const [flaggedPharmacies, setFlaggedPharmacies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");  // lower score = higher risk = top

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const sorted = [...pharmacyScores].sort((a, b) => {
    if (!sortKey) return a.score - b.score;
    const av = (a as unknown as Record<string, number>)[sortKey];
    const bv = (b as unknown as Record<string, number>)[sortKey];
    return sortDir === "desc" ? bv - av : av - bv;
  });

  const totalFlagged = sorted.reduce((s, v) => s + v.flaggedAmount, 0);
  const highRiskCount = sorted.filter((v) => v.score < 60).length;
  const avgScore = Math.round(sorted.reduce((s, v) => s + v.score, 0) / sorted.length);

  const handleAction = (id: string, action: string) => {
    setFlaggedPharmacies((prev) => ({ ...prev, [id]: action }));
    const verb =
      action === "flag" ? "Flagged for review"
      : action === "penalize" ? "Penalty applied"
      : "Removed from approved network";
    showToast(`${verb} — ${sorted.find((p) => p.id === id)?.name ?? id}`, action === "remove" ? "warning" : "info");
  };

  function handleSortClick(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      // Score sorts ascending (lowest first = highest risk top); $$ sorts desc.
      setSortDir(key === "score" ? "asc" : "desc");
    }
  }

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert className="w-4 h-4 text-[#0065cb]" />
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#0065cb]">
                Drug Distributor · SOM
              </span>
            </div>
            <h1 className="text-xl font-semibold text-[#111827] tracking-tight leading-tight m-0">
              Pharmacy Risk Scoring
            </h1>
            <p className="text-xs text-[#4b5563] mt-1 m-0">
              Order-time risk across {sorted.length} pharmacies — license · address · price · volume · identity
            </p>
          </div>
          <button
            onClick={() => showToast("Pharmacy risk report exported as PDF", "success")}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#d1d5db] bg-white text-[#111827] hover:bg-[#f0f2f5] transition-colors cursor-pointer"
          >
            Export Report
          </button>
        </div>
      </div>

      <hr className="border-[#e5e7eb] m-0" />

      {/* Summary */}
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
              <p className="section-label">Pharmacies Scored</p>
              <p className="text-2xl font-bold text-[#111827] mt-1 m-0">{sorted.length}</p>
            </div>
            <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
              <p className="section-label">High / Critical Risk</p>
              <p className="text-2xl font-bold text-red-600 mt-1 m-0">{highRiskCount}</p>
            </div>
            <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
              <p className="section-label">Total Flagged $</p>
              <p className="text-2xl font-bold text-amber-600 mt-1 m-0">{formatCurrency(totalFlagged)}</p>
            </div>
            <div className="flex-1 px-6 py-4">
              <p className="section-label">Avg Risk Score</p>
              <p className={`text-2xl font-bold mt-1 m-0 ${scoreColor(avgScore)}`}>{avgScore}/100</p>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Table */}
      <div className="px-8 pb-8">
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Pharmacy</th>
                <th>Location</th>
                <th>
                  <button
                    onClick={() => handleSortClick("score")}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide font-semibold text-[#4b5563] hover:text-[#111827] bg-transparent border-none cursor-pointer"
                  >
                    Score
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>Rating</th>
                <th className="right">
                  <button
                    onClick={() => handleSortClick("totalSpend")}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide font-semibold text-[#4b5563] hover:text-[#111827] bg-transparent border-none cursor-pointer"
                  >
                    Spend
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="right">
                  <button
                    onClick={() => handleSortClick("flaggedAmount")}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide font-semibold text-[#4b5563] hover:text-[#111827] bg-transparent border-none cursor-pointer"
                  >
                    Flagged $
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="right">
                  <button
                    onClick={() => handleSortClick("flaggedPct")}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide font-semibold text-[#4b5563] hover:text-[#111827] bg-transparent border-none cursor-pointer"
                  >
                    Flagged %
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const expanded = expandedPharmacy === p.id;
                const action = flaggedPharmacies[p.id];
                return (
                  <ExpandablePharmacyRow
                    key={p.id}
                    pharmacy={p}
                    expanded={expanded}
                    onToggle={() => setExpandedPharmacy(expanded ? null : p.id)}
                    action={action}
                    onAction={handleAction}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Expandable row ──────────────────────────────────────────────────────────

function ExpandablePharmacyRow({
  pharmacy: p,
  expanded,
  onToggle,
  action,
  onAction,
}: {
  pharmacy: PharmacyScore;
  expanded: boolean;
  onToggle: () => void;
  action?: string;
  onAction: (id: string, kind: string) => void;
}) {
  return (
    <>
      <tr className={`group cursor-pointer hover:bg-[#f7f8fa] ${rowRiskBg(p.score)}`} onClick={onToggle}>
        <td className="text-[#9ca3af]">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </td>
        <td>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-[#111827]">{p.name}</span>
            <span className="text-[10px] text-[#9ca3af] font-mono">{p.id}</span>
          </div>
        </td>
        <td>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-[#9ca3af]" />
            <span className="text-xs text-[#4b5563]">{p.city}, {p.state}</span>
          </div>
        </td>
        <td className={`text-sm font-semibold tabular-nums ${scoreColor(p.score)}`}>
          {p.score}/100
        </td>
        <td>
          <span className={ratingBadge(p.rating)}>{p.rating}</span>
        </td>
        <td className="right text-xs tabular-nums text-[#111827]">
          {p.totalSpend > 0 ? formatCurrency(p.totalSpend) : "—"}
        </td>
        <td className={`right text-xs tabular-nums font-medium ${flaggedColor(p.flaggedPct)}`}>
          {p.flaggedAmount > 0 ? formatCurrency(p.flaggedAmount) : "—"}
        </td>
        <td className={`right text-xs tabular-nums font-medium ${flaggedColor(p.flaggedPct)}`}>
          {p.flaggedPct > 0 ? `${p.flaggedPct}%` : "—"}
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          {action ? (
            <span className={`text-[11px] font-medium ${
              action === "flag" ? "text-amber-700"
              : action === "penalize" ? "text-red-700"
              : "text-red-800"
            }`}>
              {action === "flag" ? "Flagged" : action === "penalize" ? "Penalised" : "Removed"}
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAction(p.id, "flag")}
                className="text-[10px] px-2 py-1 rounded border border-amber-300 bg-white text-amber-700 hover:bg-amber-50 cursor-pointer"
                title="Flag for review"
              >
                <Flag className="w-3 h-3" />
              </button>
              <button
                onClick={() => onAction(p.id, "penalize")}
                className="text-[10px] px-2 py-1 rounded border border-red-300 bg-white text-red-700 hover:bg-red-50 cursor-pointer"
                title="Apply penalty"
              >
                <AlertTriangle className="w-3 h-3" />
              </button>
              <button
                onClick={() => onAction(p.id, "remove")}
                className="text-[10px] px-2 py-1 rounded border border-red-300 bg-white text-red-700 hover:bg-red-50 cursor-pointer"
                title="Remove from approved network"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded panel */}
      {expanded && (
        <tr className="bg-[#f7f8fa]">
          <td colSpan={9} className="p-0">
            <div className="px-8 py-5 border-t border-[#e5e7eb]">
              <div className="grid grid-cols-[260px_1fr] gap-6">
                {/* Score breakdown */}
                <div>
                  <p className="section-label mb-2">Score breakdown</p>
                  <div className="card p-4 flex flex-col gap-2">
                    <ScoreBar icon={ScrollText} label="License (40%)" value={p.components.license} />
                    <ScoreBar icon={MapPin} label="Address (20%)" value={p.components.address} />
                    <ScoreBar icon={DollarSign} label="Price (15%)" value={p.components.price} />
                    <ScoreBar icon={BarChart3} label="Volume (15%)" value={p.components.volume} />
                    <ScoreBar icon={Fingerprint} label="Identity (10%)" value={p.components.identity} />
                  </div>
                </div>

                {/* Exception history */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="section-label m-0">Exception history</p>
                    <span className="text-[10px] text-[#9ca3af]">
                      {p.exceptions.length} exception{p.exceptions.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="card max-h-[400px] overflow-y-auto">
                    {p.exceptions.length === 0 ? (
                      <div className="p-5 text-center">
                        <p className="text-xs text-[#9ca3af] m-0">No SOM exceptions on file</p>
                      </div>
                    ) : (
                      <table className="data-table w-full">
                        <thead className="sticky top-0 bg-white">
                          <tr>
                            <th>Type</th>
                            <th>Detected</th>
                            <th className="right">Flagged</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.exceptions.map((ex) => (
                            <tr key={ex.id}>
                              <td>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[11px] font-medium text-[#111827]">
                                    {exceptionTypeLabels[ex.type] || ex.type}
                                  </span>
                                  <span className="text-[10px] text-[#9ca3af] font-mono">{ex.id}</span>
                                </div>
                              </td>
                              <td className="text-[11px] text-[#4b5563]">
                                {new Date(ex.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td className="right text-[11px] tabular-nums font-medium text-red-600">
                                {formatCurrency(ex.amount)}
                              </td>
                              <td>
                                <Link
                                  href={`/exceptions/${ex.id}`}
                                  className="text-[11px] text-[#0065cb] no-underline hover:underline"
                                >
                                  View →
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Score bar (component contribution) ──────────────────────────────────────

function ScoreBar({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: number;
}) {
  const color =
    value < 30 ? "bg-red-500"
    : value < 60 ? "bg-amber-500"
    : value < 80 ? "bg-blue-500"
    : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3 h-3 text-[#9ca3af] flex-shrink-0" />
      <span className="text-[10px] text-[#4b5563] flex-shrink-0 w-[110px]">{label}</span>
      <div className="flex-1 bg-[#f0f2f5] rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className={`text-[10px] tabular-nums font-medium w-[28px] text-right ${scoreColor(value)}`}>
        {value}
      </span>
    </div>
  );
}
