"use client";

// ─── SOM Workflow Runner — Single Order ──────────────────────────────────────
//
// Per docs/PLAN_SOM_DRUG_DISTRIBUTOR.md §5.3. The visual hero — animated
// 4-card pipeline (border-beam) running the suspicious-order-monitoring
// workflow against one order. Mirrors the app/extract/page.tsx animation
// language so the experience feels coherent across verticals.
//
// [Spec: domains/som/spec.md#Page 2: Order Verification Runner] — v2.0
// shadcn migration: Card/Table/Badge/Button/Alert primitives, theme tokens,
// px-4 lg:px-6. The 4-check pipeline and decision logic are unchanged.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Check, X, Clock, MapPin, ShieldAlert,
  ScrollText, DollarSign, BarChart3, AlertTriangle, Loader2, Play,
  Globe, Database, ChevronRight,
} from "lucide-react";

import { findOrderById } from "@/lib/som/data/orders";
import {
  runSuspiciousOrderMonitoring,
  suspiciousOrderMonitoring,
} from "@/lib/som/workflows/suspiciousOrderMonitoring";
import type { TaskRunState, TaskStatus, WorkflowRunState } from "@/lib/som/types";
import { BorderBeam } from "@/components/magicui/border-beam";
import { useToast } from "@/components/Toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// ─── Visual mappings ─────────────────────────────────────────────────────────

const TASK_ICONS: Record<string, typeof MapPin> = {
  verify_address: MapPin,
  verify_license: ScrollText,
  check_price_deviation: DollarSign,
  detect_pattern_outlier: BarChart3,
};

// Per-status label + AA-safe text token. Fills/dots stay on the vivid
// --warning/--success; text uses the -text variants (ui-standard.md v2.0.1).
const STATUS_META: Record<TaskStatus, { label: string; text: string }> = {
  pass: { label: "Verified", text: "text-success-text" },
  warn: { label: "Review", text: "text-warning-text" },
  fail: { label: "Failed", text: "text-destructive-text" },
  error: { label: "Error", text: "text-muted-foreground" },
};

