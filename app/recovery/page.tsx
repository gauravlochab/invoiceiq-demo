// [Spec: domains/recovery/spec.md v2.0.1] — Recovery Queue, migrated to the
// shadcn v2.0 design system. Card/Alert/Badge/Button/Checkbox/Skeleton
// primitives, theme tokens only (no v1 vars, no hardcoded surfaces, no raw hex),
// AA-safe status text via text-warning-text / text-success-text. Recharts
// trend re-themed onto --destructive / --success. See spec CHANGELOG 2026-05-22.
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
  mapLegacyStatusToPhase,
  getPhaseConfig,
  type RecoveryPhase,
} from "@/lib/recovery-config";
import { useToast } from "@/components/Toast";
import { VendorBadge } from "@/components/VendorBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ─── Status helpers ───────────────────────────────────────────────────────────
// [Spec: domains/recovery/spec.md#Business Rules]

function statusBadge(status: RecoveryStatus) {
  switch (status) {
    case "pending":
      return (
        <Badge className="border-warning bg-warning/10 text-warning-text">
          Pending
        </Badge>
      );
    case "in_progress":
      return <Badge variant="secondary">In Progress</Badge>;
    case "recovered":
      return (
        <Badge className="border-success bg-success/10 text-success-text">
          Recovered
        </Badge>
      );
    case "partial":
      return (
        <Badge className="border-warning bg-warning/10 text-warning-text">
          Partial
        </Badge>
      );
    case "closed":
      return <Badge variant="outline">Closed</Badge>;
  }
}

function statusIcon(status: RecoveryStatus) {
  switch (status) {
    case "recovered":
      return <CheckCircle2 className="size-3.5 text-success-text" />;
    case "closed":
      return <XCircle className="size-3.5 text-muted-foreground" />;
    case "partial":
      return <AlertCircle className="size-3.5 text-warning-text" />;
    default:
      return <Clock className="size-3.5 text-primary" />;
  }
}

