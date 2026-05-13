export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "exception" | "recovery" | "compliance" | "system";
  link?: string;
}

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "EX-003 escalated to Compliance",
    description: "Suspicious invoice from MedLine flagged for CFO review — amount exceeds $100K threshold.",
    timestamp: "2026-03-14T09:12:00Z",
    read: false,
    type: "exception",
    link: "/exceptions/EX-003",
  },
  {
    id: "n2",
    title: "Cardinal Health credit memo received",
    description: "Recovery REC-002: $4,200 credit applied against duplicate billing dispute.",
    timestamp: "2026-03-14T08:45:00Z",
    read: false,
    type: "recovery",
    link: "/recovery",
  },
  {
    id: "n3",
    title: "Recovery REC-005 SLA overdue",
    description: "Owens & Minor recovery has exceeded the 14-day SLA. Auto-escalation triggered.",
    timestamp: "2026-03-13T16:30:00Z",
    read: false,
    type: "recovery",
    link: "/recovery",
  },
  {
    id: "n4",
    title: "Compliance Agent: contract breach detected",
    description: "BioMed Equipment Inc. Q1 spend has exceeded annual contract cap by $23,890.",
    timestamp: "2026-03-13T14:20:00Z",
    read: true,
    type: "compliance",
    link: "/exceptions/EX-001",
  },
  {
    id: "n5",
    title: "Weekly scan complete",
    description: "1,847 invoices processed. 12 new exceptions identified, 3 critical severity.",
    timestamp: "2026-03-13T06:00:00Z",
    read: true,
    type: "system",
  },
  {
    id: "n6",
    title: "Vendor risk score updated",
    description: "Steris Corporation risk score changed from Medium to High based on match exception patterns.",
    timestamp: "2026-03-12T11:15:00Z",
    read: true,
    type: "compliance",
    link: "/vendor-scoring",
  },
  {
    id: "n7",
    title: "GPO variance detected — Cardinal Health",
    description: "3 line items invoiced above Vizient negotiated rate. Total overcharge: $8,420.",
    timestamp: "2026-03-14T10:05:00Z",
    read: false,
    type: "compliance",
    link: "/exceptions/EX-005",
  },
  {
    id: "n8",
    title: "Escalation deadline approaching",
    description: "EX-006 requires manager approval within 24 hours — flagged amount exceeds $50K threshold.",
    timestamp: "2026-03-14T07:30:00Z",
    read: false,
    type: "exception",
    link: "/exceptions/EX-006",
  },
  {
    id: "n9",
    title: "Compliance review pending",
    description: "2 overridden exceptions await compliance team review per Parkland Health policy.",
    timestamp: "2026-03-13T15:45:00Z",
    read: true,
    type: "compliance",
  },
];

export function getUnreadCount(items: Notification[]): number {
  return items.filter((n) => !n.read).length;
}
