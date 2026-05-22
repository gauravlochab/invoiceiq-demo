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
                    ? "bg-success text-success-foreground"
                    : step.active
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
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
                    ? "text-success-text"
                    : step.active
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {step.timestamp && (
                <span className="text-[9px] text-muted-foreground -mt-1">{step.timestamp}</span>
              )}
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                  step.completed ? "bg-success" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
