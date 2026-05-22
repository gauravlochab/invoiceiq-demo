// [Spec: domains/exceptions/spec.md v2.0.1 — Duplicates View] — the standalone
// /duplicates route, migrated to the shadcn v2.0 design system. Card/Badge/
// Dialog/Select/Textarea/Button primitives, theme tokens only, AA-safe status
// text. Shares the DuplicatePairCard surface with the /exceptions Duplicates
// tab. See exceptions/spec.md CHANGELOG 2026-05-22.
"use client";

import { useState, useEffect } from "react";
import { Check, AlertTriangle } from "lucide-react";
import {
  duplicatePairs,
  DuplicatePair,
  formatCurrency,
  formatDate,
} from "@/lib/data";
import { useToast } from "@/components/Toast";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ─── AI ANALYSIS COPY PER PAIR ────────────────────────────────────────────────
// [Spec: domains/exceptions/spec.md#Data Model — aiAnalysis]

const aiAnalysis: Record<string, string[]> = {
  "DUP-001": [
    "Same vendor ID confirmed (VND-0142)",
    "8/8 line items match exactly (SKUs and quantities identical)",
    "Amount delta of 0.42% — consistent with known duplicate evasion pattern",
  ],
  "DUP-002": [
    "Exact duplicate: 100% similarity across all fields including amounts and line items",
    "Same EDI sender ID (HS-EDI-4421) re-submitted via email 4 days later",
    "Zero amount delta — likely accidental resubmission; payment would have doubled",
  ],
  "DUP-003": [
    "Same vendor account confirmed (VND-0389) — matched in vendor master",
    "11/12 line items match; one SKU description variant detected",
    "Amount altered by $240 (1.94%) across 5-day gap — pattern flagged for review",
  ],
};

// ─── SIMILARITY BAR ───────────────────────────────────────────────────────────
// Token-driven meter — non-text fill (AA 3:1), always paired with the % text.
// [Spec: domains/exceptions/spec.md#Acceptance Criteria — similarity bar]

