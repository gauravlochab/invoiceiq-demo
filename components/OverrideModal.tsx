"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, FileText } from "lucide-react";
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
    rating === "Critical" ? "text-red-600 bg-red-50 border-red-200"
    : rating === "High Risk" ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-blue-700 bg-blue-50 border-blue-200";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
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
            <label className="block text-[11px] uppercase tracking-wide font-semibold text-[var(--text-secondary)] mb-1.5">
              Formal Justification <span className="text-red-600">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Please provide formal justification for authorizing this transaction despite the flagged risk indicators."
              rows={5}
              className={`w-full text-xs px-3 py-2 rounded-md border focus:outline-none focus:ring-2 ${
                submitted && !justificationOk
                  ? "border-red-400 focus:ring-red-200"
                  : "border-[var(--border-strong)] focus:border-[var(--acl-primary)] focus:ring-[var(--acl-primary)]/20"
              }`}
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1 m-0">
              {justification.trim().length}/{MIN_JUSTIFICATION} min characters
              {submitted && !justificationOk && (
                <span className="text-red-600 ml-2">— please add more detail</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wide font-semibold text-[var(--text-secondary)] mb-1.5">
                Approver name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="Full name"
                className={`w-full text-xs px-3 py-2 rounded-md border focus:outline-none focus:ring-2 ${
                  submitted && !nameOk
                    ? "border-red-400 focus:ring-red-200"
                    : "border-[var(--border-strong)] focus:border-[var(--acl-primary)] focus:ring-[var(--acl-primary)]/20"
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide font-semibold text-[var(--text-secondary)] mb-1.5">
                Role
              </label>
              <select
                value={approverRole}
                onChange={(e) => setApproverRole(e.target.value as ApproverRole)}
                className="w-full text-xs px-3 py-2 rounded-md border border-[var(--border-strong)] bg-white focus:outline-none focus:ring-2 focus:border-[var(--acl-primary)] focus:ring-[var(--acl-primary)]/20"
              >
                {APPROVER_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-[var(--border)] bg-[var(--bg-base)] flex-row justify-between items-center gap-2">
          <a
            href="/documents/policies/exception-review-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[var(--acl-primary)] hover:underline"
          >
            <FileText className="w-3 h-3" />
            View Policy Document
          </a>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--border-strong)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-red-600 bg-red-600 text-white hover:bg-red-700 cursor-pointer"
            >
              Authorize Release
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
