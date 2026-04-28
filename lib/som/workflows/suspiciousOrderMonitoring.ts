// ─── Workflow: Suspicious Order Monitoring ───────────────────────────────────
//
// Composes the 4 SOM tasks in declared order. Per plan §2.3 + transcript 3:
//
//   1. Address Verification
//   2. License Verification (includes one live NPI Registry call)
//   3. Price Deviation
//   4. Volume Outliers
//
// Includes a runner helper (`runSuspiciousOrderMonitoring`) that streams
// per-task lifecycle transitions to a callback so the UI can animate cards
// going from pending → running → done.

import type {
  IncomingOrder,
  TaskStatus,
  Workflow,
  WorkflowContext,
  WorkflowProgressFn,
  WorkflowRunState,
} from "../types";
import { verifyAddress } from "../tasks/verifyAddress";
import { verifyLicense } from "../tasks/verifyLicense";
import { checkPriceDeviation } from "../tasks/checkPriceDeviation";
import { detectOutliers } from "../tasks/detectOutliers";

export const suspiciousOrderMonitoring: Workflow = {
  id: "suspicious_order_monitoring",
  name: "Suspicious Order Monitoring",
  tasks: [verifyAddress, verifyLicense, checkPriceDeviation, detectOutliers],
};

// ─── Status combination ──────────────────────────────────────────────────────

const RANK: Record<TaskStatus, number> = { pass: 0, warn: 1, fail: 2, error: 3 };

function worstStatus(a: TaskStatus, b: TaskStatus): TaskStatus {
  return RANK[a] >= RANK[b] ? a : b;
}

// ─── Streaming runner ────────────────────────────────────────────────────────

/**
 * Executes the workflow against `order`, calling `onProgress` after each task
 * lifecycle transition. The returned promise resolves with the final state.
 *
 * Tasks must never throw; if one does we wrap it as a synthetic "error" result
 * so the workflow can continue and the UI can render it.
 */
export async function runSuspiciousOrderMonitoring(
  order: IncomingOrder,
  onProgress: WorkflowProgressFn,
): Promise<WorkflowRunState> {
  const workflow = suspiciousOrderMonitoring;
  const ctx: WorkflowContext = { order, results: {}, flags: {} };

  const state: WorkflowRunState = {
    workflowId: workflow.id,
    orderId: order.id,
    startedAt: new Date().toISOString(),
    tasks: workflow.tasks.map((t) => ({ taskId: t.id, status: "pending" })),
    isComplete: false,
  };

  // Initial render — all pending
  onProgress({ ...state, tasks: state.tasks.map((t) => ({ ...t })) });

  for (let i = 0; i < workflow.tasks.length; i++) {
    const task = workflow.tasks[i];
    state.tasks[i] = { taskId: task.id, status: "running" };
    onProgress({ ...state, tasks: state.tasks.map((t) => ({ ...t })) });

    try {
      const result = await task.run(ctx);
      ctx.results[task.id] = result;
      state.tasks[i] = { taskId: task.id, status: "done", result };
    } catch (err) {
      const result = {
        status: "error" as const,
        message: `Task threw — ${err instanceof Error ? err.message : "unknown error"}`,
        evidence: {},
        durationMs: 0,
      };
      ctx.results[task.id] = result;
      state.tasks[i] = { taskId: task.id, status: "done", result };
    }
    onProgress({ ...state, tasks: state.tasks.map((t) => ({ ...t })) });
  }

  // Aggregate overall status
  const completed = state.tasks
    .map((t) => t.result?.status)
    .filter((s): s is TaskStatus => Boolean(s));
  const overallStatus = completed.length
    ? completed.reduce<TaskStatus>(worstStatus, "pass")
    : undefined;

  state.isComplete = true;
  state.finishedAt = new Date().toISOString();
  state.overallStatus = overallStatus;
  onProgress({ ...state, tasks: state.tasks.map((t) => ({ ...t })) });

  return state;
}
