// [Spec: domains/pipeline/spec.md] — Multi-Agent Pipeline.
// v2.0 shadcn migration (cluster 1, 2026-05-22): off the v1 token set per the
// ui-standard.md v1→v2 map. Agent cards + Activity Feed → shadcn Card/Skeleton;
// state + feed badges → shadcn Badge; Run Pipeline → shadcn Button; progress →
// shadcn Progress. Agent-accent confined to icon tile / role label / BorderBeam
// / running badge; all status surfaces use shadcn theme tokens. Dark mode works.
"use client";

import { useState, useEffect } from "react";
import {
  Bot, GitCompare, ShieldCheck, TrendingUp, BarChart3,
  Workflow, Play, Loader2, CheckCircle2, ArrowRight,
  FileText, AlertTriangle, Clock,
} from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { useToast } from "@/components/Toast";
import { allExceptions } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";

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

// AP exception count — derived from lib/data.ts, never hard-coded, so the
// pipeline agrees with the dashboard and exceptions list.
// [Spec: domains/pipeline/spec.md#Business Rules — Agent Definitions]
const AP_EXCEPTION_COUNT = allExceptions.filter((e) => !e.type.startsWith("som_")).length;

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
    stat: `${AP_EXCEPTION_COUNT} exceptions`,
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
// Icons are non-text decorative cues paired with a text label — the vivid
// --success / --warning are valid here (WCAG 1.4.1).
// [Spec: domains/pipeline/spec.md#Business Rules — Activity Feed Events]

