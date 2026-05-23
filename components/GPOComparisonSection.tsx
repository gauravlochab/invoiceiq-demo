"use client";

import { getGPOComparisons } from "@/lib/gpo-contracts";
import type { GPOComparison } from "@/lib/gpo-contracts";
import { formatCurrency } from "@/lib/data";
import { Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// [Spec: rules/ui-standard.md#v1→v2 Migration Map] — status chips driven by
// shadcn theme tokens; over-GPO-rate is critical (destructive), minor variance
// uses --warning-text, compliant uses --success-text. All AA-safe as text.
const STATUS_STYLES: Record<
  GPOComparison["status"],
  { className: string; label: string }
> = {
  compliant: {
    className: "border-success/40 bg-success/10 text-success-text",
    label: "Compliant",
  },
  minor_variance: {
    className: "border-warning/40 bg-warning/10 text-warning-text",
    label: "Minor Variance",
  },
  significant_variance: {
    className: "border-destructive/40 bg-destructive/10 text-destructive-text",
    label: "Over GPO Rate",
  },
};

function varianceColor(status: GPOComparison["status"]): string {
  if (status === "significant_variance") return "text-destructive-text";
  if (status === "minor_variance") return "text-warning-text";
  return "text-success-text";
}

export function GPOComparisonSection({ exceptionId }: { exceptionId: string }) {
  const comparisons = getGPOComparisons(exceptionId);
  if (!comparisons || comparisons.length === 0) return null;

  const totalSavings = comparisons.reduce((sum, c) => sum + c.variance, 0);
  const gpoName = comparisons[0].gpo;
  const contractId = comparisons[0].contractId;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <p className="mb-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          GPO Contract Comparison
        </p>
      </div>
      <Card className="overflow-hidden gap-0 py-0">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Comparing invoiced prices against {gpoName} contract {contractId}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {gpoName}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Invoiced Price</TableHead>
                <TableHead className="text-right">GPO Rate</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisons.map((c) => {
                const style = STATUS_STYLES[c.status];
                return (
                  <TableRow key={c.itemCode}>
                    <TableCell>
                      <span className="font-mono text-[11px] text-muted-foreground block">{c.itemCode}</span>
                      <span className="text-xs text-foreground">{c.itemDescription}</span>
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-foreground">
                      ${c.invoicedPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-success-text">
                      ${c.gpoRate.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.variance > 0 ? (
                        <span className={`text-xs tabular-nums font-medium ${varianceColor(c.status)}`}>
                          +${c.variance.toFixed(2)} ({c.variancePct.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="text-xs tabular-nums text-muted-foreground">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border inline-block ${style.className}`}
                      >
                        {style.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {gpoName} contract {contractId}
          </span>
          <span className="text-xs font-medium text-destructive-text">
            Potential savings: {formatCurrency(Math.round(totalSavings))} per unit cycle
          </span>
        </div>
      </Card>
    </div>
  );
}
