"use client";

// ─── SOM Exceptions — Drug Distributor inbox ──────────────────────────────────
//
// SOM-scoped analog of /exceptions. Lists only exceptions whose type starts
// with `som_`, with vocabulary tuned for the drug-distributor vertical:
//   - "Pharmacy" instead of "Vendor"
//   - "Order #" instead of "Invoice #"
//   - "Order amount" instead of "Invoice amount"
//
// Each row deep-links to /exceptions/[id] which already routes SOM-* IDs to
// SomExceptionDetail (built in Phase 2). The unified /exceptions page stays
// untouched and continues to show all verticals.

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowUpDown, MapPin } from "lucide-react";
import {
  exceptions,
  formatCurrency,
  formatDate,
  type Severity,
  type Status,
} from "@/lib/data";

// SOM-only filter
const somExceptions = exceptions.filter((e) => e.type.startsWith("som_"));

// ─── Filter options (SOM-scoped) ──────────────────────────────────────────────

type FilterKey =
  | "all"
  | "open"
  | "critical"
  | "high"
  | "som_address_mismatch"
  | "som_license_invalid"
  | "som_price_deviation"
  | "som_quantity_outlier";

function applyFilter(filter: FilterKey) {
  switch (filter) {
    case "open":
      return somExceptions.filter(
        (e) => e.status === "open" || e.status === "under_review" || e.status === "escalated",
      );
    case "critical":
      return somExceptions.filter((e) => e.severity === "critical");
    case "high":
      return somExceptions.filter((e) => e.severity === "high");
    case "som_address_mismatch":
    case "som_license_invalid":
    case "som_price_deviation":
    case "som_quantity_outlier":
      return somExceptions.filter((e) => e.type === filter);
    default:
      return somExceptions;
  }
}

const somTypeLabels: Record<string, string> = {
  som_address_mismatch: "Address Mismatch",
  som_license_invalid: "License Invalid",
  som_price_deviation: "Price Deviation",
  som_quantity_outlier: "Volume Outlier",
};

// ─── Style helpers ────────────────────────────────────────────────────────────

function typeBadgeClass(type: string): string {
  if (type === "som_license_invalid" || type === "som_quantity_outlier") return "badge critical";
  if (type === "som_address_mismatch" || type === "som_price_deviation") return "badge warning";
  return "badge neutral";
}

function statusBadgeClass(status: Status): string {
  if (status === "open") return "badge critical";
  if (status === "under_review") return "badge warning";
  if (status === "escalated") return "badge blue";
  if (status === "resolved") return "badge success";
  return "badge neutral";
}

function severityDotClass(severity: Severity): string {
  if (severity === "critical") return "status-dot critical";
  if (severity === "high") return "status-dot warning";
  if (severity === "medium") return "status-dot blue";
  return "status-dot neutral";
}

function flaggedColor(severity: Severity): string {
  if (severity === "critical" || severity === "high") return "var(--critical)";
  if (severity === "medium") return "var(--warning)";
  return "var(--text-secondary)";
}

// ─── Sort ────────────────────────────────────────────────────────────────────

