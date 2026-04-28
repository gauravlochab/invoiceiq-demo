// ─── Task: Price Deviation Check ─────────────────────────────────────────────
//
// Per Rajesh (transcript 3, t=82): "this is similar to the invoice and
// contract match we are doing, so we can do that" — reuses the spirit of the
// hospital-side three-way-match engine.
//
// For each line item, compares ordered unit price to the contracted price
// from manufacturerPricing.ts. Aggregates per-line outcomes into a single
// TaskResult.
//
// Pass:  every line within tolerance
// Warn:  no contract for at least one NDC (can't price-check)
// Fail:  any line outside tolerance

import type { Task, TaskResult } from "../types";
import { matchContractPrice, type PriceMatchResult } from "../actions/matchContractPrice";

export const checkPriceDeviation: Task = {
  id: "check_price_deviation",
  name: "Price Deviation",
  description: "Order line prices within manufacturer contract tolerance.",
  async run(ctx) {
    const startedAt = Date.now();
    // Synthetic latency so the runner card spends ~600 ms in "running" state.
    await new Promise((r) => setTimeout(r, 600));

    const matches: PriceMatchResult[] = ctx.order.lineItems.map(matchContractPrice);

    const deviations = matches.filter((m) => m.outcome === "deviation");
    const noContract = matches.filter((m) => m.outcome === "no_contract");

    let status: TaskResult["status"];
    let message: string;

    if (deviations.length > 0) {
      const worst = deviations.reduce(
        (acc, m) => (Math.abs(m.deviationPct ?? 0) > Math.abs(acc.deviationPct ?? 0) ? m : acc),
        deviations[0],
      );
      status = "fail";
      message = `${deviations.length} line(s) over tolerance — worst: ${worst.productName} ${worst.deviationPct}% vs ${worst.tolerancePct}%.`;
    } else if (noContract.length > 0) {
      status = "warn";
      message = `${noContract.length} line(s) have no contract on file — price could not be verified.`;
    } else {
      status = "pass";
      const max = matches.reduce(
        (acc, m) => Math.max(acc, Math.abs(m.deviationPct ?? 0)),
        0,
      );
      message = `All ${matches.length} line(s) within contract tolerance (max deviation ${max.toFixed(1)}%).`;
    }

    return {
      status,
      message,
      evidence: { matches },
      durationMs: Date.now() - startedAt,
    };
  },
};
