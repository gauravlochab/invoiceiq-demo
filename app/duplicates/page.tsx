"use client";

import { motion } from "framer-motion";
import {
  Mail,
  Inbox,
  Copy,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Cpu,
  Flag,
  XCircle,
  Search,
  ChevronUp,
  Zap,
} from "lucide-react";
import {
  duplicatePairs,
  DuplicatePair,
  formatCurrency,
  formatDate,
  statusConfig,
} from "@/lib/data";

// ─── AI ANALYSIS COPY PER PAIR ────────────────────────────────────────────────

const aiAnalysis: Record<string, string[]> = {
  "DUP-001": [
    "Same vendor ID: MedSupply Corp (VND-0142) — matched across both submissions",
    "Identical line items: 8/8 items match (SKUs, quantities, PO reference PO-2026-1047)",
    "Amount altered by $200 (0.42%) — common invoice-stuffing evasion pattern",
  ],
  "DUP-002": [
    "Exact duplicate: 100% similarity across all fields including line items and totals",
    "Same vendor EDI sender ID (HS-EDI-4421) re-submitted via email 4 days later",
    "Zero amount delta — likely accidental resubmission; payment would have doubled",
  ],
  "DUP-003": [
    "Same vendor account: Owens & Minor (VND-0389) — matched in vendor master",
    "Line item overlap: 11/12 items match; one SKU description variant detected",
    "Amount altered by $240 (1.94%) across 5-day gap — flagged for investigative review",
  ],
};

// ─── SUBMISSION ICON ──────────────────────────────────────────────────────────

function SubmissionIcon({ via }: { via: string }) {
  if (via === "Postal Mail") return <Mail className="w-3.5 h-3.5" />;
  if (via === "EDI") return <Zap className="w-3.5 h-3.5" />;
  if (via === "Vendor Portal") return <Database className="w-3.5 h-3.5" />;
  return <Inbox className="w-3.5 h-3.5" />;
}

// ─── SIMILARITY COLOR ─────────────────────────────────────────────────────────

