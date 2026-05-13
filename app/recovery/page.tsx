"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, Clock, CheckCircle2, AlertCircle, XCircle,
  ChevronDown, ChevronRight, Bot, ArrowRight, Shield,
  CalendarClock, Mail, Timer, History, RefreshCw,
} from "lucide-react";
import {
  recoveryQueue,
  updateRecoveryRecord,
  formatCurrency,
  formatDate,
  vendorCategoryMap,
  recoveryTrendData,
  type RecoveryRecord,
  type RecoveryStatus,
} from "@/lib/data";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  PARKLAND_RECOVERY_CONFIG,
  daysUntilDeadline,
  getSlaUrgency,
  getSlaColor,
  mapLegacyStatusToPhase,
  getPhaseConfig,
} from "@/lib/recovery-config";
import { useToast } from "@/components/Toast";
import { VendorBadge } from "@/components/VendorBadge";
import { CategoryBadge } from "@/components/CategoryBadge";

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
    case "closed":      return <XCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
    case "partial":     return <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
    default:            return <Clock className="w-3.5 h-3.5 text-[var(--acl-primary)]" />;
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
  { agent: "Insight Agent",    agentColor: "var(--agent-insight)", time: "09:51", msg: "Vendor risk scores recalculated. MedTech Solutions flagged Critical — 0% recovery rate, 5 days non-responsive." },
  { agent: "Recovery Agent",   agentColor: "var(--agent-recovery)", time: "09:42", msg: "Analysed BioMed Equipment response pattern. Historical recovery rate 80%. Recommended formal escalation to procurement director." },
  { agent: "Compliance Agent", agentColor: "var(--agent-compliance)", time: "09:28", msg: "Cardinal Health Q1 rebate audit complete. $26,554 rebate + $62,876 volume discount gap = $89,430 outstanding. Contract CTR-2025-CAR-003 reviewed." },
  { agent: "Recovery Agent",   agentColor: "var(--agent-recovery)", time: "09:15", msg: "Cross-referenced Cardinal Health rebate contract terms. Initiated follow-up email sequence. Awaiting finance team response." },
  { agent: "Validation Agent", agentColor: "var(--agent-validation)", time: "09:03", msg: "Re-validated EX-006 line items against updated PO. Price delta on STE-4821-A confirmed +19%. Flagged for recovery." },
  { agent: "Recovery Agent",   agentColor: "var(--agent-recovery)", time: "08:50", msg: "Processed Henry Schein credit memo HS-CM-2026-077. Matched to REC-003 target. Marked as fully recovered." },
  { agent: "Invoice Agent",    agentColor: "var(--agent-invoice)", time: "08:31", msg: "Ingested 14 new invoices from overnight batch. 2 flagged for three-way match review. 0 extraction errors." },
];

// ─── SLA Badge Component ──────────────────────────────────────────────────────

function SlaBadge({ deadline, status }: { deadline?: string; status: RecoveryStatus }) {
  if (!deadline) return null;
  // Don't show SLA for resolved/closed items
  if (status === "recovered" || status === "closed") return null;

  const days = daysUntilDeadline(deadline);
  const urgency = getSlaUrgency(days);
  const colors = getSlaColor(urgency);

  const label =
    urgency === "overdue"
      ? `Overdue by ${Math.abs(days)}d`
      : `${days}d remaining`;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: colors.dot }}
      />
      <Timer className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

// ─── Status Timeline Component ────────────────────────────────────────────────

