// ─── Task: Address Verification ──────────────────────────────────────────────
//
// Per Rajesh (transcript 3, t=06:00–07:00): create a made-up DB of pharmacy
// addresses, look up + cross-check via Google Maps coordinates.
//
// Pass criteria:
//   - Pharmacy exists in the address DB
//   - Declared coordinates and geocoded coordinates are within 1 km
//
// Warn criteria:
//   - DB hit but distance 1-10 km (could be moved branch / data lag)
//
// Fail criteria:
//   - Not in DB, OR distance > 10 km

import type { Task, TaskResult } from "../types";
import { queryPharmacyDb } from "../actions/queryPharmacyDb";
import { geocodeAddress } from "../actions/geocodeAddress";

const PASS_KM = 1;
const WARN_KM = 10;

export const verifyAddress: Task = {
  id: "verify_address",
  name: "Address Verification",
  description: "Pharmacy on file in distributor's address DB; coordinates match Google Maps geocode.",
  async run(ctx) {
    const startedAt = Date.now();
    const dbRes = await queryPharmacyDb(ctx.order.pharmacy.id);

    if (!dbRes.found || !dbRes.record) {
      const result: TaskResult = {
        status: "fail",
        message: `Pharmacy "${ctx.order.pharmacy.name}" not on file in distributor's address database.`,
        evidence: { db: dbRes },
        durationMs: Date.now() - startedAt,
      };
      return result;
    }

    const geo = await geocodeAddress(dbRes.record);
    const distance = geo.declaredVsGeocodedKm;

    let status: TaskResult["status"];
    let message: string;
    if (distance <= PASS_KM) {
      status = "pass";
      message = `Address verified — declared and geocoded coordinates match within ${PASS_KM} km.`;
    } else if (distance <= WARN_KM) {
      status = "warn";
      message = `Address discrepancy — declared coordinates ${distance} km from geocoded location.`;
    } else {
      status = "fail";
      message = `Address mismatch — declared coordinates ${distance} km from actual address geocode.`;
    }

    return {
      status,
      message,
      evidence: { db: dbRes, geocode: geo },
      durationMs: Date.now() - startedAt,
    };
  },
};
