"use client";

// ─── Override Modal ──────────────────────────────────────────────────────────
//
// Captures the analyst's justification + approver identity when overriding
// a system-imposed block on a suspicious order. Per Rajesh's
// pharmacy_usecase_transcript.txt t=12:33: "...a human justification which
// gets recorded for audit purpose...".
//
// On Submit, calls onSubmit with the captured fields. The parent (SOM queue)
// is responsible for appending to the audit log.

import { useState, useEffect } from "react";
import { X, ShieldAlert, AlertTriangle } from "lucide-react";
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

  // Reset on open.
  useEffect(() => {
    if (open) {
      setJustification("");
      setApproverName("");
      setApproverRole("Compliance Manager");
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold text-[#111827] m-0">Override System Block</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#4b5563] cursor-pointer bg-transparent border-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Context strip */}
          <div className={`rounded-md border p-3 ${ratingColor}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold m-0">{pharmacyName}</p>
                <p className="m-0 mt-0.5">
                  Order {orderId} · Risk score {score}/100 · {rating}
                </p>
                <p className="m-0 mt-1.5 text-[11px] opacity-90">
                  This pharmacy's risk score requires manual approval before fulfilment. Your
                  justification will be recorded in the audit log.
                </p>
              </div>
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold text-[#4b5563] mb-1.5">
              Justification <span className="text-red-600">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Why is it acceptable to release this order despite the suspicious-order flags?"
              rows={5}
              className={`w-full text-xs px-3 py-2 rounded-md border focus:outline-none focus:ring-2 ${
                submitted && !justificationOk
                  ? "border-red-400 focus:ring-red-200"
                  : "border-[#d1d5db] focus:border-[#0065cb] focus:ring-[#0065cb]/20"
              }`}
            />
            <p className="text-[10px] text-[#9ca3af] mt-1 m-0">
              {justification.trim().length}/{MIN_JUSTIFICATION} min characters
              {submitted && !justificationOk && (
                <span className="text-red-600 ml-2">— please add more detail</span>
              )}
            </p>
          </div>

          {/* Approver name + role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wide font-semibold text-[#4b5563] mb-1.5">
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
                    : "border-[#d1d5db] focus:border-[#0065cb] focus:ring-[#0065cb]/20"
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide font-semibold text-[#4b5563] mb-1.5">
                Role
              </label>
              <select
                value={approverRole}
                onChange={(e) => setApproverRole(e.target.value as ApproverRole)}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#d1d5db] bg-white focus:outline-none focus:ring-2 focus:border-[#0065cb] focus:ring-[#0065cb]/20"
              >
                {APPROVER_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e5e7eb] flex items-center justify-end gap-2 bg-[#f7f8fa]">
          <button
            onClick={onClose}
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-[#d1d5db] bg-white text-[#4b5563] hover:bg-[#eef0f3] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-red-600 bg-red-600 text-white hover:bg-red-700 cursor-pointer"
          >
            Override + Release
          </button>
        </div>
      </div>
    </div>
  );
}
