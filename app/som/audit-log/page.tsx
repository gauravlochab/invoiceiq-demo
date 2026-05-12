"use client";

// ─── SOM Audit Log ────────────────────────────────────────────────────────────
//
// Records every analyst override of a suspicious-order block. Per Rajesh's
// pharmacy_usecase_transcript.txt t=12:33, this is the compliance trail the
// customer needs to demonstrate due diligence to regulators when releasing
// orders that the system flagged as suspicious.
//
// Data is module-level + seeded — refreshing won't lose entries, but new
// entries added via override modal will reset on hard reload. This is a
// demo limitation; production would persist to DB.

import { useEffect, useState } from "react";
import { ShieldAlert, FileCheck2, User, Clock } from "lucide-react";
import { getAuditLog, type AuditLogEntry } from "@/lib/som/data/auditLog";

function severityColor(rating: string): string {
  if (rating === "Critical") return "text-red-600";
  if (rating === "High Risk") return "text-amber-700";
  return "text-blue-600";
}

function severityBadge(rating: string): string {
  if (rating === "Critical") return "badge critical";
  if (rating === "High Risk") return "badge warning";
  return "badge neutral";
}

function roleColor(role: string): string {
  if (role === "Head of Procurement") return "text-[#0065cb]";
  if (role === "Compliance Manager") return "text-emerald-700";
  if (role === "Pharmacy Director") return "text-amber-700";
  return "text-[#4b5563]";
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AuditLogPage() {
  // Re-read on every mount so newly-added entries from the override modal
  // appear when the analyst navigates back here.
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  useEffect(() => {
    setEntries(getAuditLog());
  }, []);

  const totalReleased = entries.length;
  const totalAtCritical = entries.filter((e) => e.ratingAtOverride === "Critical").length;
  const uniquePharmacies = new Set(entries.map((e) => e.pharmacyId)).size;
  const uniqueApprovers = new Set(entries.map((e) => e.approverName)).size;

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FileCheck2 className="w-4 h-4 text-[#0065cb]" />
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#0065cb]">
                Drug Distributor · Compliance Trail
              </span>
            </div>
            <h1 className="text-xl font-semibold text-[#111827] tracking-tight leading-tight m-0">
              Override Audit Log
            </h1>
            <p className="text-xs text-[#4b5563] mt-1 m-0">
              Every analyst decision to release a system-blocked order, with full justification.
            </p>
          </div>
        </div>
      </div>

      <hr className="border-[#e5e7eb] m-0" />

      {/* Summary strip */}
      <div className="px-8 py-6">
        <div className="flex border border-[#e5e7eb] rounded-lg bg-white">
          <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
            <p className="section-label">Total overrides</p>
            <p className="text-2xl font-bold text-[#111827] mt-1 m-0">{totalReleased}</p>
          </div>
          <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
            <p className="section-label">Released at Critical</p>
            <p className="text-2xl font-bold text-red-600 mt-1 m-0">{totalAtCritical}</p>
          </div>
          <div className="flex-1 px-6 py-4 border-r border-[#e5e7eb]">
            <p className="section-label">Unique pharmacies</p>
            <p className="text-2xl font-bold text-[#111827] mt-1 m-0">{uniquePharmacies}</p>
          </div>
          <div className="flex-1 px-6 py-4">
            <p className="section-label">Unique approvers</p>
            <p className="text-2xl font-bold text-[#111827] mt-1 m-0">{uniqueApprovers}</p>
          </div>
        </div>
      </div>

      {/* Entries — card list, full justification visible */}
      <div className="px-8 pb-8 flex flex-col gap-3">
        {entries.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-xs text-[#9ca3af] m-0">No override entries yet.</p>
          </div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] text-[#9ca3af]">{e.id}</span>
                    <span className={severityBadge(e.ratingAtOverride)}>{e.ratingAtOverride}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#111827] m-0">
                    {e.pharmacyName}
                    <span className="ml-2 text-[11px] font-normal text-[#4b5563]">
                      Order {e.orderId}
                    </span>
                  </h3>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold tabular-nums m-0 ${severityColor(e.ratingAtOverride)}`}>
                    {e.scoreAtOverride}/100
                  </p>
                  <p className="text-[10px] text-[#9ca3af] m-0">at override</p>
                </div>
              </div>

              <div className="bg-[#f7f8fa] rounded-md p-3 mb-3 border-l-2 border-[#0065cb]">
                <div className="flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-3 h-3 text-[#0065cb]" />
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-[#4b5563]">
                    Justification
                  </span>
                </div>
                <p className="text-xs text-[#111827] m-0 leading-relaxed">{e.justification}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#4b5563]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="font-medium text-[#111827]">{e.approverName}</span>
                    <span className={roleColor(e.approverRole)}>· {e.approverRole}</span>
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(e.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
