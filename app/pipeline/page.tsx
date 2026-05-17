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
    color: "var(--agent-invoice)",
    bgColor: "var(--agent-invoice-subtle)",
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
    color: "var(--agent-validation)",
    bgColor: "var(--agent-validation-subtle)",
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
    color: "var(--agent-compliance)",
    bgColor: "var(--agent-compliance-subtle)",
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
    color: "var(--agent-recovery)",
    bgColor: "var(--agent-recovery-subtle)",
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
    color: "var(--agent-insight)",
    bgColor: "var(--agent-insight-subtle)",
    Icon: BarChart3,
    stat: "18 vendors scored",
    subStat: "4 high-risk",
    step: 5,
  },
] as const;

// ── Seed events ───────────────────────────────────────────────────────────────

const SEED_EVENTS: FeedEvent[] = [
  { agent: "Insight Agent",    agentColor: "var(--agent-insight)", time: "09:51", status: "warn",
    message: "Vendor risk scores recalculated. MedTech Solutions flagged Critical — 0% recovery rate." },
  { agent: "Recovery Agent",   agentColor: "var(--agent-recovery)", time: "09:42", status: "info",
    message: "BioMed escalation confirmed. REC-001 target $123,890 — procurement director notified." },
  { agent: "Compliance Agent", agentColor: "var(--agent-compliance)", time: "09:28", status: "fail",
    message: "Cardinal Health rebate audit: $26,554 rebate + $62,876 volume discounts = $89,430 outstanding." },
  { agent: "Validation Agent", agentColor: "var(--agent-validation)", time: "09:03", status: "fail",
    message: "EX-006 re-validated. STE-4821-A price delta +19% confirmed. Flagged for recovery." },
  { agent: "Invoice Agent",    agentColor: "var(--agent-invoice)", time: "08:31", status: "info",
    message: "14 invoices ingested from overnight batch. 2 flagged for three-way match review." },
];

// ── Run events (one per step) ─────────────────────────────────────────────────

const RUN_EVENTS: Omit<FeedEvent, "time">[] = [
  { agent: "Invoice Agent",    agentColor: "var(--agent-invoice)", status: "warn",
    message: "Extracted STC-2026-19847 — 6 line items, 2 flags: price_mismatch (critical), qty_mismatch (warning)." },
  { agent: "Validation Agent", agentColor: "var(--agent-validation)", status: "fail",
    message: "Three-way match failed. STE-4821-A: PO $2.10 vs Invoice $2.50 (+19%). STE-9940-B: qty short 20 units." },
  { agent: "Compliance Agent", agentColor: "var(--agent-compliance)", status: "pass",
    message: "Contract CTR-2025-STE-007 — within annual cap. No rebate clause applies. Passed." },
  { agent: "Recovery Agent",   agentColor: "var(--agent-recovery)", status: "info",
    message: "Price mismatch confirmed. Recovery email drafted for ap@steris.com. Awaiting analyst approval." },
  { agent: "Insight Agent",    agentColor: "var(--agent-insight)", status: "info",
    message: "Steris score unchanged at 72/100. Recovery % 45%. No escalation threshold breached." },
];

// Run result status per step (for card state after completion)
const RUN_RESULTS: ("done" | "done-warn" | "done-fail")[] = [
  "done-warn", "done-fail", "done", "done", "done",
];

