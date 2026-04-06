"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Copy,
  GitCompare,
  Tag,
  AlertTriangle,
  ShieldAlert,
  Layers,
  Download,
  Users,
  ChevronRight,
} from "lucide-react";
import {
  exceptions,
  severityConfig,
  statusConfig,
  typeConfig,
  formatCurrency,
  formatDate,
  type ExceptionType,
  type Severity,
  type Status,
} from "@/lib/data";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  Copy,
  GitCompare,
  Tag,
  AlertTriangle,
  ShieldAlert,
  Layers,
};

// ─── Severity left-bar colour ─────────────────────────────────────────────────

const severityBarClass: Record<Severity, string> = {
  critical: "bg-red-500",
  high: "bg-amber-400",
  medium: "bg-blue-400",
  low: "bg-slate-300",
};

const severityTextClass: Record<Severity, string> = {
  critical: "text-red-600",
  high: "text-amber-600",
  medium: "text-blue-600",
  low: "text-slate-500",
};

const severityBadgeClass: Record<Severity, string> = {
  critical: "bg-red-50 text-red-700 ring-1 ring-red-200",
  high: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  medium: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  low: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const statusBadgeClass: Record<Status, string> = {
  open: "bg-red-50 text-red-600 ring-1 ring-red-200",
  under_review: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  escalated: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

const typeBadgeClass: Record<ExceptionType, string> = {
  duplicate: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  match_exception: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  missing_rebate: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  contract_overage: "bg-red-50 text-red-700 ring-1 ring-red-200",
  suspicious_invoice: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  tier_pricing: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
};

// ─── Filter config ────────────────────────────────────────────────────────────

type FilterKey = "all" | "critical" | "high" | "open" | "duplicate" | "match_exception";

interface FilterOption {
  key: FilterKey;
  label: string;
  count: number;
  chipClass: string;
  activeClass: string;
}

const filterOptions: FilterOption[] = [
  {
    key: "all",
    label: "All",
    count: 10,
    chipClass: "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
    activeClass: "bg-slate-800 text-white ring-slate-800",
  },
  {
    key: "critical",
    label: "Critical",
    count: exceptions.filter((e) => e.severity === "critical").length,
    chipClass: "bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50",
    activeClass: "bg-red-600 text-white ring-red-600",
  },
  {
    key: "high",
    label: "High",
    count: exceptions.filter((e) => e.severity === "high").length,
    chipClass: "bg-white text-amber-600 ring-1 ring-amber-200 hover:bg-amber-50",
    activeClass: "bg-amber-500 text-white ring-amber-500",
  },
  {
    key: "open",
    label: "Open",
    count: exceptions.filter((e) => e.status === "open").length,
    chipClass: "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
    activeClass: "bg-slate-800 text-white ring-slate-800",
  },
  {
    key: "duplicate",
    label: "Duplicate",
    count: exceptions.filter((e) => e.type === "duplicate").length,
    chipClass: "bg-white text-orange-600 ring-1 ring-orange-200 hover:bg-orange-50",
    activeClass: "bg-orange-500 text-white ring-orange-500",
  },
  {
    key: "match_exception",
    label: "Match Exception",
    count: exceptions.filter((e) => e.type === "match_exception").length,
    chipClass: "bg-white text-blue-600 ring-1 ring-blue-200 hover:bg-blue-50",
    activeClass: "bg-blue-600 text-white ring-blue-600",
  },
];

function applyFilter(filter: FilterKey) {
  switch (filter) {
    case "all":
      return exceptions;
    case "critical":
      return exceptions.filter((e) => e.severity === "critical");
    case "high":
      return exceptions.filter((e) => e.severity === "high");
    case "open":
      return exceptions.filter((e) => e.status === "open");
    case "duplicate":
      return exceptions.filter((e) => e.type === "duplicate");
    case "match_exception":
      return exceptions.filter((e) => e.type === "match_exception");
    default:
      return exceptions;
  }
}

// ─── Assignee avatar ──────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colours = [
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-slate-100 text-slate-600",
  ];
  const idx = name.charCodeAt(0) % colours.length;

  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 ${colours[idx]}`}
    >
      {initials}
    </span>
  );
}

// ─── Exception Card ───────────────────────────────────────────────────────────

function ExceptionCard({ ex, index }: { ex: (typeof exceptions)[number]; index: number }) {
  const sev = severityConfig[ex.severity];
  const stat = statusConfig[ex.status];
  const typ = typeConfig[ex.type];
  const Icon = iconMap[typ.icon] ?? AlertTriangle;
  const isCriticalOrHigh = ex.severity === "critical" || ex.severity === "high";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="relative bg-white rounded-xl shadow-sm ring-1 ring-slate-200/70 overflow-hidden flex hover:shadow-md hover:ring-slate-300 transition-all duration-200"
    >
      {/* Left severity bar */}
      <div className={`w-1 shrink-0 ${severityBarClass[ex.severity]}`} />

      {/* Card body */}
      <div className="flex-1 p-5 min-w-0">
        {/* Top row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-mono text-xs text-slate-400 tracking-wide">{ex.id}</span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadgeClass[ex.type]}`}
          >
            <Icon className="w-3 h-3" />
            {typ.label}
          </span>

          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${severityBadgeClass[ex.severity]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sev.dot}`} />
            {sev.label}
          </span>

          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass[ex.status]}`}
          >
            {stat.label}
          </span>

          <div className="flex-1" />

          {/* Flagged amount — right aligned on top row */}
          <span
            className={`text-base font-bold tabular-nums ${
              isCriticalOrHigh ? "text-red-600" : severityTextClass[ex.severity]
            }`}
          >
            {formatCurrency(ex.flaggedAmount)}
          </span>
        </div>

        {/* Middle — vendor + invoice info */}
        <div className="mb-2">
          <p className="text-base font-bold text-slate-800 leading-tight">{ex.vendor}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {ex.invoiceNumber} &middot; {formatDate(ex.invoiceDate)}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">
          {ex.description}
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={ex.assignee ?? "Unassigned"} />
            <span className="text-xs text-slate-500 truncate">{ex.assignee ?? "Unassigned"}</span>
          </div>

          <Link
            href={`/exceptions/${ex.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap group"
          >
            View Detail
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExceptionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const filtered = applyFilter(activeFilter);

  return (
    <div className="min-h-full bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Exception Queue</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              10 exceptions &middot; 7 open &middot; Q1 2026
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white ring-1 ring-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:ring-slate-300 transition-all">
              <Users className="w-4 h-4" />
              Assign All
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-sm font-medium text-white hover:bg-slate-700 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-2">
          {filterOptions.map((opt) => {
            const isActive = activeFilter === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setActiveFilter(opt.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  isActive ? opt.activeClass : opt.chipClass
                }`}
              >
                {opt.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card grid */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((ex, i) => (
              <ExceptionCard key={ex.id} ex={ex} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-slate-400"
          >
            <p className="text-lg font-medium">No exceptions match this filter</p>
          </motion.div>
        )}

        <p className="text-xs text-slate-400 mt-6 text-center">
          Showing {filtered.length} of {exceptions.length} exceptions
        </p>
      </div>
    </div>
  );
}
