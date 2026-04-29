// ─── Task: Detect Pattern Outlier (5 sub-checks) ─────────────────────────────
//
// Per pharmacy_usecase_transcript.txt (Rajesh + Bala discussion):
//   "Pattern Outlier could have four [later five] elements:
//     1. Demographics check       — area's typical therapeutic mix
//     2. Population check         — volume vs catchment population
//     3. Order history trend      — pharmacy's own historical baseline
//     4. Controlled-substance quota — distributor-set 30d cap
//     5. Raw-material correlation — proportion drift between dependent inputs"
//
// This task replaces the earlier `detectOutliers` (which only ran sub-check 2).
// Each sub-check returns its own pass / warn / fail; the task's overall verdict
// is the WORST sub-check status (so a single fail bubbles up).
//
// All five sub-checks read mock data. Real implementation would swap the data
// sources for the customer's actual feeds (BI warehouse, ARCOS, compounding
// software, etc.).

import type { Task, TaskResult, TaskStatus } from "../types";
import { queryDemographics } from "../actions/queryDemographics";
import { findOrderHistoryByPharmacyId } from "../data/orderHistory";
import { findAffinityByCity, ndcTherapeuticClass } from "../data/regionalAffinity";
import { findQuotaByPharmacyId } from "../data/controlledQuotas";
import {
  findRawMaterialUsageByPharmacyId,
  findRecipeByName,
} from "../data/rawMaterialBOM";

// ─── Sub-check result shape ──────────────────────────────────────────────────

export interface SubCheckResult {
  id: "demographics" | "population" | "history" | "quota" | "raw_material";
  label: string;
  status: TaskStatus;
  message: string;
  /** Tiny structured datum the UI can render under the sub-check row. */
  evidence?: Record<string, unknown>;
}

// ─── Status helpers ──────────────────────────────────────────────────────────

const RANK: Record<TaskStatus, number> = { pass: 0, warn: 1, fail: 2, error: 3 };
function worst(arr: TaskStatus[]): TaskStatus {
  return arr.reduce<TaskStatus>((acc, s) => (RANK[s] >= RANK[acc] ? s : acc), "pass");
}

// ─── Sub-check 1: Demographics ───────────────────────────────────────────────
// Compare ordered drug-classes to the city's regional therapeutic affinity.
// If the pharmacy is buying a class with affinity well below 1.0 in this city,
// flag it.

function runDemographicsCheck(
  city: string,
  ndcs: string[],
): SubCheckResult {
  const aff = findAffinityByCity(city);
  if (!aff) {
    return {
      id: "demographics",
      label: "Demographics",
      status: "warn",
      message: `No regional affinity data for ${city} — cannot baseline.`,
    };
  }
  // Find the lowest-affinity drug-class represented in this order.
  let minAffinity = 1;
  let flaggedClass = "";
  for (const ndc of ndcs) {
    const cls = ndcTherapeuticClass[ndc];
    if (!cls) continue;
    const a = aff.affinity[cls];
    if (a < minAffinity) {
      minAffinity = a;
      flaggedClass = cls.replace(/_/g, " ");
    }
  }
  if (minAffinity >= 0.95) {
    return {
      id: "demographics",
      label: "Demographics",
      status: "pass",
      message: `Order's drug mix matches ${city} regional norms.`,
      evidence: { city, minAffinity },
    };
  }
  if (minAffinity >= 0.75) {
    return {
      id: "demographics",
      label: "Demographics",
      status: "warn",
      message: `${flaggedClass} is ${((1 - minAffinity) * 100).toFixed(0)}% below ${city} norm.`,
      evidence: { city, flaggedClass, minAffinity },
    };
  }
  return {
    id: "demographics",
    label: "Demographics",
    status: "fail",
    message: `${flaggedClass} is ${((1 - minAffinity) * 100).toFixed(0)}% below ${city} norm — atypical for region.`,
    evidence: { city, flaggedClass, minAffinity },
  };
}

// ─── Sub-check 2: Population ─────────────────────────────────────────────────
// Original "Volume Outliers" logic — controlled-substance volume vs catchment
// monthly baseline.