function SimilarityBar({ score }: { score: number }) {
  const exact = score >= 99;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Similarity
      </span>
      <div
        className="h-1.5 w-32 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Similarity ${score} percent`}
      >
        <div
          className={`h-full rounded-full ${exact ? "bg-destructive" : "bg-warning"}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span
        className={`text-[13px] font-medium ${exact ? "text-destructive" : "text-warning-text"}`}
      >
        {score}%
      </span>
    </div>
  );
}

// ─── DUPLICATE PAIR CARD ──────────────────────────────────────────────────────

function DuplicatePairCard({
  pair,
  pairActions,
  onReject,
  onOverride,
  onEscalate,
}: {
  pair: DuplicatePair;
  pairActions: Record<string, string>;
  onReject: () => void;
  onOverride: () => void;
  onEscalate: () => void;
}) {
  const analysis = aiAnalysis[pair.id] ?? [];

  let statusBadge = <Badge variant="secondary">Open</Badge>;
  if (pair.status === "open") {
    statusBadge = <Badge variant="destructive">Open</Badge>;
  } else if (pair.status === "under_review") {
    statusBadge = (
      <Badge className="border-warning bg-warning/10 text-warning-text">
        Under Review
      </Badge>
    );
  } else if (pair.status === "resolved") {
    statusBadge = (
      <Badge className="border-success bg-success/10 text-success-text">
        Resolved
      </Badge>
    );
  }

  // [Spec: domains/exceptions/spec.md#Layout — Duplicate Pair Cards CardFooter]
  function renderActions() {
    if (pair.status === "resolved") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success-text">
          <Check className="size-3.5" />
          Resolved — {formatCurrency(pair.flaggedAmount)} saved
        </span>
      );
    }

    const taken = pairActions[pair.id];
    if (taken) {
      const label =
        taken === "reject"
          ? "Rejected"
          : taken === "override"
            ? "Approved with Override"
            : "Escalated to Manager";
      const cls =
        taken === "reject"
          ? "border-destructive bg-destructive/10 text-destructive"
          : taken === "override"
            ? "border-success bg-success/10 text-success-text"
            : "border-warning bg-warning/10 text-warning-text";
      return (
        <div
          className={`w-full rounded-md border px-3 py-2 text-center text-xs font-medium ${cls}`}
        >
          {label}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="destructive" size="sm" onClick={onReject}>
          Reject
        </Button>
        <Button variant="outline" size="sm" onClick={onOverride}>
          Approve with Override
        </Button>
        <Button variant="outline" size="sm" onClick={onEscalate}>
          Escalate to Manager
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-4 gap-0 py-0">
      {/* Card header */}
      <CardHeader className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <h3 className="m-0 text-sm font-semibold">{pair.vendor}</h3>
          <span className="text-[11px] text-muted-foreground">{pair.id}</span>
        </div>
        <CardAction className="row-span-1 row-start-1 flex items-center gap-2.5 self-center">
          <span className="text-sm font-medium tabular-nums">
            {formatCurrency(pair.flaggedAmount)}
          </span>
          {statusBadge}
        </CardAction>
      </CardHeader>

      {/* Similarity score row */}
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-2">
        <SimilarityBar score={pair.similarity} />
        <span className="text-xs text-muted-foreground">
          {pair.amountDelta > 0
            ? `Δ ${formatCurrency(pair.amountDelta)} · ${pair.daysDelta} days apart`
            : `${pair.daysDelta} days apart · no amount delta`}
        </span>
      </div>

      {/* Side-by-side comparison */}
      <CardContent className="grid grid-cols-[1fr_auto_1fr] items-start px-5 py-4">
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Invoice A
          </div>
          <div className="font-mono text-xs font-medium">
            {pair.invoice1.number}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {formatDate(pair.invoice1.date)}
          </div>
          <div className="mt-1 text-base font-semibold tabular-nums">
            {formatCurrency(pair.invoice1.amount)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {pair.invoice1.submittedVia}
          </div>
        </div>

        <div className="mx-8 w-px self-stretch bg-border" />

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Invoice B
          </div>
          <div className="font-mono text-xs font-medium">
            {pair.invoice2.number}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {formatDate(pair.invoice2.date)}
          </div>
          <div className="mt-1 text-base font-semibold tabular-nums">
            {formatCurrency(pair.invoice2.amount)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {pair.invoice2.submittedVia}
          </div>
        </div>
      </CardContent>

      {/* AI analysis */}
      {analysis.length > 0 && (
        <div className="px-5 pb-4">
          <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Analysis
            </div>
            <div className="flex flex-col gap-1.5">
              {analysis.map((line, i) => (
                <div
                  key={i}
                  className="flex gap-2 text-xs text-muted-foreground"
                >
                  <span className="shrink-0" aria-hidden="true">
                    &ndash;
                  </span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <CardFooter className="border-t-0 bg-transparent px-5 pt-0 pb-4">
        {renderActions()}
      </CardFooter>
    </Card>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
// [Spec: domains/exceptions/spec.md#Layout — How It Works]

const steps = [
  {
    step: "STEP 1",
    name: "Ingest",
    desc: "All invoices received via email, mail, EDI, and vendor portal",
  },
  {
    step: "STEP 2",
    name: "Vectorize",
    desc: "Line items, amounts, dates, and vendor IDs converted to similarity vectors",
  },
  {
    step: "STEP 3",
    name: "Flag",
    desc: "Pairs exceeding 97% similarity threshold surfaced for review",
  },
];

function HowItWorks() {
  return (
    <Card className="mb-6 flex-row items-center px-6 py-4">
      {steps.map((s, i) => (
        <div key={s.step} className="flex min-w-0 flex-1 items-center">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {s.step}
            </div>
            <div className="mt-0.5 text-[13px] font-medium">{s.name}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {s.desc}
            </div>
          </div>
          {i < steps.length - 1 && (
            <span
              className="mx-6 shrink-0 text-lg text-muted-foreground"
              aria-hidden="true"
            >
              &rarr;
            </span>
          )}
        </div>
      ))}
    </Card>
  );
}

// ─── MANAGERS LIST ────────────────────────────────────────────────────────────

const managers = ["David Kim", "Lisa Rodriguez", "Michael Chang", "Jennifer Walsh"];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DuplicatesPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<{
    type: "reject" | "override" | "escalate";
    pairId: string;
  } | null>(null);
  const [modalNote, setModalNote] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [pairActions, setPairActions] = useState<Record<string, string>>({});

  // [Spec: domains/exceptions/spec.md#Business Rules — Loading state]
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  function closeModal() {
    setActiveModal(null);
    setModalNote("");
    setSelectedManager("");
  }

  // [Spec: domains/exceptions/spec.md#Business Rules — Duplicate pair actions]
  function handleSubmit() {
    if (!activeModal) return;
    setPairActions((prev) => ({
      ...prev,
      [activeModal.pairId]: activeModal.type,
    }));
    showToast(
      `Duplicate ${activeModal.pairId} — ${
        activeModal.type === "reject"
          ? "invoice rejected per analyst review"
          : activeModal.type === "override"
            ? "approved with documented override"
            : "escalated for managerial review"
      }`,
      activeModal.type === "reject" ? "warning" : "success"
    );
    closeModal();
  }

  const totalAtRisk = formatCurrency(
    duplicatePairs.reduce((s, p) => s + p.flaggedAmount, 0)
  );

  return (
    <main className="@container/main flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-[900px]">
        {/* Header */}
        <div className="px-4 pt-8 pb-6 lg:px-6">
          <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">
                Duplicate Detection
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                AI scanned 1,847 invoices &middot; {duplicatePairs.length} pairs
                flagged &middot; {totalAtRisk} at risk
              </p>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
          <hr className="mt-5 border-border" />
        </div>

        {/* How it works + cards */}
        <section
          aria-labelledby="pairs-heading"
          className="px-4 pb-8 lg:px-6"
        >
          <h2 id="pairs-heading" className="sr-only">
            Flagged duplicate pairs
          </h2>
          {loading ? (
            <>
              <Card className="mb-6 flex-row items-center px-6 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex min-w-0 flex-1 items-center">
                    <div className="min-w-0 flex-1">
                      <Skeleton className="mb-2 h-2.5 w-12" />
                      <Skeleton className="mb-1.5 h-3.5 w-20" />
                      <Skeleton className="h-2.5 w-40" />
                    </div>
                    {i < 3 && <Skeleton className="mx-6 size-4 shrink-0" />}
                  </div>
                ))}
              </Card>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="mb-4 gap-0 py-0">
                  <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="border-b border-border bg-muted/40 px-5 py-2">
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <div className="grid grid-cols-2 gap-8 px-5 py-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                  <div className="px-5 pb-4">
                    <Skeleton className="h-7 w-64" />
                  </div>
                </Card>
              ))}
            </>
          ) : (
            <>
              <HowItWorks />
              {duplicatePairs.map((pair) => (
                <DuplicatePairCard
                  key={pair.id}
                  pair={pair}
                  pairActions={pairActions}
                  onReject={() => {
                    setActiveModal({ type: "reject", pairId: pair.id });
                    setModalNote("");
                  }}
                  onOverride={() => {
                    setActiveModal({ type: "override", pairId: pair.id });
                    setModalNote("");
                  }}
                  onEscalate={() => {
                    setActiveModal({ type: "escalate", pairId: pair.id });
                    setModalNote("");
                    setSelectedManager("");
                  }}
                />
              ))}
            </>
          )}
        </section>
      </div>

      {/* ── Reject Dialog ─────────────────────────────────────────────────── */}
      {/* [Spec: domains/exceptions/spec.md#Layout — Action Modals] */}
      <Dialog
        open={activeModal?.type === "reject"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Duplicate Invoice</DialogTitle>
            <DialogDescription>
              This will block the duplicate invoice from processing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reject-reason"
              className="text-xs font-medium text-muted-foreground"
            >
              Reason for rejection
            </label>
            <Textarea
              id="reject-reason"
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Describe why this invoice is being rejected..."
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!modalNote.trim()}
            >
              Reject Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approve with Override Dialog ──────────────────────────────────── */}
      <Dialog
        open={activeModal?.type === "override"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve with Override</DialogTitle>
            <DialogDescription>
              Override the duplicate flag and approve this invoice for payment.
            </DialogDescription>
          </DialogHeader>
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="text-warning-text" />
            <AlertDescription className="text-warning-text">
              This action overrides the AI duplicate detection. A record of this
              override will be logged for audit purposes.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="override-reason"
              className="text-xs font-medium text-muted-foreground"
            >
              Justification for override
            </label>
            <Textarea
              id="override-reason"
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Explain why this is not a true duplicate..."
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleSubmit} disabled={!modalNote.trim()}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Escalate to Manager Dialog ────────────────────────────────────── */}
      <Dialog
        open={activeModal?.type === "escalate"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate to Manager</DialogTitle>
            <DialogDescription>
              Send this duplicate pair to a manager for final review.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="escalate-manager"
              className="text-xs font-medium text-muted-foreground"
            >
              Select manager
            </label>
            <Select
              value={selectedManager}
              onValueChange={(v) => setSelectedManager(v as string)}
            >
              <SelectTrigger id="escalate-manager" className="w-full">
                <SelectValue placeholder="Choose a manager..." />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="escalate-note"
              className="text-xs font-medium text-muted-foreground"
            >
              Note (optional)
            </label>
            <Textarea
              id="escalate-note"
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Add context for the manager..."
              className="min-h-20"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleSubmit} disabled={!selectedManager}>
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
