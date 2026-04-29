"use client";

// ─── SOM Analyst — Incoming Order Queue ──────────────────────────────────────
// Per docs/PLAN_SOM_DRUG_DISTRIBUTOR.md §5.2. Lists incoming controlled-
// substance orders awaiting suspicious-order monitoring. Click an order to
// open the workflow runner.

import Link from "next/link";
import { ShieldAlert, Pill, MapPin, Clock, ArrowRight, ShieldCheck, AlertTriangle, DollarSign, Activity } from "lucide-react";
import { sampleOrders } from "@/lib/som/data/orders";
import { exceptions } from "@/lib/data";

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
  const totalValue = sampleOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const controlledCount = sampleOrders.filter((o) => o.lineItems.some((l) => l.isControlled)).length;

  // SOM-derived metrics — all numbers below derive directly from the running
  // dataset (sampleOrders + somExceptions). No hardcoded fudges.
  const somExceptions = exceptions.filter((e) => e.type.startsWith("som_"));
  const somBlockedAmount = somExceptions.reduce((sum, e) => sum + e.flaggedAmount, 0);

  // Unique orders that have produced at least one SOM exception.
  // (Two SOM exceptions can fire against the same order — e.g. price + volume
  // on Westside ORD-1004 — so we deduplicate by invoiceNumber.)
  const flaggedOrderIds = new Set(somExceptions.map((e) => e.invoiceNumber));
  const flaggedOrdersCount = flaggedOrderIds.size;

  const ordersInBatch = sampleOrders.length;
  const suspicionRate = ordersInBatch > 0
    ? ((flaggedOrdersCount / ordersInBatch) * 100).toFixed(0)
    : "0";

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
          Incoming controlled-substance orders pending verification — Address, License, Pricing, Volume
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

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-wide text-[#9ca3af] m-0">Total order value</p>
            <AlertTriangle className="w-3.5 h-3.5 text-[#9ca3af]" />
          </div>
          <p className="text-2xl font-semibold text-[#111827] m-0 tabular-nums">{formatCurrency(totalValue)}</p>
          <p className="text-[10px] text-[#4b5563] m-0 mt-1">awaiting analyst review</p>
        </div>
      </div>

      {/* Orders table */}
      <div className="px-8 pb-8">
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#111827] m-0">Incoming orders</p>
            <span className="text-[11px] text-[#9ca3af]">Tap a row to run SOM workflow</span>
          </div>
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Order</th>
                <th>Pharmacy</th>
                <th>Location</th>
                <th>Lines</th>
                <th>Controlled</th>
                <th className="right">Value</th>
                <th>Received</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sampleOrders.map((order) => {
                const hasControlled = order.lineItems.some((l) => l.isControlled);
                return (
                  <tr key={order.id}>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono text-[#111827]">{order.id}</span>
                        {order.isFresh && (
                          <span className="text-[9px] uppercase tracking-wide text-emerald-600 font-medium">
                            Fresh · just arrived
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
                      <Link
                        href={`/som/order/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[#0065cb] no-underline hover:underline"
                      >
                        Run checks
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
