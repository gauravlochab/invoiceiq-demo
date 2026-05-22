"use client";

// ─── Manufacturers — Contract Pricing ────────────────────────────────────────
// Per docs/PLAN_SOM_DRUG_DISTRIBUTOR.md §5.2, §9. Reference table the SOM
// Analyst (and Price Deviation task) uses to verify per-NDC pricing against
// what each manufacturer has contracted with the distributor.
//
// [Spec: domains/som/spec.md#Page 5: Manufacturer Contract Pricing] — v2.0
// shadcn migration: Card/Table/Badge primitives, theme tokens, px-4 lg:px-6.

import { Pill, AlertTriangle } from "lucide-react";
import { manufacturerPricing } from "@/lib/som/data/manufacturerPricing";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

function groupBy<T, K extends string>(arr: T[], key: (t: T) => K): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export default function ManufacturersPage() {
  const grouped = groupBy(manufacturerPricing, (m) => m.manufacturer);
  const manufacturers = Object.keys(grouped) as Array<keyof typeof grouped>;

  return (
    <main className="@container/main flex flex-1 flex-col">
      {/* Header — [Spec: domains/som/spec.md#Page 5 Layout] */}
      <div className="border-b border-border px-4 pt-6 pb-4 lg:px-6">
        <div className="mb-1.5 flex items-center gap-2">
          <Pill className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Drug Distributor · Contract pricing
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Manufacturers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contracted unit pricing per NDC, with tolerance bands used by the Price Deviation check.
        </p>
      </div>

      {/* Manufacturer cards — one shadcn Card + Table per manufacturer */}
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-6">
        {manufacturers.map((m) => {
          const rows = grouped[m];
          return (
            <Card key={m} className="py-0">
              <CardHeader className="border-b py-3.5">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="size-4 text-primary" />
                  <h2 className="font-[inherit] text-sm font-semibold">{m}</h2>
                </CardTitle>
                <CardAction className="text-xs text-muted-foreground">
                  {rows.length} NDC{rows.length === 1 ? "" : "s"} on contract
                </CardAction>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NDC</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Form</TableHead>
                      <TableHead className="text-right">Contract price</TableHead>
                      <TableHead className="text-right">Tolerance</TableHead>
                      <TableHead>Risk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.ndc}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {r.ndc}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          {r.productName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.form}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums text-foreground">
                          ${r.contractPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          ± {r.tolerancePct}%
                        </TableCell>
                        <TableCell>
                          {r.isControlled ? (
                            <Badge className="border-warning bg-warning/10 text-warning-text">
                              <AlertTriangle className="size-3" />
                              Controlled
                            </Badge>
                          ) : r.highRisk ? (
                            <Badge variant="secondary">High-risk</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Standard</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
