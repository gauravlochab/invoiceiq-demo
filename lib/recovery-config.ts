// ─── PARKLAND HEALTH — RECOVERY WORKFLOW CONFIGURATION ──────────────────────
// SLA timelines, escalation triggers, and status definitions for the
// recovery pipeline. Aligns with Parkland Health AP Policy §4.3.

export type RecoveryPhase =
  | "identified"
  | "vendor_contacted"
  | "under_review"
  | "credit_pending"
  | "resolved"
  | "escalated";

export interface RecoveryPhaseConfig {
  key: RecoveryPhase;
  label: string;
  description: string;
  /** Badge color class (maps to globals.css .badge.* classes) */
  badgeClass: string;
  /** Color for SLA countdown indicator */
  slaColor: string;
}

export interface SlaTransition {
  from: RecoveryPhase;
  to: RecoveryPhase;
  /** Maximum business days allowed for this transition */
  slaBusinessDays: number;
  label: string;
}

export interface EscalationTrigger {
  condition: string;
  businessDays: number;
  action: string;
  assignee: string;
}

export interface RecoveryConfig {
  phases: RecoveryPhaseConfig[];
  transitions: SlaTransition[];
  escalationTriggers: EscalationTrigger[];
  /** Recovery policy statement displayed on the page */
  policyStatement: string;
  /** Policy reference number */
  policyRef: string;
}

// ─── Phase definitions ──────────────────────────────────────────────────────

export const RECOVERY_PHASES: RecoveryPhaseConfig[] = [
  {
    key: "identified",
    label: "Identified",
    description: "Exception flagged by AI agents. Recovery case opened.",
    badgeClass: "badge neutral",
    slaColor: "#6b7280",
  },
  {
    key: "vendor_contacted",
    label: "Vendor Contacted",
    description: "Initial contact sent to vendor AP/AR team.",
    badgeClass: "badge blue",
    slaColor: "#0065cb",
  },
  {
    key: "under_review",
    label: "Under Review",
    description: "Vendor acknowledged and is reviewing the discrepancy.",
    badgeClass: "badge warning",
    slaColor: "#d97706",
  },
  {
    key: "credit_pending",
    label: "Credit Pending",
    description: "Vendor agreed to credit. Awaiting credit memo issuance.",
    badgeClass: "badge blue",
    slaColor: "#0065cb",
  },
  {
    key: "resolved",
    label: "Resolved",
    description: "Credit memo received and applied. Case closed.",
    badgeClass: "badge success",
    slaColor: "#059669",
  },
  {
    key: "escalated",
    label: "Escalated",
    description: "SLA breached or vendor unresponsive. Escalated per policy.",
    badgeClass: "badge critical",
    slaColor: "#dc2626",
  },
];

// ─── SLA transitions ────────────────────────────────────────────────────────

export const SLA_TRANSITIONS: SlaTransition[] = [
  {
    from: "identified",
    to: "vendor_contacted",
    slaBusinessDays: 2,
    label: "Contact vendor within 2 business days of identification",
  },
  {
    from: "vendor_contacted",
    to: "under_review",
    slaBusinessDays: 5,
    label: "Vendor must acknowledge within 5 business days",
  },
  {
    from: "under_review",
    to: "credit_pending",
    slaBusinessDays: 10,
    label: "Vendor review must complete within 10 business days",
  },
  {
    from: "credit_pending",
    to: "resolved",
    slaBusinessDays: 15,
    label: "Credit memo must be issued within 15 business days",
  },
];

// ─── Escalation triggers ────────────────────────────────────────────────────

export const ESCALATION_TRIGGERS: EscalationTrigger[] = [
  {
    condition: "No vendor response after initial contact",
    businessDays: 10,
    action: "Auto-escalate to procurement director. Send second formal notice.",
    assignee: "Procurement Director",
  },
  {
    condition: "Vendor review exceeds SLA",
    businessDays: 15,
    action: "Escalate to VP Finance. Suspend future POs pending resolution.",
    assignee: "VP of Finance",
  },
  {
    condition: "Credit memo not received after agreement",
    businessDays: 20,
    action: "Initiate offset against outstanding payables. Legal review triggered.",
    assignee: "Legal / AP Manager",
  },
  {
    condition: "Total recovery value exceeds $50,000",
    businessDays: 5,
    action: "Auto-escalate to CFO. Weekly status reporting enabled.",
    assignee: "Chief Financial Officer",
  },
];

// ─── Full config ────────────────────────────────────────────────────────────

export const PARKLAND_RECOVERY_CONFIG: RecoveryConfig = {
  phases: RECOVERY_PHASES,
  transitions: SLA_TRANSITIONS,
  escalationTriggers: ESCALATION_TRIGGERS,
  policyStatement:
    "Per Parkland Health AP Policy 4.3, all vendor discrepancies exceeding $1,000 must enter the recovery queue within 2 business days of detection. Vendors are required to respond within 5 business days. Unresolved items exceeding 10 business days are auto-escalated to procurement leadership.",
  policyRef: "AP-POL-4.3-2026",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getPhaseConfig(phase: RecoveryPhase): RecoveryPhaseConfig {
  return RECOVERY_PHASES.find((p) => p.key === phase) ?? RECOVERY_PHASES[0];
}

/**
 * Map the existing RecoveryStatus values to the new phase system.
 * The legacy statuses still drive the data layer; these map to
 * display-only phase labels for the enhanced UI.
 */
export function mapLegacyStatusToPhase(
  status: "pending" | "in_progress" | "recovered" | "partial" | "closed",
): RecoveryPhase {
  switch (status) {
    case "pending":
      return "vendor_contacted";
    case "in_progress":
      return "under_review";
    case "recovered":
      return "resolved";
    case "partial":
      return "credit_pending";
    case "closed":
      return "resolved";
  }
}

/**
 * Calculate the number of calendar days between two dates.
 * Returns negative if deadline is in the past (overdue).
 */
export function daysUntilDeadline(deadlineIso: string): number {
  const now = new Date();
  const deadline = new Date(deadlineIso);
  const diffMs = deadline.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns an SLA urgency level based on remaining days.
 */
export function getSlaUrgency(
  daysRemaining: number,
): "overdue" | "critical" | "warning" | "ok" {
  if (daysRemaining < 0) return "overdue";
  if (daysRemaining <= 2) return "critical";
  if (daysRemaining <= 5) return "warning";
  return "ok";
}

/**
 * Get color config for SLA urgency.
 */
export function getSlaColor(urgency: "overdue" | "critical" | "warning" | "ok"): {
  text: string;
  bg: string;
  border: string;
  dot: string;
} {
  switch (urgency) {
    case "overdue":
      return { text: "#991b1b", bg: "#fef2f2", border: "#fecaca", dot: "#dc2626" };
    case "critical":
      return { text: "#991b1b", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444" };
    case "warning":
      return { text: "#92400e", bg: "#fef3c7", border: "#fde68a", dot: "#d97706" };
    case "ok":
      return { text: "#166534", bg: "#ecfdf5", border: "#bbf7d0", dot: "#059669" };
  }
}
