# Multi-Agent Pipeline -- Specification

## Overview
The Pipeline page visualizes the InvoiceIQ Detect multi-agent architecture as a sequential 5-step flow. It lets analysts trigger a demo pipeline run that processes a sample invoice (STC-2026-19847) through all five AI agents in order -- Invoice, Validation, Compliance, Recovery, Insight -- with real-time status updates, animated transitions, and a chronological activity feed. This page exists to demonstrate the end-to-end invoice lifecycle and the handoff pattern between specialized agents.

## Acceptance Criteria

EARS notation.

**App shell**
- [ ] THE SYSTEM SHALL render the Pipeline page inside `SidebarProvider` + `SidebarInset` with `AppSidebar` and `SiteHeader`
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens

**Page structure**
- [ ] THE SYSTEM SHALL render the page title "Multi-Agent Pipeline" with subtitle "5 specialized agents — each hands off to the next across the full invoice lifecycle." and a shadcn `Button variant="default"` "Run Pipeline" action
- [ ] THE SYSTEM SHALL render exactly 5 agent cards (Invoice, Validation, Compliance, Recovery, Insight) using shadcn `Card` primitives in a horizontal `flex-1` row with arrow separators

**Run lifecycle**
- [ ] WHEN a user clicks "Run Pipeline" THE SYSTEM SHALL disable the button, render a spinner + "Running...", and reveal the progress bar
- [ ] WHILE a pipeline run is in progress THE SYSTEM SHALL transition agents sequentially: each agent stays in `running` state for 1,400ms, then transitions to its hardcoded result (`done-warn` / `done-fail` / `done`)
- [ ] THE SYSTEM SHALL place a 100ms gap between consecutive agent transitions
- [ ] WHEN all 5 agents complete THE SYSTEM SHALL fire a toast: "Pipeline complete — invoice STC-2026-19847 processed by all 5 agents"
- [ ] WHEN 8 seconds elapse after pipeline completion THE SYSTEM SHALL reset all agent cards to `idle` state

**Agent card states**
- [ ] WHILE an agent is in `running` state THE SYSTEM SHALL render the card with a `BorderBeam` animation overlay (MagicUI), a spinning `Loader2` icon, and a "Processing..." badge with pulsing dot
- [ ] THE SYSTEM SHALL render `done` agent cards with `bg-success/5 border-success`
- [ ] THE SYSTEM SHALL render `done-warn` agent cards with `bg-warning/5 border-warning`
- [ ] THE SYSTEM SHALL render `done-fail` agent cards with `bg-destructive/5 border-destructive`
- [ ] THE SYSTEM SHALL render `idle` agent cards with `bg-card border-border` and a static `Activity` icon

**Activity feed**
- [ ] THE SYSTEM SHALL render the activity feed as a full-width shadcn `Card` with `Clock` icon header, title "Agent Activity Feed", live `Badge` (during run), and event count `Badge`
- [ ] THE SYSTEM SHALL render the feed list in a scrollable `max-h-[400px]` container with `divide-y` row separators
- [ ] WHEN a pipeline run starts THE SYSTEM SHALL prepend new run events to the feed with a slide-in animation
- [ ] THE SYSTEM SHALL render event status icons using theme tokens: `text-success` for pass, `text-destructive` for fail, `text-warning` for warn, `text-muted-foreground` for info

**Loading and safety**
- [ ] WHEN the page mounts THE SYSTEM SHALL display shadcn `Skeleton` placeholders matching the 5 agent cards and activity feed for 400ms before real content
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable the BorderBeam, spinner, and feed slide-in animations
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on the "Run Pipeline" button

## Layout

Renders inside `SidebarProvider` + `SidebarInset` (per v2.0 app shell).

