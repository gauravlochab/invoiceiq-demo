// ─── Action: Query City Demographics ─────────────────────────────────────────
//
// Backs the outliers task (per Rajesh's "Durham, pop. 1k, 500 pills" example
// in transcript 3, t=07:30). Returns the city's catchment population and
// controlled-substance baseline so the task can flag anomalous volumes.

import { findDemographicsByCity, type CityDemographics } from "../data/cityDemographics";

export interface DemographicsResponse {
  source: "Demographics Dataset (synthetic)";
  found: boolean;
  record: CityDemographics | null;
  latencyMs: number;
}

export async function queryDemographics(city: string): Promise<DemographicsResponse> {
  const latencyMs = 200 + Math.floor(Math.random() * 200);
  await new Promise((r) => setTimeout(r, latencyMs));

  const record = findDemographicsByCity(city) ?? null;
  return {
    source: "Demographics Dataset (synthetic)",
    found: record !== null,
    record,
    latencyMs,
  };
}
