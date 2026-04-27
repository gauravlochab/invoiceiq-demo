"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { X, ChevronDown, Check, ArrowUpDown } from "lucide-react";
import {
  exceptions,
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

// ─── EXCEPTION TABLE HELPERS ─────────────────────────────────────────────────

type FilterKey =
  | "all"
  | "open"
  | "critical"
  | "high"
  | "duplicate"
  | "match_exception";

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All (10)" },
  { key: "open", label: "Open (7)" },
  { key: "critical", label: "Critical (3)" },
  { key: "high", label: "High (3)" },
  { key: "duplicate", label: "Duplicate" },
  { key: "match_exception", label: "Match Exception" },
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
  return "#4b5563";
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
      <div className="w-32 h-1.5 rounded-full overflow-hidden bg-[#e5e7eb]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(score, 100)}%`, background: fillColor }}
        />
      </div>
      <span className="text-[13px] font-medium" style={{ color: textColor }}>
        {score}%
      </span>
      <span className="text-[13px] text-[#d1d5db]">|</span>
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
          className="bg-white text-[#4b5563] px-3 py-1.5 text-xs font-medium rounded-md border border-[#d1d5db] cursor-pointer hover:bg-[#f7f8fa] transition-colors"
        >
          Approve with Override
        </button>
        <button
          onClick={onEscalate}
          className="bg-white text-[#4b5563] px-3 py-1.5 text-xs font-medium rounded-md border border-[#d1d5db] cursor-pointer hover:bg-[#f7f8fa] transition-colors"
        >
          Escalate to Manager
        </button>
      </div>
    );
  }

  return (
    <div className="card mb-4">
      {/* Card header */}
      <div className="px-5 pt-4 pb-3 border-b border-[#e5e7eb] flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-semibold text-[#111827]">
            {pair.vendor}
          </span>
          <span className="text-[11px] text-[#9ca3af] ml-2">{pair.id}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-[#111827]">
            {formatCurrency(pair.flaggedAmount)}
          </span>
          <span className={badgeClass}>{badgeLabel}</span>
        </div>
      </div>

      {/* Similarity score row */}
      <div className="px-5 py-2 border-b border-[#e5e7eb] bg-[#f7f8fa] flex items-center gap-3">
        <SimilarityBar score={pair.similarity} />
        <span className="text-xs text-[#4b5563]">
          {pair.amountDelta > 0
            ? `\u0394 ${formatCurrency(pair.amountDelta)} \u00b7 ${pair.daysDelta} days apart`
            : `${pair.daysDelta} days apart \u00b7 no amount delta`}
        </span>
      </div>

      {/* Side-by-side comparison */}
      <div className="px-5 py-4 grid grid-cols-[1fr_auto_1fr] items-start">
        {/* Invoice A */}
        <div>
          <div className="section-label mb-2">Invoice A</div>
          <div className="font-mono text-xs font-medium text-[#111827]">
            {pair.invoice1.number}
          </div>
          <div className="text-[11px] text-[#4b5563] mt-0.5">
            {formatDate(pair.invoice1.date)}
          </div>
          <div className="text-[15px] font-semibold text-[#111827] mt-1">
            {formatCurrency(pair.invoice1.amount)}
          </div>
          <div className="text-[11px] text-[#9ca3af] mt-1">
            {pair.invoice1.submittedVia}
          </div>
        </div>

        {/* Center divider */}
        <div className="w-px bg-[#e5e7eb] self-stretch mx-8" />

        {/* Invoice B */}
        <div>
          <div className="section-label mb-2">Invoice B</div>
          <div className="font-mono text-xs font-medium text-[#111827]">
            {pair.invoice2.number}
          </div>
          <div className="text-[11px] text-[#4b5563] mt-0.5">
            {formatDate(pair.invoice2.date)}
          </div>
          <div className="text-[15px] font-semibold text-[#111827] mt-1">
            {formatCurrency(pair.invoice2.amount)}
          </div>
          <div className="text-[11px] text-[#9ca3af] mt-1">
            {pair.invoice2.submittedVia}
          </div>
        </div>
      </div>

      {/* AI analysis */}
      {analysis.length > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-md px-4 py-3">
            <div className="section-label mb-2">Analysis</div>
            <div className="flex flex-col gap-1.5">
              {analysis.map((line, i) => (
                <div key={i} className="text-xs text-[#4b5563] flex gap-2">
                  <span className="text-[#9ca3af] shrink-0">&ndash;</span>
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
    <div className="border border-[#e5e7eb] rounded-lg bg-white px-6 py-4 flex items-center mb-6">
      {steps.map((s, i) => (
        <div key={s.step} className="flex items-center flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="section-label">{s.step}</div>
            <div className="text-[13px] font-medium text-[#111827] mt-0.5">
              {s.name}
            </div>
            <div className="text-[11px] text-[#9ca3af] mt-0.5 leading-snug">
              {s.desc}
            </div>
          </div>
          {i < steps.length - 1 && (
            <span className="text-[#d1d5db] text-lg mx-6 shrink-0">
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

  // Get unique vendors
  const vendors = Array.from(new Set(exceptions.map((e) => e.vendor))).sort();

  // Apply both filters
  const filtered = applyFilter(activeFilter).filter(
    (e) => vendorFilter === "all" || e.vendor === vendorFilter
  );

  // Sort state
  const [sortKey, setSortKey] = useState<"flaggedAmount" | "severity" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedExceptions = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    if (sortKey === "flaggedAmount") {
      return sortDir === "desc" ? b.flaggedAmount - a.flaggedAmount : a.flaggedAmount - b.flaggedAmount;
    }
    if (sortKey === "severity") {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const diff = order[a.severity] - order[b.severity];
      return sortDir === "desc" ? diff : -diff;
    }
    return 0;
  });

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
      `Duplicate ${activeModal.pairId} — ${activeModal.type === "reject" ? "rejected" : activeModal.type === "override" ? "approved with override" : "escalated to manager"}`,
      activeModal.type === "reject" ? "warning" : "success"
    );
    setActiveModal(null);
    setModalNote("");
    setSelectedManager("");
  }

  const activeTabClass =
    "text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all duration-150 text-[#111827] font-medium bg-[#f0f2f5] border border-[#e5e7eb]";
  const inactiveTabClass =
    "text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all duration-150 text-[#4b5563] font-normal bg-transparent border border-transparent hover:bg-[#f0f2f5]";

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Page header */}
      <div className="px-8 pt-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#111827] m-0 leading-tight">
              Exceptions
            </h1>
            <p className="text-xs text-[#4b5563] mt-1">
              10 exceptions · 3 duplicate pairs · Q1 2026
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative" ref={assignRef}>
              <button onClick={() => setAssignOpen(!assignOpen)} className="border border-[#d1d5db] bg-white text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer text-[#111827] hover:bg-[#f0f2f5] transition-colors">
                Assign{selectedExceptions.length > 0 ? ` (${selectedExceptions.length})` : ""}
              </button>
              {assignOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-md shadow-md py-1 z-20 w-52">
                  <p className="px-3 py-1 text-xs text-[#9ca3af] m-0">Assign to:</p>
                  {["Rajesh Jaluka", "David Kim", "Lisa Rodriguez", "Michael Chang"].map(name => (
                    <button key={name} onClick={() => { setAssignOpen(false); showToast(`${selectedExceptions.length || "All"} exception(s) assigned to ${name}`, "success"); setSelectedExceptions([]); }} className="block w-full text-left px-3 py-1.5 text-xs text-[#4b5563] hover:bg-[#f0f2f5] cursor-pointer bg-transparent border-none">
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={exportRef}>
              <button onClick={() => setExportOpen(!exportOpen)} className="border border-[#d1d5db] bg-white text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer text-[#111827] hover:bg-[#f0f2f5] transition-colors">
                Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-md shadow-md py-1 z-20 w-44">
                  {["Export as PDF", "Export as CSV", "Email to Stakeholder"].map(opt => (
                    <button key={opt} onClick={() => { setExportOpen(false); showToast(`${opt} — report generated`, "success"); }} className="block w-full text-left px-3 py-1.5 text-xs text-[#4b5563] hover:bg-[#f0f2f5] cursor-pointer bg-transparent border-none">
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
      <div className="px-8 pt-3 flex gap-1.5">
        <button
          className={viewMode === "list" ? activeTabClass : inactiveTabClass}
          onClick={() => setViewMode("list")}
        >
          Exceptions (10)
        </button>
        <button
          className={
            viewMode === "duplicates" ? activeTabClass : inactiveTabClass
          }
          onClick={() => setViewMode("duplicates")}
        >
          Duplicates (3)
        </button>
      </div>

      {/* ── LIST VIEW ──────────────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <>
          {/* Filter row */}
          <div className="px-8 py-3 flex items-center gap-3 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {filterOptions.map((f) => {
                const isActive = activeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`text-xs px-2.5 py-1 rounded-md cursor-pointer transition-all duration-150 ${
                      isActive
                        ? "text-[#111827] font-medium bg-[#f0f2f5] border border-[#e5e7eb]"
                        : "text-[#4b5563] font-normal bg-transparent border border-transparent hover:bg-[#f0f2f5]"
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
                    ? "text-[#0065cb] font-medium bg-[#e8f1fc] border border-[#b0d0f0]"
                    : "text-[#4b5563] bg-transparent border border-[#e5e7eb] hover:bg-[#f0f2f5]"
                }`}
              >
                {vendorFilter === "all" ? "All Vendors" : vendorFilter}
                <ChevronDown className="w-3 h-3" />
              </button>
              {vendorDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-[#e5e7eb] rounded-md shadow-md py-1 z-20 w-56 max-h-60 overflow-auto">
                  <button
                    onClick={() => { setVendorFilter("all"); setVendorDropdownOpen(false); }}
                    className={`block w-full text-left px-3 py-1.5 text-xs cursor-pointer bg-transparent border-none ${
                      vendorFilter === "all" ? "text-[#0065cb] font-medium bg-[#f0f2f5]" : "text-[#4b5563] hover:bg-[#f0f2f5]"
                    }`}
                  >
                    All Vendors
                  </button>
                  {vendors.map((v) => (
                    <button
                      key={v}
                      onClick={() => { setVendorFilter(v); setVendorDropdownOpen(false); }}
                      className={`block w-full text-left px-3 py-1.5 text-xs cursor-pointer bg-transparent border-none ${
                        vendorFilter === v ? "text-[#0065cb] font-medium bg-[#f0f2f5]" : "text-[#4b5563] hover:bg-[#f0f2f5]"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="px-8 pb-8">
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Exception</th>
                    <th>Type</th>
                    <th>Vendor</th>
                    <th
                      className="right cursor-pointer hover:text-[#111827] transition-colors select-none"
                      onClick={() => {
                        if (sortKey === "flaggedAmount") { setSortDir(d => d === "desc" ? "asc" : "desc"); }
                        else { setSortKey("flaggedAmount"); setSortDir("desc"); }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Flagged <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      className="cursor-pointer hover:text-[#111827] transition-colors select-none"
                      onClick={() => {
                        if (sortKey === "severity") { setSortDir(d => d === "desc" ? "asc" : "desc"); }
                        else { setSortKey("severity"); setSortDir("desc"); }
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
                          <td>
                            <div className="h-3 w-12 bg-[#e5e7eb] rounded animate-pulse mb-1.5" />
                            <div className="h-2.5 w-20 bg-[#e5e7eb] rounded animate-pulse" />
                          </td>
                          <td><div className="h-5 w-24 bg-[#e5e7eb] rounded animate-pulse" /></td>
                          <td><div className="h-3.5 w-28 bg-[#e5e7eb] rounded animate-pulse" /></td>
                          <td className="right"><div className="h-3.5 w-16 bg-[#e5e7eb] rounded animate-pulse ml-auto" /></td>
                          <td><div className="h-3.5 w-16 bg-[#e5e7eb] rounded animate-pulse" /></td>
                          <td><div className="h-5 w-20 bg-[#e5e7eb] rounded animate-pulse" /></td>
                          <td><div className="h-3.5 w-14 bg-[#e5e7eb] rounded animate-pulse" /></td>
                        </tr>
                      ))}
                    </>
                  ) : (
                    <>
                      {sortedExceptions.map((ex) => (
                        <tr key={ex.id} className="group">
                          {/* EXCEPTION */}
                          <td>
                            <span className="font-mono text-[11px] text-[#9ca3af] block leading-snug">
                              {ex.id}
                            </span>
                            <span className="text-xs text-[#4b5563]">
                              {ex.invoiceNumber}
                            </span>
                          </td>

                          {/* TYPE */}
                          <td>
                            <span className={typeBadgeClass(ex.type)}>
                              {typeConfig[ex.type].label}
                            </span>
                          </td>

                          {/* VENDOR */}
                          <td>
                            <span className="text-[13px] font-medium text-[#111827]">
                              {ex.vendor}
                            </span>
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
                              <span className="text-xs text-[#111827]">
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
                              className="text-xs text-[#9ca3af] group-hover:text-[#0065cb] no-underline whitespace-nowrap hover:underline transition-colors"
                            >
                              Review &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {sortedExceptions.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-12 px-4"
                          >
                            <div className="text-[#9ca3af] text-sm">No exceptions match this filter</div>
                            <button
                              onClick={() => setActiveFilter("all")}
                              className="mt-2 text-xs text-[#0065cb] cursor-pointer bg-transparent border-none hover:underline"
                            >
                              Clear filter
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── DUPLICATES VIEW ────────────────────────────────────────────────────── */}
      {viewMode === "duplicates" && (
        <div className="px-8 py-4">
          <p className="text-xs text-[#4b5563] mb-4">
            AI scanned 1,847 invoices &middot; 3 pairs flagged &middot; $56,070
            at risk
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
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white border border-[#e5e7eb] shadow-md rounded-lg w-full max-w-md mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-[#9ca3af] hover:text-[#4b5563] cursor-pointer bg-transparent border-none p-0"
            >
              <X size={16} />
            </button>

            <h2 className="text-sm font-semibold text-[#111827] m-0 mb-1">
              Reject Duplicate Invoice
            </h2>
            <p className="text-xs text-[#4b5563] mt-0 mb-4">
              This will block the duplicate invoice from processing.
            </p>

            <label className="block text-xs font-medium text-[#4b5563] mb-1.5">
              Reason for rejection
            </label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Describe why this invoice is being rejected..."
              className="w-full h-24 text-xs text-[#111827] border border-[#e5e7eb] rounded-md px-3 py-2 resize-none focus:outline-none focus:border-[#9ca3af] bg-white"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-medium rounded-md text-[#4b5563] bg-white border border-[#d1d5db] cursor-pointer hover:bg-[#f7f8fa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-xs font-medium rounded-md text-white bg-red-600 border-none cursor-pointer hover:bg-red-700 transition-colors"
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
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white border border-[#e5e7eb] shadow-md rounded-lg w-full max-w-md mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-[#9ca3af] hover:text-[#4b5563] cursor-pointer bg-transparent border-none p-0"
            >
              <X size={16} />
            </button>

            <h2 className="text-sm font-semibold text-[#111827] m-0 mb-1">
              Approve with Override
            </h2>
            <p className="text-xs text-[#4b5563] mt-0 mb-4">
              Override the duplicate flag and approve this invoice for payment.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5 mb-4">
              <p className="text-xs text-amber-800 m-0">
                This action overrides the AI duplicate detection. A record of
                this override will be logged for audit purposes.
              </p>
            </div>

            <label className="block text-xs font-medium text-[#4b5563] mb-1.5">
              Justification for override
            </label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Explain why this is not a true duplicate..."
              className="w-full h-24 text-xs text-[#111827] border border-[#e5e7eb] rounded-md px-3 py-2 resize-none focus:outline-none focus:border-[#9ca3af] bg-white"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-medium rounded-md text-[#4b5563] bg-white border border-[#d1d5db] cursor-pointer hover:bg-[#f7f8fa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-xs font-medium rounded-md text-white bg-amber-600 border-none cursor-pointer hover:bg-amber-700 transition-colors"
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
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white border border-[#e5e7eb] shadow-md rounded-lg w-full max-w-md mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-[#9ca3af] hover:text-[#4b5563] cursor-pointer bg-transparent border-none p-0"
            >
              <X size={16} />
            </button>

            <h2 className="text-sm font-semibold text-[#111827] m-0 mb-1">
              Escalate to Manager
            </h2>
            <p className="text-xs text-[#4b5563] mt-0 mb-4">
              Send this duplicate pair to a manager for final review.
            </p>

            <label className="block text-xs font-medium text-[#4b5563] mb-1.5">
              Select manager
            </label>
            <div className="relative mb-4">
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full text-xs text-[#111827] border border-[#e5e7eb] rounded-md px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-[#9ca3af] bg-white cursor-pointer"
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
              />
            </div>

            <label className="block text-xs font-medium text-[#4b5563] mb-1.5">
              Note (optional)
            </label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Add context for the manager..."
              className="w-full h-20 text-xs text-[#111827] border border-[#e5e7eb] rounded-md px-3 py-2 resize-none focus:outline-none focus:border-[#9ca3af] bg-white"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-medium rounded-md text-[#4b5563] bg-white border border-[#d1d5db] cursor-pointer hover:bg-[#f7f8fa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-xs font-medium rounded-md text-white bg-blue-600 border-none cursor-pointer hover:bg-blue-700 transition-colors"
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