function similarityStyle(score: number) {
  if (score >= 99) return { badge: "bg-red-600 text-white", ring: "ring-red-500" };
  return { badge: "bg-amber-500 text-white", ring: "ring-amber-400" };
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold ${accent ?? "text-slate-800"}`}>{value}</span>
    </div>
  );
}

// ─── HOW IT WORKS STRIP ───────────────────────────────────────────────────────

const steps = [
  {
    icon: Database,
    title: "Ingest",
    desc: "All invoices ingested from email, mail, EDI, portal",
    step: "01",
  },
  {
    icon: Cpu,
    title: "Vectorize",
    desc: "Line items, amounts, dates converted to similarity vectors",
    step: "02",
  },
  {
    icon: Flag,
    title: "Flag",
    desc: "Pairs exceeding 97% similarity threshold surfaced for review",
    step: "03",
  },
];

function HowItWorks() {
  return (
    <div className="bg-slate-900 rounded-2xl p-6">
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-5">
        How AI Duplicate Detection Works
      </p>
      <div className="flex flex-col md:flex-row items-stretch gap-0">
        {steps.map((s, i) => (
          <div key={s.step} className="flex flex-col md:flex-row items-stretch flex-1">
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 font-mono">{s.step}</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="font-bold text-white text-sm">{s.title}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:flex items-center justify-center w-8 shrink-0">
                <ArrowRight className="w-4 h-4 text-indigo-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ACTION BUTTONS ───────────────────────────────────────────────────────────

function ActionButtons({ pair }: { pair: DuplicatePair }) {
  if (pair.status === "open") {
    return (
      <div className="flex flex-wrap gap-2">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
          <XCircle className="w-4 h-4" />
          Block Duplicate
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors">
          <Search className="w-4 h-4" />
          Investigate
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold transition-colors">
          Dismiss
        </button>
      </div>
    );
  }
  if (pair.status === "resolved") {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-semibold cursor-default"
        >
          <CheckCircle2 className="w-4 h-4" />
          Resolved — {formatCurrency(pair.flaggedAmount)} saved
        </button>
      </div>
    );
  }
  if (pair.status === "under_review") {
    return (
      <div className="flex flex-wrap gap-2">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors">
          <Clock className="w-4 h-4" />
          Continue Investigation
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
          <ChevronUp className="w-4 h-4" />
          Escalate
        </button>
      </div>
    );
  }
  return null;
}

// ─── DUPLICATE PAIR CARD ──────────────────────────────────────────────────────

function DuplicatePairCard({
  pair,
  index,
  prominent,
}: {
  pair: DuplicatePair;
  index: number;
  prominent: boolean;
}) {
  const status = statusConfig[pair.status];
  const simStyle = similarityStyle(pair.similarity);
  const isPulse = pair.status === "open";
  const analysis = aiAnalysis[pair.id] ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.12, ease: "easeOut" }}
      className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden ${
        prominent
          ? "border-red-300 shadow-red-100 shadow-lg ring-1 ring-red-200"
          : "border-slate-200"
      }`}
    >
      {/* Prominent top accent bar */}
      {prominent && <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-400" />}

      {/* Card header */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-xl font-bold ${prominent ? "text-slate-900" : "text-slate-800"}`}
            >
              {pair.vendor}
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ color: status.color, backgroundColor: status.bg }}
            >
              {status.label}
            </span>
            <span className="text-xs font-mono text-slate-400">{pair.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-4 h-4 ${prominent ? "text-red-500" : "text-amber-500"}`} />
            <span
              className={`text-2xl font-extrabold ${prominent ? "text-red-600" : "text-amber-600"}`}
            >
              {formatCurrency(pair.flaggedAmount)}
            </span>
            <span className="text-sm text-slate-500">at risk</span>
          </div>
        </div>

        {/* Similarity badge */}
        <motion.div
          animate={isPulse ? { scale: [1, 1.04, 1] } : {}}
          transition={isPulse ? { repeat: Infinity, duration: 2.2, ease: "easeInOut" } : {}}
          className={`shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-xl ${simStyle.badge} ring-2 ${simStyle.ring} shadow-sm`}
        >
          <span className="text-2xl font-extrabold leading-none">{pair.similarity}%</span>
          <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-90">
            match
          </span>
        </motion.div>
      </div>

      {/* Side-by-side comparison */}
      <div className="mx-6 mb-5 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr]">
          {/* Invoice A */}
          <div className="p-4 flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Invoice A
            </span>
            <span className="font-mono text-sm font-semibold text-slate-800">
              {pair.invoice1.number}
            </span>
            <span className="text-xs text-slate-500">{formatDate(pair.invoice1.date)}</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(pair.invoice1.amount)}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <SubmissionIcon via={pair.invoice1.submittedVia} />
              <span>{pair.invoice1.submittedVia}</span>
            </div>
          </div>

          {/* Divider + VS + delta */}
          <div className="flex flex-col items-center justify-center px-3 py-4 gap-2 min-w-[72px]">
            <div className="w-px flex-1 bg-slate-200" />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                prominent ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
              }`}
            >
              VS
            </div>
            <div className="w-px flex-1 bg-slate-200" />
            {(pair.amountDelta > 0 || pair.daysDelta > 0) && (
              <div
                className={`text-center text-[10px] font-semibold leading-snug ${
                  prominent ? "text-red-500" : "text-amber-600"
                }`}
              >
                {pair.amountDelta > 0 && <div>&#916;&nbsp;{formatCurrency(pair.amountDelta)}</div>}
                {pair.daysDelta > 0 && <div>{pair.daysDelta}d apart</div>}
              </div>
            )}
          </div>

          {/* Invoice B */}
          <div className="p-4 flex flex-col gap-2.5 border-l border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Invoice B
            </span>
            <span className="font-mono text-sm font-semibold text-slate-800">
              {pair.invoice2.number}
            </span>
            <span className="text-xs text-slate-500">{formatDate(pair.invoice2.date)}</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(pair.invoice2.amount)}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <SubmissionIcon via={pair.invoice2.submittedVia} />
              <span>{pair.invoice2.submittedVia}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis box */}
      {analysis.length > 0 && (
        <div className="mx-6 mb-5 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
              AI Analysis
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {analysis.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 pb-5">
        <ActionButtons pair={pair} />
      </div>
    </motion.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DuplicatesPage() {
  const totalBlocked = duplicatePairs.reduce((s, p) => s + p.flaggedAmount, 0);
  const confirmed = duplicatePairs.filter((p) => p.status === "open").length;
  const underReview = duplicatePairs.filter((p) => p.status === "under_review").length;
  const resolved = duplicatePairs.filter((p) => p.status === "resolved").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
              <Copy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Duplicate Billing Detection
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-13">
            AI scanned{" "}
            <span className="font-semibold text-slate-700">1,847 invoices</span>
            {" · "}
            <span className="font-semibold text-red-600">3 duplicate pairs detected</span>
            {" · "}
            <span className="font-semibold text-slate-700">$56,070 at risk</span>
          </p>
        </motion.div>

        {/* ── Stat row ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          <StatCard label="Pairs Found" value={String(duplicatePairs.length)} />
          <StatCard label="Confirmed Duplicates" value={String(confirmed)} accent="text-red-600" />
          <StatCard label="Under Review" value={String(underReview)} accent="text-amber-600" />
          <StatCard label="Resolved" value={String(resolved)} accent="text-emerald-600" />
          <StatCard
            label="Total Blocked"
            value={formatCurrency(totalBlocked)}
            accent="text-red-700"
          />
        </motion.div>

        {/* ── How it works ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <HowItWorks />
        </motion.div>

        {/* ── Pair cards ── */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Flagged Duplicate Pairs
            </h2>
          </div>

          {duplicatePairs.map((pair, i) => (
            <DuplicatePairCard
              key={pair.id}
              pair={pair}
              index={i}
              prominent={pair.id === "DUP-001"}
            />
          ))}
        </div>

        {/* ── Footer note ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2 text-xs text-slate-400 pb-4"
        >
          <ShieldCheck className="w-4 h-4 text-slate-300" />
          Similarity scores computed using cosine distance on TF-IDF vectors of line-item
          descriptions, amounts, dates, and vendor metadata. Threshold: 97.0%.
        </motion.div>
      </div>
    </div>
  );
}
