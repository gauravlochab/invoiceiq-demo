"use client";

// ─── SOM Analyst — Incoming Order Queue ──────────────────────────────────────
//
// Per docs/PLAN_SOM_DRUG_DISTRIBUTOR.md §5.2 + pharmacy_usecase_transcript.txt
// (Phase 6.2 — block/override). Lists incoming controlled-substance orders
// awaiting suspicious-order monitoring.
//
// Behaviour:
//   - For pharmacies with risk score >= 60 (Low/Medium): "Run checks" link
//     to the workflow runner.
//   - For pharmacies with risk score < 60 (High/Critical): system blocks
//     the order and shows "Override required" — clicking opens the override
//     modal which captures justification + approver, writes an audit log
//     entry, then transitions the row to "Released after override".
//
// [Spec: domains/som/spec.md#Page 1: SOM Queue Dashboard] — v2.0 shadcn
// migration: Card/Table/Badge/Button/Skeleton primitives, theme tokens,
// px-4 lg:px-6. SOM domain behavior (block threshold, override flow, DEA
// audit) is unchanged.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert, Pill, MapPin, Clock, ArrowRight, ShieldCheck,
  DollarSign, Activity, Lock, FileCheck2,
} from "lucide-react";
import { sampleOrders } from "@/lib/som/data/orders";
import { exceptions } from "@/lib/data";
import { pharmacyScores } from "@/lib/som/data/pharmacyScoring";
import {
  appendAuditEntry, type AuditLogEntry,
} from "@/lib/som/data/auditLog";
import { OverrideModal } from "@/components/OverrideModal";
import { useToast } from "@/components/Toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// Local alias — removes "sample" prefix per business directive
const orders = sampleOrders;

