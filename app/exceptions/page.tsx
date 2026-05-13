"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { X, ChevronDown, Check, ArrowUpDown, Search } from "lucide-react";
import {
  allExceptions as exceptions,
  duplicatePairs,
  formatCurrency,
  formatDate,
  severityConfig,
  statusConfig,
  typeConfig,
  type DuplicatePair,
  type ExceptionType,
  type Severity,
  type Status,
} from "@/lib/data";
import { useToast } from "@/components/Toast";
import { CategoryBadge } from "@/components/CategoryBadge";
import { VendorBadge } from "@/components/VendorBadge";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { EmptyState } from "@/components/EmptyState";
import { FileSearch } from "lucide-react";

// ─── EXCEPTION TABLE HELPERS ─────────────────────────────────────────────────

type FilterKey =
  | "all"
  | "open"
  | "critical"
  | "high"
  | "duplicate"
  | "match_exception";

// Filter-chip labels include LIVE counts derived from `exceptions[]` so they
// stay correct as SOM rows (or any other vertical's rows) are added / removed.
// Previous version hardcoded "All (10)" etc. and went stale silently.
const counts = {
  all: exceptions.length,
  open: exceptions.filter((e) => e.status === "open" || e.status === "under_review" || e.status === "escalated").length,
  critical: exceptions.filter((e) => e.severity === "critical").length,
  high: exceptions.filter((e) => e.severity === "high").length,
  duplicate: exceptions.filter((e) => e.type === "duplicate").length,
  match_exception: exceptions.filter((e) => e.type === "match_exception").length,
};

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "all", label: `All (${counts.all})` },
  { key: "open", label: `Open (${counts.open})` },
  { key: "critical", label: `Critical (${counts.critical})` },
  { key: "high", label: `High (${counts.high})` },
  { key: "duplicate", label: `Duplicate (${counts.duplicate})` },
  { key: "match_exception", label: `Match Exception (${counts.match_exception})` },
];

function applyFilter(filter: FilterKey) {
  switch (filter) {
    case "open":
      return exceptions.filter(
        (e) =>
          e.status === "open" ||
          e.status === "under_review" ||
          e.status === "escalated"
      );
    case "critical":
      return exceptions.filter((e) => e.severity === "critical");
    case "high":
      return exceptions.filter((e) => e.severity === "high");
    case "duplicate":
      return exceptions.filter((e) => e.type === "duplicate");
    case "match_exception":
      return exceptions.filter((e) => e.type === "match_exception");
    default:
      return exceptions;
  }
}

function typeBadgeClass(type: ExceptionType): string {
  if (type === "suspicious_invoice" || type === "contract_overage")
    return "badge critical";
  if (type === "duplicate" || type === "tier_pricing") return "badge warning";
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
  if (severity === "critical" || severity === "high") return "#DC2626";
  if (severity === "medium") return "#B45309";
  return "var(--text-secondary)";
}

// ─── DUPLICATE VIEW HELPERS ──────────────────────────────────────────────────

const aiAnalysis: Record<string, string[]> = {
  "DUP-001": [
    "Same vendor ID confirmed (VND-0142)",
    "8/8 line items match exactly (SKUs and quantities identical)",
    "Amount delta of 0.42% — consistent with known duplicate evasion pattern",
  ],
  "DUP-002": [
    "Exact duplicate: 100% similarity across all fields including amounts and line items",
    "Same EDI sender ID (HS-EDI-4421) re-submitted via email 4 days later",
    "Zero amount delta — likely accidental resubmission; payment would have doubled",
  ],
  "DUP-003": [
    "Same vendor account confirmed (VND-0389) — matched in vendor master",
    "11/12 line items match; one SKU description variant detected",
    "Amount altered by $240 (1.94%) across 5-day gap — pattern flagged for review",
  ],
};

function SimilarityBar({ score }: { score: number }) {
  const fillColor = score >= 99 ? "#DC2626" : "#B45309";
  const textColor = fillColor;

  return (
    <div className="flex items-center gap-3">
      <span className="section-label">Similarity</span>
      <div className="w-32 h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(score, 100)}%`, background: fillColor }}
        />
      </div>
      <span className="text-[13px] font-medium" style={{ color: textColor }}>
        {score}%
      </span>
      <span className="text-[13px] text-[var(--border-strong)]">|</span>
    </div>
  );
}