async function runPopulationCheck(
  city: string,
  state: string,
  controlledVolume: number,
): Promise<SubCheckResult> {
  if (controlledVolume === 0) {
    return {
      id: "population",
      label: "Population",
      status: "pass",
      message: "No controlled substances in this order — population check N/A.",
    };
  }
  const demoKey = `${city}, ${state}`;
  const demo = await queryDemographics(demoKey);
  if (!demo.found || !demo.record) {
    return {
      id: "population",
      label: "Population",
      status: "warn",
      message: `No demographics data for ${demoKey}.`,
    };
  }
  const baseline = demo.record.controlledSubstanceMonthlyBaseline;
  const ratio = controlledVolume / baseline;
  if (ratio <= 0.25) {
    return {
      id: "population",
      label: "Population",
      status: "pass",
      message: `${controlledVolume.toLocaleString()} units ≈ ${(ratio * 100).toFixed(0)}% of ${demoKey} monthly baseline.`,
      evidence: { ratio: Number(ratio.toFixed(2)), baseline },
    };
  }
  if (ratio <= 3) {
    return {
      id: "population",
      label: "Population",
      status: "warn",
      message: `${controlledVolume.toLocaleString()} units = ${ratio.toFixed(1)}× baseline — review recommended.`,
      evidence: { ratio: Number(ratio.toFixed(2)), baseline },
    };
  }
  return {
    id: "population",
    label: "Population",
    status: "fail",
    message: `${controlledVolume.toLocaleString()} units = ${ratio.toFixed(1)}× ${demoKey} monthly baseline — anomalous.`,
    evidence: { ratio: Number(ratio.toFixed(2)), baseline },
  };
}

// ─── Sub-check 3: Order History Trend ────────────────────────────────────────
// Per-pharmacy historical baseline. If today's controlled-substance volume
// significantly exceeds this pharmacy's recent average, flag it.

function runHistoryCheck(
  pharmacyId: string,
  controlledVolume: number,
): SubCheckResult {
  if (controlledVolume === 0) {
    return {
      id: "history",
      label: "Order History",
      status: "pass",
      message: "No controlled substances — history baseline N/A.",
    };
  }
  const hist = findOrderHistoryByPharmacyId(pharmacyId);
  if (!hist || hist.priorOrders30d === 0) {
    return {
      id: "history",
      label: "Order History",
      status: "warn",
      message: "No prior order history on file — first-time order.",
    };
  }
  // Approximate "expected single order" as average daily * 7 (~weekly batch)
  const expected = hist.avgDailyControlledUnits * 7;
  const ratio = controlledVolume / Math.max(expected, 1);
  if (ratio <= 1.5) {
    return {
      id: "history",
      label: "Order History",
      status: "pass",
      message: `${controlledVolume.toLocaleString()} units in line with pharmacy's recent average.`,
      evidence: { ratio: Number(ratio.toFixed(2)), expected },
    };
  }
  if (ratio <= 5) {
    return {
      id: "history",
      label: "Order History",
      status: "warn",
      message: `${ratio.toFixed(1)}× pharmacy's recent average controlled-substance volume.`,
      evidence: { ratio: Number(ratio.toFixed(2)), expected },
    };
  }
  return {
    id: "history",
    label: "Order History",
    status: "fail",
    message: `${ratio.toFixed(1)}× pharmacy's recent average — sudden surge in controlled volume.`,
    evidence: { ratio: Number(ratio.toFixed(2)), expected },
  };
}

// ─── Sub-check 4: Controlled-Substance Quota ─────────────────────────────────
// Compare (used + this order) against the pharmacy's 30-day quota cap.

function runQuotaCheck(
  pharmacyId: string,
  controlledVolume: number,
): SubCheckResult {
  if (controlledVolume === 0) {
    return {
      id: "quota",
      label: "Controlled Quota",
      status: "pass",
      message: "Non-controlled order — no quota impact.",
    };
  }
  const q = findQuotaByPharmacyId(pharmacyId);
  if (!q || q.monthlyQuotaUnits === 0) {
    return {
      id: "quota",
      label: "Controlled Quota",
      status: "fail",
      message: "Pharmacy has no controlled-substance quota on file.",
    };
  }
  const projected = q.usedThisWindow + controlledVolume;
  const utilization = projected / q.monthlyQuotaUnits;
  if (utilization <= 0.85) {
    return {
      id: "quota",
      label: "Controlled Quota",
      status: "pass",
      message: `Projected ${(utilization * 100).toFixed(0)}% of monthly quota after this order.`,
      evidence: { projected, quota: q.monthlyQuotaUnits },
    };
  }
  if (utilization <= 1.0) {
    return {
      id: "quota",
      label: "Controlled Quota",
      status: "warn",
      message: `Approaching cap: ${(utilization * 100).toFixed(0)}% of monthly quota after this order.`,
      evidence: { projected, quota: q.monthlyQuotaUnits },
    };
  }
  return {
    id: "quota",
    label: "Controlled Quota",
    status: "fail",
    message: `Order would exceed 30-day quota by ${((utilization - 1) * 100).toFixed(0)}%.`,
    evidence: { projected, quota: q.monthlyQuotaUnits },
  };
}