const BLOCK_THRESHOLD = 60;   // score < 60 → blocked, requires override

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function SomQueuePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const controlledCount = orders.filter((o) => o.lineItems.some((l) => l.isControlled)).length;

  // SOM-derived metrics — all numbers below derive directly from the running
  // dataset (orders + somExceptions). No hardcoded fudges.
  const somExceptions = exceptions.filter((e) => e.type.startsWith("som_"));
  const somBlockedAmount = somExceptions.reduce((sum, e) => sum + e.flaggedAmount, 0);

  // Unique orders that have produced at least one SOM exception.
  const flaggedOrderIds = new Set(somExceptions.map((e) => e.invoiceNumber));
  const flaggedOrdersCount = flaggedOrderIds.size;

  const ordersInBatch = orders.length;
  const suspicionRate = ordersInBatch > 0
    ? ((flaggedOrdersCount / ordersInBatch) * 100).toFixed(0)
    : "0";

  // Map each order to its pharmacy's risk score for blocking logic.
  const ordersWithScore = useMemo(() => {
    return orders.map((order) => {
      const score = pharmacyScores.find((s) => s.id === order.pharmacy.id);
      return {
        order,
        score: score?.score ?? 100,
        rating: score?.rating ?? "Low Risk",
        blocked: (score?.score ?? 100) < BLOCK_THRESHOLD,
      };
    });
  }, []);

  const blockedCount = ordersWithScore.filter((r) => r.blocked).length;

  // Track which orders the analyst has overridden in this session (component
  // state — refreshing the page rolls back to "blocked" since the modal-driven
  // entries live in module memory only).
  const [overriddenOrders, setOverriddenOrders] = useState<Record<string, AuditLogEntry>>({});

  // Override modal state
  const [modalOrder, setModalOrder] = useState<{
    orderId: string;
    pharmacyId: string;
    pharmacyName: string;
    score: number;
    rating: "Critical" | "High Risk" | "Medium Risk";
  } | null>(null);

  const handleOverrideSubmit = (data: {
    justification: string;
    approverName: string;
    approverRole: AuditLogEntry["approverRole"];
  }) => {
    if (!modalOrder) return;
    const entry = appendAuditEntry({
      orderId: modalOrder.orderId,
      pharmacyId: modalOrder.pharmacyId,
      pharmacyName: modalOrder.pharmacyName,
      scoreAtOverride: modalOrder.score,
      ratingAtOverride: modalOrder.rating,
      justification: data.justification,
      approverName: data.approverName,
      approverRole: data.approverRole,
    });
    setOverriddenOrders((prev) => ({ ...prev, [modalOrder.orderId]: entry }));
    setModalOrder(null);
    showToast(
      `Override recorded — ${data.approverName} (${data.approverRole}). See Audit Log.`,
      "warning",
    );
  };

  // [Spec: domains/som/spec.md#Page 1 Layout — Stats Strip]
  const stats: {
    label: string;
    value: string;
    valueClass: string;
    subtitle: string;
    Icon: typeof Activity;
  }[] = [
    {
      label: "Orders in queue",
      value: String(ordersInBatch),
      valueClass: "text-foreground",
      subtitle: `${controlledCount} controlled`,
      Icon: Activity,
    },
    {
      label: "Auto-blocked",
      value: String(blockedCount),
      valueClass: "text-destructive-text",
      subtitle: "awaiting human override",
      Icon: Lock,
    },
    {
      label: "Flagged this batch",
      value: `${suspicionRate}%`,
      valueClass: "text-warning-text",
      subtitle: `${flaggedOrdersCount} of ${ordersInBatch} flagged`,
      Icon: ShieldCheck,
    },
    {
      label: "Blocked exposure",
      value: formatCurrency(somBlockedAmount),
      valueClass: "text-destructive-text",
      subtitle: `${somExceptions.length} exceptions`,
      Icon: DollarSign,
    },
  ];

  return (
    <main className="@container/main flex flex-1 flex-col">
      {/* Header — [Spec: domains/som/spec.md#Page 1 Layout] */}
      <div className="border-b border-border px-4 pt-6 pb-4 lg:px-6">
        <div className="mb-1.5 flex items-center gap-2">
          <ShieldAlert className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            SOM Analyst
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Suspicious Order Monitoring
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Incoming orders pending verification. High/Critical-risk pharmacies require override.
        </p>
      </div>

      {/* Stats strip — container-query grid of 4 shadcn metric Cards */}
      <div className="grid grid-cols-1 gap-4 px-4 py-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
        {loading
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)
          : stats.map((s) => (
              <Card key={s.label} className="@container/card">
                <CardHeader>
                  <CardDescription>{s.label}</CardDescription>
                  <CardTitle
                    className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${s.valueClass}`}
                  >
                    <h2 className="font-[inherit]">{s.value}</h2>
                  </CardTitle>
                  <CardAction>
                    <s.Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </CardAction>
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground">
                  {s.subtitle}
                </CardFooter>
              </Card>
            ))}
      </div>

      {/* Orders table */}
      <div className="px-4 pb-6 lg:px-6">
        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <Card className="py-0">
            <CardHeader className="border-b py-3.5">
              <CardTitle>
                <h2 className="font-[inherit] text-sm font-semibold">Incoming orders</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Pharmacy</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Lines</TableHead>
                    <TableHead>Controlled</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersWithScore.map(({ order, score, rating, blocked }) => {
                    const hasControlled = order.lineItems.some((l) => l.isControlled);
                    const overrideEntry = overriddenOrders[order.id];
                    return (
                      <TableRow
                        key={order.id}
                        className={blocked && !overrideEntry ? "bg-destructive/5" : ""}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs text-foreground">
                              {order.id}
                            </span>
                            {order.isFresh && !blocked && (
                              <span className="text-[10px] font-medium uppercase tracking-wide text-success-text">
                                New
                              </span>
                            )}
                            {blocked && !overrideEntry && (
                              <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-destructive-text">
                                <Lock className="size-2.5" />
                                Auto-blocked
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Pill className="size-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {order.pharmacy.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {order.pharmacy.city}, {order.pharmacy.state}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ScoreCell score={score} rating={rating} />
                        </TableCell>
                        <TableCell className="text-sm tabular-nums text-muted-foreground">
                          {order.lineItems.length}
                        </TableCell>
                        <TableCell>
                          {hasControlled ? (
                            <Badge className="border-warning bg-warning/10 text-warning-text">
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums text-foreground">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="size-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatTime(order.receivedAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ActionCell
                            order={order}
                            blocked={blocked}
                            overrideEntry={overrideEntry}
                            onOverrideClick={() => setModalOrder({
                              orderId: order.id,
                              pharmacyId: order.pharmacy.id,
                              pharmacyName: order.pharmacy.name,
                              score,
                              rating: rating as "Critical" | "High Risk" | "Medium Risk",
                            })}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Override modal — shadcn Dialog via shared OverrideModal component */}
      {modalOrder && (
        <OverrideModal
          open={!!modalOrder}
          pharmacyName={modalOrder.pharmacyName}
          orderId={modalOrder.orderId}
          score={modalOrder.score}
          rating={modalOrder.rating}
          onClose={() => setModalOrder(null)}
          onSubmit={handleOverrideSubmit}
        />
      )}
    </main>
  );
}

// ─── Score cell ───────────────────────────────────────────────────────────────

// [Spec: domains/som/spec.md#Business Rules — Score color mapping v2.0.1]
function ScoreCell({ score, rating }: { score: number; rating: string }) {
  const color =
    score < 30 ? "text-destructive-text"
    : score < 60 ? "text-warning-text"
    : score < 80 ? "text-primary"
    : "text-success-text";
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-xs font-semibold tabular-nums ${color}`}>{score}/100</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {rating}
      </span>
    </div>
  );
}

// ─── Action cell ──────────────────────────────────────────────────────────────

function ActionCell({
  order,
  blocked,
  overrideEntry,
  onOverrideClick,
}: {
  order: { id: string };
  blocked: boolean;
  overrideEntry?: AuditLogEntry;
  onOverrideClick: () => void;
}) {
  if (overrideEntry) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-success-text">
          <FileCheck2 className="size-3" />
          Released after override
        </span>
        <Link
          href="/som/audit-log"
          className="text-[10px] text-primary no-underline hover:underline"
        >
          View {overrideEntry.id} →
        </Link>
      </div>
    );
  }

  if (blocked) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={onOverrideClick}
      >
        <Lock className="size-3" />
        Override required
      </Button>
    );
  }

  // "Run checks" navigates — a Link styled as a ghost Button. Base UI's
  // Button primitive warns when its render slot is a non-button element,
  // so the buttonVariants() class is applied to the Link directly.
  return (
    <Link
      href={`/som/order/${order.id}`}
      className={`${buttonVariants({ variant: "ghost", size: "sm" })} no-underline`}
    >
      Run checks
      <ArrowRight className="size-3" />
    </Link>
  );
}
