"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface LegalDisclaimerDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  action: string; // "agree" | "disagree" | "block" | "recover" | "escalate" | "dismiss" | "approve" | "hold" | "report" | "verify"
  itemCode?: string;
  invoiceNumber?: string;
}

export function LegalDisclaimerDialog({ open, onConfirm, onCancel, action, itemCode, invoiceNumber }: LegalDisclaimerDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setAcknowledged(false); // Reset for next use
  };

  const handleCancel = () => {
    onCancel();
    setAcknowledged(false);
  };

  // Action-specific titles and descriptions
  const actionConfig: Record<string, { title: string; description: string }> = {
    agree: {
      title: "Confirm Determination — Accept AI Finding",
      description: "You are confirming that the automated finding is accurate and no further action is required on this line item.",
    },
    disagree: {
      title: "Override Automated Determination",
      description: "You are overriding the system’s automated determination for this line item. This action will be recorded in the compliance audit log and may be subject to review.",
    },
    block: {
      title: "Confirm Payment Authorization Hold",
      description: "You are placing a hold on payment authorization for this invoice. The vendor will not receive payment until this hold is released.",
    },
    recover: {
      title: "Initiate Recovery Process",
      description: "You are initiating a formal recovery process for the flagged amount. A notification will be sent to the vendor and this action will be recorded in the audit trail.",
    },
    escalate: {
      title: "Escalation Confirmation",
      description: "You are escalating this exception for managerial review. The assigned manager will be notified and this action will be recorded in the audit trail.",
    },
    dismiss: {
      title: "Dismiss Exception",
      description: "You are dismissing this exception as resolved or not applicable. This action will be recorded in the compliance audit log.",
    },
    approve: {
      title: "Approve Order for Fulfillment",
      description: "You are approving this order for release to fulfillment. This decision will be logged for regulatory compliance.",
    },
    hold: {
      title: "Place Order on Hold",
      description: "You are placing this order on hold pending further review. The order will not proceed to fulfillment until released.",
    },
    report: {
      title: "Report to Compliance",
      description: "You are submitting a compliance report for this exception. The compliance team will be notified and a formal case will be opened.",
    },
    verify: {
      title: "Request Vendor Verification",
      description: "You are requesting verification from the vendor. A formal verification request will be sent and this action will be recorded in the audit trail.",
    },
  };

  const config = actionConfig[action] || actionConfig["agree"];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">{config.title}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed mt-2">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2">
          {/* Legal disclaimer text */}
          <div className="bg-warning/10 border border-warning rounded-md px-4 py-3 mb-4">
            <p className="text-[11px] text-warning-text leading-relaxed m-0">
              {/* LEGAL REVIEW REQUIRED - Replace with attorney-approved language */}
              By proceeding with this action{itemCode ? ` for item ${itemCode}` : ""}{invoiceNumber ? ` on invoice #${invoiceNumber}` : ""}, you acknowledge that you have reviewed the relevant documentation and accept responsibility for this determination. This action will be permanently recorded in the audit log for compliance and regulatory purposes. All determinations are subject to review per organizational policy.
            </p>
          </div>

          {/* Acknowledgment checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I have reviewed the applicable policy and accept responsibility for this determination.
            </span>
          </label>
        </div>

        {/* View Policy Document link */}
        <div className="flex items-center">
          <a
            href="/documents/policies/exception-review-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary no-underline hover:underline"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 2h5.5L12 4.5V14H4V2z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="none"/><path d="M9.5 2v2.5H12" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="none"/></svg>
            View Policy Document
          </a>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={!acknowledged}>
            Confirm &amp; Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
