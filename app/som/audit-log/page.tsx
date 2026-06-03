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
// known limitation; production would persist to DB.
//
// [Spec: domains/som/spec.md#Page 6: Override Audit Log] — v2.0 shadcn
// migration: Card/Badge primitives, theme tokens, px-4 lg:px-6.

import { useState } from "react";
import { ShieldAlert, FileCheck2, User, Clock } from "lucide-react";
import { getAuditLog, type AuditLogEntry } from "@/lib/som/data/auditLog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// [Spec: domains/som/spec.md#Page 6 Business Rules — Rating colors]
function severityColor(rating: string): string {
  if (rating === "Critical") return "text-destructive-text";
  if (rating === "High Risk") return "text-warning-text";
  return "text-primary";
}

function severityBadgeVariant(
  rating: string,
): "destructive" | "outline" | "secondary" {
  if (rating === "Critical") return "destructive";
  if (rating === "High Risk") return "outline";
  return "secondary";
}

function roleColor(role: string): string {
  if (role === "Head of Procurement") return "text-primary";
  if (role === "Compliance Manager") return "text-success-text";
  if (role === "Pharmacy Director") return "text-warning-text";
  return "text-muted-foreground";
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
  // appear when the analyst navigates back here. The component remounts on
  // each client-side navigation to this route, so the lazy useState
  // initializer re-runs the read — no effect, no cascading render.
  // [Spec: domains/som/spec.md#Page 6 Business Rules — append-only]
  const [entries] = useState<AuditLogEntry[]>(() => getAuditLog());

  const totalReleased = entries.length;
  const totalAtCritical = entries.filter((e) => e.ratingAtOverride === "Critical").length;
  const uniquePharmacies = new Set(entries.map((e) => e.pharmacyId)).size;
  const uniqueApprovers = new Set(entries.map((e) => e.approverName)).size;

  // [Spec: domains/som/spec.md#Page 6 Layout — Summary Strip]
  const summary: { label: string; value: number; valueClass: string }[] = [
    { label: "Total overrides", value: totalReleased, valueClass: "text-foreground" },
    { label: "Released at Critical", value: totalAtCritical, valueClass: "text-destructive-text" },
    { label: "Unique pharmacies", value: uniquePharmacies, valueClass: "text-foreground" },
    { label: "Unique approvers", value: uniqueApprovers, valueClass: "text-foreground" },
  ];

  return (
    <main className="@container/main flex flex-1 flex-col">
      {/* Header — [Spec: domains/som/spec.md#Page 6 Layout] */}
      <div className="px-4 pt-6 pb-4 lg:px-6">
        <div className="mb-1.5 flex items-center gap-2">
          <FileCheck2 className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Drug Distributor · Compliance Trail
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Override Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every analyst decision to release a system-blocked order, with full justification.
        </p>
      </div>

      {/* Summary strip — shadcn Card, 4 panels with divide-x */}
      <div className="px-4 py-4 lg:px-6">
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
      </div>

      {/* Entries — card list, full justification visible */}
      <div className="flex flex-col gap-3 px-4 pb-6 lg:px-6">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No override entries yet.</p>
            </CardContent>
          </Card>
        ) : (
          entries.map((e) => (
            <Card key={e.id}>
              <CardContent>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {e.id}
                      </span>
                      <Badge variant={severityBadgeVariant(e.ratingAtOverride)}>
                        {e.ratingAtOverride}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {e.pharmacyName}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        Order {e.orderId}
                      </span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold tabular-nums ${severityColor(e.ratingAtOverride)}`}
                    >
                      {e.scoreAtOverride}/100
                    </p>
                    <p className="text-[10px] text-muted-foreground">at override</p>
                  </div>
                </div>

                <div className="mb-3 rounded-md border-l-2 border-primary bg-muted p-3">
                  <div className="mb-1 flex items-center gap-1">
                    <ShieldAlert className="size-3 text-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Justification
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">
                    {e.justification}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    <span className="font-medium text-foreground">{e.approverName}</span>
                    <span className={roleColor(e.approverRole)}>· {e.approverRole}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatTimestamp(e.timestamp)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
