"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  GitCompare,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Send,
  Undo2,
  ArrowUpRight,
  Bot,
} from "lucide-react";
import {
  sterisLineItems,
  severityConfig,
  statusConfig,
  formatCurrency,
  type InvoiceLineItem,
} from "@/lib/data";

// ─── Badge helpers ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: "high" }) {
  const cfg = severityConfig[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: "under_review" }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Row status badge ─────────────────────────────────────────────────────────

type RowStatus = InvoiceLineItem["status"];

const rowStatusConfig: Record<
  RowStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  match: {
    label: "Match",
    icon: CheckCircle,
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  price_mismatch: {
    label: "Price Mismatch",
    icon: XCircle,
    className: "bg-red-50 text-red-700 ring-1 ring-red-200",
  },
  qty_mismatch: {
    label: "Qty Mismatch",
    icon: AlertCircle,
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  both_mismatch: {
    label: "Both Mismatch",
    icon: AlertTriangle,
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  },
};

// ─── Three-way match table ────────────────────────────────────────────────────

function ThreeWayTable() {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200 shadow-sm">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-50">
            {[
              "Item Code",
              "Description",
              "PO Qty",
              "PS Qty",
              "Inv Qty",
              "PO Unit Price",
              "Inv Unit Price",
              "Delta",
              "Status",
            ].map((col, i) => (
              <th
                key={col}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 whitespace-nowrap ${
                  i === 0 ? "rounded-tl-xl" : ""
                } ${i === 8 ? "rounded-tr-xl" : ""}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {sterisLineItems.map((item, rowIdx) => {
            const isPriceMismatch =
              item.status === "price_mismatch" || item.status === "both_mismatch";
            const isQtyMismatch =
              item.status === "qty_mismatch" || item.status === "both_mismatch";
            const rowStatus = rowStatusConfig[item.status];
            const StatusIcon = rowStatus.icon;
            const isLastRow = rowIdx === sterisLineItems.length - 1;

            // Compute delta display
            let deltaDisplay: React.ReactNode = (
              <span className="text-slate-300 text-xs">—</span>
            );
            if (isPriceMismatch) {
              const delta = item.invoiceUnitPrice - item.poUnitPrice;
              deltaDisplay = (
                <span className="text-red-600 font-semibold">
                  {delta > 0 ? "+" : ""}${delta.toFixed(2)}/unit
                </span>
              );
            } else if (isQtyMismatch) {
              const delta = item.packingSlipQty - item.invoiceQty;
              deltaDisplay = (
                <span className="text-amber-600 font-semibold">
                  {delta > 0 ? "+" : ""}
                  {delta} units
                </span>
              );
            }

            return (
              <motion.tr
                key={item.itemCode}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + rowIdx * 0.07, duration: 0.25 }}
                className={`group ${
                  item.status !== "match" ? "bg-rose-50/20" : ""
                }`}
              >
                {/* Item Code */}
                <td
                  className={`px-4 py-3.5 font-mono text-xs text-slate-500 border-b border-slate-100 whitespace-nowrap ${
                    isLastRow ? "rounded-bl-xl" : ""
                  }`}
                >
                  {item.itemCode}
                </td>

                {/* Description */}
                <td className="px-4 py-3.5 text-slate-700 border-b border-slate-100 max-w-[220px]">
                  <span className="line-clamp-2 text-xs leading-relaxed">
                    {item.description}
                  </span>
                </td>

                {/* PO Qty */}
                <td className="px-4 py-3.5 text-slate-600 border-b border-slate-100 tabular-nums">
                  {item.poQty}
                </td>

                {/* PS Qty */}
                <td
                  className={`px-4 py-3.5 border-b border-slate-100 tabular-nums ${
                    isQtyMismatch
                      ? "bg-amber-50 text-amber-700 font-semibold"
                      : "text-slate-600"
                  }`}
                >
                  {item.packingSlipQty}
                </td>

                {/* Inv Qty */}
                <td
                  className={`px-4 py-3.5 border-b border-slate-100 tabular-nums ${
                    isQtyMismatch
                      ? "bg-red-50 text-red-700 font-semibold"
                      : "text-slate-600"
                  }`}
                >
                  {item.invoiceQty}
                </td>

                {/* PO Unit Price */}
                <td className="px-4 py-3.5 text-slate-600 border-b border-slate-100 tabular-nums">
                  ${item.poUnitPrice.toFixed(2)}
                </td>

                {/* Inv Unit Price */}
                <td
                  className={`px-4 py-3.5 border-b border-slate-100 tabular-nums ${
                    isPriceMismatch
                      ? "bg-red-50 text-red-700 font-bold"
                      : "text-slate-600"
                  }`}
                >
                  ${item.invoiceUnitPrice.toFixed(2)}
                  {isPriceMismatch && (
                    <span className="ml-1 text-[10px] text-red-400 font-normal">
                      (+{(((item.invoiceUnitPrice - item.poUnitPrice) / item.poUnitPrice) * 100).toFixed(0)}%)
                    </span>
                  )}
                </td>

                {/* Delta */}
                <td className="px-4 py-3.5 border-b border-slate-100 whitespace-nowrap">
                  {deltaDisplay}
                </td>

                {/* Status */}
                <td
                  className={`px-4 py-3.5 border-b border-slate-100 whitespace-nowrap ${
                    isLastRow ? "rounded-br-xl" : ""
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${rowStatus.className}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {rowStatus.label}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Summary box ──────────────────────────────────────────────────────────────

function MatchSummary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.3 }}
      className="mt-5 rounded-xl bg-slate-800 text-white p-6 grid grid-cols-1 sm:grid-cols-2 gap-6"
    >
      {/* Numbers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Total PO Value</span>
          <span className="font-semibold tabular-nums">{formatCurrency(28150)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Total Invoice Value</span>
          <span className="font-semibold tabular-nums text-red-400">{formatCurrency(29750)}</span>
        </div>
        <div className="h-px bg-slate-700" />
        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-sm font-medium">Variance</span>
          <span className="font-bold text-red-400 tabular-nums">
            +{formatCurrency(1600)}
            <span className="ml-1 text-xs font-normal text-red-400">(5.7%)</span>
          </span>
        </div>
      </div>

      {/* AI recommendation */}
      <div className="sm:border-l sm:border-slate-700 sm:pl-6">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            AI Recommendation
          </span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Hold invoice. Request revised invoice from Steris at contracted rate of $2.10/unit.
          Estimated savings:{" "}
          <span className="text-white font-semibold">$200/invoice</span> &times; 23 recurrences
          = <span className="text-emerald-400 font-bold">$4,600</span>.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────

function ActionBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.3 }}
      className="mt-8 flex flex-wrap gap-3"
    >
      <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm shadow-red-200">
        <XCircle className="w-4 h-4" />
        Hold Invoice
      </button>

      <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg ring-1 ring-amber-400 text-amber-700 bg-amber-50 text-sm font-semibold hover:bg-amber-100 transition-colors">
        <Send className="w-4 h-4" />
        Request Correction from Vendor
      </button>

      <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg ring-1 ring-slate-200 text-slate-600 bg-white text-sm font-medium hover:bg-slate-50 transition-colors">
        <ShieldCheck className="w-4 h-4" />
        Approve with Override
      </button>

      <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg ring-1 ring-indigo-200 text-indigo-700 bg-indigo-50 text-sm font-medium hover:bg-indigo-100 transition-colors">
        <ArrowUpRight className="w-4 h-4" />
        Escalate to Manager
      </button>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExceptionDetailPage() {
  return (
    <div className="min-h-full bg-slate-50">
      {/* Back link */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/exceptions"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Exception Queue
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-wrap items-start gap-3 mb-1">
            <div className="flex items-center gap-2.5">
              <GitCompare className="w-5 h-5 text-slate-400" />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                EX-006 &middot; Match Exception
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <SeverityBadge severity="high" />
              <StatusBadge status="under_review" />
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Steris Corporation &middot; Invoice{" "}
            <span className="font-mono text-slate-600">STC-2026-19847</span> &middot; Feb 28, 2026
          </p>
        </motion.div>

        {/* Alert banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="rounded-xl bg-red-600 text-white px-5 py-4 flex flex-wrap items-center gap-4 shadow-sm shadow-red-200"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="font-bold text-base">4 discrepancies detected</span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-red-200" />
              <span className="font-semibold">{formatCurrency(4600)} flagged</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-red-200" />
              <span>
                AI confidence: <span className="font-bold">98.7%</span>
              </span>
            </span>
          </div>
        </motion.div>

        {/* Three-way match section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-semibold text-slate-800">Three-Way Match</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              PO vs Packing Slip vs Invoice
            </span>
          </div>

          <ThreeWayTable />
          <MatchSummary />
        </motion.div>

        {/* Exception context */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="rounded-xl bg-white ring-1 ring-slate-200 p-5"
        >
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Exception Detail</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Price mismatch on Sterile Surgical Drape Sets. PO price: $2.10/unit. Invoiced price:
            $2.50/unit (+19%). 500 units per invoice &times; 23 invoices ={" "}
            <span className="font-semibold text-red-600">{formatCurrency(4600)} total overcharge</span>.
            Packing slip quantities match. Product description variant detected:{" "}
            <em>&ldquo;Sterile Drape Set&rdquo;</em> vs{" "}
            <em>&ldquo;Surgical Draping Kit Pro&rdquo;</em>.
          </p>
        </motion.div>

        {/* Action bar */}
        <ActionBar />
      </div>
    </div>
  );
}
