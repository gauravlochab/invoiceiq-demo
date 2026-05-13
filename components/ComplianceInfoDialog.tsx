"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Shield, ShieldCheck, Lock, Database, Users, FileText, Globe } from "lucide-react";
import { useToast } from "@/components/Toast";

interface ComplianceInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  {
    icon: Lock,
    title: "Data Encryption",
    detail: "AES-256 at rest, TLS 1.3 in transit",
  },
  {
    icon: Users,
    title: "Access Controls",
    detail: "Role-based (RBAC) with granular permissions",
  },
  {
    icon: FileText,
    title: "Audit Logging",
    detail: "Immutable event log with user attribution",
  },
  {
    icon: ShieldCheck,
    title: "HIPAA",
    detail: "Business Associate Agreement available",
  },
  {
    icon: Shield,
    title: "SOC 2",
    detail: "Type II certified",
  },
  {
    icon: Globe,
    title: "Data Residency",
    detail: "On-premise deployment available",
  },
];

export default function ComplianceInfoDialog({ open, onClose }: ComplianceInfoDialogProps) {
  const { showToast } = useToast();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--acl-primary)]" />
            Security &amp; Compliance
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed mt-1">
            InvoiceIQ Detect is built for enterprise healthcare environments with strict regulatory requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 my-2">
          {sections.map((s) => (
            <div
              key={s.title}
              className="flex items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5"
            >
              <s.icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--acl-primary)]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] m-0 leading-tight">{s.title}</p>
                <p className="text-[11px] text-[var(--text-secondary)] m-0 mt-0.5 leading-relaxed">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-2">
          <button
            onClick={() => {
              showToast("Security whitepaper download will be available soon.", "info");
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--border-strong)] text-[var(--text-secondary)] bg-white hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            Download Security Whitepaper
          </button>
          <button
            onClick={() => {
              showToast("BAA request submitted. Our compliance team will reach out within 1 business day.", "success");
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium rounded-md text-white border-none transition-colors cursor-pointer bg-[var(--acl-primary)] hover:bg-[var(--acl-primary-hover)]"
          >
            Request BAA
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
