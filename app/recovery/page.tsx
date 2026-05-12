"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, Clock, CheckCircle2, AlertCircle, XCircle,
  ChevronDown, ChevronRight, Bot, ArrowRight,
} from "lucide-react";
import {
  recoveryQueue,
  updateRecoveryRecord,
  formatCurrency,
  formatDate,
  type RecoveryRecord,
  type RecoveryStatus,
} from "@/lib/data";
import { useToast } from "@/components/Toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: RecoveryStatus): string {
  switch (status) {
    case "pending":     return "badge warning";
    case "in_progress": return "badge blue";
    case "recovered":   return "badge success";
    case "partial":     return "badge warning";
    case "closed":      return "badge neutral";
  }
}

function statusLabel(status: RecoveryStatus): string {
  switch (status) {
    case "pending":     return "Pending";
    case "in_progress": return "In Progress";
    case "recovered":   return "Recovered";
    case "partial":     return "Partial";
    case "closed":      return "Closed";
  }
}

function statusIcon(status: RecoveryStatus) {
  switch (status) {
    case "recovered":   return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    case "closed":      return <XCircle className="w-3.5 h-3.5 text-[#9ca3af]" />;
    case "partial":     return <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
    default:            return <Clock className="w-3.5 h-3.5 text-[#0065cb]" />;
  }
}

const OUTCOME_OPTIONS = [
  "Fully Recovered",
  "Partially Recovered",
  "Vendor Unresponsive",
  "Vendor Filed Dispute",
  "Closed — Write Off",
];

