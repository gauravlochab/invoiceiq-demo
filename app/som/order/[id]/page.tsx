"use client";

// ─── SOM Workflow Runner — Single Order ──────────────────────────────────────
//
// Per docs/PLAN_SOM_DRUG_DISTRIBUTOR.md §5.3. The visual hero — animated
// 4-card pipeline (border-beam) running the suspicious-order-monitoring
// workflow against one order. Mirrors the app/extract/page.tsx animation
// language so the demo feels coherent across verticals.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Check, X, Clock, MapPin, FileText, ShieldAlert,
  ScrollText, DollarSign, BarChart3, AlertTriangle, Loader2, Play,
  Globe, Database, ChevronRight,
} from "lucide-react";

import { findOrderById } from "@/lib/som/data/orders";
import {
  runSuspiciousOrderMonitoring,
  suspiciousOrderMonitoring,
} from "@/lib/som/workflows/suspiciousOrderMonitoring";
import type { TaskRunState, WorkflowRunState, TaskStatus } from "@/lib/som/types";
import { BorderBeam } from "@/components/magicui/border-beam";
import { useToast } from "@/components/Toast";

// ─── Visual mappings ─────────────────────────────────────────────────────────

const TASK_ICONS: Record<string, typeof MapPin> = {
  verify_address: MapPin,
  verify_license: ScrollText,
  check_price_deviation: DollarSign,
  detect_outliers: BarChart3,
};

