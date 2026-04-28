// ─── SOM Mock Data — City Demographics (for Outliers task) ───────────────────
//
// Per Rajesh (transcript 3, t=07:30): "one city has a population of thousand
// people, but suddenly they are asking for 500 pills". The outliers task uses
// this to flag controlled-substance order quantities that are abnormal for the
// pharmacy's catchment population.
//
// Phase 2 ships 5 cities matching the pharmacies dataset. Phase 4 will widen
// to 10+ per plan §4.6.

export interface CityDemographics {
  /** Display key, matches PharmacyRecord.demographicsCity. */
  city: string;
  state: "NC" | "CA";
  /** ZIP-3 catchment population (synthetic estimate). */
  catchmentPopulation: number;
  /** Median age (years). Used for prescription-baseline modelling. */
  medianAge: number;
  /**
   * Baseline monthly volume of controlled-substance dispenses for a typical
   * single pharmacy in this catchment. Used as an anchor for the outlier check:
   * orders >3× baseline trigger a warning, >5× a fail.
   */
  controlledSubstanceMonthlyBaseline: number;
}

export const cityDemographics: CityDemographics[] = [
  {
    city: "Durham, NC",
    state: "NC",
    catchmentPopulation: 287_500,
    medianAge: 35.2,
    controlledSubstanceMonthlyBaseline: 1_800,
  },
  {
    city: "Raleigh, NC",
    state: "NC",
    catchmentPopulation: 470_000,
    medianAge: 34.6,
    controlledSubstanceMonthlyBaseline: 2_400,
  },
  {
    city: "Charlotte, NC",
    state: "NC",
    catchmentPopulation: 870_000,
    medianAge: 34.0,
    controlledSubstanceMonthlyBaseline: 3_100,
  },
  {
    city: "San Diego, CA",
    state: "CA",
    catchmentPopulation: 1_380_000,
    medianAge: 35.6,
    controlledSubstanceMonthlyBaseline: 4_200,
  },
  {
    city: "Los Angeles, CA",
    state: "CA",
    catchmentPopulation: 3_900_000,
    medianAge: 36.5,
    controlledSubstanceMonthlyBaseline: 9_800,
  },
  {
    city: "Sacramento, CA",
    state: "CA",
    catchmentPopulation: 525_000,
    medianAge: 35.1,
    controlledSubstanceMonthlyBaseline: 2_700,
  },
];

export function findDemographicsByCity(city: string): CityDemographics | undefined {
  return cityDemographics.find((d) => d.city === city);
}
