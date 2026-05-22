"use client";

import { PARKLAND_CONFIG } from "@/lib/workflow-config";

export function PostDisagreeSteps() {
  return (
    <div className="mt-4 pt-3 border-t border-border">
      <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted-foreground mb-2">
        Post-Override Workflow
      </p>
      <div className="flex flex-col gap-2">
        {PARKLAND_CONFIG.postDisagreeSteps.map((step, i) => (
          <div key={step.step} className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground flex-shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground m-0">{step.step}</p>
              <p className="text-[10px] text-muted-foreground m-0">{step.assignee} · SLA: {step.sla}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