// ─── Sub-check 5: Raw-Material Correlation ───────────────────────────────────
// For each compound the pharmacy makes, check whether the proportion of the
// CONTROLLED ingredient ordered in last 30d is much higher than the non-
// controlled ingredients it depends on. Flag if it is.

function runRawMaterialCheck(pharmacyId: string): SubCheckResult {
  const usage = findRawMaterialUsageByPharmacyId(pharmacyId);
  if (!usage || usage.compounds.length === 0) {
    return {
      id: "raw_material",
      label: "Raw-Material Correlation",
      status: "pass",
      message: "Pharmacy does not compound — correlation N/A.",
    };
  }
  let worstDriftPct = 0;
  let worstCompound = "";
  for (const c of usage.compounds) {
    const recipe = findRecipeByName(c.compoundName);
    if (!recipe) continue;
    // Find controlled ingredient + a non-controlled ingredient to compare.
    const controlledIdx = recipe.ingredients.findIndex((i) => i.isControlled);
    const nonControlledIdx = recipe.ingredients.findIndex((i) => !i.isControlled);
    if (controlledIdx === -1 || nonControlledIdx === -1) continue;

    const expectedRatio = recipe.ingredients[controlledIdx].ratio / recipe.ingredients[nonControlledIdx].ratio;
    const actualRatio =
      c.actualUnits[controlledIdx] / Math.max(c.actualUnits[nonControlledIdx], 1);
    // drift = how much MORE controlled we've ordered relative to expectation.
    const drift = (actualRatio / expectedRatio) - 1;
    const driftPct = drift * 100;
    if (driftPct > worstDriftPct) {
      worstDriftPct = driftPct;
      worstCompound = c.compoundName;
    }
  }
  if (worstDriftPct <= 30) {
    return {
      id: "raw_material",
      label: "Raw-Material Correlation",
      status: "pass",
      message: "Compounding ingredients in expected proportions.",
      evidence: { worstDriftPct: Math.round(worstDriftPct) },
    };
  }
  if (worstDriftPct <= 100) {
    return {
      id: "raw_material",
      label: "Raw-Material Correlation",
      status: "warn",
      message: `${worstCompound}: controlled ingredient ${Math.round(worstDriftPct)}% above expected ratio.`,
      evidence: { worstCompound, worstDriftPct: Math.round(worstDriftPct) },
    };
  }
  return {
    id: "raw_material",
    label: "Raw-Material Correlation",
    status: "fail",
    message: `${worstCompound}: controlled ingredient ${Math.round(worstDriftPct)}% above expected — diversion risk.`,
    evidence: { worstCompound, worstDriftPct: Math.round(worstDriftPct) },
  };
}

// ─── Task: bundles all 5 sub-checks ──────────────────────────────────────────

export const detectPatternOutlier: Task = {
  id: "detect_pattern_outlier",
  name: "Pattern Outlier",
  description:
    "5-factor pattern check: demographics, population, order history, controlled quota, raw-material correlation.",
  async run(ctx) {
    const startedAt = Date.now();

    const controlledVolume = ctx.order.lineItems
      .filter((l) => l.isControlled)
      .reduce((sum, l) => sum + l.quantity, 0);

    const ndcs = ctx.order.lineItems.map((l) => l.ndc);
    const { id: pharmacyId, city, state } = ctx.order.pharmacy;

    const subChecks: SubCheckResult[] = [
      runDemographicsCheck(`${city}, ${state}`, ndcs),
      await runPopulationCheck(city, state, controlledVolume),
      runHistoryCheck(pharmacyId, controlledVolume),
      runQuotaCheck(pharmacyId, controlledVolume),
      runRawMaterialCheck(pharmacyId),
    ];

    const overall = worst(subChecks.map((s) => s.status));
    const failed = subChecks.filter((s) => s.status === "fail").length;
    const warned = subChecks.filter((s) => s.status === "warn").length;

    let message: string;
    if (overall === "pass") {
      message = "All 5 pattern sub-checks pass.";
    } else if (overall === "warn") {
      message = `${warned} sub-check${warned === 1 ? "" : "s"} flagged for review.`;
    } else {
      message = `${failed} sub-check${failed === 1 ? "" : "s"} failed${warned ? ` (+ ${warned} warning)` : ""}.`;
    }

    return {
      status: overall,
      message,
      evidence: { subChecks, controlledVolume },
      durationMs: Date.now() - startedAt,
    };
  },
};
