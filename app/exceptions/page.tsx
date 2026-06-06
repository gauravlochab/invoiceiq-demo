// [Spec: domains/exceptions/spec.md] — Exceptions list (work queue).
// v2.0 shadcn migration (cluster 1, 2026-05-22): off the v1 token set per the
// ui-standard.md v1→v2 map. Tabs/ToggleGroup/Table/Card/Badge/Dialog/Select/
// Input/Checkbox/DropdownMenu/Progress/Alert/Skeleton primitives. SOM rows
// excluded consistently via a single derived `apExceptions` set. aria-sort on
// sortable headers. Dark mode works.
"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, Search, FileSearch } from "lucide-react";
import {
  allExceptions,
  duplicatePairs,
  formatCurrency,
  formatDate,
  severityConfig,
  statusConfig,
  typeConfig,
  type DuplicatePair,
  type ExceptionType,
  type Severity,
  type Status,
} from "@/lib/data";
import { useToast } from "@/components/Toast";
import { CategoryBadge } from "@/components/CategoryBadge";
import { VendorBadge } from "@/components/VendorBadge";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { EmptyState } from "@/components/EmptyState";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ─── EXCEPTION TABLE HELPERS ─────────────────────────────────────────────────

// AP-only exception set — SOM rows excluded once, here, so the header subtitle,
// tab count, filter-chip counts, and table rows never disagree.
// [Spec: domains/exceptions/spec.md#Acceptance Criteria — View toggle]
const apExceptions = allExceptions.filter((e) => !e.type.startsWith("som_"));

type FilterKey =
  | "all"
  | "open"
  | "critical"
  | "high"
  | "duplicate"
  | "match_exception";

// Filter-chip counts derive from `apExceptions[]` so they stay correct as the
// underlying data changes.
const counts = {
  all: apExceptions.length,
  open: apExceptions.filter((e) => e.status === "open" || e.status === "under_review" || e.status === "escalated").length,
  critical: apExceptions.filter((e) => e.severity === "critical").length,
  high: apExceptions.filter((e) => e.severity === "high").length,
  duplicate: apExceptions.filter((e) => e.type === "duplicate").length,
  match_exception: apExceptions.filter((e) => e.type === "match_exception").length,
};

const filterOptions: { key: FilterKey; label: string; count: number }[] = [
  { key: "all", label: "All", count: counts.all },
  { key: "open", label: "Open", count: counts.open },
  { key: "critical", label: "Critical", count: counts.critical },
  { key: "high", label: "High", count: counts.high },
  { key: "duplicate", label: "Duplicate", count: counts.duplicate },
  { key: "match_exception", label: "Match Exception", count: counts.match_exception },
];

// [Spec: domains/dashboard/spec.md#Dependencies — pre-filtered drill-through]
// Dashboard KPIs link here with a filter param (e.g. /exceptions?severity=critical).
function filterFromParams(params: URLSearchParams): FilterKey {
  const severity = params.get("severity");
  const status = params.get("status");
  const type = params.get("type");
  if (severity === "critical" || severity === "high") return severity;
  if (status === "open") return "open";
  if (type === "duplicate" || type === "match_exception") return type;
  return "all";
}

function applyFilter(filter: FilterKey) {
  switch (filter) {
    case "open":
      return apExceptions.filter(
        (e) =>
          e.status === "open" ||
          e.status === "under_review" ||
          e.status === "escalated"
      );
    case "critical":
      return apExceptions.filter((e) => e.severity === "critical");
    case "high":
      return apExceptions.filter((e) => e.severity === "high");
    case "duplicate":
      return apExceptions.filter((e) => e.type === "duplicate");
    case "match_exception":
      return apExceptions.filter((e) => e.type === "match_exception");
    default:
      return apExceptions;
  }
}

// Type badge — shadcn Badge variant. [Spec: domains/exceptions/spec.md#Business Rules]
function typeBadgeVariant(type: ExceptionType): "destructive" | "outline" | "secondary" {
  if (type === "suspicious_invoice" || type === "contract_overage") return "destructive";
  if (type === "duplicate" || type === "tier_pricing") return "outline";
  return "secondary";
}

// Status badge — shadcn Badge variant. Resolved uses a custom success class.
function statusBadgeVariant(status: Status): "destructive" | "outline" | "secondary" | "success" {
  if (status === "open") return "destructive";
  if (status === "under_review") return "secondary";
  if (status === "escalated") return "outline";
  return "success"; // resolved
}