// ── Status icon helper ────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: FeedEvent["status"] }) {
  if (status === "pass") return <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5 text-[var(--agent-recovery)]" />;
  if (status === "fail") return <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-[var(--critical)]" />;
  if (status === "warn") return <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-[var(--agent-compliance)]" />;
  return <FileText className="w-3 h-3 flex-shrink-0 mt-0.5 text-[var(--text-tertiary)]" />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stepStates, setStepStates] = useState<StepState[]>(["idle","idle","idle","idle","idle"]);
  const [isRunning, setIsRunning] = useState(false);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>(SEED_EVENTS);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

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
    <div className="min-h-screen bg-[var(--bg-base)]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-8 pt-8 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Workflow className="w-3.5 h-3.5 text-[var(--acl-primary)]" />
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--acl-primary)]">
                Healthcare AP · Multi-Agent Pipeline
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight m-0 text-[var(--text-primary)]">
              Multi-Agent Pipeline
            </h1>
            <p className="text-xs mt-1 m-0 text-[var(--text-tertiary)]">
              5 specialized agents — each hands off to the next across the full invoice lifecycle
            </p>
          </div>
          <button
            onClick={runPipeline}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md text-white transition-all cursor-pointer border-none flex-shrink-0 mt-1 disabled:opacity-50 bg-[var(--acl-primary)]"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? "Running…" : "Run Pipeline"}
          </button>
        </div>
      </div>

      <hr className="border-[var(--border)] m-0" />

      {/* ── Pipeline progress bar ─────────────────────────────────────────── */}
      {isRunning || completedCount > 0 ? (
        <div className="px-6 lg:px-8 py-3 bg-white border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {isRunning ? `Processing — Step ${runningIdx + 1} of 5` : "Pipeline complete"}
            </span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--bg-subtle)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completedCount / 5) * 100}%`,
                  backgroundColor: isRunning ? "var(--acl-primary)" : "var(--agent-recovery)",
                }}
              />
            </div>
            <span className="text-[11px] tabular-nums font-medium text-[var(--acl-primary)]">
              {completedCount}/5
            </span>
          </div>
        </div>
      ) : null}

      {loading ? (
        <>
          {/* ── Agent cards skeleton ──────────────────────────────────────── */}
          <div className="px-6 lg:px-8 py-6">
            <div className="flex items-stretch gap-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-stretch flex-1 min-w-0">
                  <div className="flex-1 relative overflow-hidden rounded-lg">
                    <div
                      className="flex flex-col gap-3 p-4 rounded-lg border-2 border-[var(--border)] bg-white h-full"
                      style={{ minHeight: 172 }}
                    >
                      {/* Icon + step number */}
                      <div className="flex items-start justify-between">
                        <div className="w-9 h-9 rounded-lg bg-[var(--border)] animate-pulse" />
                        <div className="h-5 w-8 bg-[var(--border)] rounded animate-pulse" />
                      </div>
                      {/* Agent name + role */}
                      <div>
                        <div className="h-3.5 w-24 bg-[var(--border)] rounded animate-pulse mb-1.5" />
                        <div className="h-2.5 w-20 bg-[var(--border)] rounded animate-pulse" />
                      </div>
                      {/* Status badge */}
                      <div>
                        <div className="h-5 w-14 bg-[var(--border)] rounded-full animate-pulse" />
                      </div>
                      {/* Stat */}
                      <div className="mt-auto pt-2 border-t border-[var(--border)]">
                        <div className="h-3 w-20 bg-[var(--border)] rounded animate-pulse mb-1.5" />
                        <div className="h-2.5 w-16 bg-[var(--border)] rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                  {/* Arrow connector skeleton */}
                  {i < 5 && (
                    <div className="flex items-center justify-center flex-shrink-0 w-8">
                      <div className="h-4 w-4 bg-[var(--border)] rounded animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Activity Feed skeleton ────────────────────────────────────── */}
          <div className="px-6 lg:px-8 pb-8">
            <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
              {/* Feed header skeleton */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-[var(--border)] rounded animate-pulse" />
                  <div className="h-3.5 w-28 bg-[var(--border)] rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-[var(--border)] rounded-full animate-pulse" />
              </div>
              {/* Feed row skeletons */}
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <div className="w-3 h-3 bg-[var(--border)] rounded animate-pulse mt-0.5 flex-shrink-0" />
                    <div className="h-4 w-20 bg-[var(--border)] rounded animate-pulse flex-shrink-0" />
                    <div className="h-3 w-10 bg-[var(--border)] rounded animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-full bg-[var(--border)] rounded animate-pulse mb-1.5" />
                      <div className="h-3 w-3/4 bg-[var(--border)] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ── Agent cards with connecting flow ──────────────────────────── */}
          <div className="px-6 lg:px-8 py-6">
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
                  ? state === "done-fail" ? "var(--pipeline-fail-border)"
                    : state === "done-warn" ? "var(--pipeline-warn-border)"
                    : "var(--pipeline-pass-border)"
                  : "var(--border)";

                // Background tint when active or done
                const cardBg = isActive
                  ? agent.bgColor
                  : isDone
                  ? state === "done-fail" ? "var(--pipeline-fail-bg)"
                    : state === "done-warn" ? "var(--pipeline-warn-bg)"
                    : "var(--pipeline-pass-bg)"
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
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : isDone && state === "done-fail" ? (
                          <AlertTriangle className="w-4 h-4 text-white" style={{ fill: agent.color }} />
                        ) : isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <AgentIcon className="w-4 h-4" style={{ color: agent.color }} />
                        )}
                      </div>
                      <span
                        className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: isActive || isDone ? agent.color + "18" : "var(--bg-subtle)",
                          color: isActive || isDone ? agent.color : "var(--text-muted)",
                        }}
                      >
                        {agent.step}/5
                      </span>
                    </div>

                    {/* Agent name + role */}
                    <div>
                      <p className="text-[13px] font-semibold m-0 leading-tight text-[var(--text-primary)]">
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
                            backgroundColor: state === "done-fail" ? "var(--pipeline-fail-badge)"
                              : state === "done-warn" ? "var(--pipeline-warn-badge)"
                              : "var(--pipeline-pass-badge)",
                            color: state === "done-fail" ? "var(--critical)"
                              : state === "done-warn" ? "var(--agent-compliance)"
                              : "var(--agent-recovery)",
                          }}
                        >
                          {state === "done-fail" ? "⚠ Exception found"
                            : state === "done-warn" ? "⚠ Flag raised"
                            : "✓ Passed"}
                        </span>
                      )}
                      {!isActive && !isDone && (
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--pipeline-pass-bg)] text-[var(--agent-recovery)]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--agent-recovery)]" />
                          Active
                        </span>
                      )}
                    </div>

                    {/* Stat */}
                    <div className="mt-auto pt-2 border-t" style={{ borderColor: borderColor + "66" }}>
                      <p className="text-[11px] font-semibold m-0 text-[var(--neutral-text)]">{agent.stat}</p>
                      <p className="text-[10px] m-0 mt-0.5 text-[var(--text-muted)]">{agent.subStat}</p>
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
                              color: isDone ? agent.color : "var(--border-strong)",
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
                        <span className="text-[9px] text-center leading-tight text-[var(--text-muted)] max-w-[52px]">
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
          <div className="px-6 lg:px-8 pb-8">
            <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
              {/* Feed header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    Agent Activity Feed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isRunning && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--agent-invoice-subtle)] text-[var(--info)]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Live
                    </span>
                  )}
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-tertiary)]"
                  >
                    {feedEvents.length} events
                  </span>
                </div>
              </div>

              {/* Feed rows */}
              <div className="divide-y max-h-[400px] overflow-y-auto">
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
                    <span className="text-[11px] flex-shrink-0 tabular-nums text-[var(--text-muted)]">
                      {evt.time}
                    </span>
                    <span className="text-[12px] leading-relaxed flex-1 text-[var(--neutral-text)]">
                      {evt.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