const STATUS_COLORS: Record<TaskStatus, { text: string; bg: string; border: string; label: string }> = {
  pass: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Verified" },
  warn: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Review" },
  fail: { text: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Failed" },
  error: { text: "text-[#4b5563]", bg: "bg-[#f0f2f5]", border: "border-[#e5e7eb]", label: "Error" },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SomOrderRunnerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const order = useMemo(() => findOrderById(params.id), [params.id]);

  const [runState, setRunState] = useState<WorkflowRunState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [decision, setDecision] = useState<"approved" | "held" | "escalated" | null>(null);
  const hasAutoStarted = useRef(false);

  // Auto-run the workflow once on mount so the demo "just goes".
  useEffect(() => {
    if (!order || hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    void startRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  async function startRun() {
    if (!order) return;
    setIsRunning(true);
    setDecision(null);
    setRunState(null);
    await runSuspiciousOrderMonitoring(order, (state) => {
      setRunState(state);
    });
    setIsRunning(false);
  }

  if (!order) {
    return (
      <div className="bg-[#f7f8fa] min-h-screen p-8">
        <p className="text-sm text-[#4b5563]">Order not found.</p>
        <Link href="/som" className="text-[#0065cb] text-xs no-underline hover:underline">
          ← Back to queue
        </Link>
      </div>
    );
  }

  const overall = runState?.overallStatus;
  const allDone = runState?.isComplete ?? false;

  function handleDecision(kind: "approved" | "held" | "escalated") {
    if (!allDone) {
      showToast("Wait for all checks to complete before deciding.", "warning");
      return;
    }
    setDecision(kind);
    showToast(
      kind === "approved"
        ? "Order approved — released to fulfilment."
        : kind === "held"
        ? "Order placed on hold."
        : "Order escalated to compliance manager.",
      kind === "approved" ? "success" : kind === "held" ? "warning" : "info",
    );
  }

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Breadcrumb */}
      <div className="pt-6 px-8">
        <button
          onClick={() => router.push("/som")}
          className="inline-flex items-center gap-1 text-xs text-[#0065cb] bg-transparent border-none cursor-pointer hover:underline p-0"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to SOM queue
        </button>
      </div>

      {/* Header */}
      <div className="px-8 pt-3 pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-[#9ca3af]">{order.id}</span>
          <ShieldAlert className="w-3 h-3 text-[#0065cb]" />
          <span className="text-[10px] uppercase tracking-wide font-semibold text-[#0065cb]">SOM workflow</span>
          {order.lineItems.some((l) => l.isControlled) && (
            <span className="badge warning">Controlled substance</span>
          )}
        </div>
        <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight m-0 mb-1.5 leading-tight">
          {order.pharmacy.name}
        </h1>
        <p className="text-xs text-[#4b5563] m-0">
          {order.pharmacy.address} · {order.pharmacy.city}, {order.pharmacy.state} ·
          {" "}
          {order.lineItems.length} line item{order.lineItems.length === 1 ? "" : "s"} · {formatCurrency(order.totalAmount)}
        </p>
      </div>

      <div className="px-8 pb-8 grid grid-cols-[1fr_320px] gap-5 items-start">
        {/* LEFT: Pipeline */}
        <div className="flex flex-col gap-3">
          {/* Re-run button */}
          <div className="flex items-center justify-between">
            <p className="section-label m-0">Verification pipeline</p>
            <button
              onClick={startRun}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-md border border-[#d1d5db] bg-white text-[#4b5563] cursor-pointer hover:bg-[#f0f2f5] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {isRunning ? "Running…" : "Re-run pipeline"}
            </button>
          </div>

          {/* Task cards */}
          {suspiciousOrderMonitoring.tasks.map((task, i) => {
            const taskState = runState?.tasks[i];
            return (
              <TaskCard
                key={task.id}
                title={task.name}
                description={task.description}
                taskState={taskState}
                index={i}
                order={order}
              />
            );
          })}

          {/* Decision row */}
          <div className="card p-5 mt-2">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label m-0">Analyst decision</p>
              {overall && (
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${STATUS_COLORS[overall].bg} ${STATUS_COLORS[overall].text} border ${STATUS_COLORS[overall].border}`}>
                  Overall: {STATUS_COLORS[overall].label}
                </span>
              )}
            </div>

            {decision ? (
              <div className={`px-3 py-2.5 rounded-md text-xs font-medium text-center ${
                decision === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                decision === "held" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {decision === "approved" && "Approved — released to fulfilment"}
                {decision === "held" && "On hold — awaiting analyst follow-up"}
                {decision === "escalated" && "Escalated to compliance manager"}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDecision("approved")}
                  disabled={!allDone || (overall === "fail")}
                  className="text-xs font-medium px-3 py-2 rounded-md border border-emerald-600 bg-white text-emerald-700 cursor-pointer hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={overall === "fail" ? "At least one check failed — cannot approve" : ""}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDecision("held")}
                  disabled={!allDone}
                  className="text-xs font-medium px-3 py-2 rounded-md border border-amber-600 bg-white text-amber-700 cursor-pointer hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Hold
                </button>
                <button
                  onClick={() => handleDecision("escalated")}
                  disabled={!allDone}
                  className="text-xs font-medium px-3 py-2 rounded-md border border-[#0065cb] bg-white text-[#0065cb] cursor-pointer hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Escalate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Order summary */}
        <div className="flex flex-col gap-4 sticky top-4">
          <div className="card p-5">
            <p className="section-label mb-3">Order details</p>
            {[
              { label: "Order ID", value: order.id, mono: true },
              { label: "Received", value: new Date(order.receivedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) },
              { label: "Permit on file", value: order.pharmacy.permitNumber || "—", mono: true },
              { label: "NPI on file", value: order.pharmacy.npi || "—", mono: true },
              { label: "Total", value: formatCurrency(order.totalAmount) },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex justify-between items-baseline py-2 ${i < arr.length - 1 ? "border-b border-[#f0f2f5]" : ""}`}>
                <span className="text-[11px] text-[#4b5563]">{row.label}</span>
                <span className={`text-[11px] text-[#111827] font-medium ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <p className="section-label mb-3">Line items</p>
            <div className="flex flex-col gap-2.5">
              {order.lineItems.map((line) => (
                <div key={line.ndc} className="text-[11px]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-[#111827]">{line.description}</span>
                    {line.isControlled && (
                      <span className="text-[9px] uppercase tracking-wide font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Controlled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[#4b5563]">
                    <span className="font-mono">{line.ndc}</span>
                    <span className="tabular-nums">
                      {line.quantity.toLocaleString()} × {formatCurrency(line.unitPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task card ───────────────────────────────────────────────────────────────

function TaskCard({
  title,
  description,
  taskState,
  index,
  order,
}: {
  title: string;
  description?: string;
  taskState?: TaskRunState;
  index: number;
  order: ReturnType<typeof findOrderById>;
}) {
  const isRunning = taskState?.status === "running";
  const isDone = taskState?.status === "done";
  const result = taskState?.result;
  const Icon = TASK_ICONS[taskState?.taskId ?? ""] ?? Database;

  return (
    <div className={`relative card overflow-hidden transition-opacity ${
      taskState?.status === "pending" ? "opacity-60" : "opacity-100"
    }`}>
      {isRunning && <BorderBeam duration={3} colorFrom="#0065cb" colorTo="#22d3ee" />}
      <div className="p-5 flex items-start gap-4">
        {/* Numbered circle + icon */}
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold ${
            isDone && result
              ? `${STATUS_COLORS[result.status].bg} ${STATUS_COLORS[result.status].text}`
              : isRunning
              ? "bg-[#0065cb]/10 text-[#0065cb]"
              : "bg-[#f0f2f5] text-[#9ca3af]"
          }`}>
            {isDone && result?.status === "pass" ? (
              <Check className="w-4 h-4" />
            ) : isDone && result?.status === "fail" ? (
              <X className="w-4 h-4" />
            ) : isDone && result?.status === "warn" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-[#4b5563]" />
              <h3 className="text-sm font-semibold text-[#111827] m-0">{title}</h3>
            </div>
            {isDone && result && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${STATUS_COLORS[result.status].bg} ${STATUS_COLORS[result.status].text} border ${STATUS_COLORS[result.status].border}`}>
                {STATUS_COLORS[result.status].label}
              </span>
            )}
            {isRunning && (
              <span className="text-[10px] font-medium text-[#0065cb] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Running
              </span>
            )}
          </div>
          {description && (
            <p className="text-[11px] text-[#4b5563] m-0 leading-snug mb-2">{description}</p>
          )}
          {isDone && result && (
            <>
              <p className={`text-xs m-0 leading-relaxed ${STATUS_COLORS[result.status].text}`}>
                {result.message}
              </p>
              <TaskEvidence taskId={taskState?.taskId ?? ""} evidence={result.evidence} order={order} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Per-task evidence panels (the bits that make the demo feel real) ───────

function TaskEvidence({
  taskId,
  evidence,
  order,
}: {
  taskId: string;
  evidence: Record<string, unknown>;
  order: ReturnType<typeof findOrderById>;
}) {
  if (taskId === "verify_address") {
    const db = evidence.db as { source?: string; record?: { address?: string; city?: string; state?: string; zip?: string } };
    const geo = evidence.geocode as { query?: string; declaredVsGeocodedKm?: number; lat?: number; lng?: number };
    if (!db) return null;
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        <EvidenceRow icon={Database} label={db.source ?? "Database"} value={db.record ? `${db.record.address}, ${db.record.city}, ${db.record.state} ${db.record.zip}` : "Not found"} />
        {geo && (
          <EvidenceRow
            icon={MapPin}
            label="Geocoded distance"
            value={`${geo.declaredVsGeocodedKm} km from declared`}
          />
        )}
      </div>
    );
  }

  if (taskId === "verify_license") {
    const board = evidence.stateBoard as { source?: string; record?: { permitNumber?: string; status?: string; expiry?: string } };
    const npi = evidence.npi as { source?: string; isLive?: boolean; found?: boolean; status?: string; rawError?: string; latencyMs?: number };
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {board && (
          // Note: state-board cards are intentionally NON-clickable. The
          // upstream sites (ncbop.org, search.dca.ca.gov) only expose
          // search-portal entry pages, not stable per-pharmacy URLs, so a
          // deep-link would dump the user on a generic landing page.
          <EvidenceRow
            icon={ScrollText}
            label={board.source ?? "State board"}
            value={board.record ? `Permit ${board.record.permitNumber} · ${board.record.status} · expires ${board.record.expiry}` : "No record"}
          />
        )}
        {npi && (
          <EvidenceRow
            icon={Globe}
            label={`NPI Registry${npi.isLive ? " · live" : " · cached"}`}
            value={npi.found ? `${npi.status ?? "Unknown"} (${npi.latencyMs}ms)` : npi.rawError || "No record"}
          />
        )}
      </div>
    );
  }

  if (taskId === "check_price_deviation") {
    const matches = evidence.matches as Array<{ ndc: string; productName: string; orderedUnitPrice: number; contractPrice: number | null; deviationPct: number | null; outcome: string; tolerancePct: number | null }>;
    if (!matches?.length) return null;
    return (
      <div className="mt-3 border border-[#e5e7eb] rounded-md overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-[#f7f8fa]">
            <tr>
              <th className="text-left px-2.5 py-1.5 font-medium text-[#4b5563]">Product</th>
              <th className="text-right px-2.5 py-1.5 font-medium text-[#4b5563]">Ordered</th>
              <th className="text-right px-2.5 py-1.5 font-medium text-[#4b5563]">Contract</th>
              <th className="text-right px-2.5 py-1.5 font-medium text-[#4b5563]">Δ</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.ndc} className="border-t border-[#f0f2f5]">
                <td className="px-2.5 py-1.5 text-[#111827]">
                  <div className="font-medium">{m.productName}</div>
                  <div className="text-[10px] text-[#9ca3af] font-mono">{m.ndc}</div>
                </td>
                <td className="text-right px-2.5 py-1.5 tabular-nums text-[#111827]">${m.orderedUnitPrice.toFixed(2)}</td>
                <td className="text-right px-2.5 py-1.5 tabular-nums text-[#4b5563]">
                  {m.contractPrice != null ? `$${m.contractPrice.toFixed(2)}` : "—"}
                </td>
                <td className={`text-right px-2.5 py-1.5 tabular-nums font-medium ${
                  m.outcome === "deviation" ? "text-red-600" : m.outcome === "no_contract" ? "text-amber-700" : "text-emerald-700"
                }`}>
                  {m.deviationPct != null ? `${m.deviationPct > 0 ? "+" : ""}${m.deviationPct}%` : "n/a"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (taskId === "detect_outliers") {
    const baseline = evidence.baseline as number | undefined;
    const ratio = evidence.ratio as number | undefined;
    const controlledVolume = evidence.controlledVolume as number | undefined;
    const demo = evidence.demographics as { record?: { city?: string; catchmentPopulation?: number } } | undefined;
    if (controlledVolume === 0) return null;
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        <EvidenceRow
          icon={BarChart3}
          label="Order controlled volume"
          value={controlledVolume != null ? `${controlledVolume.toLocaleString()} units` : "—"}
        />
        {baseline != null && (
          <EvidenceRow
            icon={FileText}
            label={`${demo?.record?.city ?? "City"} monthly baseline`}
            value={`${baseline.toLocaleString()} units · this order = ${ratio}× baseline`}
          />
        )}
      </div>
    );
  }

  return null;
}

function EvidenceRow({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  link?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-[#9ca3af]" />
        <span className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-semibold">{label}</span>
      </div>
      <p className="text-[11px] text-[#111827] m-0 leading-snug flex items-center gap-1">
        {value}
        {link && <ChevronRight className="w-3 h-3 text-[#0065cb]" />}
      </p>
    </>
  );
  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#f7f8fa] rounded px-2.5 py-2 no-underline hover:bg-[#eef0f3] transition-colors"
      >
        {inner}
      </a>
    );
  }
  return <div className="bg-[#f7f8fa] rounded px-2.5 py-2">{inner}</div>;
}
