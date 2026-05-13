export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: "user" | "system" | "agent";
  action: string;
  description: string;
}

const auditData: Record<string, AuditEntry[]> = {
  "EX-001": [
    { id: "a1", timestamp: "2026-01-15T08:14:00Z", actor: "Invoice Agent", actorType: "agent", action: "extracted", description: "Extracted invoice BME-2026-Q1-047 — 23 line items identified" },
    { id: "a2", timestamp: "2026-01-15T08:16:00Z", actor: "Compliance Agent", actorType: "agent", action: "flagged", description: "Contract cap breach detected — $123,890 over annual limit" },
    { id: "a3", timestamp: "2026-01-15T09:30:00Z", actor: "System", actorType: "system", action: "assigned", description: "Auto-assigned to Rajesh Jaluka based on vendor category rules" },
    { id: "a4", timestamp: "2026-01-15T10:45:00Z", actor: "Rajesh Jaluka", actorType: "user", action: "viewed", description: "Viewed exception details and reviewed contract terms" },
    { id: "a5", timestamp: "2026-01-15T11:02:00Z", actor: "Rajesh Jaluka", actorType: "user", action: "escalated", description: "Escalated to CFO — amount exceeds $50,000 approval threshold" },
    { id: "a6", timestamp: "2026-01-16T08:20:00Z", actor: "Insight Agent", actorType: "agent", action: "updated", description: "Vendor risk score recalculated: BioMed → 30/100 (High Risk)" },
    { id: "a7", timestamp: "2026-01-16T14:15:00Z", actor: "Recovery Agent", actorType: "agent", action: "initiated", description: "Recovery workflow initiated — credit memo request sent to vendor" },
    { id: "a8", timestamp: "2026-01-17T09:00:00Z", actor: "System", actorType: "system", action: "reminder", description: "SLA reminder: 3 business days remaining for vendor response" },
  ],
  "EX-003": [
    { id: "a1", timestamp: "2026-01-20T10:04:00Z", actor: "Invoice Agent", actorType: "agent", action: "extracted", description: "Extracted MTS-INV-00291 — no PO reference found" },
    { id: "a2", timestamp: "2026-01-20T10:05:00Z", actor: "Validation Agent", actorType: "agent", action: "flagged", description: "Three-way match failed — vendor not in approved master" },
    { id: "a3", timestamp: "2026-01-20T10:06:00Z", actor: "Compliance Agent", actorType: "agent", action: "flagged", description: "Suspicious pattern: non-standard terms, unregistered category" },
    { id: "a4", timestamp: "2026-01-20T10:30:00Z", actor: "System", actorType: "system", action: "escalated", description: "Auto-escalated — suspicious invoice triggers immediate review" },
    { id: "a5", timestamp: "2026-01-20T11:15:00Z", actor: "Rajesh Jaluka", actorType: "user", action: "reviewed", description: "Confirmed bank account mismatch with known vendor records" },
    { id: "a6", timestamp: "2026-01-20T11:45:00Z", actor: "Rajesh Jaluka", actorType: "user", action: "blocked", description: "Payment blocked — referred to internal audit for investigation" },
  ],
  "EX-006": [
    { id: "a1", timestamp: "2026-02-10T10:32:00Z", actor: "Invoice Agent", actorType: "agent", action: "extracted", description: "Extracted STC-2026-19847 — 6 line items with flags" },
    { id: "a2", timestamp: "2026-02-10T10:33:00Z", actor: "Validation Agent", actorType: "agent", action: "flagged", description: "Price mismatch on STE-4821-A: PO $2.10 vs Invoice $2.50 (+19%)" },
    { id: "a3", timestamp: "2026-02-10T11:00:00Z", actor: "System", actorType: "system", action: "assigned", description: "Assigned to Rajesh Jaluka — Sterilization category specialist" },
    { id: "a4", timestamp: "2026-02-10T14:20:00Z", actor: "Rajesh Jaluka", actorType: "user", action: "reviewed", description: "Reviewed line items — confirmed price discrepancy on 1 of 6 items" },
    { id: "a5", timestamp: "2026-02-11T09:15:00Z", actor: "Recovery Agent", actorType: "agent", action: "contacted", description: "Steris Corporation AR department contacted via email" },
  ],
};

