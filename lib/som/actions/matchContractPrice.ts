// ─── Action: Match Contract Price ────────────────────────────────────────────
//
// Per Rajesh (transcript 3, t=83): "this is similar to the invoice and
// contract match we are doing, so we can do that". For Phase 2 we deliberately
// keep this simple — straight unit-price comparison against the contract
// price with the per-NDC tolerance. Phase 3+ can port the richer 3-way-match
// engine from app/exceptions/[id]/page.tsx if needed.

import { findContractPriceByNdc } from "../data/manufacturerPricing";
import type { OrderLineItem } from "../types";

export interface PriceMatchResult {
  ndc: string;
  productName: string;
  manufacturer: string;
  orderedUnitPrice: number;
  contractPrice: number | null;
  /** Signed deviation ((ordered − contract) / contract × 100), null if no contract. */
  deviationPct: number | null;
  tolerancePct: number | null;
  /** "match" if within tolerance, "deviation" if over, "no_contract" if NDC unknown. */
  outcome: "match" | "deviation" | "no_contract";
  isControlled: boolean;
  highRisk: boolean;
}

export function matchContractPrice(line: OrderLineItem): PriceMatchResult {
  const contract = findContractPriceByNdc(line.ndc);

  if (!contract) {
    return {
      ndc: line.ndc,
      productName: line.description,
      manufacturer: line.manufacturer,
      orderedUnitPrice: line.unitPrice,
      contractPrice: null,
      deviationPct: null,
      tolerancePct: null,
      outcome: "no_contract",
      isControlled: line.isControlled,
      highRisk: false,
    };
  }

  const deviationPct =
    ((line.unitPrice - contract.contractPrice) / contract.contractPrice) * 100;
  const outcome: PriceMatchResult["outcome"] =
    Math.abs(deviationPct) <= contract.tolerancePct ? "match" : "deviation";

  return {
    ndc: contract.ndc,
    productName: contract.productName,
    manufacturer: contract.manufacturer,
    orderedUnitPrice: line.unitPrice,
    contractPrice: contract.contractPrice,
    deviationPct: Number(deviationPct.toFixed(2)),
    tolerancePct: contract.tolerancePct,
    outcome,
    isControlled: contract.isControlled,
    highRisk: contract.highRisk,
  };
}
