"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot, GitCompare, ShieldCheck, TrendingUp, BarChart3,
  Workflow, Play, Loader2, CheckCircle2, ArrowRight,
  FileText, AlertTriangle, Clock,
} from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { useToast } from "@/components/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedEvent {
  agent: string;
  agentColor: string;
  time: string;
  message: string;
  status: "pass" | "warn" | "fail" | "info";
}

type StepState = "idle" | "running" | "done" | "done-warn" | "done-fail";

// ── Agent definitions ─────────────────────────────────────────────────────────

const AGENTS = [
  {
    name: "Invoice Agent",
    shortName: "Invoice",
    role: "Extraction & Triage",
    description: "Reads PDFs, extracts all fields, raises initial flags",
    color: "#0065cb",
    bgColor: "#e8f1fc",
    Icon: Bot,
    stat: "1,847 processed",
    subStat: "0 errors",
    step: 1,
  },
  {
    name: "Validation Agent",
    shortName: "Validation",
    role: "Three-Way Match",
    description: "Cross-checks invoice vs PO vs packing slip",
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    Icon: GitCompare,
    stat: "188 exceptions",
    subStat: "6 escalated",
    step: 2,
  },
  {
    name: "Compliance Agent",
    shortName: "Compliance",
    role: "Contract & Rebate Audit",
    description: "Verifies contract caps, rebates, tier pricing",
    color: "#b45309",
    bgColor: "#fffbeb",
    Icon: ShieldCheck,
    stat: "12 alerts",
    subStat: "3 contracts at risk",
    step: 3,
  },
  {
    name: "Recovery Agent",
    shortName: "Recovery",
    role: "Vendor Outreach",
    description: "Initiates recovery, tracks responses, records outcomes",
    color: "#15803d",
    bgColor: "#f0fdf4",
    Icon: TrendingUp,
    stat: "14 in queue",
    subStat: "$470K target",
    step: 4,
  },
  {
    name: "Insight Agent",
    shortName: "Insight",
    role: "Risk Intelligence",
    description: "Scores vendors, trends, flags escalation paths",
    color: "#0891b2",
    bgColor: "#ecfeff",
    Icon: BarChart3,
    stat: "18 vendors scored",
    subStat: "4 high-risk",
    step: 5,
  },
] as const;

// ── Seed events ───────────────────────────────────────────────────────────────

const SEED_EVENTS: FeedEvent[] = [
  { agent: "Insight Agent",    agentColor: "#0891b2", time: "09:51", status: "warn",
    message: "Vendor risk scores recalculated. MedTech Solutions flagged Critical — 0% recovery rate." },
  { agent: "Recovery Agent",   agentColor: "#15803d", time: "09:42", status: "info",
    message: "BioMed escalation confirmed. REC-001 target $123,890 — procurement director notified." },
  { agent: "Compliance Agent", agentColor: "#b45309", time: "09:28", status: "fail",
    message: "Cardinal Health rebate audit: $26,554 rebate + $62,876 volume discounts = $89,430 outstanding." },
  { agent: "Validation Agent", agentColor: "#7c3aed", time: "09:03", status: "fail",
    message: "EX-006 re-validated. STE-4821-A price delta +19% confirmed. Flagged for recovery." },
  { agent: "Invoice Agent",    agentColor: "#0065cb", time: "08:31", status: "info",
    message: "14 invoices ingested from overnight batch. 2 flagged for three-way match review." },
];

// ── Run events (one per step) ─────────────────────────────────────────────────

const RUN_EVENTS: Omit<FeedEvent, "time">[] = [
  { agent: "Invoice Agent",    agentColor: "#0065cb", status: "warn",
    message: "Extracted STC-2026-19847 — 6 line items, 2 flags: price_mismatch (critical), qty_mismatch (warning)." },
  { agent: "Validation Agent", agentColor: "#7c3aed", status: "fail",
    message: "Three-way match failed. STE-4821-A: PO $2.10 vs Invoice $2.50 (+19%). STE-9940-B: qty short 20 units." },
  { agent: "Compliance Agent", agentColor: "#b45309", status: "pass",
    message: "Contract CTR-2025-STE-007 — within annual cap. No rebate clause applies. Passed." },
  { agent: "Recovery Agent",   agentColor: "#15803d", status: "info",
    message: "Price mismatch confirmed. Recovery email drafted for ap@steris.com. Awaiting analyst approval." },
  { agent: "Insight Agent",    agentColor: "#0891b2", status: "info",
    message: "Steris score unchanged at 72/100. Recovery % 45%. No escalation threshold breached." },
];

// Run result status per step (for card state after completion)
const RUN_RESULTS: ("done" | "done-warn" | "done-fail")[] = [
  "done-warn", "done-fail", "done", "done", "done",
];

