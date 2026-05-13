export interface EscalationThreshold {
  minAmount: number;
  label: string;
  approver: string;
  autoEscalate: boolean;
}

export interface WorkflowConfig {
  customer: string;
  customerLogo?: string;
  primaryColor: string;
  escalationThresholds: EscalationThreshold[];
  postDisagreeSteps: { step: string; assignee: string; sla: string }[];
}

export const PARKLAND_CONFIG: WorkflowConfig = {
  customer: "Parkland Health",
  customerLogo: "/branding/parkland-logo.svg",
  primaryColor: "#003366",
  escalationThresholds: [
    { minAmount: 10000, label: "Manager Approval Required", approver: "Department Manager", autoEscalate: false },
    { minAmount: 50000, label: "VP Approval Required", approver: "VP of Finance", autoEscalate: true },
    { minAmount: 100000, label: "CFO Approval Required", approver: "Chief Financial Officer", autoEscalate: true },
  ],
  postDisagreeSteps: [
    { step: "Compliance Review", assignee: "Compliance Team", sla: "2 business days" },
    { step: "Incident Report Generation", assignee: "System", sla: "Automatic" },
    { step: "Vendor Meeting Scheduling", assignee: "Procurement Lead", sla: "5 business days" },
  ],
};

export function getEscalationLevel(amount: number, config: WorkflowConfig = PARKLAND_CONFIG): EscalationThreshold | null {
  const sorted = [...config.escalationThresholds].sort((a, b) => b.minAmount - a.minAmount);
  return sorted.find(t => amount >= t.minAmount) || null;
}