const defaultAudit: AuditEntry[] = [
  { id: "a1", timestamp: "2026-02-15T08:00:00Z", actor: "Invoice Agent", actorType: "agent", action: "extracted", description: "Invoice extracted and validated by AI pipeline" },
  { id: "a2", timestamp: "2026-02-15T08:01:00Z", actor: "Validation Agent", actorType: "agent", action: "flagged", description: "Exception identified and flagged for review" },
  { id: "a3", timestamp: "2026-02-15T09:00:00Z", actor: "System", actorType: "system", action: "assigned", description: "Auto-assigned to analyst based on vendor category rules" },
  { id: "a4", timestamp: "2026-02-15T10:30:00Z", actor: "Rajesh Jaluka", actorType: "user", action: "viewed", description: "Viewed exception details" },
  { id: "a5", timestamp: "2026-02-15T11:00:00Z", actor: "Insight Agent", actorType: "agent", action: "updated", description: "Vendor risk profile updated with latest exception data" },
];

export function getAuditTrail(exceptionId: string): AuditEntry[] {
  return auditData[exceptionId] || defaultAudit;
}

export type WorkflowPhase = "received" | "validated" | "flagged" | "under_review" | "resolved";

export interface WorkflowStep {
  phase: WorkflowPhase;
  label: string;
  timestamp?: string;
  completed: boolean;
  active: boolean;
}

const workflowSteps: Record<string, WorkflowStep[]> = {
  "EX-001": [
    { phase: "received", label: "Received", timestamp: "Jan 15, 08:14", completed: true, active: false },
    { phase: "validated", label: "Validated", timestamp: "Jan 15, 08:15", completed: true, active: false },
    { phase: "flagged", label: "Flagged", timestamp: "Jan 15, 08:16", completed: true, active: false },
    { phase: "under_review", label: "Under Review", timestamp: "Jan 15, 10:45", completed: false, active: true },
    { phase: "resolved", label: "Resolved", completed: false, active: false },
  ],
  "EX-003": [
    { phase: "received", label: "Received", timestamp: "Jan 20, 10:04", completed: true, active: false },
    { phase: "validated", label: "Validated", timestamp: "Jan 20, 10:05", completed: true, active: false },
    { phase: "flagged", label: "Flagged", timestamp: "Jan 20, 10:06", completed: true, active: false },
    { phase: "under_review", label: "Under Review", timestamp: "Jan 20, 11:15", completed: true, active: false },
    { phase: "resolved", label: "Resolved", timestamp: "Jan 20, 11:45", completed: true, active: false },
  ],
  "EX-006": [
    { phase: "received", label: "Received", timestamp: "Feb 10, 10:32", completed: true, active: false },
    { phase: "validated", label: "Validated", timestamp: "Feb 10, 10:33", completed: true, active: false },
    { phase: "flagged", label: "Flagged", timestamp: "Feb 10, 10:33", completed: true, active: false },
    { phase: "under_review", label: "Under Review", timestamp: "Feb 10, 14:20", completed: false, active: true },
    { phase: "resolved", label: "Resolved", completed: false, active: false },
  ],
};

const defaultWorkflow: WorkflowStep[] = [
  { phase: "received", label: "Received", timestamp: "Feb 15, 08:00", completed: true, active: false },
  { phase: "validated", label: "Validated", timestamp: "Feb 15, 08:01", completed: true, active: false },
  { phase: "flagged", label: "Flagged", timestamp: "Feb 15, 08:01", completed: true, active: false },
  { phase: "under_review", label: "Under Review", completed: false, active: true },
  { phase: "resolved", label: "Resolved", completed: false, active: false },
];

export function getWorkflowSteps(exceptionId: string): WorkflowStep[] {
  return workflowSteps[exceptionId] || defaultWorkflow;
}
