"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ApproverRole } from "@/lib/som/data/auditLog";

interface Props {
  open: boolean;
  pharmacyName: string;
  orderId: string;
  score: number;
  rating: "Critical" | "High Risk" | "Medium Risk";
  onClose: () => void;
  onSubmit: (data: {
    justification: string;
    approverName: string;
    approverRole: ApproverRole;
  }) => void;
}

const APPROVER_ROLES: ApproverRole[] = [
  "Compliance Manager",
  "Head of Procurement",
  "Pharmacy Director",
  "Other",
];

const MIN_JUSTIFICATION = 20;

export function OverrideModal({
  open,
  pharmacyName,
  orderId,
  score,
  rating,
  onClose,
  onSubmit,
}: Props) {
  const [justification, setJustification] = useState("");
  const [approverName, setApproverName] = useState("");
  const [approverRole, setApproverRole] = useState<ApproverRole>("Compliance Manager");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setJustification("");
      setApproverName("");
      setApproverRole("Compliance Manager");
      setSubmitted(false);
    }
  }, [open]);

  const justificationOk = justification.trim().length >= MIN_JUSTIFICATION;
  const nameOk = approverName.trim().length >= 2;
  const canSubmit = justificationOk && nameOk;

  function handleSubmit() {
    if (!canSubmit) {
      setSubmitted(true);
      return;
    }
    onSubmit({
      justification: justification.trim(),
      approverName: approverName.trim(),
      approverRole,
    });
  }

  const ratingColor =
    rating === "Critical" ? "text-destructive bg-destructive/10 border-destructive/40"
    : rating === "High Risk" ? "text-warning-text bg-warning/10 border-warning/40"
    : "text-primary bg-primary/10 border-primary/40";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <DialogTitle className="text-sm font-semibold">Authorization Override Request</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Provide formal justification and designated approver credentials to authorize release of order {orderId}
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 flex flex-col gap-4">
          <div className={`rounded-md border p-3 ${ratingColor}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold m-0">{pharmacyName}</p>
                <p className="m-0 mt-0.5">
                  Order {orderId} · Risk score {score}/100 · {rating}
                </p>
                <p className="m-0 mt-1.5 text-[11px] opacity-90">
                  This entity has been flagged for elevated risk and requires authorized approval
                  before order fulfilment. All justifications are permanently recorded in the compliance audit log.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">
              Formal Justification <span className="text-destructive">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Please provide formal justification for authorizing this transaction despite the flagged risk indicators."
              rows={5}
              className={`w-full text-xs px-3 py-2 rounded-md border bg-card text-foreground focus:outline-none focus:ring-2 ${
                submitted && !justificationOk
                  ? "border-destructive focus:ring-destructive/20"
                  : "border-input focus:border-ring focus:ring-ring/20"
              }`}
            />
            <p className="text-[10px] text-muted-foreground mt-1 m-0">
              {justification.trim().length}/{MIN_JUSTIFICATION} min characters
              {submitted && !justificationOk && (
                <span className="text-destructive ml-2">— please add more detail</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">
                Approver name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="Full name"
                className={`w-full text-xs px-3 py-2 rounded-md border bg-card text-foreground focus:outline-none focus:ring-2 ${
                  submitted && !nameOk
                    ? "border-destructive focus:ring-destructive/20"
                    : "border-input focus:border-ring focus:ring-ring/20"
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">
                Role
              </label>
              <select
                value={approverRole}
                onChange={(e) => setApproverRole(e.target.value as ApproverRole)}
                className="w-full text-xs px-3 py-2 rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:border-ring focus:ring-ring/20"
              >
                {APPROVER_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border bg-muted flex-row justify-between items-center gap-2">
          <a
            href="/documents/policies/exception-review-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            <FileText className="w-3 h-3" />
            View Policy Document
          </a>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleSubmit}>
              Authorize Release
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
