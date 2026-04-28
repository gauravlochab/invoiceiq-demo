// ─── Action: Geocode Address ─────────────────────────────────────────────────
//
// Mock Google Maps geocoding (per plan §4.4 — no real API key in repo). For
// the demo the "geocoded" coordinates already live on PharmacyRecord; this
// action just adds latency + returns them so the UI can render a map preview.

import type { PharmacyRecord } from "../data/pharmacies";

export interface GeocodeResponse {
  source: "Google Maps Geocoding (mock)";
  query: string;
  /** Coordinates the address actually resolves to. */
  lat: number;
  lng: number;
  /** Distance in km between declared and geocoded coordinates. */
  declaredVsGeocodedKm: number;
  latencyMs: number;
}

const EARTH_KM = 6371;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}

export async function geocodeAddress(record: PharmacyRecord): Promise<GeocodeResponse> {
  const latencyMs = 350 + Math.floor(Math.random() * 250);
  await new Promise((r) => setTimeout(r, latencyMs));

  const distance = haversineKm(
    record.declaredLat,
    record.declaredLng,
    record.geocodedLat,
    record.geocodedLng,
  );

  return {
    source: "Google Maps Geocoding (mock)",
    query: `${record.address}, ${record.city}, ${record.state} ${record.zip}`,
    lat: record.geocodedLat,
    lng: record.geocodedLng,
    declaredVsGeocodedKm: Number(distance.toFixed(2)),
    latencyMs,
  };
}
