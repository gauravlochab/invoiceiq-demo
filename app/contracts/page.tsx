"use client";

import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  DollarSign,
  Calendar,
  XCircle,
  TrendingUp,
  Download,
  Plus,
  Clock,
  RefreshCw,
  PhoneCall,
  Bell,
  Tag,
  Layers,
} from "lucide-react";
import { contracts, Contract, formatCurrency, formatDate } from "@/lib/data";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getSpendPct(contract: Contract): number {
  return (contract.currentSpend / contract.capValue) * 100;
}

function getBarColor(status: Contract["status"]): string {
  if (status === "breached") return "bg-red-500";
  if (status === "warning") return "bg-amber-400";
  return "bg-indigo-500";
}

function getStatusBadge(status: Contract["status"]) {
  const map: Record<Contract["status"], { label: string; className: string }> = {
    breached: {
      label: "Breached",
      className: "bg-red-100 text-red-700 ring-1 ring-red-200",
    },
    warning: {
      label: "At Risk",
      className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    },
    compliant: {
      label: "Compliant",
      className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    },
    expired: {
      label: "Expired",
      className: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
    },
  };
  const cfg = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function getCategoryBadge(category: string) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      <Tag className="h-3 w-3" />
      {category}
    </span>
  );
}

function getLeftBorder(status: Contract["status"]): string {
  if (status === "breached") return "border-l-4 border-l-red-500";
  if (status === "warning") return "border-l-4 border-l-amber-400";
  return "border-l-4 border-l-transparent";
}

// ─── SPEND BAR ───────────────────────────────────────────────────────────────

function SpendBar({ contract }: { contract: Contract }) {
  const pct = getSpendPct(contract);
  const isBreached = contract.status === "breached";
  const isWarning = contract.status === "warning";
  const normalFillPct = Math.min(pct, 100);
  const overflowPct = isBreached ? pct - 100 : 0;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span
          className={`font-semibold ${
            isBreached
              ? "text-red-600"
              : isWarning
              ? "text-amber-600"
              : "text-slate-700"
          }`}
        >
          {formatCurrency(contract.currentSpend)}{" "}
          <span className="font-normal text-slate-400">/</span>{" "}
          {formatCurrency(contract.capValue)}
        </span>
        <span
          className={`text-xs font-bold tracking-wide ${
            isBreached
              ? "text-red-600"
              : isWarning
              ? "text-amber-600"
              : "text-slate-500"
          }`}
        >
          {pct.toFixed(1)}% of cap
        </span>
      </div>

      {/* Track */}
      <div className="relative h-3 w-full">
        {/* Background track */}
        <div className="absolute inset-0 rounded-full bg-slate-100" />

        {/* Normal fill — up to 100% */}
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all ${getBarColor(
            contract.status
          )}`}
          style={{ width: `${normalFillPct}%` }}
        />

        {/* Cap marker line for breached */}
        {isBreached && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-700 z-10"
            style={{ left: "100%" }}
          />
        )}
      </div>

      {/* Overflow indicator below the bar */}
      {isBreached && overflowPct > 0 && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <div className="h-2 rounded-full bg-red-400 opacity-80" style={{ width: `${Math.min(overflowPct * 0.6, 120)}px` }} />
          <span className="font-bold tracking-widest text-red-700 text-[10px]">
            BREACHED — {formatCurrency(contract.currentSpend - contract.capValue)} over cap
          </span>
        </div>
      )}

      {/* Quantity bar for "both" cap type */}
      {contract.capType === "both" &&
        contract.capQuantity !== undefined &&
        contract.currentQuantity !== undefined && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Volume: {contract.currentQuantity.toLocaleString()} /{" "}
                {contract.capQuantity.toLocaleString()} units
              </span>
              <span>
                {((contract.currentQuantity / contract.capQuantity) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-400"
                style={{
                  width: `${Math.min(
                    (contract.currentQuantity / contract.capQuantity) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
    </div>
  );
}

// ─── REBATE ALERT ────────────────────────────────────────────────────────────

function RebateAlert({ amount }: { amount: number }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
      <div className="text-sm">
        <span className="font-semibold text-amber-800">
          {formatCurrency(amount)} in unclaimed rebates
        </span>
        <span className="ml-1 text-amber-700">
          — No credit memo received for Q1 2026
        </span>
      </div>
    </div>
  );
}

// ─── TIER PRICING TABLE ──────────────────────────────────────────────────────