function StatusIcon({ status }: { status: FeedEvent["status"] }) {
  if (status === "pass") return <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />;
  if (status === "fail") return <AlertTriangle className="mt-0.5 size-3 shrink-0 text-destructive-text" />;
  if (status === "warn") return <AlertTriangle className="mt-0.5 size-3 shrink-0 text-warning" />;
  return <FileText className="mt-0.5 size-3 shrink-0 text-muted-foreground" />;
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
    <main className="min-h-screen bg-background">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {/* [Spec: domains/pipeline/spec.md#Layout — Header region] */}
      <div className="px-4 pt-8 pb-5 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Workflow className="size-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Healthcare AP · Multi-Agent Pipeline
              </span>
            </div>
            <h1 className="m-0 text-2xl font-semibold tracking-tight text-foreground">
              Multi-Agent Pipeline
            </h1>
            <p className="m-0 mt-1 text-sm text-muted-foreground">
              5 specialized agents — each hands off to the next across the full invoice lifecycle
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={runPipeline}
            disabled={isRunning}
            className="mt-1 shrink-0"
          >
            {isRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {isRunning ? "Running…" : "Run Pipeline"}
          </Button>
        </div>
      </div>

      <hr className="m-0 border-border" />

      {/* ── Pipeline progress bar ─────────────────────────────────────────── */}
      {/* [Spec: domains/pipeline/spec.md#Layout — Progress bar] */}
      {isRunning || completedCount > 0 ? (
        <div className="border-b border-border bg-card px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-muted-foreground">
              {isRunning ? `Processing — Step ${runningIdx + 1} of 5` : "Pipeline complete"}
            </span>
            <Progress value={(completedCount / 5) * 100} className="flex-1">
              <ProgressTrack>
                <ProgressIndicator className={isRunning ? "bg-primary" : "bg-success"} />
              </ProgressTrack>
            </Progress>
            <Badge variant="outline" className="tabular-nums">
              {completedCount}/5
            </Badge>
          </div>
        </div>
      ) : null}

      {loading ? (
        <>
          {/* ── Agent cards skeleton ──────────────────────────────────────── */}
          <div className="px-4 py-6 lg:px-6">
            <div className="flex items-stretch gap-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex min-w-0 flex-1 items-stretch">
                  <Card className="flex-1 gap-3 p-4" style={{ minHeight: 172 }}>
                    {/* Icon + step number */}
                    <div className="flex items-start justify-between">
                      <Skeleton className="size-9 rounded-lg" />
                      <Skeleton className="h-5 w-8 rounded" />
                    </div>
                    {/* Agent name + role */}
                    <div>
                      <Skeleton className="mb-1.5 h-3.5 w-24 rounded" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                    {/* Status badge */}
                    <Skeleton className="h-5 w-14 rounded-full" />
                    {/* Stat */}
                    <div className="mt-auto border-t border-border pt-2">
                      <Skeleton className="mb-1.5 h-3 w-20 rounded" />
                      <Skeleton className="h-2.5 w-16 rounded" />
                    </div>
                  </Card>
                  {/* Arrow connector skeleton */}
                  {i < 5 && (
                    <div className="flex w-8 shrink-0 items-center justify-center">
                      <Skeleton className="size-4 rounded" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Activity Feed skeleton ────────────────────────────────────── */}
          <div className="px-4 pb-8 lg:px-6">
            <Card className="gap-0 py-0">
              {/* Feed header skeleton */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-3.5 rounded" />
                  <Skeleton className="h-3.5 w-28 rounded" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              {/* Feed row skeletons */}
              <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <Skeleton className="mt-0.5 size-3 shrink-0 rounded" />
                    <Skeleton className="h-4 w-20 shrink-0 rounded" />
                    <Skeleton className="h-3 w-10 shrink-0 rounded" />
                    <div className="flex-1">
                      <Skeleton className="mb-1.5 h-3 w-full rounded" />
                      <Skeleton className="h-3 w-3/4 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* ── Agent cards with connecting flow ──────────────────────────── */}
          {/* [Spec: domains/pipeline/spec.md#Layout — Agent cards row] */}
          <div className="px-4 py-6 lg:px-6">
            <div className="flex items-stretch gap-0">
              {AGENTS.map((agent, i) => {
                const AgentIcon = agent.Icon;
                const state = stepStates[i];
                const isActive = state === "running";
                const isDone = state === "done" || state === "done-warn" || state === "done-fail";
                const isLast = i === AGENTS.length - 1;

                // Status-driven surface — shadcn theme tokens only.
                // [Spec: domains/pipeline/spec.md#Business Rules — Step State Machine]
                const surfaceClass = isActive
                  ? "border-2 bg-card"
                  : state === "done-fail"
                  ? "border-2 border-destructive bg-destructive/5"
                  : state === "done-warn"
                  ? "border-2 border-warning bg-warning/5"
                  : isDone
                  ? "border-2 border-success bg-success/5"
                  : "border-2 border-border bg-card";

                const card = (
                  <Card
                    className={`h-full gap-3 p-4 transition-all duration-300 ${surfaceClass}`}
                    style={{
                      minHeight: 172,
                      // running: per-agent accent border (decorative)
                      ...(isActive ? { borderColor: agent.color } : null),
                    }}
                  >
                    {/* Step number + icon row */}
                    <div className="flex items-start justify-between">
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: isActive || isDone ? agent.color : agent.bgColor,
                        }}
                      >
                        {isActive ? (
                          <Loader2 className="size-4 animate-spin text-white" />
                        ) : isDone && state === "done-fail" ? (
                          <AlertTriangle className="size-4 text-white" style={{ fill: agent.color }} />
                        ) : isDone ? (
                          <CheckCircle2 className="size-4 text-white" />
                        ) : (
                          <AgentIcon className="size-4" style={{ color: agent.color }} />
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="tabular-nums"
                        style={
                          isActive || isDone
                            ? { backgroundColor: agent.color + "18", color: agent.color, borderColor: "transparent" }
                            : undefined
                        }
                      >
                        {agent.step}/5
                      </Badge>
                    </div>

                    {/* Agent name + role */}
                    <div>
                      <p className="m-0 text-[13px] font-semibold leading-tight text-foreground">
                        {agent.name}
                      </p>
                      <p className="m-0 mt-0.5 text-[10px]" style={{ color: agent.color }}>
                        {agent.role}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div>
                      {isActive && (
                        <Badge
                          variant="outline"
                          style={{ backgroundColor: agent.color + "18", color: agent.color, borderColor: "transparent" }}
                        >
                          <span
                            className="size-1.5 animate-pulse rounded-full"
                            style={{ backgroundColor: agent.color }}
                          />
                          Processing…
                        </Badge>
                      )}
                      {isDone && state === "done-fail" && (
                        <Badge variant="destructive">
                          <AlertTriangle className="size-3" />
                          Exception found
                        </Badge>
                      )}
                      {isDone && state === "done-warn" && (
                        <Badge className="border-warning bg-warning/10 text-warning-text">
                          <AlertTriangle className="size-3" />
                          Flag raised
                        </Badge>
                      )}
                      {isDone && state === "done" && (
                        <Badge className="border-success bg-success/10 text-success-text">
                          <CheckCircle2 className="size-3" />
                          Passed
                        </Badge>
                      )}
                      {!isActive && !isDone && (
                        <Badge variant="outline" className="text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-success" />
                          Active
                        </Badge>
                      )}
                    </div>

                    {/* Stat */}
                    <div className="mt-auto border-t border-border pt-2">
                      <p className="m-0 text-[11px] font-semibold text-foreground">{agent.stat}</p>
                      <p className="m-0 mt-0.5 text-[10px] text-muted-foreground">{agent.subStat}</p>
                    </div>
                  </Card>
                );

                return (
                  <div key={agent.name} className="flex min-w-0 flex-1 items-stretch">
                    {/* Card with optional BorderBeam */}
                    <div className="relative flex-1 overflow-hidden rounded-xl">
                      {isActive ? (
                        <>
                          {card}
                          <BorderBeam colorFrom={agent.color} colorTo={agent.bgColor} duration={1.5} borderWidth={2.5} />
                        </>
                      ) : card}
                    </div>

                    {/* Arrow connector between cards. Idle = neutral border
                        token; done = per-agent accent (decorative extension). */}
                    {!isLast && (
                      <div className="flex w-8 shrink-0 items-center justify-center">
                        <ArrowRight
                          className={`size-4 transition-colors duration-300 ${isDone ? "" : "text-border"}`}
                          style={isDone ? { color: agent.color } : undefined}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Handoff labels under each arrow */}
            <div className="mt-1.5 flex">
              {AGENTS.map((agent, i) => {
                const isLast = i === AGENTS.length - 1;
                const labels = ["Flags + data", "Match results", "Audit verdict", "Recovery task"];
                return (
                  <div key={agent.name} className="flex min-w-0 flex-1">
                    <div className="flex-1" />
                    {!isLast && (
                      <div className="flex w-8 items-start justify-center">
                        <span className="max-w-[52px] text-center text-[9px] leading-tight text-muted-foreground">
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
          {/* [Spec: domains/pipeline/spec.md#Layout — Activity Feed] */}
          <div className="px-4 pb-8 lg:px-6">
            <Card className="gap-0 py-0">
              {/* Feed header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Agent Activity Feed
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {isRunning && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                      Live
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {feedEvents.length} events
                  </Badge>
                </div>
              </div>

              {/* Feed rows */}
              <div className="max-h-[400px] divide-y divide-border overflow-y-auto">
                {feedEvents.map((evt, idx) => (
                  <div
                    key={`${evt.agent}-${evt.time}-${idx}`}
                    className="flex items-start gap-3 px-5 py-3 animate-[slideIn_0.2s_ease-out]"
                    style={{
                      backgroundColor: idx === 0 && isRunning ? evt.agentColor + "0d" : undefined,
                    }}
                  >
                    <StatusIcon status={evt.status} />
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: evt.agentColor + "18", color: evt.agentColor }}
                    >
                      {evt.agent}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {evt.time}
                    </span>
                    <span className="flex-1 text-[12px] leading-relaxed text-foreground">
                      {evt.message}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