function DuplicatePairCard({
  pair,
  pairActions,
  onReject,
  onOverride,
  onEscalate,
}: {
  pair: DuplicatePair;
  pairActions: Record<string, string>;
  onReject: () => void;
  onOverride: () => void;
  onEscalate: () => void;
}) {
  const analysis = aiAnalysis[pair.id] ?? [];

  let badgeClass = "badge neutral";
  let badgeLabel = "Open";
  if (pair.status === "open") {
    badgeClass = "badge critical";
    badgeLabel = "Open";
  } else if (pair.status === "under_review") {
    badgeClass = "badge warning";
    badgeLabel = "Under Review";
  } else if (pair.status === "resolved") {
    badgeClass = "badge success";
    badgeLabel = "Resolved";
  }

  function renderActions() {
    if (pair.status === "resolved") {
      return (
        <span className="text-xs font-medium text-green-700">
          Resolved — {formatCurrency(pair.flaggedAmount)} saved
          <Check className="w-3.5 h-3.5 inline ml-1" />
        </span>
      );
    }

    if (pairActions[pair.id]) {
      return (
        <div
          className={`px-3 py-2 rounded-md text-xs font-medium text-center ${
            pairActions[pair.id] === "reject"
              ? "bg-red-50 text-red-700 border border-red-200"
              : pairActions[pair.id] === "override"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-purple-50 text-purple-700 border border-purple-200"
          }`}
        >
          {pairActions[pair.id] === "reject"
            ? "Rejected"
            : pairActions[pair.id] === "override"
              ? "Approved with Override"
              : "Escalated to Manager"}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onReject}
          className="bg-red-600 text-white px-3 py-1.5 text-xs font-medium rounded-md border-none cursor-pointer hover:bg-red-700 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={onOverride}
          className="bg-[var(--bg-surface)] text-[var(--text-secondary)] px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border-strong)] cursor-pointer hover:bg-[var(--bg-base)] transition-colors"
        >
          Approve with Override
        </button>
        <button
          onClick={onEscalate}
          className="bg-[var(--bg-surface)] text-[var(--text-secondary)] px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border-strong)] cursor-pointer hover:bg-[var(--bg-base)] transition-colors"
        >
          Escalate to Manager
        </button>
      </div>
    );
  }

  return (
    <div className="card mb-4">
      {/* Card header */}
      <div className="px-5 pt-4 pb-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VendorBadge name={pair.vendor} size="md" />
          <span className="text-[11px] text-[var(--text-muted)] ml-1">{pair.id}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {formatCurrency(pair.flaggedAmount)}
          </span>
          <span className={badgeClass}>{badgeLabel}</span>
        </div>
      </div>

      {/* Similarity score row */}
      <div className="px-5 py-2 border-b border-[var(--border)] bg-[var(--bg-base)] flex items-center gap-3">
        <SimilarityBar score={pair.similarity} />
        <span className="text-xs text-[var(--text-secondary)]">
          {pair.amountDelta > 0
            ? `Δ ${formatCurrency(pair.amountDelta)} · ${pair.daysDelta} days apart`
            : `${pair.daysDelta} days apart · no amount delta`}
        </span>
      </div>

      {/* Side-by-side comparison */}
      <div className="px-5 py-4 grid grid-cols-[1fr_auto_1fr] items-start">
        {/* Invoice A */}
        <div>
          <div className="section-label mb-2">Invoice A</div>
          <div className="font-mono text-xs font-medium text-[var(--text-primary)]">
            {pair.invoice1.number}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            {formatDate(pair.invoice1.date)}
          </div>
          <div className="text-[15px] font-semibold text-[var(--text-primary)] mt-1">
            {formatCurrency(pair.invoice1.amount)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            {pair.invoice1.submittedVia}
          </div>
        </div>

        {/* Center divider */}
        <div className="w-px bg-[var(--border)] self-stretch mx-8" />

        {/* Invoice B */}
        <div>
          <div className="section-label mb-2">Invoice B</div>
          <div className="font-mono text-xs font-medium text-[var(--text-primary)]">
            {pair.invoice2.number}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            {formatDate(pair.invoice2.date)}
          </div>
          <div className="text-[15px] font-semibold text-[var(--text-primary)] mt-1">
            {formatCurrency(pair.invoice2.amount)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            {pair.invoice2.submittedVia}
          </div>
        </div>
      </div>

      {/* AI analysis */}
      {analysis.length > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3">
            <div className="section-label mb-2">Analysis</div>
            <div className="flex flex-col gap-1.5">
              {analysis.map((line, i) => (
                <div key={i} className="text-xs text-[var(--text-secondary)] flex gap-2">
                  <span className="text-[var(--text-muted)] shrink-0">&ndash;</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 pb-4">{renderActions()}</div>
    </div>
  );
}

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────

const steps = [
  {
    step: "STEP 1",
    name: "Ingest",
    desc: "All invoices received via email, mail, EDI, and vendor portal",
  },
  {
    step: "STEP 2",
    name: "Vectorize",
    desc: "Line items, amounts, dates, and vendor IDs converted to similarity vectors",
  },
  {
    step: "STEP 3",
    name: "Flag",
    desc: "Pairs exceeding 97% similarity threshold surfaced for review",
  },
];

function HowItWorks() {
  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-surface)] px-6 py-4 flex items-center mb-6">
      {steps.map((s, i) => (
        <div key={s.step} className="flex items-center flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="section-label">{s.step}</div>
            <div className="text-[13px] font-medium text-[var(--text-primary)] mt-0.5">
              {s.name}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
              {s.desc}
            </div>
          </div>
          {i < steps.length - 1 && (
            <span className="text-[var(--border-strong)] text-lg mx-6 shrink-0">
              &rarr;
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── MANAGERS LIST ───────────────────────────────────────────────────────────

const managers = [
  "David Kim",
  "Lisa Rodriguez",
  "Michael Chang",
  "Jennifer Walsh",
];

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function ExceptionsPage() {
  const { showToast } = useToast();

  // Exception list state
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const vendorRef = useRef<HTMLDivElement>(null);

  // Table search
  const [tableSearch, setTableSearch] = useState("");

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Get unique vendors
  const vendors = Array.from(new Set(exceptions.map((e) => e.vendor))).sort();

  // Apply both filters
  const filtered = applyFilter(activeFilter).filter(
    (e) => vendorFilter === "all" || e.vendor === vendorFilter
  );

  // Sort state
  const [sortKey, setSortKey] = useState<"flaggedAmount" | "severity" | "category" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const searchedExceptions = useMemo(() => {
    if (!tableSearch.trim()) return filtered;
    const q = tableSearch.toLowerCase();
    return filtered.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.vendor.toLowerCase().includes(q) ||
        e.invoiceNumber.toLowerCase().includes(q) ||
        typeConfig[e.type].label.toLowerCase().includes(q)
    );
  }, [filtered, tableSearch]);

  const sortedExceptions = useMemo(() => {
    return [...searchedExceptions].sort((a, b) => {
      if (!sortKey) return 0;
      if (sortKey === "flaggedAmount") {
        return sortDir === "desc" ? b.flaggedAmount - a.flaggedAmount : a.flaggedAmount - b.flaggedAmount;
      }
      if (sortKey === "severity") {
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        const diff = order[a.severity] - order[b.severity];
        return sortDir === "desc" ? diff : -diff;
      }
      if (sortKey === "category") {
        const cmp = (a.category || "").localeCompare(b.category || "");
        return sortDir === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  }, [searchedExceptions, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sortedExceptions.length / pageSize));
  const paginatedExceptions = sortedExceptions.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  // Reset to page 0 when filter/search changes
  useEffect(() => {
    setPageIndex(0);
  }, [activeFilter, vendorFilter, tableSearch]);

  // View toggle state
  const [viewMode, setViewMode] = useState<"list" | "duplicates">("list");

  // Duplicate modal state
  const [activeModal, setActiveModal] = useState<{
    type: "reject" | "override" | "escalate";
    pairId: string;
  } | null>(null);
  const [modalNote, setModalNote] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [pairActions, setPairActions] = useState<Record<string, string>>({});

  // Header button state
  const [assignOpen, setAssignOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedExceptions, setSelectedExceptions] = useState<string[]>([]);

  // Simulated loading state
  const [loading, setLoading] = useState(true);

  const assignRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalNote("");
    setSelectedManager("");
  }, []);

  // Select-all checkbox indeterminate state
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedExceptions.length > 0 && selectedExceptions.length < paginatedExceptions.length;
    }
  }, [selectedExceptions.length, paginatedExceptions.length]);

  // Simulated loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) {
        setAssignOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
      if (vendorRef.current && !vendorRef.current.contains(e.target as Node)) {
        setVendorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit() {
    if (!activeModal) return;
    setPairActions((prev) => ({
      ...prev,
      [activeModal.pairId]: activeModal.type,
    }));
    showToast(
      `Duplicate ${activeModal.pairId} — ${activeModal.type === "reject" ? "invoice rejected per analyst review" : activeModal.type === "override" ? "approved with documented override" : "escalated for managerial review"}`,
      activeModal.type === "reject" ? "warning" : "success"
    );
    closeModal();
  }

  const activeTabClass =
    "text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all duration-150 text-[var(--text-primary)] font-medium bg-[var(--bg-subtle)] border border-[var(--border)]";
  const inactiveTabClass =
    "text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all duration-150 text-[var(--text-secondary)] font-normal bg-transparent border border-transparent hover:bg-[var(--bg-subtle)]";

  const duplicateAtRisk = formatCurrency(
    duplicatePairs
      .filter((p) => p.status !== "resolved")
      .reduce((s, p) => s + p.flaggedAmount, 0)
  );

  return (
    <div className="bg-[var(--bg-base)] min-h-screen">
      {/* Page header */}
      <div className="px-6 lg:px-8 pt-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] m-0 leading-tight">
              Exceptions
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {exceptions.length} exceptions · {duplicatePairs.length} duplicate pairs · Q1 2026
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative" ref={assignRef}>
              <button onClick={() => setAssignOpen(!assignOpen)} className="border border-[var(--border-strong)] bg-[var(--bg-surface)] text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors">
                Assign{selectedExceptions.length > 0 ? ` (${selectedExceptions.length})` : ""}
              </button>
              {assignOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-md py-1 z-20 w-52">
                  <p className="px-3 py-1 text-xs text-[var(--text-muted)] m-0">Assign to:</p>
                  {managers.map(name => (
                    <button key={name} onClick={() => { setAssignOpen(false); showToast(`${selectedExceptions.length || "All"} exception(s) assigned to ${name} for review`, "success"); setSelectedExceptions([]); }} className="block w-full text-left px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer bg-transparent border-none">
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={exportRef}>
              <button onClick={() => setExportOpen(!exportOpen)} className="border border-[var(--border-strong)] bg-[var(--bg-surface)] text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors">
                Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-md py-1 z-20 w-44">
                  {["Export as PDF", "Export as CSV", "Email to Stakeholder"].map(opt => (
                    <button key={opt} onClick={() => { setExportOpen(false); showToast(`${opt} — report generated successfully`, "success"); }} className="block w-full text-left px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer bg-transparent border-none">
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr className="divider mt-4" />

      {/* View toggle tabs */}
      <div className="px-6 lg:px-8 pt-3 flex gap-1.5">
        <button
          className={viewMode === "list" ? activeTabClass : inactiveTabClass}
          onClick={() => setViewMode("list")}
        >
          Exceptions ({exceptions.filter(e => !e.type.startsWith("som_")).length})
        </button>
        <button
          className={
            viewMode === "duplicates" ? activeTabClass : inactiveTabClass
          }
          onClick={() => setViewMode("duplicates")}
        >
          Duplicates ({duplicatePairs.length})
        </button>
      </div>

      {/* ── LIST VIEW ──────────────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <>
          {/* Filter row */}
          <div className="px-6 lg:px-8 py-3 flex items-center gap-3 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {filterOptions.map((f) => {
                const isActive = activeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all duration-150 ${
                      isActive
                        ? "text-[var(--text-primary)] font-medium bg-[var(--bg-subtle)] border border-[var(--border)]"
                        : "text-[var(--text-secondary)] font-normal bg-transparent border border-transparent hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Vendor filter */}
            <div className="relative" ref={vendorRef}>
              <button
                onClick={() => setVendorDropdownOpen(!vendorDropdownOpen)}
                className={`text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all duration-150 inline-flex items-center gap-1 ${
                  vendorFilter !== "all"
                    ? "text-[var(--acl-primary)] font-medium bg-[#e8f1fc] border border-[#b0d0f0]"
                    : "text-[var(--text-secondary)] bg-transparent border border-[var(--border)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                {vendorFilter === "all" ? "All Vendors" : vendorFilter}
                <ChevronDown className="w-3 h-3" />
              </button>
              {vendorDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-md py-1 z-20 w-56 max-h-60 overflow-auto">
                  <button
                    onClick={() => { setVendorFilter("all"); setVendorDropdownOpen(false); }}
                    className={`block w-full text-left px-3 py-1.5 text-xs cursor-pointer bg-transparent border-none ${
                      vendorFilter === "all" ? "text-[var(--acl-primary)] font-medium bg-[var(--bg-subtle)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    All Vendors
                  </button>
                  {vendors.map((v) => (
                    <button
                      key={v}
                      onClick={() => { setVendorFilter(v); setVendorDropdownOpen(false); }}
                      className={`block w-full text-left px-3 py-1.5 text-xs cursor-pointer bg-transparent border-none ${
                        vendorFilter === v ? "text-[var(--acl-primary)] font-medium bg-[var(--bg-subtle)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table search bar */}
          <div className="px-6 lg:px-8 pb-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search exceptions..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--acl-primary)] transition-colors"
              />
            </div>
          </div>

          {/* Table */}
          <div className="px-6 lg:px-8 pb-8">
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={selectedExceptions.length === paginatedExceptions.length && paginatedExceptions.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExceptions(paginatedExceptions.map((ex) => ex.id));
                          } else {
                            setSelectedExceptions([]);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-[var(--border-strong)] cursor-pointer accent-[var(--acl-primary)]"
                        aria-label="Select all rows"
                      />
                    </th>
                    <th>Exception</th>
                    <th>Type</th>
                    <th
                      className="cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                      onClick={() => {
                        if (sortKey === "category") { setSortDir(d => d === "desc" ? "asc" : "desc"); }
                        else { setSortKey("category"); setSortDir("asc"); }
                        setPageIndex(0);
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Category <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th>Vendor</th>
                    <th
                      className="right cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                      onClick={() => {
                        if (sortKey === "flaggedAmount") { setSortDir(d => d === "desc" ? "asc" : "desc"); }
                        else { setSortKey("flaggedAmount"); setSortDir("desc"); }
                        setPageIndex(0);
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Flagged <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      className="cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                      onClick={() => {
                        if (sortKey === "severity") { setSortDir(d => d === "desc" ? "asc" : "desc"); }
                        else { setSortKey("severity"); setSortDir("desc"); }
                        setPageIndex(0);
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Severity <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <>
                      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <tr key={i}>
                          <td className="w-8"><div className="h-3.5 w-3.5 bg-[var(--border)] rounded animate-pulse" /></td>
                          <td>
                            <div className="h-3 w-12 bg-[var(--border)] rounded animate-pulse mb-1.5" />
                            <div className="h-2.5 w-20 bg-[var(--border)] rounded animate-pulse" />
                          </td>
                          <td><div className="h-5 w-24 bg-[var(--border)] rounded animate-pulse" /></td>
                          <td><div className="h-5 w-28 bg-[var(--border)] rounded animate-pulse" /></td>
                          <td><div className="h-3.5 w-28 bg-[var(--border)] rounded animate-pulse" /></td>
                          <td className="right"><div className="h-3.5 w-16 bg-[var(--border)] rounded animate-pulse ml-auto" /></td>
                          <td><div className="h-3.5 w-16 bg-[var(--border)] rounded animate-pulse" /></td>
                          <td><div className="h-5 w-20 bg-[var(--border)] rounded animate-pulse" /></td>
                          <td><div className="h-3.5 w-14 bg-[var(--border)] rounded animate-pulse" /></td>
                        </tr>
                      ))}
                    </>
                  ) : (
                    <>
                      {paginatedExceptions.map((ex) => (
                        <tr key={ex.id} className="group">
                          {/* CHECKBOX */}
                          <td className="w-8">
                            <input
                              type="checkbox"
                              checked={selectedExceptions.includes(ex.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExceptions((prev) => [...prev, ex.id]);
                                } else {
                                  setSelectedExceptions((prev) => prev.filter((id) => id !== ex.id));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded border-[var(--border-strong)] cursor-pointer accent-[var(--acl-primary)]"
                              aria-label={`Select ${ex.id}`}
                            />
                          </td>
                          {/* EXCEPTION */}
                          <td>
                            <span className="font-mono text-[11px] text-[var(--text-muted)] block leading-snug">
                              {ex.id}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                              {ex.invoiceNumber}
                            </span>
                          </td>

                          {/* TYPE */}
                          <td>
                            <span className={typeBadgeClass(ex.type)}>
                              {typeConfig[ex.type].label}
                            </span>
                          </td>

                          {/* CATEGORY */}
                          <td>
                            {ex.category && <CategoryBadge category={ex.category} />}
                          </td>

                          {/* VENDOR */}
                          <td>
                            <VendorBadge name={ex.vendor} size="sm" />
                          </td>

                          {/* FLAGGED */}
                          <td className="right">
                            <span
                              className="tabular-nums text-[13px] font-medium"
                              style={{ color: flaggedColor(ex.severity) }}
                            >
                              {formatCurrency(ex.flaggedAmount)}
                            </span>
                          </td>

                          {/* SEVERITY */}
                          <td>
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className={severityDotClass(ex.severity)}
                                style={{
                                  background: severityConfig[ex.severity].color,
                                }}
                              />
                              <span className="text-xs text-[var(--text-primary)]">
                                {severityConfig[ex.severity].label}
                              </span>
                            </span>
                          </td>

                          {/* STATUS */}
                          <td>
                            <span className={statusBadgeClass(ex.status)}>
                              {statusConfig[ex.status].label}
                            </span>
                          </td>

                          {/* ACTION */}
                          <td>
                            <Link
                              href={`/exceptions/${ex.id}`}
                              className="text-xs text-[var(--text-muted)] group-hover:text-[var(--acl-primary)] no-underline whitespace-nowrap hover:underline transition-colors"
                            >
                              Review &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {paginatedExceptions.length === 0 && (
                        <tr>
                          <td colSpan={9}>
                            <EmptyState
                              icon={FileSearch}
                              title="No exceptions match this filter"
                              description="Try adjusting your filters or search query to find what you're looking for."
                              action={{ label: "Clear filter", onClick: () => { setActiveFilter("all"); setVendorFilter("all"); setTableSearch(""); } }}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
              <DataTablePagination
                pageIndex={pageIndex}
                pageCount={pageCount}
                pageSize={pageSize}
                totalRows={sortedExceptions.length}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPageIndex(0);
                }}
                selectedCount={selectedExceptions.length}
              />
            </div>
          </div>
        </>
      )}

      {/* ── DUPLICATES VIEW ────────────────────────────────────────────────────── */}
      {viewMode === "duplicates" && (
        <div className="px-6 lg:px-8 py-4">
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            AI scanned 1,847 invoices &middot; {duplicatePairs.length} pairs flagged &middot; {duplicateAtRisk}
            {" "}at risk
          </p>

          <HowItWorks />

          {duplicatePairs.map((pair) => (
            <DuplicatePairCard
              key={pair.id}
              pair={pair}
              pairActions={pairActions}
              onReject={() => {
                setActiveModal({ type: "reject", pairId: pair.id });
                setModalNote("");
              }}
              onOverride={() => {
                setActiveModal({ type: "override", pairId: pair.id });
                setModalNote("");
              }}
              onEscalate={() => {
                setActiveModal({ type: "escalate", pairId: pair.id });
                setModalNote("");
                setSelectedManager("");
              }}
            />
          ))}
        </div>
      )}

      {/* ── Reject Modal ──────────────────────────────────────────────────────── */}
      {activeModal?.type === "reject" && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={closeModal}
          onKeyDown={(e) => { if (e.key === "Escape") closeModal(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
            className="bg-[var(--bg-surface)] border border-[var(--border)] shadow-md rounded-lg w-full max-w-md mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none p-0"
            >
              <X size={16} />
            </button>

            <h2 id="reject-modal-title" className="text-sm font-semibold text-[var(--text-primary)] m-0 mb-1">
              Reject Duplicate Invoice
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0 mb-4">
              This will block the duplicate invoice from processing.
            </p>

            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Reason for rejection
            </label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Describe why this invoice is being rejected..."
              className="w-full h-24 text-xs text-[var(--text-primary)] border border-[var(--border)] rounded-md px-3 py-2 resize-none focus:outline-none focus:border-[var(--text-muted)] bg-[var(--bg-surface)]"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-medium rounded-md text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-strong)] cursor-pointer hover:bg-[var(--bg-base)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!modalNote.trim()}
                className={`px-4 py-2 text-xs font-medium rounded-md text-white bg-red-600 border-none cursor-pointer hover:bg-red-700 transition-colors ${!modalNote.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Reject Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approve with Override Modal ────────────────────────────────────────── */}
      {activeModal?.type === "override" && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={closeModal}
          onKeyDown={(e) => { if (e.key === "Escape") closeModal(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="override-modal-title"
            className="bg-[var(--bg-surface)] border border-[var(--border)] shadow-md rounded-lg w-full max-w-md mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none p-0"
            >
              <X size={16} />
            </button>

            <h2 id="override-modal-title" className="text-sm font-semibold text-[var(--text-primary)] m-0 mb-1">
              Approve with Override
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0 mb-4">
              Override the duplicate flag and approve this invoice for payment.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5 mb-4">
              <p className="text-xs text-amber-800 m-0">
                This action overrides the AI duplicate detection. A record of
                this override will be logged for audit purposes.
              </p>
            </div>

            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Justification for override
            </label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Explain why this is not a true duplicate..."
              className="w-full h-24 text-xs text-[var(--text-primary)] border border-[var(--border)] rounded-md px-3 py-2 resize-none focus:outline-none focus:border-[var(--text-muted)] bg-[var(--bg-surface)]"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-medium rounded-md text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-strong)] cursor-pointer hover:bg-[var(--bg-base)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!modalNote.trim()}
                className={`px-4 py-2 text-xs font-medium rounded-md text-white bg-amber-600 border-none cursor-pointer hover:bg-amber-700 transition-colors ${!modalNote.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Escalate to Manager Modal ──────────────────────────────────────────── */}
      {activeModal?.type === "escalate" && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={closeModal}
          onKeyDown={(e) => { if (e.key === "Escape") closeModal(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="escalate-modal-title"
            className="bg-[var(--bg-surface)] border border-[var(--border)] shadow-md rounded-lg w-full max-w-md mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none p-0"
            >
              <X size={16} />
            </button>

            <h2 id="escalate-modal-title" className="text-sm font-semibold text-[var(--text-primary)] m-0 mb-1">
              Escalate to Manager
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0 mb-4">
              Send this duplicate pair to a manager for final review.
            </p>

            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Select manager
            </label>
            <div className="relative mb-4">
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full text-xs text-[var(--text-primary)] border border-[var(--border)] rounded-md px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-[var(--text-muted)] bg-[var(--bg-surface)] cursor-pointer"
              >
                <option value="">Choose a manager...</option>
                {managers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />
            </div>

            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Note (optional)
            </label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Add context for the manager..."
              className="w-full h-20 text-xs text-[var(--text-primary)] border border-[var(--border)] rounded-md px-3 py-2 resize-none focus:outline-none focus:border-[var(--text-muted)] bg-[var(--bg-surface)]"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-medium rounded-md text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-strong)] cursor-pointer hover:bg-[var(--bg-base)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedManager}
                className={`px-4 py-2 text-xs font-medium rounded-md text-white bg-blue-600 border-none cursor-pointer hover:bg-blue-700 transition-colors ${!selectedManager ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
