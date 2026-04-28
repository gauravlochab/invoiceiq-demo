// ─── Task: Detect Volume Outliers (controlled substances) ────────────────────
//
// Per Rajesh (transcript 3, t=07:30): "one city has population of thousand
// people, but suddenly they are asking for 500 pills — doesn't make sense".
// Compares the order's controlled-substance volume to the city's monthly
// baseline. Flagged as STRETCH in plan §2.2 — implementing in Phase 2 since
// the data is small and the demo benefits from showing all 4 checks.
//
// Pass:  controlled volume ≤ baseline / 4 (i.e., reasonable for a single order)
// Warn:  baseline/4 < volume ≤ 3× baseline
// Fail:  volume > 3× baseline   (genuine red flag)
//
// Rationale: a single order shouldn't typically exceed ~25% of monthly baseline.
// Above 3× is the "Durham 500 pills" case Rajesh described.

import type { Task, TaskResult } from "../types";
import { queryDemographics } from "../actions/queryDemographics";

export const detectOutliers: Task = {
  id: "detect_outliers",
  name: "Volume Outliers",
  description: "Controlled-substance volume reasonable for catchment population.",
  async run(ctx) {
    const startedAt = Date.now();

    const controlledVolume = ctx.order.lineItems
      .filter((l) => l.isControlled)
      .reduce((sum, l) => sum + l.quantity, 0);

    if (controlledVolume === 0) {
      return {
        status: "pass",
        message: "No controlled substances in this order — outlier check N/A.",
        evidence: { controlledVolume: 0 },
        durationMs: Date.now() - startedAt,
      };
    }

    // Map state+city to demographicsCity key
    const demoKey = `${ctx.order.pharmacy.city}, ${ctx.order.pharmacy.state}`;
    const demo = await queryDemographics(demoKey);

    if (!demo.found || !demo.record) {
      return {
        status: "warn",
        message: `No demographics data for ${demoKey} — cannot baseline volume.`,
        evidence: { controlledVolume, demographics: demo },
        durationMs: Date.now() - startedAt,
      };
    }

    const baseline = demo.record.controlledSubstanceMonthlyBaseline;
    const ratio = controlledVolume / baseline;

    let status: TaskResult["status"];
    let message: string;

    if (ratio <= 0.25) {
      status = "pass";
      message = `${controlledVolume.toLocaleString()} controlled units ≈ ${(ratio * 100).toFixed(0)}% of ${demoKey} monthly baseline.`;
    } else if (ratio <= 3) {
      status = "warn";
      message = `${controlledVolume.toLocaleString()} controlled units = ${ratio.toFixed(1)}× single-order baseline — review recommended.`;
    } else {
      status = "fail";
      message = `${controlledVolume.toLocaleString()} controlled units = ${ratio.toFixed(1)}× baseline — anomalous for ${demoKey} (pop. ${demo.record.catchmentPopulation.toLocaleString()}).`;
    }

    return {
      status,
      message,
      evidence: { controlledVolume, baseline, ratio: Number(ratio.toFixed(2)), demographics: demo },
      durationMs: Date.now() - startedAt,
    };
  },
};
