// ─── Task: License Verification ──────────────────────────────────────────────
//
// Per Rajesh (transcript 3, t=12:50–14:30): hit the state Board of Pharmacy
// site to check permit status. We mock the state board response and ALSO
// make one genuine NPI Registry call for the demo's "live API" wow factor.
//
// Pass criteria:
//   - State board permit is "active"
//   - NPI Registry confirms organization (or no NPI on file but state board OK)
//
// Warn criteria:
//   - State board active but NPI mismatch / not found / network down
//
// Fail criteria:
//   - State board permit is expired / suspended / inactive / not_found

import type { Task, TaskResult } from "../types";
import { queryStateBoard } from "../actions/queryStateBoard";
import { queryNpi } from "../actions/queryNpi";

export const verifyLicense: Task = {
  id: "verify_license",
  name: "License Verification",
  description: "State Board of Pharmacy permit active; NPI Registry confirms organization.",
  async run(ctx) {
    const startedAt = Date.now();
    const board = await queryStateBoard(ctx.order.pharmacy.id);

    // No record at all → outright fail
    if (!board.record) {
      return {
        status: "fail",
        message: `No record found at ${board.source} for ${ctx.order.pharmacy.name}.`,
        evidence: { stateBoard: board },
        durationMs: Date.now() - startedAt,
      };
    }

    // Always cross-reference NPI Registry (live call) — even on board fail it
    // adds audit value to the evidence.
    const npi = await queryNpi(ctx.order.pharmacy.npi);

    const boardStatus = board.record.status;
    if (boardStatus === "active") {
      // Pass + warn distinction based on NPI signal
      if (npi.status === "Active" || (!ctx.order.pharmacy.npi && npi.rawError === "no NPI on file")) {
        return {
          status: "pass",
          message: `Permit ${board.record.permitNumber} active until ${board.record.expiry}; NPI Registry confirmed.`,
          evidence: { stateBoard: board, npi },
          durationMs: Date.now() - startedAt,
        };
      }
      return {
        status: "warn",
        message: `Permit ${board.record.permitNumber} active, but NPI verification incomplete (${npi.status ?? "unknown"}).`,
        evidence: { stateBoard: board, npi },
        durationMs: Date.now() - startedAt,
      };
    }

    // Anything other than active → fail
    return {
      status: "fail",
      message: `Permit ${board.record.permitNumber} is ${boardStatus} (expired ${board.record.expiry}).`,
      evidence: { stateBoard: board, npi },
      durationMs: Date.now() - startedAt,
    };
  },
};
