"use client";

// ─── Pharmacy Scoring (SOM) ──────────────────────────────────────────────────
//
// SOM analog of /vendor-scoring. Same UX language: sortable table, expandable
// rows showing each pharmacy's SOM exception history, flag/penalize/remove
// actions. Score derives from license + address + price + volume + identity
// (see lib/som/data/pharmacyScoring.ts for weights).
//
// [Spec: domains/som/spec.md#Page 4: Pharmacy Risk Scoring] — v2.0 shadcn
// migration: Card/Table/Badge/Button primitives, token-driven meters with
// role="progressbar", theme tokens, px-4 lg:px-6.

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert, ChevronDown, ChevronRight, AlertTriangle, Flag, XCircle,
  ArrowUpDown, MapPin, ScrollText, DollarSign, BarChart3, Fingerprint,
} from "lucide-react";
import { pharmacyScores, type PharmacyScore } from "@/lib/som/data/pharmacyScoring";
import { formatCurrency } from "@/lib/data";
import { useToast } from "@/components/Toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// [Spec: domains/som/spec.md#Business Rules — Score color mapping v2.0.1]
function scoreColor(score: number): string {
  if (score < 30) return "text-destructive-text";
  if (score < 60) return "text-warning-text";
  if (score < 80) return "text-primary";
  return "text-success-text";
}

// Meter fill — non-text element, uses the vivid --warning/--success fills.
function meterFill(value: number): string {
  if (value < 30) return "bg-destructive";
  if (value < 60) return "bg-warning";
  if (value < 80) return "bg-primary";
  return "bg-success";
}

function RatingBadge({ rating }: { rating: string }) {
  if (rating === "Critical") return <Badge variant="destructive">{rating}</Badge>;
  if (rating === "High Risk")
    return (
      <Badge className="border-warning bg-warning/10 text-warning-text">{rating}</Badge>
    );
  if (rating === "Medium Risk") return <Badge variant="secondary">{rating}</Badge>;
  return <Badge className="border-success bg-success/10 text-success-text">{rating}</Badge>;
}

function rowRiskBg(score: number): string {
  if (score < 60) return "bg-destructive/5";
  return "";
}

function flaggedColor(pct: number): string {
  if (pct > 25) return "text-destructive-text";
  if (pct > 5) return "text-warning-text";
  return "text-muted-foreground";
}

const exceptionTypeLabels: Record<string, string> = {
  som_address_mismatch: "Address Mismatch",
  som_license_invalid: "License Invalid",
  som_price_deviation: "Price Deviation",
  som_quantity_outlier: "Volume Outlier",
};

type SortKey = "score" | "flaggedPct" | "flaggedAmount" | "totalSpend" | null;