function TierPricingBlock({
  tiers,
}: {
  tiers: { upToQty: number; unitPrice: number }[];
}) {
  const currentVolume = 2340;
  const activeTierIdx = tiers.findIndex((t) => currentVolume <= t.upToQty);
  const effectiveTierIdx =
    activeTierIdx === -1 ? tiers.length - 1 : activeTierIdx;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2">
        <Layers className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Tiered Pricing Schedule
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {tiers.map((tier, i) => {
          const isLast = i === tiers.length - 1;
          const label = isLast
            ? `> ${tiers[i - 1]?.upToQty.toLocaleString()} units/month`
            : `≤ ${tier.upToQty.toLocaleString()} units/month`;
          const isActive = i === effectiveTierIdx;
          return (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                isActive ? "bg-amber-50" : ""
              }`}
            >
              <span className={isActive ? "font-medium text-amber-800" : "text-slate-600"}>
                Tier {i + 1}: {label}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold ${
                    isActive ? "text-amber-700" : "text-slate-700"
                  }`}
                >
                  ${tier.unitPrice}/unit
                </span>
                {isActive && (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    SHOULD APPLY
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-amber-200 bg-amber-50 px-4 py-2.5">
        <p className="text-xs text-amber-700">
          <span className="font-semibold">
            Current month volume: {currentVolume.toLocaleString()} units
          </span>{" "}
          — Should be on Tier 2 at{" "}
          <span className="font-semibold">$72/unit</span>. Vendor is billing at Tier 1 ($85/unit).
        </p>
      </div>
    </div>
  );
}

// ─── BREACHED BANNER ─────────────────────────────────────────────────────────

function BreachedBanner({ contract }: { contract: Contract }) {
  const overage = contract.currentSpend - contract.capValue;
  return (
    <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 ring-1 ring-red-300">
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div className="space-y-1">
          <p className="text-sm font-bold uppercase tracking-wide text-red-700">
            Contract Breached
          </p>
          <ul className="space-y-0.5 text-sm text-red-600">
            <li>
              <span className="font-semibold">{formatCurrency(overage)} over cap</span>
            </li>
            <li>23 invoices processed after breach</li>
            <li className="font-semibold">Immediate action required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── ACTION BUTTONS ───────────────────────────────────────────────────────────

function BreachedActions() {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95">
        <Clock className="h-4 w-4" />
        Pause Vendor Payments
      </button>
      <button className="inline-flex items-center gap-2 rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 active:scale-95">
        <PhoneCall className="h-4 w-4" />
        Contact Vendor
      </button>
      <button className="inline-flex items-center gap-2 rounded-lg border border-indigo-400 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 active:scale-95">
        <Bell className="h-4 w-4" />
        Notify CFO
      </button>
    </div>
  );
}

function WarningActions() {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-95">
        <DollarSign className="h-4 w-4" />
        Request Rebate Credit Memo
      </button>
      <button className="inline-flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50 active:scale-95">
        <RefreshCw className="h-4 w-4" />
        Submit Pricing Correction
      </button>
    </div>
  );
}

// ─── CONTRACT CARD ────────────────────────────────────────────────────────────

function ContractCard({
  contract,
  index,
}: {
  contract: Contract;
  index: number;
}) {
  const isBreached = contract.status === "breached";
  const isCardinalWarning =
    contract.status === "warning" &&
    (contract.rebateMissed !== undefined || contract.tieredPricing !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={`rounded-xl bg-white shadow-sm ring-1 ring-slate-200 ${getLeftBorder(
        contract.status
      )} overflow-hidden`}
    >
      <div className="p-6">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">
              {contract.vendor}
            </h3>
            <code className="text-xs font-mono text-slate-400">
              {contract.contractNumber}
            </code>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {getCategoryBadge(contract.category)}
              {getStatusBadge(contract.status)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
            </span>
          </div>
        </div>

        {/* Spend bar */}
        <SpendBar contract={contract} />

        {/* Breached banner */}
        {isBreached && <BreachedBanner contract={contract} />}

        {/* Rebate alert */}
        {contract.rebateMissed !== undefined && contract.rebateMissed > 0 && (
          <RebateAlert amount={contract.rebateMissed} />
        )}

        {/* Tier pricing */}
        {contract.tieredPricing && (
          <TierPricingBlock tiers={contract.tieredPricing} />
        )}

        {/* Action buttons */}
        {isBreached && <BreachedActions />}
        {isCardinalWarning && <WarningActions />}
      </div>
    </motion.div>
  );
}

// ─── SUMMARY STAT CARD ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: "amber" | "red";
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex-1 min-w-[180px] rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p
            className={`text-2xl font-bold ${
              accent === "amber"
                ? "text-amber-600"
                : accent === "red"
                ? "text-red-600"
                : "text-slate-900"
            }`}
          >
            {value}
          </p>
        </div>
        <div
          className={`rounded-lg p-2 ${
            accent === "amber"
              ? "bg-amber-50 text-amber-500"
              : accent === "red"
              ? "bg-red-50 text-red-500"
              : "bg-indigo-50 text-indigo-500"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── RENEWAL TIMELINE ─────────────────────────────────────────────────────────

function RenewalTimeline() {
  const renewals = [
    {
      vendor: "BioMed Equipment Inc.",
      contractNumber: "CTR-2024-BIO-009",
      endDate: "Dec 31, 2025",
      label: "EXPIRED",
      urgency: "red" as const,
      note: "Contract expired — payments continued past cap",
    },
    {
      vendor: "Cardinal Health",
      contractNumber: "CTR-2025-CAR-003",
      endDate: "Mar 31, 2026",
      label: "Expires soon",
      urgency: "amber" as const,
      note: "Expiring in < 30 days — rebate terms pending negotiation",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.35 }}
      className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-500" />
          <h2 className="text-base font-semibold text-slate-800">
            Upcoming Contract Renewals
          </h2>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          2 require action
        </span>
      </div>

      <ul className="divide-y divide-slate-100">
        {renewals.map((r, i) => (
          <li key={i} className="flex items-start justify-between gap-4 px-6 py-4">
            <div className="flex items-start gap-3">
              {/* Timeline dot */}
              <div className="mt-1 flex-shrink-0">
                <div
                  className={`h-3 w-3 rounded-full ring-2 ring-white ${
                    r.urgency === "red"
                      ? "bg-red-500 ring-red-200"
                      : "bg-amber-400 ring-amber-100"
                  }`}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">{r.vendor}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide ${
                      r.urgency === "red"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  <code className="font-mono">{r.contractNumber}</code> · Contract end:{" "}
                  <span className="font-medium">{r.endDate}</span>
                </p>
                <p className="text-xs text-slate-400">{r.note}</p>
              </div>
            </div>

            <button className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 active:scale-95">
              <RefreshCw className="h-3.5 w-3.5" />
              Renew Contract
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ContractCompliancePage() {
  const totalContractValue = contracts.reduce((s, c) => s + c.capValue, 0);
  const currentPeriodSpend = contracts.reduce((s, c) => s + c.currentSpend, 0);
  const unclaimed = contracts.reduce((s, c) => s + (c.rebateMissed ?? 0), 0);
  const breachedCount = contracts.filter((c) => c.status === "breached").length;
  const atRiskCount = contracts.filter((c) => c.status === "warning").length;

  return (
    <div className="min-h-full p-6 md:p-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-600 p-2">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Contract Compliance
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            {contracts.length} active contracts
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-medium text-amber-600">{atRiskCount} at risk</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-medium text-red-600">{breachedCount} breached</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95">
            <Download className="h-4 w-4" />
            Download Report
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95">
            <Plus className="h-4 w-4" />
            Add Contract
          </button>
        </div>
      </motion.div>

      {/* ── Summary stat cards ── */}
      <div className="mb-8 flex flex-wrap gap-4">
        <StatCard
          icon={FileText}
          label="Total Contract Value"
          value={formatCurrency(totalContractValue)}
          delay={0.05}
        />
        <StatCard
          icon={TrendingUp}
          label="Current Period Spend"
          value={formatCurrency(currentPeriodSpend)}
          delay={0.1}
        />
        <StatCard
          icon={DollarSign}
          label="Unclaimed Rebates"
          value={formatCurrency(unclaimed)}
          accent="amber"
          delay={0.15}
        />
        <StatCard
          icon={AlertTriangle}
          label="Contracts Breached"
          value={String(breachedCount)}
          accent="red"
          delay={0.2}
        />
      </div>

      {/* ── Contract cards ── */}
      <div className="mb-8 space-y-5">
        {contracts.map((contract, i) => (
          <ContractCard key={contract.id} contract={contract} index={i} />
        ))}
      </div>

      {/* ── Renewal timeline ── */}
      <RenewalTimeline />
    </div>
  );
}
