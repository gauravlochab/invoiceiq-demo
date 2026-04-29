// ─── SOM Audit Log — Override Decisions ──────────────────────────────────────
//
// Records every analyst decision to override a system-imposed block on a
// suspicious order, per Rajesh's pharmacy_usecase_transcript.txt t=12:33:
//
//   "We need to do that and say this side will not be able to move forward
//    till a human override... and a human justification which gets recorded
//    for audit purpose saying while it had a low score and was suspicious,
//    but then we released it because the head of procurement... said no,
//    that's okay to override that for ABCD reasons, right? So we capture
//    that and that gets into the audit log."
//
// This is a module-level store backed by an array — for the demo only.
// Production version would persist to DB. Seeded with a few historical
// overrides so /som/audit-log isn't empty on first visit.

export type ApproverRole =
  | "Compliance Manager"
  | "Head of Procurement"
  | "Pharmacy Director"
  | "Other";

export interface AuditLogEntry {
  id: string;
  /** ISO datetime when the override was approved. */
  timestamp: string;
  /** Order that was overridden (matches IncomingOrder.id). */
  orderId: string;
  /** Pharmacy identification at time of override. */
  pharmacyId: string;
  pharmacyName: string;
  /** Pharmacy's risk score at the time of override (0-100). */
  scoreAtOverride: number;
  /** Severity classification at override time, for audit colour-coding. */
  ratingAtOverride: "Critical" | "High Risk" | "Medium Risk";
  /** Reason the analyst typed in (free text). */
  justification: string;
  /** Approver identification. */
  approverName: string;
  approverRole: ApproverRole;
}

// ─── Seed entries (3 historical overrides) ───────────────────────────────────
//
// These represent prior-quarter override decisions. They're hand-crafted so
// the audit log has variety on first visit (different roles, different score
// bands, different justifications).

const seedEntries: AuditLogEntry[] = [
  {
    id: "AUD-001",
    timestamp: "2026-03-14T14:22:00Z",
    orderId: "ORD-0884",
    pharmacyId: "PH-005",
    pharmacyName: "Westside Pharmacy",
    scoreAtOverride: 22,
    ratingAtOverride: "Critical",
    justification:
      "Pharmacy has been on probation but Compliance team confirmed remediation plan. Order limited to 60% of original quantity. Re-evaluation in 30 days.",
    approverName: "Anita Kowalski",
    approverRole: "Head of Procurement",
  },
  {
    id: "AUD-002",
    timestamp: "2026-02-28T09:47:00Z",
    orderId: "ORD-0732",
    pharmacyId: "PH-003",
    pharmacyName: "Tarheel Drugs",
    scoreAtOverride: 51,
    ratingAtOverride: "High Risk",
    justification:
      "Pharmacy's NC permit renewal was delayed by state board backlog. Confirmed renewal application is in queue (case #NC-PR-2026-1422). Exception granted for 14 days.",
    approverName: "Marcus Webb",
    approverRole: "Compliance Manager",
  },
  {
    id: "AUD-003",
    timestamp: "2026-04-02T16:11:00Z",
    orderId: "ORD-0951",
    pharmacyId: "PH-013",
    pharmacyName: "Catawba Valley Drugs",
    scoreAtOverride: 57,
    ratingAtOverride: "High Risk",
    justification:
      "Customer transitioning ownership; new licensee identified. Order is for non-controlled inventory only. Verified with state board liaison.",
    approverName: "Dr. Priya Iyer",
    approverRole: "Pharmacy Director",
  },
];

// ─── Module-level store ──────────────────────────────────────────────────────
//
// In-memory only — refreshing the page won't lose seeds, but new entries
// added via the override modal will reset on hard reload (acceptable for
// the demo). Documented in the demo guide Q&A.

let entries: AuditLogEntry[] = [...seedEntries];

export function getAuditLog(): AuditLogEntry[] {
  // Newest first.
  return [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function appendAuditEntry(
  entry: Omit<AuditLogEntry, "id" | "timestamp">,
): AuditLogEntry {
  const id = `AUD-${String(entries.length + 1).padStart(3, "0")}`;
  const timestamp = new Date().toISOString();
  const fullEntry: AuditLogEntry = { id, timestamp, ...entry };
  entries = [...entries, fullEntry];
  return fullEntry;
}
