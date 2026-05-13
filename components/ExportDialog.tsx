"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onExport: (format: "csv" | "pdf", options: ExportOptions) => void;
  title?: string;
}

export interface ExportOptions {
  format: "csv" | "pdf";
  dateRange: string;
}

const DATE_RANGES = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "Q1 2026",
  "All time",
];

export function ExportDialog({ open, onClose, onExport, title = "Export Data" }: Props) {
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [dateRange, setDateRange] = useState("Q1 2026");
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      onExport(format, { format, dateRange });
      setExporting(false);
      onClose();
    }, 600);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--acl-primary)]" />
            <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-xs mt-1">
            Choose a format and date range for your export.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold text-[var(--text-secondary)] mb-2">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat("csv")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                  format === "csv"
                    ? "border-[var(--acl-primary)] bg-[var(--acl-primary-subtle)] text-[var(--acl-primary)]"
                    : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV Spreadsheet
              </button>
              <button
                onClick={() => setFormat("pdf")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                  format === "pdf"
                    ? "border-[var(--acl-primary)] bg-[var(--acl-primary-subtle)] text-[var(--acl-primary)]"
                    : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <FileText className="w-4 h-4" />
                PDF Report
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold text-[var(--text-secondary)] mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:border-[var(--acl-primary)] focus:ring-[var(--acl-primary)]/20"
            >
              {DATE_RANGES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {exporting && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-subtle)]">
              <div className="w-3 h-3 border-2 border-[var(--acl-primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[var(--text-secondary)]">Preparing export...</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="text-xs font-medium px-3 py-1.5 rounded-md border-none bg-[var(--acl-primary)] text-white hover:bg-[var(--acl-primary-hover)] cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3 h-3 inline mr-1" />
            Export {format.toUpperCase()}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