const AGENT_LOG = [
  { agent: "Insight Agent",    agentColor: "#0891b2", time: "09:51", msg: "Vendor risk scores recalculated. MedTech Solutions flagged Critical — 0% recovery rate, 5 days non-responsive." },
  { agent: "Recovery Agent",   agentColor: "#15803d", time: "09:42", msg: "Analysed BioMed Equipment response pattern. Historical recovery rate 80%. Recommended formal escalation to procurement director." },
  { agent: "Compliance Agent", agentColor: "#b45309", time: "09:28", msg: "Cardinal Health Q1 rebate audit complete. $26,554 rebate + $62,876 volume discount gap = $89,430 outstanding. Contract CTR-2025-CAR-003 reviewed." },
  { agent: "Recovery Agent",   agentColor: "#15803d", time: "09:15", msg: "Cross-referenced Cardinal Health rebate contract terms. Initiated follow-up email sequence. Awaiting finance team response." },
  { agent: "Validation Agent", agentColor: "#7c3aed", time: "09:03", msg: "Re-validated EX-006 line items against updated PO. Price delta on STE-4821-A confirmed +19%. Flagged for recovery." },
  { agent: "Recovery Agent",   agentColor: "#15803d", time: "08:50", msg: "Processed Henry Schein credit memo HS-CM-2026-077. Matched to REC-003 target. Marked as fully recovered." },
  { agent: "Invoice Agent",    agentColor: "#0065cb", time: "08:31", msg: "Ingested 14 new invoices from overnight batch. 2 flagged for three-way match review. 0 extraction errors." },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RecoveryPage() {
  const { showToast } = useToast();
  const [records, setRecords] = useState<RecoveryRecord[]>([...recoveryQueue]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setRecords([...recoveryQueue]);
  }, []);

  const totalTarget = records.reduce((s, r) => s + r.targetAmount, 0);
  const totalRecovered = records.reduce((s, r) => s + (r.recoveredAmount ?? 0), 0);
  const successRate = records.length > 0
    ? Math.round((records.filter(r => r.status === "recovered").length / records.length) * 100)
    : 0;
  const pendingCount = records.filter(r => r.status === "pending" || r.status === "in_progress").length;

  function handleOutcomeSubmit(id: string, recoveredAmount: number, outcome: string, note: string) {
    let newStatus: RecoveryStatus = "in_progress";
    if (outcome === "Fully Recovered") newStatus = "recovered";
    else if (outcome === "Partially Recovered") newStatus = "partial";
    else if (outcome === "Vendor Filed Dispute" || outcome === "Vendor Unresponsive") newStatus = "in_progress";
    else newStatus = "closed";

    updateRecoveryRecord(id, {
      status: newStatus,
      recoveredAmount: recoveredAmount > 0 ? recoveredAmount : undefined,
      closedReason: outcome,
      analystNote: note || undefined,
    });
    setRecords([...recoveryQueue]);
    setExpandedId(null);
    showToast(
      newStatus === "recovered"
        ? `Recovery recorded — ${formatCurrency(recoveredAmount)} fully recovered`
        : newStatus === "partial"
        ? `Partial recovery recorded — ${formatCurrency(recoveredAmount)} received`
        : `Outcome recorded — ${outcome}`,
      newStatus === "recovered" ? "success" : newStatus === "partial" ? "info" : "warning",
    );
  }

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-4 h-4 text-[#0065cb]" />
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#0065cb]">
                Healthcare AP · Recovery Agent
              </span>
            </div>
            <h1 className="text-xl font-semibold text-[#111827] tracking-tight leading-tight m-0">
              Recovery Queue
            </h1>
            <p className="text-xs text-[#4b5563] mt-1 m-0">
              Vendor recovery tracking — initiated by Invoice Agent, actioned by Recovery Agent
            </p>
          </div>
        </div>
      </div>

      <hr className="border-[#e5e7eb] m-0" />

      {/* Summary strip */}
      <div className="px-8 py-6">
        <div className="flex border border-[#e5e7eb] rounded-lg bg-white">
          <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
            <p className="section-label">In Queue</p>
            <p className="text-2xl font-bold text-[#111827] mt-1 m-0">{records.length}</p>
            <p className="text-[10px] text-[#9ca3af] mt-0.5">{pendingCount} active</p>
          </div>
          <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
            <p className="section-label">Total Target</p>
            <p className="text-2xl font-bold text-red-600 mt-1 m-0">{formatCurrency(totalTarget)}</p>
          </div>
          <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
            <p className="section-label">Recovered</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1 m-0">{formatCurrency(totalRecovered)}</p>
            <p className="text-[10px] text-[#9ca3af] mt-0.5">
              {totalTarget > 0 ? Math.round((totalRecovered / totalTarget) * 100) : 0}% of target
            </p>
          </div>
          <div className="flex-1 px-6 py-4">
            <p className="section-label">Success Rate</p>
            <p className={`text-2xl font-bold mt-1 m-0 ${successRate >= 80 ? "text-emerald-600" : successRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
              {successRate}%
            </p>
            <p className="text-[10px] text-[#9ca3af] mt-0.5">last 12 months</p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="px-8 pb-8 grid grid-cols-[1fr_320px] gap-5 items-start">

        {/* LEFT — Recovery Queue Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e5e7eb]">
            <p className="text-sm font-semibold text-[#111827] m-0">Active recoveries</p>
          </div>
          <div className="divide-y divide-[#f0f2f5]">
            {records.map((r) => (
              <RecoveryRow
                key={r.id}
                record={r}
                expanded={expandedId === r.id}
                onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                onSubmit={handleOutcomeSubmit}
              />
            ))}
          </div>
        </div>

        {/* RIGHT — Recovery Intelligence */}
        <div className="flex flex-col gap-4 sticky top-4">

          {/* Recovery score breakdown */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-[#0065cb]" />
              <p className="section-label m-0">Recovery Agent</p>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { label: "Response rate", value: 75, color: "bg-blue-500" },
                { label: "Settlement rate", value: successRate, color: successRate >= 70 ? "bg-emerald-500" : "bg-amber-500" },
                { label: "Avg days to close", value: 62, color: "bg-blue-400", isTime: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#4b5563] w-[120px] flex-shrink-0">{item.label}</span>
                  {item.isTime ? (
                    <span className="text-[11px] font-semibold text-[#111827]">18 days</span>
                  ) : (
                    <>
                      <div className="flex-1 bg-[#f0f2f5] rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-[#111827] w-[28px] text-right">{item.value}%</span>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#9ca3af] m-0">
              Target: 90% recovery rate · Current trajectory on track
            </p>
          </div>

          {/* Agent activity log */}
          <div className="card p-5">
            <p className="section-label mb-0">Agent activity log</p>
            <p className="text-[10px] text-[#9ca3af] m-0 mt-0.5">All 5 agents · last 2 hours</p>
            <div className="flex flex-col gap-0 mt-3">
              {AGENT_LOG.map((entry, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: entry.agentColor }} />
                    {i < AGENT_LOG.length - 1 && <div className="w-px flex-1 bg-[#e5e7eb]" />}
                  </div>
                  <div className="pb-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span
                        className="text-[9px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: entry.agentColor + "22", color: entry.agentColor }}
                      >
                        {entry.agent}
                      </span>
                      <span className="text-[9px] uppercase tracking-wide font-semibold text-[#9ca3af]">{entry.time}</span>
                    </div>
                    <p className="text-[11px] text-[#4b5563] m-0 leading-relaxed">{entry.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link to vendor scoring */}
          <Link
            href="/vendor-scoring"
            className="card p-4 flex items-center justify-between no-underline hover:bg-[#f0f2f5] transition-colors group"
          >
            <div>
              <p className="text-xs font-semibold text-[#111827] m-0">Vendor Recovery Scores</p>
              <p className="text-[10px] text-[#9ca3af] mt-0.5 m-0">Recovery % reflected in vendor risk scoring</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#9ca3af] group-hover:text-[#0065cb] transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Recovery Row ──────────────────────────────────────────────────────────────

function RecoveryRow({
  record: r,
  expanded,
  onToggle,
  onSubmit,
}: {
  record: RecoveryRecord;
  expanded: boolean;
  onToggle: () => void;
  onSubmit: (id: string, amount: number, outcome: string, note: string) => void;
}) {
  const [amount, setAmount] = useState(r.targetAmount);
  const [outcome, setOutcome] = useState(OUTCOME_OPTIONS[0]);
  const [note, setNote] = useState(r.analystNote ?? "");
  const [touched, setTouched] = useState(false);
  const canRecord = r.status === "pending" || r.status === "in_progress";

  return (
    <div>
      <div
        className={`px-5 py-4 flex items-start gap-3 ${canRecord ? "cursor-pointer hover:bg-[#f7f8fa]" : ""} transition-colors`}
        onClick={canRecord ? onToggle : undefined}
      >
        {/* Chevron */}
        <div className="flex-shrink-0 mt-0.5">
          {canRecord ? (
            expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af]" />
              : <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
          ) : (
            statusIcon(r.status)
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono text-[#9ca3af]">{r.id}</span>
            <span className={statusBadge(r.status)}>{statusLabel(r.status)}</span>
          </div>
          <p className="text-xs font-semibold text-[#111827] m-0">{r.vendor}</p>
          <p className="text-[11px] text-[#4b5563] m-0 font-mono">{r.invoiceNumber}</p>
          {r.analystNote && (
            <p className="text-[11px] text-[#4b5563] m-0 mt-1 leading-relaxed line-clamp-2">{r.analystNote}</p>
          )}
          <p className="text-[10px] text-[#9ca3af] mt-1 m-0">
            Initiated {formatDate(r.initiatedAt)} · {r.emailSentTo}
          </p>
        </div>

        {/* Amount */}
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-semibold text-red-600 tabular-nums m-0">
            {formatCurrency(r.targetAmount)}
          </p>
          <p className="text-[10px] text-[#9ca3af] m-0">target</p>
          {r.recoveredAmount != null && (
            <>
              <p className="text-xs font-semibold text-emerald-600 tabular-nums m-0 mt-1">
                {formatCurrency(r.recoveredAmount)}
              </p>
              <p className="text-[10px] text-[#9ca3af] m-0">recovered</p>
            </>
          )}
        </div>
      </div>

      {/* Expanded outcome form */}
      {expanded && canRecord && (
        <div className="px-5 pb-5 border-t border-[#f0f2f5] bg-[#fafbfc]">
          <p className="section-label mt-4 mb-3">Record outcome</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-[#4b5563] font-semibold block mb-1">
                Amount Recovered ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#d1d5db] bg-white text-[#111827] focus:outline-none focus:border-[#0065cb]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-[#4b5563] font-semibold block mb-1">
                Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#d1d5db] bg-white text-[#111827] focus:outline-none focus:border-[#0065cb] cursor-pointer"
              >
                {OUTCOME_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-[#4b5563] font-semibold block mb-1">
                Notes <span className="text-[#9ca3af] normal-case font-normal">(captured for AI enrichment)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#d1d5db] bg-white text-[#111827] focus:outline-none focus:border-[#0065cb] resize-none"
                placeholder="Describe the vendor response, commitments made, or reason for closure…"
              />
            </div>
            {touched && amount <= 0 && outcome !== "Vendor Unresponsive" && outcome !== "Closed — Write Off" && (
              <p className="text-[11px] text-red-600 m-0">Enter recovered amount or choose a write-off outcome.</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTouched(true);
                  if (amount <= 0 && outcome !== "Vendor Unresponsive" && outcome !== "Vendor Filed Dispute" && outcome !== "Closed — Write Off") return;
                  onSubmit(r.id, amount, outcome, note);
                }}
                className="flex-1 text-xs font-medium py-2 rounded-md bg-[#0065cb] text-white border-none cursor-pointer hover:bg-[#0057ad] transition-colors"
              >
                Save outcome
              </button>
              <button
                onClick={onToggle}
                className="px-4 text-xs font-medium py-2 rounded-md bg-white text-[#4b5563] border border-[#d1d5db] cursor-pointer hover:bg-[#f0f2f5] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
