"use client";

import { getEscalationLevel } from "@/lib/workflow-config";
import { formatCurrency } from "@/lib/data";

interface EscalationBannerProps {
  flaggedAmount: number;
}

export function EscalationBanner({ flaggedAmount }: EscalationBannerProps) {
  const level = getEscalationLevel(flaggedAmount);
  if (!level) return null;

  const colors = level.autoEscalate
    ? { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "text-red-600" }
    : { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "text-amber-600" };

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-md px-4 py-3 mb-4`}>
      <div className="flex items-start gap-2.5">
        <svg className={`w-4 h-4 ${colors.icon} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div>
          <p className={`text-xs font-semibold ${colors.text} m-0`}>
            {level.label}
          </p>
          <p className={`text-[11px] ${colors.text} m-0 mt-0.5 opacity-80`}>
            Flagged amount of {formatCurrency(flaggedAmount)} exceeds the {formatCurrency(level.minAmount)} threshold.
            {level.autoEscalate
              ? ` This exception will be automatically escalated to ${level.approver}.`
              : ` Requires approval from ${level.approver} before proceeding.`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