export default function PharmacyScoringPage() {
  const { showToast } = useToast();
  const [expandedPharmacy, setExpandedPharmacy] = useState<string | null>(null);
  const [flaggedPharmacies, setFlaggedPharmacies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");  // lower score = higher risk = top

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const sorted = [...pharmacyScores].sort((a, b) => {
    if (!sortKey) return a.score - b.score;
    const av = (a as unknown as Record<string, number>)[sortKey];
    const bv = (b as unknown as Record<string, number>)[sortKey];
    return sortDir === "desc" ? bv - av : av - bv;
  });

  const totalFlagged = sorted.reduce((s, v) => s + v.flaggedAmount, 0);
  const highRiskCount = sorted.filter((v) => v.score < 60).length;
  const avgScore = Math.round(sorted.reduce((s, v) => s + v.score, 0) / sorted.length);

  const handleAction = (id: string, action: string) => {
    setFlaggedPharmacies((prev) => ({ ...prev, [id]: action }));
    const verb =
      action === "flag" ? "Flagged for review"
      : action === "penalize" ? "Penalty applied"
      : "Removed from approved network";
    showToast(`${verb} — ${sorted.find((p) => p.id === id)?.name ?? id}`, action === "remove" ? "warning" : "info");
  };

  function handleSortClick(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      // Score sorts ascending (lowest first = highest risk top); $$ sorts desc.
      setSortDir(key === "score" ? "asc" : "desc");
    }
  }

  function ariaSortFor(key: SortKey): "ascending" | "descending" | "none" {
    if (sortKey !== key) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  // [Spec: domains/som/spec.md#Page 4 Layout — Summary Strip]
  const summary: { label: string; value: string; valueClass: string }[] = [
    { label: "Pharmacies Scored", value: String(sorted.length), valueClass: "text-foreground" },
    { label: "High / Critical Risk", value: String(highRiskCount), valueClass: "text-destructive-text" },
    { label: "Total Flagged $", value: formatCurrency(totalFlagged), valueClass: "text-warning-text" },
    { label: "Avg Risk Score", value: `${avgScore}/100`, valueClass: scoreColor(avgScore) },
  ];

  return (
    <main className="@container/main flex flex-1 flex-col">
      {/* Header — [Spec: domains/som/spec.md#Page 4 Layout] */}
      <div className="px-4 pt-6 pb-4 lg:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                Drug Distributor · SOM
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Pharmacy Risk Scoring
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Order-time risk across {sorted.length} pharmacies — license · address · price · volume · identity
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => showToast("Pharmacy risk report exported as PDF", "success")}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary strip — shadcn Card, 4 panels with divide-x */}
      <div className="px-4 py-4 lg:px-6">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Card className="py-0">
            <div className="flex flex-col divide-y divide-border @2xl/main:flex-row @2xl/main:divide-x @2xl/main:divide-y-0">
              {summary.map((s) => (
                <div key={s.label} className="flex-1 px-5 py-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`mt-1 text-2xl font-semibold tabular-nums ${s.valueClass}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Pharmacy table */}
      <div className="px-4 pb-6 lg:px-6">
        <Card className="py-0">
          <CardHeader className="border-b py-3.5">
            <CardTitle>
              <h2 className="font-[inherit] text-sm font-semibold">Scored pharmacies</h2>
            </CardTitle>
            <CardAction className="text-sm text-muted-foreground">
              Expand a row for the score breakdown
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Pharmacy</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead aria-sort={ariaSortFor("score")}>
                    <button
                      type="button"
                      onClick={() => handleSortClick("score")}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      Score
                      <ArrowUpDown
                        className={`size-3 ${sortKey === "score" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
                  </TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right" aria-sort={ariaSortFor("totalSpend")}>
                    <button
                      type="button"
                      onClick={() => handleSortClick("totalSpend")}
                      className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      Spend
                      <ArrowUpDown
                        className={`size-3 ${sortKey === "totalSpend" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="text-right" aria-sort={ariaSortFor("flaggedAmount")}>
                    <button
                      type="button"
                      onClick={() => handleSortClick("flaggedAmount")}
                      className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      Flagged $
                      <ArrowUpDown
                        className={`size-3 ${sortKey === "flaggedAmount" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="text-right" aria-sort={ariaSortFor("flaggedPct")}>
                    <button
                      type="button"
                      onClick={() => handleSortClick("flaggedPct")}
                      className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      Flagged %
                      <ArrowUpDown
                        className={`size-3 ${sortKey === "flaggedPct" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
                  </TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? [0, 1, 2, 3, 4].map((i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={9}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : sorted.map((p) => {
                      const expanded = expandedPharmacy === p.id;
                      const action = flaggedPharmacies[p.id];
                      return (
                        <ExpandablePharmacyRow
                          key={p.id}
                          pharmacy={p}
                          expanded={expanded}
                          onToggle={() => setExpandedPharmacy(expanded ? null : p.id)}
                          action={action}
                          onAction={handleAction}
                        />
                      );
                    })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// ─── Expandable row ──────────────────────────────────────────────────────────

function ExpandablePharmacyRow({
  pharmacy: p,
  expanded,
  onToggle,
  action,
  onAction,
}: {
  pharmacy: PharmacyScore;
  expanded: boolean;
  onToggle: () => void;
  action?: string;
  onAction: (id: string, kind: string) => void;
}) {
  return (
    <>
      <TableRow
        className={`group cursor-pointer ${rowRiskBg(p.score)}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <TableCell className="text-muted-foreground">
          {expanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{p.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{p.id}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {p.city}, {p.state}
            </span>
          </div>
        </TableCell>
        <TableCell className={`text-sm font-semibold tabular-nums ${scoreColor(p.score)}`}>
          {p.score}/100
        </TableCell>
        <TableCell>
          <RatingBadge rating={p.rating} />
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums text-foreground">
          {p.totalSpend > 0 ? formatCurrency(p.totalSpend) : "—"}
        </TableCell>
        <TableCell
          className={`text-right text-sm font-medium tabular-nums ${flaggedColor(p.flaggedPct)}`}
        >
          {p.flaggedAmount > 0 ? formatCurrency(p.flaggedAmount) : "—"}
        </TableCell>
        <TableCell
          className={`text-right text-sm font-medium tabular-nums ${flaggedColor(p.flaggedPct)}`}
        >
          {p.flaggedPct > 0 ? `${p.flaggedPct}%` : "—"}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          {action ? (
            <span
              className={`text-xs font-medium ${
                action === "flag" ? "text-warning-text" : "text-destructive-text"
              }`}
            >
              {action === "flag" ? "Flagged" : action === "penalize" ? "Penalised" : "Removed"}
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onAction(p.id, "flag")}
                aria-label={`Flag ${p.name} for review`}
                title="Flag for review"
              >
                <Flag />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => onAction(p.id, "penalize")}
                aria-label={`Apply penalty to ${p.name}`}
                title="Apply penalty"
              >
                <AlertTriangle />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => onAction(p.id, "remove")}
                aria-label={`Remove ${p.name} from approved network`}
                title="Remove from approved network"
              >
                <XCircle />
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded panel */}
      {expanded && (
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableCell colSpan={9} className="p-0">
            <div className="border-t border-border px-8 py-5">
              <div className="grid grid-cols-1 gap-6 @3xl/main:grid-cols-[260px_1fr]">
                {/* Score breakdown */}
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Score breakdown
                  </h3>
                  <Card>
                    <CardContent className="flex flex-col gap-2">
                      <ScoreBar icon={ScrollText} label="License (40%)" value={p.components.license} />
                      <ScoreBar icon={MapPin} label="Address (20%)" value={p.components.address} />
                      <ScoreBar icon={DollarSign} label="Price (15%)" value={p.components.price} />
                      <ScoreBar icon={BarChart3} label="Pattern (15%)" value={p.components.volume} />
                      <ScoreBar icon={Fingerprint} label="Identity (10%)" value={p.components.identity} />
                    </CardContent>
                  </Card>
                </div>

                {/* Exception history */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Exception history
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      {p.exceptions.length} exception{p.exceptions.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <Card className="max-h-[400px] overflow-y-auto py-0">
                    {p.exceptions.length === 0 ? (
                      <CardContent className="py-5 text-center">
                        <p className="text-xs text-muted-foreground">
                          No SOM exceptions on file
                        </p>
                      </CardContent>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Detected</TableHead>
                            <TableHead className="text-right">Flagged</TableHead>
                            <TableHead className="text-right">
                              <span className="sr-only">View</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {p.exceptions.map((ex) => (
                            <TableRow key={ex.id}>
                              <TableCell>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[11px] font-medium text-foreground">
                                    {exceptionTypeLabels[ex.type] || ex.type}
                                  </span>
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    {ex.id}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-[11px] text-muted-foreground">
                                {new Date(ex.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell className="text-right text-[11px] font-medium tabular-nums text-destructive-text">
                                {formatCurrency(ex.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link
                                  href={`/exceptions/${ex.id}`}
                                  className="text-[11px] text-primary no-underline hover:underline"
                                >
                                  View →
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Score bar (component contribution) ──────────────────────────────────────
// Token-driven meter with role="progressbar" + ARIA values per ui-standard.md.

function ScoreBar({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3 shrink-0 text-muted-foreground" />
      <span className="w-[110px] shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div
        role="progressbar"
        aria-label={`${label} score`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full rounded-full ${meterFill(value)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className={`w-[28px] text-right text-[10px] font-medium tabular-nums ${scoreColor(value)}`}>
        {value}
      </span>
    </div>
  );
}