type SortKey = "flaggedAmount" | "detectedAt" | null;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SomExceptionsPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("detectedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = applyFilter(filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "flaggedAmount") {
      return sortDir === "desc" ? b.flaggedAmount - a.flaggedAmount : a.flaggedAmount - b.flaggedAmount;
    }
    if (sortKey === "detectedAt") {
      const av = new Date(a.detectedAt).getTime();
      const bv = new Date(b.detectedAt).getTime();
      return sortDir === "desc" ? bv - av : av - bv;
    }
    return 0;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  // Counts for the filter chips
  const counts = {
    all: somExceptions.length,
    open: somExceptions.filter((e) => e.status === "open" || e.status === "under_review" || e.status === "escalated").length,
    critical: somExceptions.filter((e) => e.severity === "critical").length,
    high: somExceptions.filter((e) => e.severity === "high").length,
    som_address_mismatch: somExceptions.filter((e) => e.type === "som_address_mismatch").length,
    som_license_invalid: somExceptions.filter((e) => e.type === "som_license_invalid").length,
    som_price_deviation: somExceptions.filter((e) => e.type === "som_price_deviation").length,
    som_quantity_outlier: somExceptions.filter((e) => e.type === "som_quantity_outlier").length,
  };

  const filterChips: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "open", label: "Open", count: counts.open },
    { key: "critical", label: "Critical", count: counts.critical },
    { key: "high", label: "High", count: counts.high },
    { key: "som_address_mismatch", label: "Address Mismatch", count: counts.som_address_mismatch },
    { key: "som_license_invalid", label: "License Invalid", count: counts.som_license_invalid },
    { key: "som_price_deviation", label: "Price Deviation", count: counts.som_price_deviation },
    { key: "som_quantity_outlier", label: "Volume Outlier", count: counts.som_quantity_outlier },
  ];

  // Summary metrics
  const totalFlagged = somExceptions.reduce((sum, e) => sum + e.flaggedAmount, 0);
  const openCount = counts.open;
  const criticalCount = counts.critical;

  return (
    <div className="bg-[var(--bg-base)] min-h-screen">
      {/* Header */}
      <div className="px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert className="w-4 h-4 text-[var(--acl-primary)]" />
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--acl-primary)]">
                Drug Distributor · SOM
              </span>
            </div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-tight m-0">
              Exceptions
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 m-0">
              {somExceptions.length} suspicious-order exceptions across {new Set(somExceptions.map((e) => e.vendor)).size} pharmacies
            </p>
          </div>
        </div>
      </div>

      <hr className="border-[var(--border)] m-0" />

      {/* Summary strip */}
      <div className="px-6 lg:px-8 py-6">
        <div className="flex border border-[var(--border)] rounded-lg bg-white">
          <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
            <p className="section-label">Total exceptions</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 m-0">{somExceptions.length}</p>
          </div>
          <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
            <p className="section-label">Open / Under Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-1 m-0">{openCount}</p>
          </div>
          <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
            <p className="section-label">Critical</p>
            <p className="text-2xl font-bold text-red-600 mt-1 m-0">{criticalCount}</p>
          </div>
          <div className="flex-1 px-6 py-4">
            <p className="section-label">Total flagged $</p>
            <p className="text-2xl font-bold text-red-600 mt-1 m-0">{formatCurrency(totalFlagged)}</p>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-6 lg:px-8 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterChips.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                disabled={f.count === 0 && f.key !== "all"}
                className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  active
                    ? "bg-[var(--acl-primary)] text-white border-[var(--acl-primary)]"
                    : f.count === 0
                    ? "bg-white text-[var(--text-muted)] border-[var(--border)] cursor-not-allowed opacity-60"
                    : "bg-white text-[var(--text-secondary)] border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                {f.label} <span className={active ? "opacity-80" : "opacity-60"}>({f.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="px-6 lg:px-8 pb-8">
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Exception</th>
                <th>Type</th>
                <th>Pharmacy</th>
                <th>Order #</th>
                <th className="right">
                  <button
                    onClick={() => handleSort("flaggedAmount")}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
                  >
                    Flagged
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>Severity</th>
                <th>Status</th>
                <th>
                  <button
                    onClick={() => handleSort("detectedAt")}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
                  >
                    Detected
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="px-5 py-10 text-center text-xs text-[var(--text-muted)]">
                      No exceptions match this filter.
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((ex) => (
                  <tr key={ex.id} className="group">
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono text-[var(--text-primary)]">{ex.id}</span>
                      </div>
                    </td>
                    <td>
                      <span className={typeBadgeClass(ex.type)}>{somTypeLabels[ex.type] || ex.type}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                        <span className="text-xs font-medium text-[var(--text-primary)]">{ex.vendor}</span>
                      </div>
                    </td>
                    <td className="font-mono text-[11px] text-[var(--text-secondary)]">{ex.invoiceNumber}</td>
                    <td className="right">
                      <span className="text-xs font-medium tabular-nums" style={{ color: flaggedColor(ex.severity) }}>
                        {formatCurrency(ex.flaggedAmount)}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5">
                        <span className={severityDotClass(ex.severity)} />
                        <span className="text-xs text-[var(--text-secondary)]">
                          {ex.severity.charAt(0).toUpperCase() + ex.severity.slice(1)}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className={statusBadgeClass(ex.status)}>
                        {ex.status === "open" ? "Open"
                          : ex.status === "under_review" ? "Under Review"
                          : ex.status === "escalated" ? "Escalated"
                          : "Resolved"}
                      </span>
                    </td>
                    <td className="text-xs text-[var(--text-secondary)]">{formatDate(ex.detectedAt)}</td>
                    <td>
                      <Link
                        href={`/exceptions/${ex.id}`}
                        className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--acl-primary)] font-medium no-underline hover:underline transition-colors"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
