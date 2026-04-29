// ─── SOM Mock Data — Raw Material BOM (Bill of Materials) ────────────────────
//
// Synthetic compound-drug recipes for the Pattern Outlier task's "Raw
// Material Correlation" sub-check (Bala, pharmacy_usecase_transcript.txt
// t=01:23): "if a pharmacy is asking for just one raw material more and
// more repeatedly... if there are dependent raw materials, check the
// proportion of orders".
//
// Some prescription drugs in the US are compounded at the pharmacy from
// raw materials in fixed ratios. If a pharmacy orders disproportionately
// more of one ingredient than the others it depends on, that's a flag —
// could indicate diversion (taking the controlled ingredient out the back
// door without dispensing the compound).
//
// We model 3 representative compound recipes. Each row says "for compound
// X, pharmacy needs N parts of material A, M parts of material B".
// The Pattern Outlier task compares the pharmacy's last-30-day order
// proportions for the materials in each compound.
//
// All synthetic — real BOM data would come from the pharmacy's compounding
// software (PioneerRx, Rx30, etc.).

export interface RawMaterialRecipe {
  /** Compound product the pharmacy makes (display name). */
  compoundName: string;
  /** Ingredient NDCs and their fixed ratio in the recipe. */
  ingredients: Array<{
    ndc: string;
    name: string;
    /** Relative ratio (any units — only ratios matter). */
    ratio: number;
    isControlled: boolean;
  }>;
}

export const rawMaterialRecipes: RawMaterialRecipe[] = [
  {
    // Compounded testosterone cream — controlled (Schedule III) +
    // non-controlled excipients
    compoundName: "Testosterone Cream 5%",
    ingredients: [
      { ndc: "RAW-TEST-100", name: "Testosterone USP",            ratio: 1, isControlled: true },
      { ndc: "RAW-PROG-200", name: "Pluronic Lecithin Organogel", ratio: 8, isControlled: false },
      { ndc: "RAW-CARR-500", name: "Anhydrous Lanolin Carrier",   ratio: 4, isControlled: false },
    ],
  },
  {
    // Compounded ketamine troche — controlled (III) + flavor + base
    compoundName: "Ketamine 50mg Troche",
    ingredients: [
      { ndc: "RAW-KETA-100", name: "Ketamine HCl USP",            ratio: 1, isControlled: true },
      { ndc: "RAW-FLAV-300", name: "Mint Troche Base",            ratio: 6, isControlled: false },
      { ndc: "RAW-SWEET-401", name: "Stevia Sweetener Powder",     ratio: 2, isControlled: false },
    ],
  },
  {
    // Compounded amphetamine suspension — Schedule II, more inert
    compoundName: "Amphetamine 5mg/mL Suspension",
    ingredients: [
      { ndc: "RAW-AMPH-100", name: "Amphetamine Sulfate USP",      ratio: 1, isControlled: true },
      { ndc: "RAW-SUSP-700", name: "Ora-Plus Suspension Vehicle",  ratio: 12, isControlled: false },
      { ndc: "RAW-FLAV-301", name: "Cherry Flavoring Concentrate", ratio: 1, isControlled: false },
    ],
  },
];

// ─── Per-pharmacy 30-day raw-material order history ──────────────────────────
//
// For each compound a pharmacy makes, we model the prior 30 days' purchases
// of each ingredient. The Pattern Outlier sub-check computes the actual
// proportion vs the recipe's expected proportion. Significant drift on the
// controlled ingredient is the red flag.

export interface PharmacyRawMaterialUsage {
  pharmacyId: string;
  /** Compound + actual purchase ratios (parallels to recipe.ingredients order). */
  compounds: Array<{
    compoundName: string;
    /** Actual units of each ingredient ordered in last 30 days, same NDC order. */
    actualUnits: number[];
  }>;
}

export const rawMaterialUsage: PharmacyRawMaterialUsage[] = [
  // ── Westside (PH-005, boss case) — controlled ingredient ordered
  //    way out of proportion. Recipe expects 1:8:4 (1 part testosterone,
  //    8 parts gel, 4 parts lanolin). Actual: 800 : 400 : 200. The
  //    pharmacy ordered 800 of the controlled ingredient but only 400
  //    of the gel they need 8x as much of. Diversion signal.
  {
    pharmacyId: "PH-005",
    compounds: [
      { compoundName: "Testosterone Cream 5%", actualUnits: [800, 400, 200] },
    ],
  },
  // ── Tarheel (PH-003) — moderate drift but not extreme: 1:6:3 vs 1:8:4
  {
    pharmacyId: "PH-003",
    compounds: [
      { compoundName: "Testosterone Cream 5%", actualUnits: [60, 360, 180] },
    ],
  },
  // ── Sunset Strip (PH-012) — recipe-proportional, but still flagged on
  //    other sub-checks. Demonstrates that raw-material can pass
  //    independently.
  {
    pharmacyId: "PH-012",
    compounds: [
      { compoundName: "Ketamine 50mg Troche", actualUnits: [10, 60, 20] },
    ],
  },
  // ── A few clean pharmacies with proportional usage so the sub-check
  //    has variety to demo.
  {
    pharmacyId: "PH-001",
    compounds: [
      { compoundName: "Testosterone Cream 5%", actualUnits: [25, 200, 100] },  // exact ratio
    ],
  },
  {
    pharmacyId: "PH-006",
    compounds: [
      { compoundName: "Amphetamine 5mg/mL Suspension", actualUnits: [50, 600, 50] },  // exact ratio
    ],
  },
];

export function findRawMaterialUsageByPharmacyId(id: string): PharmacyRawMaterialUsage | undefined {
  return rawMaterialUsage.find((u) => u.pharmacyId === id);
}

export function findRecipeByName(name: string): RawMaterialRecipe | undefined {
  return rawMaterialRecipes.find((r) => r.compoundName === name);
}