// Phase → theme classes. Replaces the v1 hex `slaColor` from recovery-config.
// [Spec: domains/recovery/spec.md#Business Rules — Status-to-Phase Mapping]
const PHASE_STYLE: Record<RecoveryPhase, { chip: string; dot: string }> = {
  identified:       { chip: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  vendor_contacted: { chip: "bg-primary/10 text-primary",     dot: "bg-primary" },
  under_review:     { chip: "bg-warning/10 text-warning-text", dot: "bg-warning" },
  credit_pending:   { chip: "bg-primary/10 text-primary",     dot: "bg-primary" },
  resolved:         { chip: "bg-success/10 text-success-text", dot: "bg-success" },
  escalated:        { chip: "bg-destructive/10 text-destructive-text", dot: "bg-destructive" },
};

function phaseFromHistoryLabel(label: string): RecoveryPhase {
  const map: Record<string, RecoveryPhase> = {
    "Identified": "identified",
    "Vendor Contacted": "vendor_contacted",
    "Under Review": "under_review",
    "Credit Pending": "credit_pending",
    "Resolved": "resolved",
    "Escalated": "escalated",
  };
  return map[label] ?? "identified";
}

const OUTCOME_OPTIONS = [
  "Fully Recovered",
  "Partially Recovered",
  "Vendor Unresponsive",
  "Vendor Filed Dispute",
  "Closed — Write Off",
];

// Agent activity log — agent palette colors are an InvoiceIQ extension layer
// preserved per ui-standard.md (`--agent-*` tokens).
const AGENT_LOG = [
  { agent: "Insight Agent",    agentColor: "var(--agent-insight)", time: "09:51", msg: "Vendor risk scores recalculated. MedTech Solutions flagged Critical — 0% recovery rate, 5 days non-responsive." },
  { agent: "Recovery Agent",   agentColor: "var(--agent-recovery)", time: "09:42", msg: "Analysed BioMed Equipment response pattern. Historical recovery rate 80%. Recommended formal escalation to procurement director." },
  { agent: "Compliance Agent", agentColor: "var(--agent-compliance)", time: "09:28", msg: "Cardinal Health Q1 rebate audit complete. $26,554 rebate + $62,876 volume discount gap = $89,430 outstanding. Contract CTR-2025-CAR-003 reviewed." },
  { agent: "Recovery Agent",   agentColor: "var(--agent-recovery)", time: "09:15", msg: "Cross-referenced Cardinal Health rebate contract terms. Initiated follow-up email sequence. Awaiting finance team response." },
  { agent: "Validation Agent", agentColor: "var(--agent-validation)", time: "09:03", msg: "Re-validated EX-006 line items against updated PO. Price delta on STE-4821-A confirmed +19%. Flagged for recovery." },
  { agent: "Recovery Agent",   agentColor: "var(--agent-recovery)", time: "08:50", msg: "Processed Henry Schein credit memo HS-CM-2026-077. Matched to REC-003 target. Marked as fully recovered." },
  { agent: "Invoice Agent",    agentColor: "var(--agent-invoice)", time: "08:31", msg: "Ingested 14 new invoices from overnight batch. 2 flagged for three-way match review. 0 extraction errors." },
];

// ─── SLA Badge ────────────────────────────────────────────────────────────────
// [Spec: domains/recovery/spec.md#Acceptance Criteria — SLA badges]

function SlaBadge({ deadline, status }: { deadline?: string; status: RecoveryStatus }) {
  if (!deadline) return null;
  // Don't show SLA for resolved/closed items.
  if (status === "recovered" || status === "closed") return null;

  const days = daysUntilDeadline(deadline);
  const urgency = getSlaUrgency(days);
  const label =
    urgency === "overdue"
      ? `Overdue by ${Math.abs(days)}d`
      : `${days}d remaining`;

  if (urgency === "overdue" || urgency === "critical") {
    return (
      <Badge variant="destructive">
        <Timer className="size-2.5" />
        {label}
      </Badge>
    );
  }
  if (urgency === "warning") {
    return (
      <Badge className="border-warning bg-warning/10 text-warning-text">
        <Timer className="size-2.5" />
        {label}
      </Badge>
    );
  }
  return (
    <Badge className="border-success bg-success/10 text-success-text">
      <Timer className="size-2.5" />
      {label}
    </Badge>
  );
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ history }: { history: NonNullable<RecoveryRecord["statusHistory"]> }) {
  // Show last 4 entries to keep it compact.
  const entries = history.slice(-4);
  const hasMore = history.length > 4;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="mb-2 flex items-center gap-1.5">
        <History className="size-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Status history
        </span>
        {hasMore && (
          <span className="text-[9px] text-muted-foreground">
            ({history.length} total)
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0">
        {entries.map((entry, i) => {
          const phase = phaseFromHistoryLabel(entry.status);
          return (
            <div key={i} className="flex gap-2">
              <div className="flex flex-col items-center gap-0">
                <div
                  className={`mt-1 size-2 shrink-0 rounded-full ${PHASE_STYLE[phase].dot}`}
                />
                {i < entries.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-foreground">
                    {entry.status}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {formatDate(entry.date)}
                  </span>
                </div>
                {entry.note && (
                  <p className="m-0 text-[10px] leading-relaxed text-muted-foreground">
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

function RecoveryTrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-popover/85 px-3 py-2.5 text-popover-foreground shadow-lg shadow-black/[0.08] backdrop-blur-xl dark:border-white/10 dark:shadow-black/25">
      <p className="m-0 mb-1 text-[11px] font-semibold">{label}</p>
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className="m-0 flex items-center gap-2 text-[10px] text-muted-foreground"
        >
          <span
            className={`size-2 shrink-0 rounded-full ${p.dataKey === "recovered" ? "bg-success" : "bg-destructive"}`}
          />
          <span>{p.dataKey === "recovered" ? "Recovered" : "Target"}</span>
          <span className="font-medium tabular-nums text-foreground">
            {formatCurrency(p.value)}
          </span>
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

  // [Spec: domains/recovery/spec.md#Acceptance Criteria — Loading]
  // `records` is already seeded from recoveryQueue via useState — the effect
  // only drives the 400ms loading-skeleton delay (no setState-in-effect body).
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const totalTarget = records.reduce((s, r) => s + r.targetAmount, 0);
  const totalRecovered = records.reduce((s, r) => s + (r.recoveredAmount ?? 0), 0);
  const successRate = records.length > 0
    ? Math.round((records.filter(r => r.status === "recovered").length / records.length) * 100)
    : 0;
  const pendingCount = records.filter(r => r.status === "pending" || r.status === "in_progress").length;

  // Active (actionable) record IDs for select-all logic.
  const activeRecordIds = records
    .filter(r => r.status === "pending" || r.status === "in_progress")
    .map(r => r.id);

  const allActiveSelected = activeRecordIds.length > 0 && activeRecordIds.every(id => selectedIds.has(id));
  const someActiveSelected = activeRecordIds.some(id => selectedIds.has(id));

  // SLA metrics — [Spec: domains/recovery/spec.md#Business Rules — Summary Metrics]
  const overdueCount = records.filter(r => {
    if (r.status === "recovered" || r.status === "closed") return false;
    if (!r.slaDeadline) return false;
    return daysUntilDeadline(r.slaDeadline) < 0;
  }).length;

  // Success-rate color — AA-safe status text tokens.
  const successRateClass =
    successRate >= 80
      ? "text-success-text"
      : successRate >= 50
        ? "text-warning-text"
        : "text-destructive-text";

  function handleSelectAll(checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        activeRecordIds.forEach(id => next.add(id));
      } else {
        activeRecordIds.forEach(id => next.delete(id));
      }
      return next;
    });
  }

  function handleToggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // [Spec: domains/recovery/spec.md#Business Rules — Bulk Actions]
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

  // [Spec: domains/recovery/spec.md#Business Rules — Outcome Recording]
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
    <main className="@container/main flex flex-1 flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                Healthcare AP · Recovery Agent
              </span>
            </div>
            <h1 className="m-0 text-2xl font-semibold" style={{ letterSpacing: '-0.03em' }}>
              Recovery Queue
            </h1>
            <p className="m-0 mt-1 text-sm text-muted-foreground">
              Vendor recovery tracking — initiated by Invoice Agent, actioned by Recovery Agent
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refreshRecords(); showToast("Recovery queue refreshed", "info"); }}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <hr className="border-border" />

      {/* Policy Info Banner */}
      <div className="px-4 pt-6 lg:px-6">
        <Alert className="border-primary bg-primary/5">
          <Shield className="text-primary" />
          <AlertTitle className="flex flex-wrap items-center gap-2 text-primary">
            Parkland Health Recovery Policy
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
              {PARKLAND_RECOVERY_CONFIG.policyRef}
            </span>
          </AlertTitle>
          <AlertDescription>
            {PARKLAND_RECOVERY_CONFIG.policyStatement}
          </AlertDescription>
        </Alert>
      </div>

      {/* Summary strip */}
      <section aria-labelledby="summary-heading" className="px-4 py-6 lg:px-6">
        <h2 id="summary-heading" className="sr-only">Recovery summary</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Card className="card-elevated py-0">
            <div className="animate-stagger-in flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
              <div className="flex-1 px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">In Queue</p>
                <p className="m-0 mt-1 text-2xl font-bold tabular-nums" style={{ letterSpacing: '-0.04em' }}>{records.length}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{pendingCount} active</p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-destructive/5 to-transparent px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Target</p>
                <p className="m-0 mt-1 text-2xl font-bold tabular-nums text-destructive-text" style={{ letterSpacing: '-0.04em' }}>{formatCurrency(totalTarget)}</p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-success/5 to-transparent px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recovered</p>
                <p className="m-0 mt-1 text-2xl font-bold tabular-nums text-success-text" style={{ letterSpacing: '-0.04em' }}>{formatCurrency(totalRecovered)}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {totalTarget > 0 ? Math.round((totalRecovered / totalTarget) * 100) : 0}% of target
                </p>
              </div>
              <div className="flex-1 px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Success Rate</p>
                <p className={`m-0 mt-1 text-2xl font-bold tabular-nums ${successRateClass}`} style={{ letterSpacing: '-0.04em' }}>
                  {successRate}%
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">last 12 months</p>
              </div>
              <div className="flex-1 px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SLA Overdue</p>
                <p className={`m-0 mt-1 text-2xl font-bold tabular-nums ${overdueCount > 0 ? "text-destructive-text" : "text-success-text"}`} style={{ letterSpacing: '-0.04em' }}>
                  {overdueCount}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {overdueCount === 0 ? "all on track" : `require${overdueCount === 1 ? "s" : ""} attention`}
                </p>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Recovery Trend */}
      <section aria-labelledby="trend-heading" className="px-4 pb-8 lg:px-6">
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <Card className="card-elevated p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="trend-heading" className="m-0 text-sm font-medium">Recovery Trend</h2>
                <p className="m-0 mt-0.5 text-[10px] text-muted-foreground">Monthly recovery amounts — last 12 months</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className="inline-block h-0 w-6"
                    style={{ borderTop: "2px dashed var(--destructive)" }}
                  />
                  Target
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="inline-block h-0.5 w-6 rounded-sm bg-success" />
                  Recovered
                </span>
              </div>
            </div>
            <div role="img" aria-label="Recovery trend chart showing monthly target versus recovered amounts over the last 12 months">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={recoveryTrendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="recoveryTargetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="recoveryRecoveredGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" horizontal vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<RecoveryTrendTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="target" stroke="var(--destructive)" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#recoveryTargetGrad)" dot={false} />
                  <Area type="monotone" dataKey="recovered" stroke="var(--success)" strokeWidth={2} fill="url(#recoveryRecoveredGrad)" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </section>

      {/* Two-column layout */}
      <section aria-labelledby="queue-heading" className="grid grid-cols-1 items-start gap-6 px-4 pb-8 lg:grid-cols-[1fr_320px] lg:px-6">
        <h2 id="queue-heading" className="sr-only">Recovery queue and intelligence</h2>

        {/* LEFT — Recovery Queue */}
        <Card className="card-elevated gap-0 overflow-hidden py-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
              {activeRecordIds.length > 0 && (
                <Checkbox
                  checked={allActiveSelected}
                  indeterminate={someActiveSelected && !allActiveSelected}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  aria-label="Select all active recoveries"
                />
              )}
              <h3 className="m-0 text-sm font-semibold">Active recoveries</h3>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">SLA tracked per Parkland Policy 4.3</span>
            </div>
          </div>

          {/* Bulk action toolbar */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary/5 px-5 py-2.5">
              <span className="text-xs font-medium text-primary">{selectedIds.size} selected</span>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleBulkAction("escalate")}>
                  Bulk Escalate
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("follow-up")}>
                  Send Follow-up Emails
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("export")}>
                  Export Selected
                </Button>
              </div>
            </div>
          )}

          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="size-4" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-48" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
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
        </Card>

        {/* RIGHT — Recovery Intelligence */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4">

          {/* Recovery score breakdown */}
          <Card className="card-elevated p-5">
            <div className="mb-3 flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <h3 className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recovery Agent
              </h3>
            </div>
            <div className="mb-4 space-y-2">
              {[
                { label: "Response rate", value: 75, fill: "bg-primary" },
                { label: "Settlement rate", value: successRate, fill: successRate >= 70 ? "bg-success" : "bg-warning" },
                { label: "Avg days to close", value: 62, fill: "bg-primary/70", isTime: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-[120px] shrink-0 text-[10px] text-muted-foreground">{item.label}</span>
                  {item.isTime ? (
                    <span className="text-[11px] font-semibold">18 days</span>
                  ) : (
                    <>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${item.fill}`} style={{ width: `${item.value}%` }} />
                      </div>
                      <span className="w-[28px] text-right text-[10px] font-semibold tabular-nums">{item.value}%</span>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="m-0 text-[10px] text-muted-foreground">
              Target: 90% recovery rate · Current trajectory on track
            </p>
          </Card>

          {/* SLA Summary */}
          <Card className="card-elevated p-5">
            <div className="mb-3 flex items-center gap-2">
              <Timer className="size-4 text-warning-text" />
              <h3 className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                SLA Compliance
              </h3>
            </div>
            <div className="space-y-2">
              {PARKLAND_RECOVERY_CONFIG.transitions.map((t) => (
                <div key={`${t.from}-${t.to}`} className="flex items-center justify-between">
                  <span className="min-w-0 flex-1 truncate pr-2 text-[10px] text-muted-foreground">
                    {getPhaseConfig(t.from).label} → {getPhaseConfig(t.to).label}
                  </span>
                  <span className="whitespace-nowrap text-[10px] font-semibold tabular-nums">
                    {t.slaBusinessDays}d SLA
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Escalation trigger</span>
                <span className="text-[10px] font-semibold text-destructive-text">10 business days</span>
              </div>
              <p className="m-0 mt-1 text-[9px] text-muted-foreground">
                No vendor response after initial contact
              </p>
            </div>
          </Card>

          {/* Agent activity log */}
          <Card className="card-elevated p-5">
            <div className="flex items-center gap-2">
              <span className="dot-pulse size-1.5 rounded-full bg-success" />
              <h3 className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Agent activity log
              </h3>
            </div>
            <p className="m-0 mt-0.5 text-[10px] text-muted-foreground">All 5 agents · last 2 hours</p>
            <div className="mt-3 flex flex-col gap-0">
              {AGENT_LOG.map((entry, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="flex flex-col items-center gap-1">
                    <div className="mt-1 size-1.5 shrink-0 rounded-full" style={{ backgroundColor: entry.agentColor }} />
                    {i < AGENT_LOG.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-3">
                    <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: `color-mix(in oklch, ${entry.agentColor} 14%, transparent)`, color: entry.agentColor }}
                      >
                        {entry.agent}
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{entry.time}</span>
                    </div>
                    <p className="m-0 text-[11px] leading-relaxed text-muted-foreground">{entry.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Link to vendor scoring */}
          <Link
            href="/vendor-scoring"
            className="group no-underline"
          >
            <Card className="card-elevated flex-row items-center justify-between p-4 transition-colors hover:bg-accent/40">
              <div>
                <p className="m-0 text-xs font-semibold">Vendor Recovery Scores</p>
                <p className="m-0 mt-0.5 text-[10px] text-muted-foreground">Recovery % reflected in vendor risk scoring</p>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
            </Card>
          </Link>
        </div>
      </section>
    </main>
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

  const category = vendorCategoryMap[r.vendor];
  const phase = mapLegacyStatusToPhase(r.status);
  const phaseConfig = getPhaseConfig(phase);
  const recoveredPct =
    r.recoveredAmount != null && r.targetAmount > 0
      ? Math.min(100, Math.round((r.recoveredAmount / r.targetAmount) * 100))
      : 0;

  return (
    <div>
      <div
        className={`flex items-start gap-3 px-5 py-4 transition-colors ${canRecord ? "cursor-pointer hover:bg-accent/50" : "hover:bg-accent/30"}`}
        onClick={canRecord ? onToggle : undefined}
      >
        {/* Checkbox (actionable rows) or status icon (non-actionable) */}
        <div className="mt-0.5 shrink-0">
          {canRecord ? (
            <span onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selected}
                onCheckedChange={onSelect}
                aria-label={`Select recovery ${r.id}`}
              />
            </span>
          ) : (
            statusIcon(r.status)
          )}
        </div>

        {/* Chevron */}
        <div className="mt-0.5 shrink-0">
          {canRecord ? (
            expanded
              ? <ChevronDown className="size-3.5 text-muted-foreground" />
              : <ChevronRight className="size-3.5 text-muted-foreground" />
          ) : (
            <span className="inline-block size-3.5" />
          )}
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          {/* Row 1: ID + Status + Phase + SLA */}
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
            {statusBadge(r.status)}
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium ${PHASE_STYLE[phase].chip}`}
            >
              {phaseConfig.label}
            </span>
            <SlaBadge deadline={r.slaDeadline} status={r.status} />
          </div>

          {/* Row 2: Vendor + Category */}
          <div className="mb-0.5 flex items-center gap-2">
            <VendorBadge name={r.vendor} size="sm" />
            {category && <CategoryBadge category={category} />}
          </div>

          {/* Row 3: Invoice number */}
          <p className="m-0 font-mono text-[11px] text-muted-foreground">{r.invoiceNumber}</p>

          {/* Row 4: Analyst note */}
          {r.analystNote && (
            <p className="m-0 mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{r.analystNote}</p>
          )}

          {/* Row 5: Contact tracking info */}
          <div className="mt-1.5 flex flex-wrap items-center gap-4">
            <p className="m-0 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Mail className="size-3" />
              {r.emailSentTo}
            </p>
            {r.lastContactDate && (
              <p className="m-0 text-[10px] text-muted-foreground">
                Last contact: <span className="font-medium text-foreground">{formatDate(r.lastContactDate)}</span>
              </p>
            )}
            {r.nextFollowupDate && (r.status === "pending" || r.status === "in_progress" || r.status === "partial") && (
              <p className="m-0 flex items-center gap-1 text-[10px]">
                <CalendarClock className="size-3 text-primary" />
                <span className="font-medium text-primary">
                  Follow-up: {formatDate(r.nextFollowupDate)}
                </span>
              </p>
            )}
          </div>

          {/* Row 6: Initiated date */}
          <p className="m-0 mt-1 text-[10px] text-muted-foreground">
            Initiated {formatDate(r.initiatedAt)}
          </p>

          {/* Status History Timeline (expanded actionable rows) */}
          {expanded && canRecord && r.statusHistory && r.statusHistory.length > 0 && (
            <StatusTimeline history={r.statusHistory} />
          )}
        </div>

        {/* Amount */}
        <div className="shrink-0 text-right">
          <p className="m-0 text-xs font-semibold tabular-nums text-destructive-text">
            {formatCurrency(r.targetAmount)}
          </p>
          <p className="m-0 text-[10px] text-muted-foreground">target</p>
          {r.recoveredAmount != null && (
            <>
              <p className="m-0 mt-1 text-xs font-semibold tabular-nums text-success-text">
                {formatCurrency(r.recoveredAmount)}
              </p>
              <p className="m-0 text-[10px] text-muted-foreground">recovered</p>
            </>
          )}
          {r.recoveredAmount != null && r.targetAmount > 0 && (
            <div className="mt-1.5">
              <div className="ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all duration-500"
                  style={{ width: `${recoveredPct}%` }}
                />
              </div>
              <p className="m-0 mt-0.5 text-right text-[9px] text-muted-foreground">
                {recoveredPct}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expanded outcome form */}
      {expanded && canRecord && (
        <div className="border-t border-border bg-muted/40 px-5 pb-5">
          <h4 className="mt-4 mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Record outcome
          </h4>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor={`amount-${r.id}`} className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Amount Recovered ($)
              </label>
              <Input
                id={`amount-${r.id}`}
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor={`outcome-${r.id}`} className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Outcome
              </label>
              <Select value={outcome} onValueChange={(v) => setOutcome(v as string)}>
                <SelectTrigger id={`outcome-${r.id}`} className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor={`note-${r.id}`} className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Notes <span className="font-normal normal-case text-muted-foreground">(captured for AI enrichment)</span>
              </label>
              <Textarea
                id={`note-${r.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Describe the vendor response, commitments made, or reason for closure..."
              />
            </div>
            {touched && amount <= 0 && outcome !== "Vendor Unresponsive" && outcome !== "Vendor Filed Dispute" && outcome !== "Closed — Write Off" && (
              <p className="m-0 text-[11px] text-destructive-text">Enter recovered amount or choose a write-off outcome.</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  setTouched(true);
                  if (amount <= 0 && outcome !== "Vendor Unresponsive" && outcome !== "Vendor Filed Dispute" && outcome !== "Closed — Write Off") return;
                  onSubmit(r.id, amount, outcome, note);
                }}
              >
                Save outcome
              </Button>
              <Button variant="outline" size="sm" onClick={onToggle}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* For non-actionable rows, show history inline on click */}
      {expanded && !canRecord && r.statusHistory && r.statusHistory.length > 0 && (
        <div
          className="cursor-pointer border-t border-border bg-muted/40 px-5 pb-4"
          onClick={onToggle}
        >
          <StatusTimeline history={r.statusHistory} />
        </div>
      )}
    </div>
  );
}