// ── Status icon helper ────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: FeedEvent["status"] }) {
  if (status === "pass") return <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#15803d" }} />;
  if (status === "fail") return <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#dc2626" }} />;
  if (status === "warn") return <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#b45309" }} />;
  return <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#6b7280" }} />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const { showToast } = useToast();
  const [stepStates, setStepStates] = useState<StepState[]>(["idle","idle","idle","idle","idle"]);
  const [isRunning, setIsRunning] = useState(false);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>(SEED_EVENTS);
  const [completedCount, setCompletedCount] = useState(0);

  // Reset to idle after run completes
  useEffect(() => {
    if (!isRunning && stepStates.some(s => s !== "idle")) {
      const t = setTimeout(() => {
        setStepStates(["idle","idle","idle","idle","idle"]);
        setCompletedCount(0);
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [isRunning, stepStates]);

  async function runPipeline() {
    if (isRunning) return;
    setIsRunning(true);
    setStepStates(["idle","idle","idle","idle","idle"]);
    setCompletedCount(0);
    const now = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    for (let i = 0; i < 5; i++) {
      setStepStates(prev => {
        const next = [...prev] as StepState[];
        next[i] = "running";
        return next;
      });
      await new Promise<void>(r => setTimeout(r, 1400));
      setStepStates(prev => {
        const next = [...prev] as StepState[];
        next[i] = RUN_RESULTS[i];
        return next;
      });
      setCompletedCount(i + 1);
      setFeedEvents(prev => [{ ...RUN_EVENTS[i], time: now }, ...prev]);
      await new Promise<void>(r => setTimeout(r, 100));
    }

    setIsRunning(false);
    showToast("Pipeline complete — invoice STC-2026-19847 processed by all 5 agents", "success");
  }

  const runningIdx = stepStates.findIndex(s => s === "running");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f8fa" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Workflow className="w-3.5 h-3.5" style={{ color: "#0065cb" }} />
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold" style={{ color: "#0065cb" }}>
                Healthcare AP · Multi-Agent Pipeline
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight m-0" style={{ color: "#111827" }}>
              Multi-Agent Pipeline
            </h1>
            <p className="text-xs mt-1 m-0" style={{ color: "#6b7280" }}>
              5 specialized agents — each hands off to the next across the full invoice lifecycle
            </p>
          </div>
          <button
            onClick={runPipeline}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md text-white transition-all cursor-pointer border-none flex-shrink-0 mt-1 disabled:opacity-50"
            style={{ backgroundColor: "#0065cb" }}
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? "Running…" : "Run Pipeline"}
          </button>
        </div>
      </div>

      <hr style={{ borderColor: "#e5e7eb", margin: 0 }} />

      {/* ── Pipeline progress bar ─────────────────────────────────────────── */}
      {isRunning || completedCount > 0 ? (
        <div className="px-8 py-3 bg-white border-b" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium" style={{ color: "#4b5563" }}>
              {isRunning ? `Processing — Step ${runningIdx + 1} of 5` : "Pipeline complete"}
            </span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f3f4f6" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completedCount / 5) * 100}%`,
                  backgroundColor: isRunning ? "#0065cb" : "#15803d",
                }}
              />
            </div>
            <span className="text-[11px] tabular-nums font-medium" style={{ color: "#0065cb" }}>
              {completedCount}/5
            </span>
          </div>
        </div>
      ) : null}

      {/* ── Agent cards with connecting flow ──────────────────────────────── */}
      <div className="px-8 py-6">
        <div className="flex items-stretch gap-0">
          {AGENTS.map((agent, i) => {
            const AgentIcon = agent.Icon;
            const state = stepStates[i];
            const isActive = state === "running";
            const isDone = state === "done" || state === "done-warn" || state === "done-fail";
            const isLast = i === AGENTS.length - 1;

            // Border color based on state
            const borderColor = isActive
              ? agent.color
              : isDone
              ? state === "done-fail" ? "#fca5a5"
                : state === "done-warn" ? "#fcd34d"
                : "#86efac"
              : "#e5e7eb";

            // Background tint when active or done
            const cardBg = isActive
              ? agent.bgColor
              : isDone
              ? state === "done-fail" ? "#fff1f2"
                : state === "done-warn" ? "#fffbeb"
                : "#f0fdf4"
              : "white";

            const card = (
              <div
                className="flex flex-col gap-3 p-4 rounded-lg border-2 h-full transition-all duration-300"
                style={{ borderColor, backgroundColor: cardBg, minHeight: 172 }}
              >
                {/* Step number + icon row */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isActive || isDone ? agent.color : agent.bgColor,
                    }}
                  >
                    {isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: "white" }} />
                    ) : isDone && state === "done-fail" ? (
                      <AlertTriangle className="w-4 h-4" style={{ color: "white", fill: agent.color }} />
                    ) : isDone ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: "white" }} />
                    ) : (
                      <AgentIcon className="w-4 h-4" style={{ color: agent.color }} />
                    )}
                  </div>
                  <span
                    className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: isActive || isDone ? agent.color + "18" : "#f3f4f6",
                      color: isActive || isDone ? agent.color : "#9ca3af",
                    }}
                  >
                    {agent.step}/5
                  </span>
                </div>

                {/* Agent name + role */}
                <div>
                  <p className="text-[13px] font-semibold m-0 leading-tight" style={{ color: "#111827" }}>
                    {agent.name}
                  </p>
                  <p className="text-[10px] m-0 mt-0.5" style={{ color: agent.color }}>
                    {agent.role}
                  </p>
                </div>

                {/* Status badge */}
                <div>
                  {isActive && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: agent.color + "18", color: agent.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: agent.color }} />
                      Processing…
                    </span>
                  )}
                  {isDone && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: state === "done-fail" ? "#fee2e2"
                          : state === "done-warn" ? "#fef3c7"
                          : "#dcfce7",
                        color: state === "done-fail" ? "#dc2626"
                          : state === "done-warn" ? "#b45309"
                          : "#15803d",
                      }}
                    >
                      {state === "done-fail" ? "⚠ Exception found"
                        : state === "done-warn" ? "⚠ Flag raised"
                        : "✓ Passed"}
                    </span>
                  )}
                  {!isActive && !isDone && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#15803d" }} />
                      Active
                    </span>
                  )}
                </div>

                {/* Stat */}
                <div className="mt-auto pt-2 border-t" style={{ borderColor: borderColor + "66" }}>
                  <p className="text-[11px] font-semibold m-0" style={{ color: "#374151" }}>{agent.stat}</p>
                  <p className="text-[10px] m-0 mt-0.5" style={{ color: "#9ca3af" }}>{agent.subStat}</p>
                </div>
              </div>
            );

            return (
              <div key={agent.name} className="flex items-stretch flex-1 min-w-0">
                {/* Card with optional BorderBeam */}
                <div className="flex-1 relative overflow-hidden rounded-lg">
                  {isActive ? (
                    <>
                      {card}
                      <BorderBeam colorFrom={agent.color} colorTo={agent.bgColor} duration={1.5} borderWidth={2.5} />
                    </>
                  ) : card}
                </div>

                {/* Arrow connector between cards */}
                {!isLast && (
                  <div className="flex items-center justify-center flex-shrink-0 w-8">
                    <div className="flex flex-col items-center gap-0.5">
                      <ArrowRight
                        className="w-4 h-4 transition-colors duration-300"
                        style={{
                          color: isDone ? agent.color : "#d1d5db",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Handoff labels under each arrow */}
        <div className="flex mt-1.5">
          {AGENTS.map((agent, i) => {
            const isLast = i === AGENTS.length - 1;
            const labels = ["Flags + data", "Match results", "Audit verdict", "Recovery task"];
            return (
              <div key={agent.name} className="flex-1 flex min-w-0">
                <div className="flex-1" />
                {!isLast && (
                  <div className="w-8 flex items-start justify-center">
                    <span className="text-[9px] text-center leading-tight" style={{ color: "#9ca3af", maxWidth: 52 }}>
                      {labels[i]}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Activity Feed ─────────────────────────────────────────────────── */}
      <div className="px-8 pb-8">
        <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          {/* Feed header */}
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
              <span className="text-sm font-semibold" style={{ color: "#111827" }}>
                Agent Activity Feed
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isRunning && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Live
                </span>
              )}
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
              >
                {feedEvents.length} events
              </span>
            </div>
          </div>

          {/* Feed rows */}
          <div className="divide-y" style={{ maxHeight: 400, overflowY: "auto" }}>
            {feedEvents.map((evt, idx) => (
              <div
                key={`${evt.agent}-${evt.time}-${idx}`}
                className="flex items-start gap-3 px-5 py-3 animate-[slideIn_0.2s_ease-out]"
                style={{
                  backgroundColor: idx === 0 && isRunning ? evt.agentColor + "06" : undefined,
                }}
              >
                <StatusIcon status={evt.status} />
                <span
                  className="text-[9px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ backgroundColor: evt.agentColor + "18", color: evt.agentColor }}
                >
                  {evt.agent}
                </span>
                <span className="text-[11px] flex-shrink-0 tabular-nums" style={{ color: "#9ca3af" }}>
                  {evt.time}
                </span>
                <span className="text-[12px] leading-relaxed flex-1" style={{ color: "#374151" }}>
                  {evt.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