- **Header region**: Page title `text-2xl font-semibold` ("Multi-Agent Pipeline"), subtitle `text-sm text-muted-foreground`, and a shadcn `Button variant="default"` "Run Pipeline" positioned top-right. Subtitle: "5 specialized agents — each hands off to the next across the full invoice lifecycle."
- **Progress bar** (conditional): Shadcn `Progress` component, appears only while a run is active or recently completed. Shows step N of 5 with a counter `Badge variant="outline"` (e.g., "3/5"). Progress fill uses `bg-primary` during run, switches to `bg-success` on completion.
- **Agent cards row**: Five shadcn `Card` instances in a horizontal `flex` row with `flex-1` per card. Cards connected by `ArrowRight` icons (Lucide) in 32px-wide separator divs. Below each arrow, a handoff label `text-xs text-muted-foreground` describes data passing between agents: "Flags + data", "Match results", "Audit verdict", "Recovery task".
- **Activity Feed**: Full-width shadcn `Card`. `CardHeader` contains `Clock` icon, `CardTitle` "Agent Activity Feed", `CardAction` with live indicator `Badge variant="outline"` (during run) and event count `Badge variant="secondary"`. `CardContent` contains the scrollable `max-h-[400px]` feed with `divide-y divide-border` row separators.
- **Responsive behavior**: Horizontal padding uses `px-4 lg:px-6` (v2.0 standard). The agent card row uses `flex-1 min-w-0` to compress cards on narrow viewports.

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
Each agent card can be in one of five states: `idle`, `running`, `done`, `done-warn`, `done-fail`. State drives (all colors via v2.0 shadcn theme tokens):
- **Border + background**: `running` uses `border-[var(--agent-*)]` (per-agent accent). `done-fail` uses `bg-destructive/5 border-destructive`. `done-warn` uses `bg-warning/5 border-warning`. `done` uses `bg-success/5 border-success`. `idle` uses `bg-card border-border`.
- **Icon**: `running` shows a spinning `Loader2`. `done-fail` shows `AlertTriangle` in `text-destructive`. `done-warn` shows `AlertTriangle` in `text-warning`. `done` shows `CheckCircle2` in `text-success`. `idle` shows the agent's default Lucide icon.
- **Badge** (shadcn `Badge`): `done-fail` `variant="destructive"` "Exception found". `done-warn` styled `bg-warning/10 text-warning border-warning` "Flag raised". `done` styled `bg-success/10 text-success border-success` "Passed". `running` `variant="outline"` "Processing..." with a pulsing `bg-primary` dot. `idle` `variant="outline"` "Active" with a `bg-success` dot.
- **BorderBeam**: Only the currently `running` card gets an animated MagicUI BorderBeam overlay tinted with the agent's color via `bg-[var(--agent-*)]`.

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
- **Status icons** (v2.0 theme tokens): `pass` = `CheckCircle2` in `text-success`. `fail` = `AlertTriangle` in `text-destructive`. `warn` = `AlertTriangle` in `text-warning`. `info` = `FileText` in `text-muted-foreground`.
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
1. **Page load**: 400ms simulated loading with skeleton placeholders for 5 agent pipeline cards (icon, name, stats, badge) connected by arrow separators, plus activity feed skeleton (header + 5 row placeholders). After loading, all 5 agent cards render in `idle` state showing "Active" badges and static stats. The activity feed shows 5 seed events.
2. **User clicks "Run Pipeline"**: Button disables (shows spinner + "Running..."). Progress bar appears.
3. **Sequential processing**: Agents 1-5 activate one at a time. The active card gets a BorderBeam animation and "Processing..." badge. Its icon becomes a spinner.
4. **Step completion**: After 1,400ms, the active card transitions to its result state (`done-warn`, `done-fail`, or `done`). The corresponding event is prepended to the activity feed. The progress bar advances.
5. **Pipeline complete**: Toast notification fires. Button re-enables. Progress bar shows "Pipeline complete" with green fill.
6. **Auto-reset**: 8 seconds after the run finishes, all cards return to `idle` state.
7. **Navigation**: No outbound links. This is a standalone visualization page.

## State Machine

See `### Step State Machine` under Business Rules above. Each agent card transitions through: `idle -> running -> done | done-warn | done-fail`. The pipeline itself is sequential -- agent N+1 cannot start until agent N completes.

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Extract | triggered by | Pipeline runs after invoice extraction completes |
| Exceptions | feeds into | Validation and Compliance agents create exceptions |
| Dashboard | feeds into | Agent completion status and processing counts displayed on dashboard |
| Recovery | feeds into | Recovery agent creates recovery cases from confirmed overcharges |

## Forbidden Patterns

Use affirmative phrasing per SpecLayer v1.1.

- **Process agents strictly in defined order (Invoice → Validation → Compliance → Recovery → Insight)** — Reason: each agent's output is the next agent's input; skipping breaks downstream agents (Compliance running on unvalidated data, etc.).
- **Run agents sequentially, one at a time** — Reason: handoff is by design; parallel execution creates race conditions on shared state.
- **Require explicit user action ("Run Pipeline" click) to start a new run, including after a failure** — Reason: a failed step may indicate a data quality issue that needs investigation, not a retry.
- **Treat agent definitions (colors, roles, stats) as immutable at runtime** — Reason: dynamic agent changes would break the pipeline visualization and audit trail.
- **Use shadcn `Card` for agent cards and the activity feed surface** — Reason: ad-hoc `<div className="card">` deprecated in ui-standard.md v2.0.
- **Use shadcn `Badge` for agent state badges (Processing / Passed / Flag raised / Exception found / Active)** — Reason: deprecates `.badge.*` utility classes.
- **Use theme tokens (`text-success` / `text-destructive` / `text-warning` / `text-muted-foreground`, `bg-*\/5` for tinted backgrounds, `border-*`) for all colored states** — Reason: hex tokens (`--pipeline-pass-*`, `--pipeline-fail-*`, `--pipeline-warn-*`) removed in v2.0.
- **Use shadcn `Progress` for the run progress bar** — Reason: replaces custom horizontal progress div; consistent disabled and accessibility states.

## AJ Feedback (Parkland Demo)
- Note: Pending -- no specific feedback for this module yet.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-14: Added 400ms loading state with skeleton placeholders (5 agent cards + activity feed) -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system per ui-standard.md v2.0. App shell wraps in SidebarProvider+SidebarInset. Agent cards and activity feed → shadcn `Card`. Run Pipeline button + activity feed badges → shadcn `Button` / `Badge` variants. Progress bar → shadcn `Progress`. Loading → shadcn `Skeleton`. All v1 pipeline tokens (`--pipeline-pass-bg`, `--pipeline-fail-border`, etc.) migrated to v2 theme tokens (`bg-success/5`, `border-destructive`, etc.). Activity feed status icons retokenized to `text-success` / `text-destructive` / `text-warning` / `text-muted-foreground`. Added 17 EARS Acceptance Criteria covering app shell, run lifecycle, agent card states, activity feed, loading, accessibility. Forbidden Patterns rewritten in affirmative form per SpecLayer v1.1. -->
