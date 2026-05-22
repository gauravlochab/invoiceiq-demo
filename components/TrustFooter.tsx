"use client";

import { useState } from "react";
import { Shield, Lock, ShieldCheck } from "lucide-react";
import ComplianceInfoDialog from "@/components/ComplianceInfoDialog";

const badges = [
  { icon: ShieldCheck, label: "SOC 2 Type II" },
  { icon: Shield, label: "HIPAA Compliant" },
  { icon: Lock, label: "AES-256 Encryption" },
] as const;

export default function TrustFooter() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <footer
        className="flex items-center justify-between px-4 shrink-0 h-7 bg-muted border-t border-border"
      >
        <div className="flex items-center gap-4">
          {badges.map((b) => (
            <span
              key={b.label}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              <b.icon className="w-3 h-3" />
              {b.label}
            </span>
          ))}
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="text-[10px] uppercase tracking-wide font-medium text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
        >
          Security &amp; Compliance
        </button>
      </footer>
      <ComplianceInfoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