function StatusBadge({ status }: { status: Status }) {
  const variant = statusBadgeVariant(status);
  if (variant === "success") {
    return (
      <Badge className="border-success bg-success/10 text-success-text">
        {statusConfig[status].label}
      </Badge>
    );
  }
  return <Badge variant={variant}>{statusConfig[status].label}</Badge>;
}

// Severity dot — vivid token fill (non-text, AA 3:1).
function severityDotClass(severity: Severity): string {
  if (severity === "critical") return "bg-destructive";
  if (severity === "high") return "bg-destructive/60";
  if (severity === "medium") return "bg-warning";
  return "bg-border";
}

// Flagged-amount text — AA-safe *-text tokens.
// [Spec: domains/exceptions/spec.md#Acceptance Criteria — Data table]
function flaggedAmountClass(severity: Severity): string {
  if (severity === "critical" || severity === "high") return "text-destructive-text";
  if (severity === "medium") return "text-warning-text";
  return "text-foreground";
}

// ─── DUPLICATE VIEW HELPERS ──────────────────────────────────────────────────

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

// Similarity bar — shadcn Progress. >=99% uses --destructive fill, else --warning.
// [Spec: domains/exceptions/spec.md#Business Rules — Similarity bar color]
function SimilarityBar({ score }: { score: number }) {
  const high = score >= 99;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Similarity
      </span>
      <Progress value={Math.min(score, 100)} className="w-32">
        <ProgressTrack className="h-1.5">
          <ProgressIndicator className={high ? "bg-destructive" : "bg-warning"} />
        </ProgressTrack>
      </Progress>
      <span className={`text-[13px] font-medium ${high ? "text-destructive-text" : "text-warning-text"}`}>
        {score}%
      </span>
      <span className="text-[13px] text-border">|</span>
    </div>
  );
}

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

  function renderActions() {
    if (pair.status === "resolved") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success-text">
          Resolved — {formatCurrency(pair.flaggedAmount)} saved
        </span>
      );
    }

    if (pairActions[pair.id]) {
      const action = pairActions[pair.id];
      const cls =
        action === "reject"
          ? "border-destructive bg-destructive/10 text-destructive-text"
          : action === "override"
            ? "border-success bg-success/10 text-success-text"
            : "border-border bg-muted text-foreground";
      return (
        <div className={`rounded-md border px-3 py-2 text-center text-xs font-medium ${cls}`}>
          {action === "reject"
            ? "Rejected"
            : action === "override"
              ? "Approved with Override"
              : "Escalated to Manager"}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
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
    <Card className="card-elevated mb-4 gap-0 py-0">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-border px-5 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <VendorBadge name={pair.vendor} size="md" />
          {/* h3 — gives screen-reader heading navigation a target per spec */}
          <h3 className="ml-1 m-0 text-[11px] font-normal text-muted-foreground">
            {pair.id}
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium tabular-nums text-foreground">
            {formatCurrency(pair.flaggedAmount)}
          </span>
          <StatusBadge status={pair.status as Status} />
        </div>
      </div>

      {/* Similarity score row */}
      <div className="flex items-center gap-3 border-b border-border bg-muted px-5 py-2">
        <SimilarityBar score={pair.similarity} />
        <span className="text-xs text-muted-foreground">
          {pair.amountDelta > 0
            ? `Δ ${formatCurrency(pair.amountDelta)} · ${pair.daysDelta} days apart`
            : `${pair.daysDelta} days apart · no amount delta`}
        </span>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start px-5 py-4">
        {/* Invoice A */}
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Invoice A
          </div>
          <div className="font-mono text-xs font-medium text-foreground">
            {pair.invoice1.number}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {formatDate(pair.invoice1.date)}
          </div>
          <div className="mt-1 text-base font-semibold tabular-nums text-foreground">
            {formatCurrency(pair.invoice1.amount)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {pair.invoice1.submittedVia}
          </div>
        </div>

        {/* Center divider */}
        <div className="mx-8 w-px self-stretch bg-border" />

        {/* Invoice B */}
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Invoice B
          </div>
          <div className="font-mono text-xs font-medium text-foreground">
            {pair.invoice2.number}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {formatDate(pair.invoice2.date)}
          </div>
          <div className="mt-1 text-base font-semibold tabular-nums text-foreground">
            {formatCurrency(pair.invoice2.amount)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {pair.invoice2.submittedVia}
          </div>
        </div>
      </div>

      {/* AI analysis */}
      {analysis.length > 0 && (
        <div className="px-5 pb-4">
          <div className="rounded-md border border-border bg-muted px-4 py-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Analysis
            </div>
            <div className="flex flex-col gap-1.5">
              {analysis.map((line, i) => (
                <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="shrink-0 text-muted-foreground">&ndash;</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 pb-4">{renderActions()}</div>
    </Card>
  );
}

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────

const steps = [
  {
    step: "STEP 1",
    name: "Ingest",
    desc: "Ingests invoices from all channels",
  },
  {
    step: "STEP 2",
    name: "Vectorize",
    desc: "Converts fields to similarity vectors",
  },
  {
    step: "STEP 3",
    name: "Flag",
    desc: "Flags pairs above 97% similarity",
  },
];

function HowItWorks() {
  return (
    <Card className="card-elevated mb-6 flex-row items-center gap-0 px-6 py-4">
      {steps.map((s, i) => (
        <div key={s.step} className="flex min-w-0 flex-1 items-center">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {s.step}
            </div>
            <div className="mt-0.5 text-[13px] font-medium text-foreground">
              {s.name}
            </div>
            <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {s.desc}
            </div>
          </div>
          {i < steps.length - 1 && (
            <span className="mx-6 shrink-0 text-lg text-border">&rarr;</span>
          )}
        </div>
      ))}
    </Card>
  );
}

// ─── MANAGERS LIST ───────────────────────────────────────────────────────────

const managers = [
  "David Kim",
  "Lisa Rodriguez",
  "Michael Chang",
  "Jennifer Walsh",
];

type SortKey = "flaggedAmount" | "severity" | "category" | null;

// ─── PAGE ────────────────────────────────────────────────────────────────────

function ExceptionsPageInner() {
  const { showToast } = useToast();

  // [Spec: domains/dashboard/spec.md#Dependencies — pre-filtered drill-through]
  const searchParams = useSearchParams();

  // Exception list state
  const [activeFilter, setActiveFilter] = useState<FilterKey>(() =>
    filterFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [vendorFilter, setVendorFilter] = useState<string>("all");

  // Table search
  const [tableSearch, setTableSearch] = useState("");

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Get unique vendors
  const vendors = Array.from(new Set(apExceptions.map((e) => e.vendor))).sort();

  // Apply both filters
  const filtered = applyFilter(activeFilter).filter(
    (e) => vendorFilter === "all" || e.vendor === vendorFilter
  );

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const searchedExceptions = useMemo(() => {
    if (!tableSearch.trim()) return filtered;
    const q = tableSearch.toLowerCase();
    return filtered.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.vendor.toLowerCase().includes(q) ||
        e.invoiceNumber.toLowerCase().includes(q) ||
        typeConfig[e.type].label.toLowerCase().includes(q)
    );
  }, [filtered, tableSearch]);

  const sortedExceptions = useMemo(() => {
    return [...searchedExceptions].sort((a, b) => {
      if (!sortKey) return 0;
      if (sortKey === "flaggedAmount") {
        return sortDir === "desc" ? b.flaggedAmount - a.flaggedAmount : a.flaggedAmount - b.flaggedAmount;
      }
      if (sortKey === "severity") {
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        const diff = order[a.severity] - order[b.severity];
        return sortDir === "desc" ? diff : -diff;
      }
      if (sortKey === "category") {
        const cmp = (a.category || "").localeCompare(b.category || "");
        return sortDir === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  }, [searchedExceptions, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sortedExceptions.length / pageSize));
  // Clamp during render so a filter/search change that shrinks the result set
  // never strands the view on an out-of-range page.
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const paginatedExceptions = sortedExceptions.slice(
    safePageIndex * pageSize,
    (safePageIndex + 1) * pageSize
  );

  // View toggle state
  const [viewMode, setViewMode] = useState<"list" | "duplicates">("list");

  // Duplicate modal state
  const [activeModal, setActiveModal] = useState<{
    type: "reject" | "override" | "escalate";
    pairId: string;
  } | null>(null);
  const [modalNote, setModalNote] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [pairActions, setPairActions] = useState<Record<string, string>>({});

  // Header button state
  const [selectedExceptions, setSelectedExceptions] = useState<string[]>([]);

  // Simulated loading state
  const [loading, setLoading] = useState(true);

  // aria-sort header helper.
  // [Spec: domains/exceptions/spec.md#Acceptance Criteria — Data table]
  function ariaSortFor(key: Exclude<SortKey, null>): "ascending" | "descending" | "none" {
    if (sortKey !== key) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  function handleSort(key: Exclude<SortKey, null>) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "category" ? "asc" : "desc");
    }
    setPageIndex(0);
  }

  // Plain function — the React Compiler memoizes automatically.
  const closeModal = () => {
    setActiveModal(null);
    setModalNote("");
    setSelectedManager("");
  };

  // Simulated loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  function handleSubmit() {
    if (!activeModal) return;
    setPairActions((prev) => ({
      ...prev,
      [activeModal.pairId]: activeModal.type,
    }));
    showToast(
      `Duplicate ${activeModal.pairId} — ${activeModal.type === "reject" ? "invoice rejected per analyst review" : activeModal.type === "override" ? "approved with documented override" : "escalated for managerial review"}`,
      activeModal.type === "reject" ? "warning" : "success"
    );
    closeModal();
  }

  const allSelected =
    selectedExceptions.length === paginatedExceptions.length && paginatedExceptions.length > 0;
  const someSelected =
    selectedExceptions.length > 0 && selectedExceptions.length < paginatedExceptions.length;

  const duplicateAtRisk = formatCurrency(
    duplicatePairs
      .filter((p) => p.status !== "resolved")
      .reduce((s, p) => s + p.flaggedAmount, 0)
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Page header */}
      {/* [Spec: domains/exceptions/spec.md#Layout — Header] */}
      <div className="px-4 pt-10 pb-2 lg:px-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block h-0.5 w-6 rounded-full" style={{ background: 'var(--agent-validation)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Validation Agent
              </span>
            </div>
            <h1 className="m-0 text-2xl font-semibold leading-tight text-foreground" style={{ letterSpacing: '-0.03em' }}>
              Exceptions
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {apExceptions.length} exceptions · {duplicatePairs.length} duplicates · Q1 2026
            </p>
          </div>
          <div className="flex gap-2">
            {/* Assign — shadcn DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    Assign{selectedExceptions.length > 0 ? ` (${selectedExceptions.length})` : ""}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Assign to:</DropdownMenuLabel>
                {managers.map((name) => (
                  <DropdownMenuItem
                    key={name}
                    onClick={() => {
                      showToast(
                        `${selectedExceptions.length || "All"} exception(s) assigned to ${name} for review`,
                        "success"
                      );
                      setSelectedExceptions([]);
                    }}
                  >
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export — shadcn DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                {["Export as PDF", "Export as CSV", "Email to Stakeholder"].map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => showToast(`${opt} — report generated successfully`, "success")}
                  >
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <hr className="mt-4 border-border" />

      {/* Summary KPI cards */}
      <div className="animate-stagger-in grid grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 lg:px-6">
        <Card className="card-elevated gap-0 px-4 py-3">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Open</p>
          <p className="m-0 mt-1 text-xl font-bold tabular-nums text-destructive-text">{counts.open}</p>
        </Card>
        <Card className="card-elevated gap-0 px-4 py-3">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Critical</p>
          <p className="m-0 mt-1 text-xl font-bold tabular-nums text-destructive-text">{counts.critical}</p>
        </Card>
        <Card className="card-elevated gap-0 px-4 py-3">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duplicates</p>
          <p className="m-0 mt-1 text-xl font-bold tabular-nums text-warning-text">{counts.duplicate}</p>
          <p className="m-0 mt-0.5 text-[10px] text-muted-foreground">{duplicateAtRisk} at risk</p>
        </Card>
        <Card className="card-elevated gap-0 px-4 py-3">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="m-0 mt-1 text-xl font-bold tabular-nums">{counts.all}</p>
        </Card>
      </div>

      {/* View toggle tabs */}
      {/* [Spec: domains/exceptions/spec.md#Layout — View Toggle] */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "list" | "duplicates")}
        className="gap-0"
      >
        <div className="px-4 pt-3 lg:px-6">
          <TabsList>
            <TabsTrigger value="list">
              Exceptions ({apExceptions.length})
            </TabsTrigger>
            <TabsTrigger value="duplicates">
              Duplicates ({duplicatePairs.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── LIST VIEW ──────────────────────────────────────────────────────── */}
        <TabsContent value="list">
          {/* Filter row */}
          {/* [Spec: domains/exceptions/spec.md#Layout — Filter Row] */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
            {/* Single-select filter: base-ui ToggleGroup is array-valued; we
                keep exactly one chip pressed and ignore empty deselection so
                the queue is never unfiltered. */}
            <ToggleGroup
              value={[activeFilter]}
              onValueChange={(v) => {
                const next = v.find((k) => k !== activeFilter) ?? activeFilter;
                setActiveFilter(next as FilterKey);
                setPageIndex(0);
              }}
              variant="outline"
              size="sm"
            >
              {filterOptions.map((f) => (
                <ToggleGroupItem
                  key={f.key}
                  value={f.key}
                  className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                >
                  {f.label}
                  <Badge variant="secondary" className="ml-1">
                    {f.count}
                  </Badge>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {/* Vendor filter — shadcn Select */}
            <Select
              value={vendorFilter}
              onValueChange={(v) => {
                setVendorFilter(v as string);
                setPageIndex(0);
              }}
            >
              <SelectTrigger size="sm" className="w-44">
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table search bar */}
          {/* [Spec: domains/exceptions/spec.md#Layout — Search Bar] */}
          <div className="px-4 pb-4 lg:px-6">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setPageIndex(0);
                }}
                placeholder="Search exceptions..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          {/* [Spec: domains/exceptions/spec.md#Layout — Data Table] */}
          <div className="px-4 pb-10 lg:px-6">
            <Card className="card-elevated py-0">
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedExceptions(paginatedExceptions.map((ex) => ex.id));
                            } else {
                              setSelectedExceptions([]);
                            }
                          }}
                          aria-label="Select all rows"
                        />
                      </TableHead>
                      <TableHead>Exception</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead aria-sort={ariaSortFor("category")}>
                        <button
                          type="button"
                          onClick={() => handleSort("category")}
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                        >
                          Category
                          <ArrowUpDown
                            className={`size-3 ${sortKey === "category" ? "text-primary" : "text-muted-foreground"}`}
                          />
                        </button>
                      </TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right" aria-sort={ariaSortFor("flaggedAmount")}>
                        <button
                          type="button"
                          onClick={() => handleSort("flaggedAmount")}
                          className="inline-flex flex-row-reverse items-center gap-1 transition-colors hover:text-foreground"
                        >
                          Flagged
                          <ArrowUpDown
                            className={`size-3 ${sortKey === "flaggedAmount" ? "text-primary" : "text-muted-foreground"}`}
                          />
                        </button>
                      </TableHead>
                      <TableHead aria-sort={ariaSortFor("severity")}>
                        <button
                          type="button"
                          onClick={() => handleSort("severity")}
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                        >
                          Severity
                          <ArrowUpDown
                            className={`size-3 ${sortKey === "severity" ? "text-primary" : "text-muted-foreground"}`}
                          />
                        </button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <span className="sr-only">Review</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <>
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                          <TableRow key={i}>
                            <TableCell className="w-8"><Skeleton className="size-3.5 rounded" /></TableCell>
                            <TableCell>
                              <Skeleton className="mb-1.5 h-3 w-12 rounded" />
                              <Skeleton className="h-2.5 w-20 rounded" />
                            </TableCell>
                            <TableCell><Skeleton className="h-5 w-24 rounded" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28 rounded" /></TableCell>
                            <TableCell><Skeleton className="h-3.5 w-28 rounded" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="ml-auto h-3.5 w-16 rounded" /></TableCell>
                            <TableCell><Skeleton className="h-3.5 w-16 rounded" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20 rounded" /></TableCell>
                            <TableCell><Skeleton className="h-3.5 w-14 rounded" /></TableCell>
                          </TableRow>
                        ))}
                      </>
                    ) : (
                      <>
                        {paginatedExceptions.map((ex) => (
                          <TableRow key={ex.id} className="group transition-colors hover:bg-accent/50">
                            {/* CHECKBOX */}
                            <TableCell className="w-8">
                              <Checkbox
                                checked={selectedExceptions.includes(ex.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedExceptions((prev) => [...prev, ex.id]);
                                  } else {
                                    setSelectedExceptions((prev) => prev.filter((id) => id !== ex.id));
                                  }
                                }}
                                aria-label={`Select ${ex.id}`}
                              />
                            </TableCell>
                            {/* EXCEPTION */}
                            <TableCell>
                              <span className="block font-mono text-[11px] leading-snug text-muted-foreground">
                                {ex.id}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {ex.invoiceNumber}
                              </span>
                            </TableCell>

                            {/* TYPE */}
                            <TableCell>
                              <Badge variant={typeBadgeVariant(ex.type)}>
                                {typeConfig[ex.type].label}
                              </Badge>
                            </TableCell>

                            {/* CATEGORY */}
                            <TableCell>
                              {ex.category && <CategoryBadge category={ex.category} />}
                            </TableCell>

                            {/* VENDOR */}
                            <TableCell>
                              <VendorBadge name={ex.vendor} size="sm" />
                            </TableCell>

                            {/* FLAGGED */}
                            <TableCell
                              className={`text-right text-[13px] font-medium tabular-nums ${flaggedAmountClass(ex.severity)}`}
                            >
                              {formatCurrency(ex.flaggedAmount)}
                            </TableCell>

                            {/* SEVERITY */}
                            <TableCell>
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className={`size-2 shrink-0 rounded-full ${severityDotClass(ex.severity)} ${ex.severity === "critical" ? "dot-pulse" : ""}`}
                                />
                                <span className={`text-xs ${ex.severity === "critical" ? "font-semibold text-destructive-text" : ex.severity === "high" ? "font-medium text-foreground" : "text-foreground"}`}>
                                  {severityConfig[ex.severity].label}
                                </span>
                              </span>
                            </TableCell>

                            {/* STATUS */}
                            <TableCell>
                              <StatusBadge status={ex.status} />
                            </TableCell>

                            {/* ACTION */}
                            <TableCell>
                              {/* [Spec: rules/ui-standard.md#Touch Targets] — extend hit area */}
                              <Link
                                href={`/exceptions/${ex.id}`}
                                className="inline-flex items-center whitespace-nowrap -my-3 -mx-2 px-2 py-3 text-xs text-muted-foreground no-underline transition-all hover:underline group-hover:text-primary group-hover:translate-x-0.5"
                              >
                                Review &rarr;
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}

                        {paginatedExceptions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9}>
                              <EmptyState
                                icon={FileSearch}
                                title="No exceptions match"
                                description=""
                                action={{
                                  label: "Clear filter",
                                  onClick: () => {
                                    setActiveFilter("all");
                                    setVendorFilter("all");
                                    setTableSearch("");
                                  },
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
                <DataTablePagination
                  pageIndex={safePageIndex}
                  pageCount={pageCount}
                  pageSize={pageSize}
                  totalRows={sortedExceptions.length}
                  onPageChange={setPageIndex}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPageIndex(0);
                  }}
                  selectedCount={selectedExceptions.length}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── DUPLICATES VIEW ────────────────────────────────────────────────── */}
        {/* [Spec: domains/exceptions/spec.md#Layout — Duplicates View] */}
        <TabsContent value="duplicates">
          <div className="px-4 py-4 lg:px-6">
            <p className="mb-4 text-sm text-muted-foreground">
              1,847 invoices scanned &middot; {duplicatePairs.length} pairs flagged &middot;{" "}
              {duplicateAtRisk} at risk
            </p>

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
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Action Modals — shadcn Dialog ──────────────────────────────────── */}
      {/* [Spec: domains/exceptions/spec.md#Layout — Action Modals] */}
      <Dialog
        open={activeModal !== null}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        {activeModal?.type === "reject" && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Duplicate Invoice</DialogTitle>
              <DialogDescription>
                Blocks this invoice from payment.
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
                className="h-24 resize-none"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Cancel
              </DialogClose>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSubmit}
                disabled={!modalNote.trim()}
              >
                Reject Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        )}

        {activeModal?.type === "override" && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve with Override</DialogTitle>
              <DialogDescription>
                Approve despite duplicate flag.
              </DialogDescription>
            </DialogHeader>
            <Alert className="border-warning bg-warning/10">
              <AlertDescription className="text-warning-text">
                Override will be logged for audit.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="override-justification"
                className="text-xs font-medium text-muted-foreground"
              >
                Justification for override
              </label>
              <Textarea
                id="override-justification"
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Explain why this is not a true duplicate..."
                className="h-24 resize-none"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Cancel
              </DialogClose>
              <Button size="sm" onClick={handleSubmit} disabled={!modalNote.trim()}>
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        )}

        {activeModal?.type === "escalate" && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escalate to Manager</DialogTitle>
              <DialogDescription>
                Routes to a manager for review.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Select manager
              </label>
              <Select value={selectedManager} onValueChange={(v) => setSelectedManager(v as string)}>
                <SelectTrigger className="w-full">
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
                className="h-20 resize-none"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Cancel
              </DialogClose>
              <Button size="sm" onClick={handleSubmit} disabled={!selectedManager}>
                Escalate
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}

// useSearchParams() requires a Suspense boundary in the App Router.
export default function ExceptionsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 pt-8 text-sm text-muted-foreground lg:px-6">
          Loading exceptions…
        </div>
      }
    >
      <ExceptionsPageInner />
    </Suspense>
  );
}
