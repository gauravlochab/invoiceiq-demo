// ─── SOM (Suspicious Order Monitoring) — Core Types ───────────────────────────
//
// Layered architecture (per docs/PLAN_SOM_DRUG_DISTRIBUTOR.md §3):
//   UI LAYER       → app/som/...
//   WORKFLOW LAYER → lib/som/workflows/   composes Tasks
//   TASK LIBRARY   → lib/som/tasks/       composes Actions
//   ACTION LIBRARY → lib/som/actions/     atomic queries/lookups
//   DATA LAYER     → lib/som/data/        typed mock data
//
// This is a degenerate, in-process version of Rajesh's full vision
// (CrewAI / LangChain + MCP). Promotion to real agent runtime is deferred.

// ─── Result of a single Task run ──────────────────────────────────────────────

export type TaskStatus = "pass" | "warn" | "fail" | "error";

export interface TaskResult {
  /** Outcome of the check. */
  status: TaskStatus;
  /** Short human-readable message for the UI (≤ ~120 chars). */
  message: string;
  /** Free-form structured evidence the UI/audit log can render. */
  evidence: Record<string, unknown>;
  /** How long the task took (ms). Used for the running animation. */
  durationMs: number;
}

// ─── Workflow context passed to every Task ────────────────────────────────────

export interface PharmacyRef {
  id: string;
  name: string;
  permitNumber?: string;
  npi?: string;
  state: string;
  city: string;
  address: string;
}

export interface OrderLineItem {
  ndc: string;            // National Drug Code
  manufacturer: string;
  description: string;
  quantity: number;
  unit: string;           // "bottle" | "case" | etc
  unitPrice: number;      // what the pharmacy is being charged
  isControlled: boolean;
}

export interface IncomingOrder {
  id: string;
  receivedAt: string;     // ISO datetime
  pharmacy: PharmacyRef;
  lineItems: OrderLineItem[];
  totalAmount: number;
  /** Hint to the demo to show a "fresh order" arrival animation. */
  isFresh?: boolean;
}

/**
 * Mutable context threaded through every Task in a Workflow run.
 * Tasks may read prior results and write evidence here.
 */
export interface WorkflowContext {
  order: IncomingOrder;
  /** Results indexed by Task.id, populated as the workflow runs. */
  results: Record<string, TaskResult>;
  /** Optional flags for downstream tasks (e.g. "skipPriceCheck"). */
  flags: Record<string, boolean>;
}

// ─── Task & Workflow primitives ───────────────────────────────────────────────

export interface Task {
  id: string;
  name: string;
  /** Optional short description shown under the task title in the UI. */
  description?: string;
  /** The actual check. Must return a TaskResult, never throw. */
  run: (ctx: WorkflowContext) => Promise<TaskResult>;
}

export interface Workflow {
  id: string;
  name: string;
  /** Tasks executed in declared order. */
  tasks: Task[];
}

// ─── Workflow execution & UI streaming ────────────────────────────────────────

/** Per-task lifecycle state — drives the animated cards in the runner UI. */
export type TaskRunStatus = "pending" | "running" | "done";

export interface TaskRunState {
  taskId: string;
  status: TaskRunStatus;
  /** Populated once status === "done". */
  result?: TaskResult;
}

export interface WorkflowRunState {
  workflowId: string;
  orderId: string;
  startedAt: string;
  finishedAt?: string;
  /** Per-task states in the same order as workflow.tasks. */
  tasks: TaskRunState[];
  /** True if every task has run (regardless of pass/warn/fail). */
  isComplete: boolean;
  /** Worst status across all completed tasks: pass < warn < fail < error. */
  overallStatus?: TaskStatus;
}

/** Callback fired after every task transition so the UI can re-render. */
export type WorkflowProgressFn = (state: WorkflowRunState) => void;

// ─── SOM-specific exception types (cross over to lib/data.ts) ─────────────────
//
// These get added to ExceptionType in lib/data.ts so SOM exceptions flow into
// the same unified inbox.

export type SomExceptionType =
  | "som_address_mismatch"
  | "som_license_invalid"
  | "som_price_deviation"
  | "som_quantity_outlier";
