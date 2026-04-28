"use client";

// ─── Manufacturers — Contract Pricing ────────────────────────────────────────
// Per docs/PLAN_SOM_DRUG_DISTRIBUTOR.md §5.2, §9. Reference table the SOM
// Analyst (and Price Deviation task) uses to verify per-NDC pricing against
// what each manufacturer has contracted with the distributor.

import { Pill, AlertTriangle } from "lucide-react";
import { manufacturerPricing } from "@/lib/som/data/manufacturerPricing";

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
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Header */}
      <div className="px-8 pt-6 pb-5 border-b border-[#e5e7eb] bg-white">
        <div className="flex items-center gap-2 mb-1.5">
          <Pill className="w-4 h-4 text-[#0065cb]" />
          <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#0065cb]">
            Drug Distributor · Contract pricing
          </span>
        </div>
        <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight m-0 mb-1">
          Manufacturers
        </h1>
        <p className="text-xs text-[#4b5563] m-0">
          Contracted unit pricing per NDC, with tolerance bands used by the Price Deviation check.
        </p>
      </div>

      <div className="px-8 py-5 flex flex-col gap-4">
        {manufacturers.map((m) => {
          const rows = grouped[m];
          return (
            <div key={m} className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-[#0065cb]" />
                  <p className="text-sm font-semibold text-[#111827] m-0">{m}</p>
                </div>
                <span className="text-[11px] text-[#9ca3af]">
                  {rows.length} NDC{rows.length === 1 ? "" : "s"} on contract
                </span>
              </div>
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>NDC</th>
                    <th>Product</th>
                    <th>Form</th>
                    <th className="right">Contract price</th>
                    <th className="right">Tolerance</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.ndc}>
                      <td className="font-mono text-[11px] text-[#4b5563]">{r.ndc}</td>
                      <td className="text-xs font-medium text-[#111827]">{r.productName}</td>
                      <td className="text-xs text-[#4b5563]">{r.form}</td>
                      <td className="right text-xs tabular-nums font-medium text-[#111827]">
                        ${r.contractPrice.toFixed(2)}
                      </td>
                      <td className="right text-xs tabular-nums text-[#4b5563]">
                        ± {r.tolerancePct}%
                      </td>
                      <td>
                        {r.isControlled ? (
                          <span className="badge warning inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Controlled
                          </span>
                        ) : r.highRisk ? (
                          <span className="badge blue">High-risk</span>
                        ) : (
                          <span className="text-[11px] text-[#9ca3af]">Standard</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
