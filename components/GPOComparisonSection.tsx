"use client";

import { getGPOComparisons } from "@/lib/gpo-contracts";
import type { GPOComparison } from "@/lib/gpo-contracts";
import { formatCurrency } from "@/lib/data";
import { Shield } from "lucide-react";

const STATUS_STYLES: Record<GPOComparison["status"], { bg: string; text: string; label: string }> = {
  compliant: { bg: "var(--success-subtle)", text: "var(--success-text)", label: "Compliant" },
  minor_variance: { bg: "var(--warning-subtle)", text: "var(--warning-text)", label: "Minor Variance" },
  significant_variance: { bg: "var(--critical-subtle)", text: "var(--critical-text)", label: "Over GPO Rate" },
};

export function GPOComparisonSection({ exceptionId }: { exceptionId: string }) {
  const comparisons = getGPOComparisons(exceptionId);
  if (!comparisons || comparisons.length === 0) return null;

  const totalSavings = comparisons.reduce((sum, c) => sum + c.variance, 0);
  const gpoName = comparisons[0].gpo;
  const contractId = comparisons[0].contractId;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-3.5 h-3.5 text-[var(--acl-primary)]" />
        <p className="section-label mb-0">GPO Contract Comparison</p>
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">
            Comparing invoiced prices against {gpoName} contract {contractId}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: "var(--info-subtle)", color: "var(--acl-primary)" }}>
            {gpoName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="right">Invoiced Price</th>
                <th className="right">GPO Rate</th>
                <th className="right">Variance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((c) => {
                const style = STATUS_STYLES[c.status];
                return (
                  <tr key={c.itemCode}>
                    <td>
                      <span className="font-mono text-[11px] text-[var(--text-muted)] block">{c.itemCode}</span>
                      <span className="text-xs text-[var(--text-primary)]">{c.itemDescription}</span>
                    </td>
                    <td className="right text-xs tabular-nums text-[var(--text-primary)]">
                      ${c.invoicedPrice.toFixed(2)}
                    </td>
                    <td className="right text-xs tabular-nums" style={{ color: "var(--success-text)" }}>
                      ${c.gpoRate.toFixed(2)}
                    </td>
                    <td className="right">
                      {c.variance > 0 ? (
                        <span className="text-xs tabular-nums font-medium" style={{ color: c.status === "significant_variance" ? "var(--critical)" : c.status === "minor_variance" ? "var(--warning)" : "var(--success)" }}>
                          +${c.variance.toFixed(2)} ({c.variancePct.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="text-xs tabular-nums text-[var(--text-muted)]">&mdash;</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md inline-block"
                        style={{ background: style.bg, color: style.text }}
                      >
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--border)] px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">
            {gpoName} contract {contractId}
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--critical)" }}>
            Potential savings: {formatCurrency(Math.round(totalSavings))} per unit cycle
          </span>
        </div>
      </div>
    </div>
  );
}
