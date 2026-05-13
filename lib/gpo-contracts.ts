export interface GPOContract {
  id: string;
  gpo: "Premier" | "Vizient" | "HealthTrust";
  contractId: string;
  vendor: string;
  category: string;
  itemDescription: string;
  negotiatedRate: number;
  unit: string;
  effectiveDate: string;
  expiryDate: string;
  tier?: string;
}

export interface GPOComparison {
  itemCode: string;
  itemDescription: string;
  invoicedPrice: number;
  gpoRate: number;
  variance: number;
  variancePct: number;
  gpo: string;
  contractId: string;
  status: "compliant" | "minor_variance" | "significant_variance";
}

export const gpoContracts: GPOContract[] = [
  { id: "GPO-001", gpo: "Premier", contractId: "PRE-2025-STE-4100", vendor: "Steris Corporation", category: "Surgical Supplies", itemDescription: "Sterile Surgical Drape Set", negotiatedRate: 2.05, unit: "ea", effectiveDate: "2025-01-01", expiryDate: "2026-12-31", tier: "Tier 1" },
  { id: "GPO-002", gpo: "Premier", contractId: "PRE-2025-STE-4100", vendor: "Steris Corporation", category: "Surgical Supplies", itemDescription: "Surgical Isolation Gown AAMI Level 3", negotiatedRate: 8.60, unit: "ea", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
  { id: "GPO-003", gpo: "Premier", contractId: "PRE-2025-STE-4100", vendor: "Steris Corporation", category: "Surgical Supplies", itemDescription: "Disposable Full-Face Shield", negotiatedRate: 1.15, unit: "ea", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
  { id: "GPO-004", gpo: "Premier", contractId: "PRE-2025-STE-4100", vendor: "Steris Corporation", category: "Sterilization", itemDescription: "Sterile Gauze Pad 4x4 inch (pkg/100)", negotiatedRate: 14.20, unit: "pkg", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
  { id: "GPO-005", gpo: "Premier", contractId: "PRE-2025-STE-4100", vendor: "Steris Corporation", category: "Sterilization", itemDescription: "Sterilization Wrap CSR 24x24", negotiatedRate: 4.75, unit: "sheet", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
  { id: "GPO-006", gpo: "Premier", contractId: "PRE-2025-STE-4100", vendor: "Steris Corporation", category: "Surgical Supplies", itemDescription: "Bouffant Surgical Cap Disposable", negotiatedRate: 1.85, unit: "ea", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
  { id: "GPO-007", gpo: "Vizient", contractId: "VZT-2025-CAR-7200", vendor: "Cardinal Health", category: "Pharmaceuticals", itemDescription: "Pharmaceutical Unit — Standard", negotiatedRate: 72.00, unit: "unit", effectiveDate: "2025-04-01", expiryDate: "2026-03-31", tier: "Tier 2" },
  { id: "GPO-008", gpo: "Vizient", contractId: "VZT-2025-CAR-7200", vendor: "Cardinal Health", category: "Pharmaceuticals", itemDescription: "Pharmaceutical Unit — High Volume", negotiatedRate: 68.50, unit: "unit", effectiveDate: "2025-04-01", expiryDate: "2026-03-31", tier: "Tier 3" },
  { id: "GPO-009", gpo: "HealthTrust", contractId: "HT-2025-MDL-3300", vendor: "Medline Industries", category: "Medical Equipment", itemDescription: "Exam Gloves Nitrile Medium (Box/200)", negotiatedRate: 210.00, unit: "box", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
  { id: "GPO-010", gpo: "HealthTrust", contractId: "HT-2025-MDL-3300", vendor: "Medline Industries", category: "Surgical Supplies", itemDescription: "Bed Pads Disposable (Case/100)", negotiatedRate: 40.50, unit: "case", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
  { id: "GPO-011", gpo: "HealthTrust", contractId: "HT-2025-MDL-3300", vendor: "Medline Industries", category: "Medical Equipment", itemDescription: "Sharps Container 8 Gallon", negotiatedRate: 27.00, unit: "ea", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
  { id: "GPO-012", gpo: "Premier", contractId: "PRE-2025-BIO-5500", vendor: "BioMed Equipment Inc.", category: "Medical Equipment", itemDescription: "Patient Monitor Accessories Kit", negotiatedRate: 1240.00, unit: "kit", effectiveDate: "2025-01-01", expiryDate: "2025-12-31" },
  { id: "GPO-013", gpo: "Premier", contractId: "PRE-2025-BIO-5500", vendor: "BioMed Equipment Inc.", category: "Medical Equipment", itemDescription: "Infusion Pump Tubing Set", negotiatedRate: 18.40, unit: "set", effectiveDate: "2025-01-01", expiryDate: "2025-12-31" },
  { id: "GPO-014", gpo: "Premier", contractId: "PRE-2025-BIO-5500", vendor: "BioMed Equipment Inc.", category: "Medical Equipment", itemDescription: "Surgical Lighting Module", negotiatedRate: 3450.00, unit: "ea", effectiveDate: "2025-01-01", expiryDate: "2025-12-31" },
  { id: "GPO-015", gpo: "Vizient", contractId: "VZT-2025-OM-8100", vendor: "Owens & Minor", category: "Surgical Supplies", itemDescription: "IV Tubing Extension Set", negotiatedRate: 152.00, unit: "case", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
  { id: "GPO-016", gpo: "Vizient", contractId: "VZT-2025-OM-8100", vendor: "Owens & Minor", category: "Surgical Supplies", itemDescription: "Irrigation Syringe 60mL (Box/50)", negotiatedRate: 32.50, unit: "box", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
  { id: "GPO-017", gpo: "Vizient", contractId: "VZT-2025-CAR-7200", vendor: "Cardinal Health", category: "Pharmaceuticals", itemDescription: "Quarterly Rebate Credit", negotiatedRate: 0, unit: "credit", effectiveDate: "2025-04-01", expiryDate: "2026-03-31" },
  { id: "GPO-018", gpo: "Premier", contractId: "PRE-2025-STE-4100", vendor: "Steris Corporation", category: "Sterilization", itemDescription: "Chemical Indicator Strip (case/500)", negotiatedRate: 22.80, unit: "case", effectiveDate: "2025-01-01", expiryDate: "2026-12-31" },
];

const gpoComparisonData: Record<string, GPOComparison[]> = {
  "EX-006": [
    { itemCode: "STE-4821-A", itemDescription: "Sterile Surgical Drape Set", invoicedPrice: 2.50, gpoRate: 2.05, variance: 0.45, variancePct: 21.95, gpo: "Premier", contractId: "PRE-2025-STE-4100", status: "significant_variance" },
    { itemCode: "STE-2200-C", itemDescription: "Surgical Isolation Gown AAMI Level 3 XL", invoicedPrice: 8.75, gpoRate: 8.60, variance: 0.15, variancePct: 1.74, gpo: "Premier", contractId: "PRE-2025-STE-4100", status: "minor_variance" },
    { itemCode: "STE-9940-B", itemDescription: "Disposable Full-Face Shield", invoicedPrice: 1.20, gpoRate: 1.15, variance: 0.05, variancePct: 4.35, gpo: "Premier", contractId: "PRE-2025-STE-4100", status: "minor_variance" },
    { itemCode: "STE-3310-D", itemDescription: "Sterile Gauze Pad 4x4 inch (pkg/100)", invoicedPrice: 14.50, gpoRate: 14.20, variance: 0.30, variancePct: 2.11, gpo: "Premier", contractId: "PRE-2025-STE-4100", status: "minor_variance" },
    { itemCode: "STE-7710-A", itemDescription: "Sterilization Wrap CSR 24x24", invoicedPrice: 4.85, gpoRate: 4.75, variance: 0.10, variancePct: 2.11, gpo: "Premier", contractId: "PRE-2025-STE-4100", status: "minor_variance" },
    { itemCode: "STE-1100-C", itemDescription: "Bouffant Surgical Cap Disposable", invoicedPrice: 1.90, gpoRate: 1.85, variance: 0.05, variancePct: 2.70, gpo: "Premier", contractId: "PRE-2025-STE-4100", status: "minor_variance" },
  ],
  "EX-007": [
    { itemCode: "MDL-EG-200", itemDescription: "Exam Gloves Nitrile Medium (Box/200)", invoicedPrice: 218.46, gpoRate: 210.00, variance: 8.46, variancePct: 4.03, gpo: "HealthTrust", contractId: "HT-2025-MDL-3300", status: "minor_variance" },
    { itemCode: "MDL-BP-100", itemDescription: "Bed Pads Disposable (Case/100)", invoicedPrice: 42.00, gpoRate: 40.50, variance: 1.50, variancePct: 3.70, gpo: "HealthTrust", contractId: "HT-2025-MDL-3300", status: "minor_variance" },
    { itemCode: "MDL-SC-8G", itemDescription: "Sharps Container 8 Gallon", invoicedPrice: 28.50, gpoRate: 27.00, variance: 1.50, variancePct: 5.56, gpo: "HealthTrust", contractId: "HT-2025-MDL-3300", status: "significant_variance" },
  ],
  "EX-010": [
    { itemCode: "OM-IVT-24", itemDescription: "IV Tubing Extension Set", invoicedPrice: 162.08, gpoRate: 152.00, variance: 10.08, variancePct: 6.63, gpo: "Vizient", contractId: "VZT-2025-OM-8100", status: "significant_variance" },
    { itemCode: "OM-SYR-50", itemDescription: "Irrigation Syringe 60mL (Box/50)", invoicedPrice: 34.00, gpoRate: 32.50, variance: 1.50, variancePct: 4.62, gpo: "Vizient", contractId: "VZT-2025-OM-8100", status: "minor_variance" },
  ],
  "EX-001": [
    { itemCode: "BIO-PM-100", itemDescription: "Patient Monitor Accessories Kit", invoicedPrice: 1295.00, gpoRate: 1240.00, variance: 55.00, variancePct: 4.44, gpo: "Premier", contractId: "PRE-2025-BIO-5500", status: "minor_variance" },
    { itemCode: "BIO-IPT-50", itemDescription: "Infusion Pump Tubing Set", invoicedPrice: 19.80, gpoRate: 18.40, variance: 1.40, variancePct: 7.61, gpo: "Premier", contractId: "PRE-2025-BIO-5500", status: "significant_variance" },
    { itemCode: "BIO-SLM-01", itemDescription: "Surgical Lighting Module", invoicedPrice: 3680.00, gpoRate: 3450.00, variance: 230.00, variancePct: 6.67, gpo: "Premier", contractId: "PRE-2025-BIO-5500", status: "significant_variance" },
  ],
  "EX-005": [
    { itemCode: "CH-PHARM-STD", itemDescription: "Pharmaceutical Unit — Standard", invoicedPrice: 85.00, gpoRate: 72.00, variance: 13.00, variancePct: 18.06, gpo: "Vizient", contractId: "VZT-2025-CAR-7200", status: "significant_variance" },
  ],
  "EX-004": [
    { itemCode: "CH-PHARM-HV", itemDescription: "Pharmaceutical Unit — High Volume", invoicedPrice: 85.00, gpoRate: 68.50, variance: 16.50, variancePct: 24.09, gpo: "Vizient", contractId: "VZT-2025-CAR-7200", status: "significant_variance" },
  ],
};

export function getGPOComparisons(exceptionId: string): GPOComparison[] | null {
  return gpoComparisonData[exceptionId] || null;
}

export function getGPOComplianceRate(): number {
  return 87.3;
}

export function getGPOPotentialSavings(): number {
  return 142850;
}
