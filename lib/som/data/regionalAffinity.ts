// ─── SOM Mock Data — Regional Therapeutic Affinity ───────────────────────────
//
// Synthetic dataset for the Pattern Outlier task's "Demographics" sub-check
// (per Rajesh, pharmacy_usecase_transcript.txt t=00:14): "certain area may
// not have a need for certain kind of medication".
//
// Maps city → typical therapeutic mix. If a pharmacy in (say) Durham orders
// a class of drug that's atypical for Durham's prescription pattern (e.g.,
// disproportionate ADHD stimulant volume vs. national norm), the sub-check
// flags it.
//
// Real implementation would use HHS prescription-claims data + GeoCoded
// patient-residence aggregates. Here we just pick a few drug classes with
// plausible regional skew.

/** Drug-class affinity for a city: 1.0 = national norm, >1 = above norm. */
export interface RegionalAffinity {
  /** Display key, matches PharmacyRecord.demographicsCity. */
  city: string;
  /** Affinity multipliers per therapeutic class (national norm = 1.0). */
  affinity: {
    schedule_iv_anxiolytic: number;     // Xanax, Valium, etc
    schedule_iii_opioid: number;        // Tylenol w/ Codeine, etc
    schedule_ii_stimulant: number;      // Concerta, Adderall, etc
    statin: number;                      // Lipitor, Atorvastatin
    glp1_agonist: number;                // Ozempic, Mounjaro
    antipsychotic: number;               // Risperdal, etc
  };
}

// Numbers are illustrative — derived from rough geographic priors:
//   - Sun-belt CA cities: higher GLP-1 (obesity rx), lower opioid
//   - College towns (Durham): higher stimulant
//   - SF: higher antipsychotic, lower opioid
//   - LA: high anxiolytic
export const regionalAffinity: RegionalAffinity[] = [
  {
    city: "Durham, NC",
    affinity: {
      schedule_iv_anxiolytic: 0.95,
      schedule_iii_opioid:    1.05,
      schedule_ii_stimulant:  1.40,    // Duke + UNC student population
      statin:                  1.00,
      glp1_agonist:            0.90,
      antipsychotic:           1.00,
    },
  },
  {
    city: "Raleigh, NC",
    affinity: {
      schedule_iv_anxiolytic: 1.00,
      schedule_iii_opioid:    1.10,
      schedule_ii_stimulant:  1.10,
      statin:                  1.05,
      glp1_agonist:            0.95,
      antipsychotic:           0.95,
    },
  },
  {
    city: "Charlotte, NC",
    affinity: {
      schedule_iv_anxiolytic: 1.05,
      schedule_iii_opioid:    1.15,
      schedule_ii_stimulant:  1.00,
      statin:                  1.10,
      glp1_agonist:            1.00,
      antipsychotic:           1.00,
    },
  },
  {
    city: "Los Angeles, CA",
    affinity: {
      schedule_iv_anxiolytic: 1.30,    // anxiolytic skew
      schedule_iii_opioid:    0.80,
      schedule_ii_stimulant:  1.20,
      statin:                  0.95,
      glp1_agonist:            1.40,    // GLP-1 hot
      antipsychotic:           0.95,
    },
  },
  {
    city: "San Diego, CA",
    affinity: {
      schedule_iv_anxiolytic: 1.10,
      schedule_iii_opioid:    0.85,
      schedule_ii_stimulant:  1.05,
      statin:                  1.00,
      glp1_agonist:            1.25,
      antipsychotic:           0.90,
    },
  },
  {
    city: "Sacramento, CA",
    affinity: {
      schedule_iv_anxiolytic: 1.00,
      schedule_iii_opioid:    0.95,
      schedule_ii_stimulant:  0.95,
      statin:                  1.05,
      glp1_agonist:            1.10,
      antipsychotic:           1.00,
    },
  },
  {
    city: "San Francisco, CA",
    affinity: {
      schedule_iv_anxiolytic: 1.05,
      schedule_iii_opioid:    0.65,    // SF outlier on opioids
      schedule_ii_stimulant:  1.10,
      statin:                  0.95,
      glp1_agonist:            1.30,
      antipsychotic:           1.20,
    },
  },
];

/**
 * Map an NDC manufacturer/product to its therapeutic class. Synthetic — would
 * derive from FDA NDC directory in production.
 */
export const ndcTherapeuticClass: Record<string, keyof RegionalAffinity["affinity"]> = {
  "00069-1080-04": "schedule_iv_anxiolytic",       // Pfizer Xanax 0.5mg
  "00069-2238-30": "schedule_iv_anxiolytic",       // Pfizer Lyrica 75mg (Schedule V actually but close enough for demo)
  "50458-0140-30": "schedule_iii_opioid",          // J&J Tylenol with Codeine
  "50458-0578-01": "schedule_ii_stimulant",        // J&J Concerta 36mg
  "00378-7058-93": "schedule_iii_opioid",          // Mylan Hydrocodone/APAP
  "00069-2587-30": "statin",                       // Pfizer Lipitor
  "00093-7159-56": "statin",                       // Teva Atorvastatin
  "50458-0220-10": "antipsychotic",                // J&J Risperdal
  "00069-0080-30": "statin",                       // Pfizer Norvasc — BP not statin, but lump for demo
};

export function findAffinityByCity(city: string): RegionalAffinity | undefined {
  return regionalAffinity.find((a) => a.city === city);
}
