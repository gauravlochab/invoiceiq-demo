"use client";

// ─── SOM Analyst — Incoming Order Queue ──────────────────────────────────────
//
// Per docs/PLAN_SOM_DRUG_DISTRIBUTOR.md §5.2 + pharmacy_usecase_transcript.txt
// (Phase 6.2 — block/override). Lists incoming controlled-substance orders
// awaiting suspicious-order monitoring.
//
// Behaviour:
//   - For pharmacies with risk score ≥ 60 (Low/Medium): "Run checks" link
//     to the workflow runner.
//   - For pharmacies with risk score < 60 (High/Critical): system blocks
//     the order and shows "Override required" — clicking opens the override
//     modal which captures justification + approver, writes an audit log
//     entry, then transitions the row to "Released after override".

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert, Pill, MapPin, Clock, ArrowRight, ShieldCheck, AlertTriangle,
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
  const totalValue = sampleOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const controlledCount = sampleOrders.filter((o) => o.lineItems.some((l) => l.isControlled)).length;

  // SOM-derived metrics — all numbers below derive directly from the running
  // dataset (sampleOrders + somExceptions). No hardcoded fudges.
  const somExceptions = exceptions.filter((e) => e.type.startsWith("som_"));
  const somBlockedAmount = somExceptions.reduce((sum, e) => sum + e.flaggedAmount, 0);

  // Unique orders that have produced at least one SOM exception.
  const flaggedOrderIds = new Set(somExceptions.map((e) => e.invoiceNumber));
  const flaggedOrdersCount = flaggedOrderIds.size;

  const ordersInBatch = sampleOrders.length;
  const suspicionRate = ordersInBatch > 0
    ? ((flaggedOrdersCount / ordersInBatch) * 100).toFixed(0)
    : "0";

  // Map each order to its pharmacy's risk score for blocking logic.
  const ordersWithScore = useMemo(() => {
    return sampleOrders.map((order) => {
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

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Header */}
      <div className="px-8 pt-6 pb-5 border-b border-[#e5e7eb] bg-white">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldAlert className="w-4 h-4 text-[#0065cb]" />
          <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#0065cb]">
            Drug Distributor · SOM Analyst
          </span>
        </div>
        <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight m-0 mb-1">
          Suspicious Order Monitoring
        </h1>
        <p className="text-xs text-[#4b5563] m-0">
          Incoming orders pending verification — Address, License, Pricing, Pattern checks. High/Critical-risk pharmacies require override.
        </p>
      </div>

      {/* Stats strip — every number below derives from the actual queue + SOM exceptions */}
      <div className="px-8 py-4 grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-wide text-[#9ca3af] m-0">Orders in queue</p>
            <Activity className="w-3.5 h-3.5 text-[#9ca3af]" />
          </div>
          <p className="text-2xl font-semibold text-[#111827] m-0 tabular-nums">{ordersInBatch}</p>
          <p className="text-[10px] text-[#4b5563] m-0 mt-1">{controlledCount} with controlled substances</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-wide text-[#9ca3af] m-0">Auto-blocked</p>
            <Lock className="w-3.5 h-3.5 text-[#9ca3af]" />
          </div>
          <p className="text-2xl font-semibold text-red-600 m-0 tabular-nums">{blockedCount}</p>
          <p className="text-[10px] text-[#4b5563] m-0 mt-1">awaiting human override</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-wide text-[#9ca3af] m-0">Flagged this batch</p>
            <ShieldCheck className="w-3.5 h-3.5 text-[#9ca3af]" />
          </div>
          <p className="text-2xl font-semibold text-amber-700 m-0 tabular-nums">{suspicionRate}%</p>
          <p className="text-[10px] text-[#4b5563] m-0 mt-1">{flaggedOrdersCount} of {ordersInBatch} orders flagged</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-wide text-[#9ca3af] m-0">Blocked exposure</p>
            <DollarSign className="w-3.5 h-3.5 text-[#9ca3af]" />
          </div>
          <p className="text-2xl font-semibold text-red-600 m-0 tabular-nums">{formatCurrency(somBlockedAmount)}</p>
          <p className="text-[10px] text-[#4b5563] m-0 mt-1">across {somExceptions.length} SOM exceptions</p>
        </div>
      </div>

      {/* Orders table */}
      <div className="px-8 pb-8">
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#111827] m-0">Incoming orders</p>
            <span className="text-[11px] text-[#9ca3af]">High/Critical pharmacies require human override</span>
          </div>
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Order</th>
                <th>Pharmacy</th>
                <th>Location</th>
                <th>Score</th>
                <th>Lines</th>
                <th>Controlled</th>
                <th className="right">Value</th>
                <th>Received</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ordersWithScore.map(({ order, score, rating, blocked }) => {
                const hasControlled = order.lineItems.some((l) => l.isControlled);
                const overrideEntry = overriddenOrders[order.id];
                return (
                  <tr key={order.id} className={blocked && !overrideEntry ? "bg-red-50/40" : ""}>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono text-[#111827]">{order.id}</span>
                        {order.isFresh && !blocked && (
                          <span className="text-[9px] uppercase tracking-wide text-emerald-600 font-medium">
                            Fresh · just arrived
                          </span>
                        )}
                        {blocked && !overrideEntry && (
                          <span className="text-[9px] uppercase tracking-wide text-red-600 font-medium flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Auto-blocked
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Pill className="w-3 h-3 text-[#9ca3af]" />
                        <span className="text-xs font-medium text-[#111827]">{order.pharmacy.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#9ca3af]" />
                        <span className="text-xs text-[#4b5563]">
                          {order.pharmacy.city}, {order.pharmacy.state}
                        </span>
                      </div>
                    </td>
                    <td>
                      <ScoreCell score={score} rating={rating} />
                    </td>
                    <td className="text-xs text-[#4b5563] tabular-nums">{order.lineItems.length}</td>
                    <td>
                      {hasControlled ? (
                        <span className="badge warning">Yes</span>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">No</span>
                      )}
                    </td>
                    <td className="right text-xs tabular-nums font-medium text-[#111827]">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#9ca3af]" />
                        <span className="text-xs text-[#4b5563]">{formatTime(order.receivedAt)}</span>
                      </div>
                    </td>
                    <td>
                      <ActionCell
                        order={order}
                        score={score}
                        rating={rating}
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override modal */}
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
    </div>
  );
}

// ─── Score cell ───────────────────────────────────────────────────────────────

function ScoreCell({ score, rating }: { score: number; rating: string }) {
  const color =
    score < 30 ? "text-red-600"
    : score < 60 ? "text-amber-700"
    : score < 80 ? "text-blue-600"
    : "text-emerald-700";
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-xs font-semibold tabular-nums ${color}`}>{score}/100</span>
      <span className="text-[9px] uppercase tracking-wide text-[#9ca3af]">{rating}</span>
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
  score: number;
  rating: string;
  blocked: boolean;
  overrideEntry?: AuditLogEntry;
  onOverrideClick: () => void;
}) {
  if (overrideEntry) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold flex items-center gap-1">
          <FileCheck2 className="w-3 h-3" />
          Released after override
        </span>
        <Link
          href="/som/audit-log"
          className="text-[10px] text-[#0065cb] no-underline hover:underline"
        >
          View {overrideEntry.id} →
        </Link>
      </div>
    );
  }

  if (blocked) {
    return (
      <button
        onClick={onOverrideClick}
        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded border border-red-300 bg-white text-red-700 hover:bg-red-50 cursor-pointer"
      >
        <Lock className="w-3 h-3" />
        Override required
      </button>
    );
  }

  return (
    <Link
      href={`/som/order/${order.id}`}
      className="inline-flex items-center gap-1 text-xs text-[#0065cb] no-underline hover:underline"
    >
      Run checks
      <ArrowRight className="w-3 h-3" />
    </Link>
  );
}
