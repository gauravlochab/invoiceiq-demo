"use client";

import { Check } from "lucide-react";
import { type WorkflowStep } from "@/lib/audit-trail";

interface Props {
  steps: WorkflowStep[];
}

export default function WorkflowStepper({ steps }: Props) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;

        return (
          <div key={step.phase} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step.completed
                    ? "bg-[var(--success)] text-white"
                    : step.active
                    ? "bg-[var(--acl-primary)] text-white ring-4 ring-[var(--acl-primary)]/20"
                    : "bg-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                {step.completed ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  step.completed
                    ? "text-[var(--success)]"
                    : step.active
                    ? "text-[var(--acl-primary)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {step.label}
              </span>
              {step.timestamp && (
                <span className="text-[9px] text-[var(--text-muted)] -mt-1">{step.timestamp}</span>
              )}
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                  step.completed ? "bg-[var(--success)]" : "bg-[var(--border)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
