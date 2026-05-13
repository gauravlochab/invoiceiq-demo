# Multi-Agent Pipeline -- Specification

## Overview
The Pipeline page visualizes the InvoiceIQ Detect multi-agent architecture as a sequential 5-step flow. It lets analysts trigger a demo pipeline run that processes a sample invoice (STC-2026-19847) through all five AI agents in order -- Invoice, Validation, Compliance, Recovery, Insight -- with real-time status updates, animated transitions, and a chronological activity feed. This page exists to demonstrate the end-to-end invoice lifecycle and the handoff pattern between specialized agents.

## Layout
- **Header region**: Page title ("Multi-Agent Pipeline"), subtitle, and a "Run Pipeline" action button positioned top-right. The subtitle reads: "5 specialized agents -- each hands off to the next across the full invoice lifecycle."
- **Progress bar** (conditional): Appears only while a run is active or recently completed. Shows a horizontal progress bar (step N of 5) with a counter badge (e.g., "3/5"). Bar color switches from `--acl-primary` during run to `--agent-recovery` (green) on completion.
- **Agent cards row**: Five cards in a single horizontal `flex` row with `flex-1` per card (equal width). Cards are connected by ArrowRight icons in 32px-wide separator divs. Below each arrow, a handoff label describes what data passes between agents: "Flags + data", "Match results", "Audit verdict", "Recovery task".
- **Activity Feed**: Full-width card below the agent row. Has a header bar with a Clock icon, "Agent Activity Feed" title, a live indicator badge (during run), and an event count badge. Feed rows are in a scrollable `max-h-[400px]` container with `divide-y` separators.
- **Responsive behavior**: Horizontal padding uses `px-6 lg:px-8`. The agent card row does not wrap -- it relies on `flex-1 min-w-0` to compress cards on narrow viewports.

## Business Rules

### Agent Definitions (static)
Each agent has a fixed configuration:

| Step | Agent Name       | Role                     | Static Stat      | Static Sub-Stat       |
|------|------------------|--------------------------|-------------------|-----------------------|
| 1    | Invoice Agent    | Extraction & Triage      | 1,847 processed   | 0 errors              |
| 2    | Validation Agent | Three-Way Match          | 188 exceptions    | 6 escalated           |
| 3    | Compliance Agent | Contract & Rebate Audit  | 12 alerts         | 3 contracts at risk   |
| 4    | Recovery Agent   | Vendor Outreach          | 14 in queue       | $470K target          |
| 5    | Insight Agent    | Risk Intelligence        | 18 vendors scored | 4 high-risk           |

### Step State Machine
Each agent card can be in one of five states: `idle`, `running`, `done`, `done-warn`, `done-fail`. State drives:
- **Border color**: `running` uses the agent's own color. `done-fail` uses `--pipeline-fail-border`. `done-warn` uses `--pipeline-warn-border`. `done` uses `--pipeline-pass-border`. `idle` uses `--border`.
- **Background tint**: Each state maps to its own CSS variable (e.g., `--pipeline-fail-bg`, `--pipeline-pass-bg`).
- **Icon**: `running` shows a spinning Loader2. `done-fail` shows AlertTriangle. `done` shows CheckCircle2. `idle` shows the agent's default icon.
- **Badge text**: `done-fail` shows "Exception found". `done-warn` shows "Flag raised". `done` shows "Passed". `running` shows "Processing..." with a pulsing dot. `idle` shows "Active" with a green dot.
- **BorderBeam**: Only the currently `running` card gets an animated MagicUI BorderBeam overlay.

### Pipeline Run Sequence
The hardcoded run results for each step are:
1. Invoice Agent -> `done-warn` ("Flag raised")
2. Validation Agent -> `done-fail` ("Exception found")
3. Compliance Agent -> `done` ("Passed")
4. Recovery Agent -> `done` ("Passed")
5. Insight Agent -> `done` ("Passed")

Each step takes 1,400ms in `running` state, then transitions to its result state. A 100ms gap separates steps. After all 5 complete, a toast notification fires: "Pipeline complete -- invoice STC-2026-19847 processed by all 5 agents". After 8 seconds of idle, all cards reset to `idle`.

### Activity Feed Events
- **Seed events** (5): Pre-populated entries from Insight, Recovery, Compliance, Validation, and Invoice agents with timestamps from 08:31 to 09:51. These appear on page load.
- **Run events** (5, one per agent): Prepended to the feed during a pipeline run. All share the same timestamp (current time when run starts). New events appear at the top with a `slideIn` animation.
- **Status icons**: `pass` = green CheckCircle2. `fail` = red AlertTriangle. `warn` = amber AlertTriangle. `info` = gray FileText.
- **Event count badge**: Shows the total number of events in the feed (seed + any run events).

## Data Model

### Interfaces
- **`FeedEvent`**: `{ agent: string, agentColor: string, time: string, message: string, status: "pass" | "warn" | "fail" | "info" }`
- **`StepState`**: Union type `"idle" | "running" | "done" | "done-warn" | "done-fail"`

### Data Sources
- All data is defined inline in `app/pipeline/page.tsx`. There are no external data imports from `lib/data.ts`.
- `AGENTS` array (5 elements): Static agent metadata.
- `SEED_EVENTS` array (5 elements): Initial activity feed entries.
- `RUN_EVENTS` array (5 elements): Events generated during a pipeline run.
- `RUN_RESULTS` array (5 elements): Determines the final state of each agent card after processing.

### Data Relationships
- Agent cards and run events are indexed by position (0-4). `RUN_EVENTS[i]` corresponds to `AGENTS[i]`.
- The `agentColor` in events matches the CSS custom property of the respective agent (e.g., `var(--agent-invoice)`).

## Workflow
1. **Page load**: All 5 agent cards render in `idle` state showing "Active" badges and static stats. The activity feed shows 5 seed events.
2. **User clicks "Run Pipeline"**: Button disables (shows spinner + "Running..."). Progress bar appears.
3. **Sequential processing**: Agents 1-5 activate one at a time. The active card gets a BorderBeam animation and "Processing..." badge. Its icon becomes a spinner.
4. **Step completion**: After 1,400ms, the active card transitions to its result state (`done-warn`, `done-fail`, or `done`). The corresponding event is prepended to the activity feed. The progress bar advances.
5. **Pipeline complete**: Toast notification fires. Button re-enables. Progress bar shows "Pipeline complete" with green fill.
6. **Auto-reset**: 8 seconds after the run finishes, all cards return to `idle` state.
7. **Navigation**: No outbound links. This is a standalone visualization page.

## AJ Feedback (Parkland Demo)
- Note: Pending -- no specific feedback for this module yet.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