// Status Badge for a completed task / overall status.
function StatusBadge({ status }: { status: TaskStatus }) {
  const label = STATUS_META[status].label;
  if (status === "pass")
    return <Badge className="border-success bg-success/10 text-success-text">{label}</Badge>;
  if (status === "warn")
    return <Badge className="border-warning bg-warning/10 text-warning-text">{label}</Badge>;
  if (status === "fail") return <Badge variant="destructive">{label}</Badge>;
  return <Badge variant="secondary">{label}</Badge>;
}

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

  // Auto-run the workflow once on mount for a seamless experience.
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
      <main className="@container/main flex flex-1 flex-col p-6">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Link href="/som" className="text-xs text-primary no-underline hover:underline">
          ← Back to queue
        </Link>
      </main>
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
    <main className="@container/main flex flex-1 flex-col">
      {/* Breadcrumb — [Spec: domains/som/spec.md#Page 2 Layout] */}
      <div className="px-4 pt-6 lg:px-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/som")}>
          <ArrowLeft className="size-3" />
          Back to SOM queue
        </Button>
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-4 lg:px-6">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">{order.id}</span>
          <ShieldAlert className="size-3 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            SOM workflow
          </span>
          {order.lineItems.some((l) => l.isControlled) && (
            <Badge className="border-warning bg-warning/10 text-warning-text">
              Controlled substance
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">
          {order.pharmacy.name}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {order.pharmacy.address} · {order.pharmacy.city}, {order.pharmacy.state} ·{" "}
          {order.lineItems.length} line item{order.lineItems.length === 1 ? "" : "s"} ·{" "}
          {formatCurrency(order.totalAmount)}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 px-4 pb-6 lg:px-6 @4xl/main:grid-cols-[1fr_320px]">
        {/* LEFT: Pipeline */}
        <div className="flex flex-col gap-3">
          {/* Re-run button */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Verification pipeline</h2>
            <Button variant="outline" size="sm" onClick={startRun} disabled={isRunning}>
              {isRunning ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Play className="size-3" />
              )}
              {isRunning ? "Running…" : "Re-run pipeline"}
            </Button>
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
          <Card className="mt-2">
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Analyst decision
                </h3>
                {overall && (
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-muted-foreground">Overall:</span>
                    <StatusBadge status={overall} />
                  </span>
                )}
              </div>

              {decision ? (
                <Alert
                  className={
                    decision === "approved"
                      ? "border-success bg-success/10"
                      : decision === "held"
                        ? "border-warning bg-warning/10"
                        : "border-primary bg-primary/5"
                  }
                >
                  <AlertDescription
                    className={
                      decision === "approved"
                        ? "text-success-text"
                        : decision === "held"
                          ? "text-warning-text"
                          : "text-primary"
                    }
                  >
                    {decision === "approved" && "Approved — released to fulfilment"}
                    {decision === "held" && "On hold — awaiting analyst follow-up"}
                    {decision === "escalated" && "Escalated to compliance manager"}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 gap-2 @md/card:grid-cols-3">
                  <Button
                    variant="default"
                    onClick={() => handleDecision("approved")}
                    disabled={!allDone || overall === "fail"}
                    title={
                      overall === "fail"
                        ? "At least one check failed — cannot approve"
                        : ""
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDecision("held")}
                    disabled={!allDone}
                  >
                    Hold
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDecision("escalated")}
                    disabled={!allDone}
                  >
                    Escalate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Order summary */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4">
          <Card>
            <CardContent>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Order details
              </h2>
              {[
                { label: "Order ID", value: order.id, mono: true },
                {
                  label: "Received",
                  value: new Date(order.receivedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }),
                },
                { label: "Permit on file", value: order.pharmacy.permitNumber || "—", mono: true },
                { label: "NPI on file", value: order.pharmacy.npi || "—", mono: true },
                { label: "Total", value: formatCurrency(order.totalAmount) },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className={`flex items-baseline justify-between py-2 ${
                    i < arr.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="text-[11px] text-muted-foreground">{row.label}</span>
                  <span
                    className={`text-[11px] font-medium text-foreground ${row.mono ? "font-mono" : ""}`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Line items
              </h2>
              <div className="flex flex-col gap-2.5">
                {order.lineItems.map((line) => (
                  <div key={line.ndc} className="text-[11px]">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{line.description}</span>
                      {line.isControlled && (
                        <Badge className="border-warning bg-warning/10 text-warning-text">
                          Controlled
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-mono">{line.ndc}</span>
                      <span className="tabular-nums">
                        {line.quantity.toLocaleString()} × {formatCurrency(line.unitPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
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

  // Numbered-circle styling per task lifecycle state.
  const circleClass =
    isDone && result
      ? result.status === "pass"
        ? "bg-success/10 text-success-text"
        : result.status === "warn"
          ? "bg-warning/10 text-warning-text"
          : result.status === "fail"
            ? "bg-destructive/10 text-destructive-text"
            : "bg-muted text-muted-foreground"
      : isRunning
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";

  return (
    <Card
      className={`relative ${taskState?.status === "pending" ? "opacity-60" : "opacity-100"}`}
    >
      {isRunning && <BorderBeam duration={3} colorFrom="var(--primary)" colorTo="var(--chart-2)" />}
      <CardContent className="flex items-start gap-4">
        {/* Numbered circle + icon */}
        <div className="shrink-0">
          <div
            className={`flex size-8 items-center justify-center rounded-full text-[11px] font-semibold ${circleClass}`}
          >
            {isDone && result?.status === "pass" ? (
              <Check className="size-4" />
            ) : isDone && result?.status === "fail" ? (
              <X className="size-4" />
            ) : isDone && result?.status === "warn" ? (
              <AlertTriangle className="size-4" />
            ) : isRunning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon className="size-3.5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
            {isDone && result && <StatusBadge status={result.status} />}
            {isRunning && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
                <Clock className="size-3" />
                Running
              </span>
            )}
          </div>
          {description && (
            <p className="mb-2 text-[11px] leading-snug text-muted-foreground">{description}</p>
          )}
          {isDone && result && (
            <>
              <p className={`text-xs leading-relaxed ${STATUS_META[result.status].text}`}>
                {result.message}
              </p>
              <TaskEvidence
                taskId={taskState?.taskId ?? ""}
                evidence={result.evidence}
                order={order}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Per-task evidence panels (supporting evidence for each check) ───────

function TaskEvidence({
  taskId,
  evidence,
  order,
}: {
  taskId: string;
  evidence: Record<string, unknown>;
  order: ReturnType<typeof findOrderById>;
}) {
  void order;
  if (taskId === "verify_address") {
    const db = evidence.db as { source?: string; record?: { address?: string; city?: string; state?: string; zip?: string } };
    const geo = evidence.geocode as { query?: string; declaredVsGeocodedKm?: number; lat?: number; lng?: number };
    if (!db) return null;
    const fullAddress = db.record ? `${db.record.address}, ${db.record.city}, ${db.record.state} ${db.record.zip}` : "";
    const mapsUrl = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : undefined;
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        <EvidenceRow
          icon={Database}
          label={db.source ?? "Database"}
          value={db.record ? fullAddress : "Not found"}
          link={mapsUrl}
        />
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
    const board = evidence.stateBoard as { source?: string; searchUrl?: string; record?: { permitNumber?: string; status?: string; expiry?: string } };
    const npi = evidence.npi as { source?: string; isLive?: boolean; found?: boolean; status?: string; rawError?: string; latencyMs?: number };
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {board && (
          // Links to the upstream state-board search portal (NC: portal.ncbop.org,
          // CA: search.dca.ca.gov). Stable per-pharmacy URLs aren't exposed, so
          // the link drops the user on the search portal where they can paste
          // the permit number to verify.
          <EvidenceRow
            icon={ScrollText}
            label={board.source ?? "State board"}
            value={board.record ? `Permit ${board.record.permitNumber} · ${board.record.status} · expires ${board.record.expiry}` : "No record"}
            link={board.searchUrl}
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
      <div className="mt-3 overflow-hidden rounded-md border border-border">
        <Table className="text-[11px]">
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-2.5 text-[11px]">Product</TableHead>
              <TableHead className="h-8 px-2.5 text-right text-[11px]">Ordered</TableHead>
              <TableHead className="h-8 px-2.5 text-right text-[11px]">Contract</TableHead>
              <TableHead className="h-8 px-2.5 text-right text-[11px]">Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((m) => (
              <TableRow key={m.ndc}>
                <TableCell className="px-2.5 py-1.5 text-foreground">
                  <div className="font-medium">{m.productName}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{m.ndc}</div>
                </TableCell>
                <TableCell className="px-2.5 py-1.5 text-right tabular-nums text-foreground">
                  ${m.orderedUnitPrice.toFixed(2)}
                </TableCell>
                <TableCell className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">
                  {m.contractPrice != null ? `$${m.contractPrice.toFixed(2)}` : "—"}
                </TableCell>
                <TableCell
                  className={`px-2.5 py-1.5 text-right font-medium tabular-nums ${
                    m.outcome === "deviation"
                      ? "text-destructive-text"
                      : m.outcome === "no_contract"
                        ? "text-warning-text"
                        : "text-success-text"
                  }`}
                >
                  {m.deviationPct != null
                    ? `${m.deviationPct > 0 ? "+" : ""}${m.deviationPct}%`
                    : "n/a"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (taskId === "detect_pattern_outlier") {
    // 5 sub-checks: demographics, population, history, quota, raw_material.
    // Each is rendered as its own mini-row with status pill + 1-line message.
    type SubCheck = {
      id: string;
      label: string;
      status: "pass" | "warn" | "fail" | "error";
      message: string;
    };
    const subChecks = (evidence.subChecks as SubCheck[] | undefined) ?? [];
    if (subChecks.length === 0) return null;
    return (
      <div className="mt-3 flex flex-col gap-1.5">
        {subChecks.map((sc) => (
          <PatternSubCheckRow key={sc.id} subCheck={sc} />
        ))}
      </div>
    );
  }

  return null;
}

// ─── Pattern Outlier sub-check row ────────────────────────────────────────────

function PatternSubCheckRow({
  subCheck,
}: {
  subCheck: { id: string; label: string; status: "pass" | "warn" | "fail" | "error"; message: string };
}) {
  // Status dot — non-text element, uses vivid fill tokens.
  const dotColor =
    subCheck.status === "pass"
      ? "bg-success"
      : subCheck.status === "warn"
        ? "bg-warning"
        : subCheck.status === "fail"
          ? "bg-destructive"
          : "bg-muted-foreground";
  const labelColor = STATUS_META[subCheck.status]?.text ?? "text-muted-foreground";
  return (
    <div className="flex items-start gap-2.5 rounded bg-muted px-2.5 py-2">
      <span className={`mt-1 size-1.5 shrink-0 rounded-full ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {subCheck.label}
          </span>
          <span className={`text-[9px] font-semibold uppercase tracking-wide ${labelColor}`}>
            {STATUS_META[subCheck.status]?.label ?? subCheck.status}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-foreground">{subCheck.message}</p>
      </div>
    </div>
  );
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
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="size-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="flex items-center gap-1 text-[11px] leading-snug text-foreground">
        {value}
        {link && <ChevronRight className="size-3 text-primary" />}
      </p>
    </>
  );
  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded bg-muted px-2.5 py-2 no-underline transition-colors hover:bg-accent"
      >
        {inner}
      </a>
    );
  }
  return <div className="rounded bg-muted px-2.5 py-2">{inner}</div>;
}