function StatusTimeline({ history }: { history: NonNullable<RecoveryRecord["statusHistory"]> }) {
  // Show last 4 entries to keep it compact
  const entries = history.slice(-4);
  const hasMore = history.length > 4;

  return (
    <div className="mt-3 pt-3 border-t border-[var(--bg-subtle)]">
      <div className="flex items-center gap-1.5 mb-2">
        <History className="w-3 h-3 text-[var(--text-muted)]" />
        <span className="text-[10px] uppercase tracking-wide font-semibold text-[var(--text-tertiary)]">
          Status history
        </span>
        {hasMore && (
          <span className="text-[9px] text-[var(--text-muted)]">
            ({history.length} total)
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0">
        {entries.map((entry, i) => {
          const phase = (() => {
            const phaseMap: Record<string, string> = {
              "Identified": "identified",
              "Vendor Contacted": "vendor_contacted",
              "Under Review": "under_review",
              "Credit Pending": "credit_pending",
              "Resolved": "resolved",
              "Escalated": "escalated",
            };
            return phaseMap[entry.status] || "identified";
          })();
          const config = getPhaseConfig(phase as "identified" | "vendor_contacted" | "under_review" | "credit_pending" | "resolved" | "escalated");

          return (
            <div key={i} className="flex gap-2">
              <div className="flex flex-col items-center gap-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: config.slaColor }}
                />
                {i < entries.length - 1 && (
                  <div className="w-px flex-1 bg-[var(--border)]" />
                )}
              </div>
              <div className="pb-2 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-[var(--text-primary)]">
                    {entry.status}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] font-mono">
                    {formatDate(entry.date)}
                  </span>
                </div>
                {entry.note && (
                  <p className="text-[10px] text-[var(--text-tertiary)] m-0 leading-relaxed">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recovery Trend Tooltip ───────────────────────────────────────────────────

function RecoveryTrendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--border)] rounded-md px-3 py-2 shadow-sm">
      <p className="text-[11px] font-semibold text-[var(--text-primary)] m-0 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-[10px] m-0" style={{ color: p.dataKey === "recovered" ? "var(--chart-recovered)" : "var(--chart-target)" }}>
          {p.dataKey === "recovered" ? "Recovered" : "Target"}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RecoveryPage() {
  const { showToast } = useToast();
  const [records, setRecords] = useState<RecoveryRecord[]>([...recoveryQueue]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refreshRecords = useCallback(() => {
    setRecords([...recoveryQueue]);
  }, []);

  useEffect(() => {
    refreshRecords();
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [refreshRecords]);

  const totalTarget = records.reduce((s, r) => s + r.targetAmount, 0);
  const totalRecovered = records.reduce((s, r) => s + (r.recoveredAmount ?? 0), 0);
  const successRate = records.length > 0
    ? Math.round((records.filter(r => r.status === "recovered").length / records.length) * 100)
    : 0;
  const pendingCount = records.filter(r => r.status === "pending" || r.status === "in_progress").length;

  // Active (actionable) record IDs for select-all logic
  const activeRecordIds = records
    .filter(r => r.status === "pending" || r.status === "in_progress")
    .map(r => r.id);

  // Determine select-all state
  const allActiveSelected = activeRecordIds.length > 0 && activeRecordIds.every(id => selectedIds.has(id));
  const someActiveSelected = activeRecordIds.some(id => selectedIds.has(id));

  // SLA metrics
  const overdueCount = records.filter(r => {
    if (r.status === "recovered" || r.status === "closed") return false;
    if (!r.slaDeadline) return false;
    return daysUntilDeadline(r.slaDeadline) < 0;
  }).length;

  function handleSelectAll() {
    if (allActiveSelected) {
      // Deselect all active
      setSelectedIds(prev => {
        const next = new Set(prev);
        activeRecordIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Select all active
      setSelectedIds(prev => {
        const next = new Set(prev);
        activeRecordIds.forEach(id => next.add(id));
        return next;
      });
    }
  }

  function handleToggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBulkAction(action: "escalate" | "follow-up" | "export") {
    const count = selectedIds.size;
    switch (action) {
      case "escalate":
        showToast(`${count} record${count !== 1 ? "s" : ""} escalated`, "info");
        break;
      case "follow-up":
        showToast(`Follow-up emails sent for ${count} record${count !== 1 ? "s" : ""}`, "success");
        break;
      case "export":
        showToast(`${count} record${count !== 1 ? "s" : ""} exported`, "info");
        break;
    }
    setSelectedIds(new Set());
  }

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
    // Clear from selection if status changed to non-actionable
    if (newStatus !== "in_progress") {
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
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
    <div className="bg-[var(--bg-base)] min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-4 h-4 text-[var(--acl-primary)]" />
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--acl-primary)]">
                Healthcare AP · Recovery Agent
              </span>
            </div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-tight m-0">
              Recovery Queue
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 m-0">
              Vendor recovery tracking — initiated by Invoice Agent, actioned by Recovery Agent
            </p>
          </div>
          <button
            onClick={() => { refreshRecords(); showToast("Recovery queue refreshed", "info"); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer mt-1 flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <hr className="border-[var(--border)] m-0" />

      {/* Policy Info Banner */}
      <div className="px-8 pt-6">
        <div className="alert-bar info flex items-start gap-3">
          <Shield className="w-4 h-4 text-[var(--acl-primary)] mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[11px] font-semibold text-[var(--acl-primary)] m-0">
                Parkland Health Recovery Policy
              </p>
              <span className="text-[9px] font-mono text-[var(--text-tertiary)] bg-white/60 px-1.5 py-0.5 rounded">
                {PARKLAND_RECOVERY_CONFIG.policyRef}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] m-0 leading-relaxed">
              {PARKLAND_RECOVERY_CONFIG.policyStatement}
            </p>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      {loading ? (
        <div className="px-8 py-6">
          <div className="flex border border-[var(--border)] rounded-lg bg-white">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex-1 px-6 py-4 ${i < 5 ? "border-r border-[var(--border)]" : ""}`}>
                <div className="h-3 w-20 bg-[var(--border)] rounded animate-pulse mb-3" />
                <div className="h-7 w-14 bg-[var(--border)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="px-8 py-6">
        <div className="flex border border-[var(--border)] rounded-lg bg-white">
          <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
            <p className="section-label">In Queue</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 m-0">{records.length}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{pendingCount} active</p>
          </div>
          <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
            <p className="section-label">Total Target</p>
            <p className="text-2xl font-bold text-red-600 mt-1 m-0">{formatCurrency(totalTarget)}</p>
          </div>
          <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
            <p className="section-label">Recovered</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1 m-0">{formatCurrency(totalRecovered)}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              {totalTarget > 0 ? Math.round((totalRecovered / totalTarget) * 100) : 0}% of target
            </p>
          </div>
          <div className="flex-1 px-6 py-4 border-r border-[var(--border)]">
            <p className="section-label">Success Rate</p>
            <p className={`text-2xl font-bold mt-1 m-0 ${successRate >= 80 ? "text-emerald-600" : successRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
              {successRate}%
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">last 12 months</p>
          </div>
          <div className="flex-1 px-6 py-4">
            <p className="section-label">SLA Overdue</p>
            <p className={`text-2xl font-bold mt-1 m-0 ${overdueCount > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {overdueCount}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              {overdueCount === 0 ? "all on track" : `require${overdueCount === 1 ? "s" : ""} attention`}
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Recovery Trend */}
      <div className="px-8 pb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] m-0">Recovery Trend</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 m-0">Monthly recovery amounts — last 12 months</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                <span className="inline-block w-6 h-0.5 rounded-sm bg-[var(--chart-target)]" style={{ borderTop: "2px dashed var(--chart-target)", background: "none" }} />
                Target
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                <span className="inline-block w-6 h-0.5 rounded-sm bg-[var(--chart-recovered)]" />
                Recovered
              </span>
            </div>
          </div>
          <div role="img" aria-label="Recovery trend chart showing monthly target vs recovered amounts">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={recoveryTrendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" horizontal={true} vertical={false} stroke="var(--bg-subtle)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<RecoveryTrendTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="target" stroke="var(--chart-target)" strokeWidth={1} strokeDasharray="5 3" fill="var(--critical-subtle)" fillOpacity={0.4} dot={false} />
                <Area type="monotone" dataKey="recovered" stroke="var(--chart-recovered)" strokeWidth={1.5} fill="var(--success-subtle)" fillOpacity={0.6} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">

        {/* LEFT — Recovery Queue Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeRecordIds.length > 0 && (
                <input
                  type="checkbox"
                  checked={allActiveSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someActiveSelected && !allActiveSelected;
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-[var(--border-strong)] accent-[var(--acl-primary)] cursor-pointer flex-shrink-0"
                  aria-label="Select all active recoveries"
                />
              )}
              <p className="text-sm font-semibold text-[var(--text-primary)] m-0">Active recoveries</p>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)]">SLA tracked per Parkland Policy 4.3</span>
            </div>
          </div>

          {/* Bulk action toolbar */}
          {selectedIds.size > 0 && (
            <div className="px-5 py-2.5 bg-[var(--acl-primary-subtle)] border-b border-[var(--info-border)] flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--acl-primary)]">{selectedIds.size} selected</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction("escalate")}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-md bg-[var(--acl-primary)] text-white border-none cursor-pointer hover:bg-[var(--acl-primary-hover)] transition-colors"
                >
                  Bulk Escalate
                </button>
                <button
                  onClick={() => handleBulkAction("follow-up")}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-md bg-white text-[var(--acl-primary)] border border-[var(--acl-primary)] cursor-pointer hover:bg-[var(--acl-primary-subtle)] transition-colors"
                >
                  Send Follow-up Emails
                </button>
                <button
                  onClick={() => handleBulkAction("export")}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-md bg-white text-[var(--text-secondary)] border border-[var(--border-strong)] cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  Export Selected
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-[var(--bg-subtle)]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-4 h-4 bg-[var(--border)] rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 bg-[var(--border)] rounded animate-pulse" />
                    <div className="h-2.5 w-48 bg-[var(--border)] rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-16 bg-[var(--border)] rounded-full animate-pulse" />
                  <div className="h-4 w-20 bg-[var(--border)] rounded animate-pulse" />
                </div>
              ))
            ) : records.map((r) => (
              <RecoveryRow
                key={r.id}
                record={r}
                expanded={expandedId === r.id}
                onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                onSubmit={handleOutcomeSubmit}
                selected={selectedIds.has(r.id)}
                onSelect={() => handleToggleSelect(r.id)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT — Recovery Intelligence */}
        <div className="flex flex-col gap-4 sticky top-4">

          {/* Recovery score breakdown */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-[var(--acl-primary)]" />
              <p className="section-label m-0">Recovery Agent</p>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { label: "Response rate", value: 75, color: "bg-blue-500" },
                { label: "Settlement rate", value: successRate, color: successRate >= 70 ? "bg-emerald-500" : "bg-amber-500" },
                { label: "Avg days to close", value: 62, color: "bg-blue-400", isTime: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-secondary)] w-[120px] flex-shrink-0">{item.label}</span>
                  {item.isTime ? (
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">18 days</span>
                  ) : (
                    <>
                      <div className="flex-1 bg-[var(--bg-subtle)] rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--text-primary)] w-[28px] text-right">{item.value}%</span>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] m-0">
              Target: 90% recovery rate · Current trajectory on track
            </p>
          </div>

          {/* SLA Summary */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="w-4 h-4 text-[var(--warning)]" />
              <p className="section-label m-0">SLA Compliance</p>
            </div>
            <div className="space-y-2">
              {PARKLAND_RECOVERY_CONFIG.transitions.map((t) => (
                <div key={`${t.from}-${t.to}`} className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-secondary)] flex-1 min-w-0 truncate pr-2">
                    {getPhaseConfig(t.from).label} → {getPhaseConfig(t.to).label}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {t.slaBusinessDays}d SLA
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--bg-subtle)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)]">Escalation trigger</span>
                <span className="text-[10px] font-semibold text-red-600">10 business days</span>
              </div>
              <p className="text-[9px] text-[var(--text-muted)] mt-1 m-0">
                No vendor response after initial contact
              </p>
            </div>
          </div>

          {/* Agent activity log */}
          <div className="card p-5">
            <p className="section-label mb-0">Agent activity log</p>
            <p className="text-[10px] text-[var(--text-muted)] m-0 mt-0.5">All 5 agents · last 2 hours</p>
            <div className="flex flex-col gap-0 mt-3">
              {AGENT_LOG.map((entry, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: entry.agentColor }} />
                    {i < AGENT_LOG.length - 1 && <div className="w-px flex-1 bg-[var(--border)]" />}
                  </div>
                  <div className="pb-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span
                        className="text-[9px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: entry.agentColor + "22", color: entry.agentColor }}
                      >
                        {entry.agent}
                      </span>
                      <span className="text-[9px] uppercase tracking-wide font-semibold text-[var(--text-muted)]">{entry.time}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] m-0 leading-relaxed">{entry.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link to vendor scoring */}
          <Link
            href="/vendor-scoring"
            className="card card-interactive p-4 flex items-center justify-between no-underline hover:bg-[var(--bg-subtle)] transition-colors group"
          >
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)] m-0">Vendor Recovery Scores</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 m-0">Recovery % reflected in vendor risk scoring</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--acl-primary)] transition-colors" />
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
  selected,
  onSelect,
}: {
  record: RecoveryRecord;
  expanded: boolean;
  onToggle: () => void;
  onSubmit: (id: string, amount: number, outcome: string, note: string) => void;
  selected: boolean;
  onSelect: () => void;
}) {
  const [amount, setAmount] = useState(r.targetAmount);
  const [outcome, setOutcome] = useState(OUTCOME_OPTIONS[0]);
  const [note, setNote] = useState(r.analystNote ?? "");
  const [touched, setTouched] = useState(false);
  const canRecord = r.status === "pending" || r.status === "in_progress";

  // Get category for this vendor
  const category = vendorCategoryMap[r.vendor];

  // Get phase label
  const phase = mapLegacyStatusToPhase(r.status);
  const phaseConfig = getPhaseConfig(phase);

  return (
    <div>
      <div
        className={`px-5 py-4 flex items-start gap-3 ${canRecord ? "cursor-pointer hover:bg-[var(--bg-base)]" : ""} transition-colors`}
        onClick={canRecord ? onToggle : undefined}
      >
        {/* Checkbox (actionable rows) or status icon (non-actionable) */}
        <div className="flex-shrink-0 mt-0.5">
          {canRecord ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => { e.stopPropagation(); onSelect(); }}
              className="w-4 h-4 rounded border-[var(--border-strong)] accent-[var(--acl-primary)] cursor-pointer flex-shrink-0"
              aria-label={`Select recovery ${r.id}`}
            />
          ) : (
            statusIcon(r.status)
          )}
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 mt-0.5">
          {canRecord ? (
            expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          ) : (
            <span className="w-3.5 h-3.5 inline-block" />
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          {/* Row 1: ID + Status + SLA + Phase */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono text-[var(--text-muted)]">{r.id}</span>
            <span className={statusBadge(r.status)}>{statusLabel(r.status)}</span>
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{
                backgroundColor: phaseConfig.slaColor + "15",
                color: phaseConfig.slaColor,
              }}
            >
              {phaseConfig.label}
            </span>
            <SlaBadge deadline={r.slaDeadline} status={r.status} />
          </div>

          {/* Row 2: Vendor + Category */}
          <div className="flex items-center gap-2 mb-0.5">
            <VendorBadge name={r.vendor} size="sm" />
            {category && <CategoryBadge category={category} />}
          </div>

          {/* Row 3: Invoice number */}
          <p className="text-[11px] text-[var(--text-secondary)] m-0 font-mono">{r.invoiceNumber}</p>

          {/* Row 4: Analyst note */}
          {r.analystNote && (
            <p className="text-[11px] text-[var(--text-secondary)] m-0 mt-1 leading-relaxed line-clamp-2">{r.analystNote}</p>
          )}

          {/* Row 5: Contact tracking info */}
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            <p className="text-[10px] text-[var(--text-muted)] m-0 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {r.emailSentTo}
            </p>
            {r.lastContactDate && (
              <p className="text-[10px] text-[var(--text-muted)] m-0">
                Last contact: <span className="font-medium text-[var(--text-tertiary)]">{formatDate(r.lastContactDate)}</span>
              </p>
            )}
            {r.nextFollowupDate && (r.status === "pending" || r.status === "in_progress" || r.status === "partial") && (
              <p className="text-[10px] m-0 flex items-center gap-1">
                <CalendarClock className="w-3 h-3 text-[var(--acl-primary)]" />
                <span className="text-[var(--acl-primary)] font-medium">
                  Follow-up: {formatDate(r.nextFollowupDate)}
                </span>
              </p>
            )}
          </div>

          {/* Row 6: Initiated date */}
          <p className="text-[10px] text-[var(--text-muted)] mt-1 m-0">
            Initiated {formatDate(r.initiatedAt)}
          </p>

          {/* Status History Timeline (shown in expanded view for non-actionable records, always for actionable) */}
          {expanded && r.statusHistory && r.statusHistory.length > 0 && (
            <StatusTimeline history={r.statusHistory} />
          )}
        </div>

        {/* Amount */}
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-semibold text-red-600 tabular-nums m-0">
            {formatCurrency(r.targetAmount)}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] m-0">target</p>
          {r.recoveredAmount != null && (
            <>
              <p className="text-xs font-semibold text-emerald-600 tabular-nums m-0 mt-1">
                {formatCurrency(r.recoveredAmount)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] m-0">recovered</p>
            </>
          )}
          {r.recoveredAmount != null && r.targetAmount > 0 && (
            <div className="mt-1.5">
              <div className="w-16 h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden ml-auto">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.round((r.recoveredAmount / r.targetAmount) * 100))}%` }}
                />
              </div>
              <p className="text-[9px] text-[var(--text-muted)] m-0 mt-0.5 text-right">
                {Math.round((r.recoveredAmount / r.targetAmount) * 100)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expanded outcome form */}
      {expanded && canRecord && (
        <div className="px-5 pb-5 border-t border-[var(--bg-subtle)] bg-[var(--bg-subtle)]">
          <p className="section-label mt-4 mb-3">Record outcome</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)] font-semibold block mb-1">
                Amount Recovered ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-md border border-[var(--border-strong)] bg-white text-[var(--text-primary)] focus:outline-none focus:border-[var(--acl-primary)]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)] font-semibold block mb-1">
                Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-md border border-[var(--border-strong)] bg-white text-[var(--text-primary)] focus:outline-none focus:border-[var(--acl-primary)] cursor-pointer"
              >
                {OUTCOME_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)] font-semibold block mb-1">
                Notes <span className="text-[var(--text-muted)] normal-case font-normal">(captured for AI enrichment)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full text-xs px-3 py-2 rounded-md border border-[var(--border-strong)] bg-white text-[var(--text-primary)] focus:outline-none focus:border-[var(--acl-primary)] resize-none"
                placeholder="Describe the vendor response, commitments made, or reason for closure..."
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
                className="flex-1 text-xs font-medium py-2 rounded-md bg-[var(--acl-primary)] text-white border-none cursor-pointer hover:bg-[var(--acl-primary-hover)] transition-colors"
              >
                Save outcome
              </button>
              <button
                onClick={onToggle}
                className="px-4 text-xs font-medium py-2 rounded-md bg-white text-[var(--text-secondary)] border border-[var(--border-strong)] cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* For non-actionable rows, show history inline on click */}
      {expanded && !canRecord && r.statusHistory && r.statusHistory.length > 0 && (
        <div
          className="px-5 pb-4 bg-[var(--bg-subtle)] border-t border-[var(--bg-subtle)] cursor-pointer"
          onClick={onToggle}
        >
          <StatusTimeline history={r.statusHistory} />
        </div>
      )}
    </div>
  );
}
