# Recovery Queue -- Specification

## Overview
The Recovery page is the operational hub for tracking vendor overpayment recovery. It displays a queue of recovery cases initiated by AI agents, each tied to a detected exception. Analysts can record outcomes (full recovery, partial, dispute, write-off), track SLA compliance against Parkland Health AP Policy 4.3, view recovery trend charts, and perform bulk actions like escalation and follow-up emails. The page connects upstream to the exception detection pipeline and downstream to vendor scoring.

## Acceptance Criteria

EARS notation.

**App shell**
- [ ] THE SYSTEM SHALL render the Recovery page inside `SidebarProvider` + `SidebarInset` with `AppSidebar` and `SiteHeader`
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens

**Policy banner and summary**
- [ ] THE SYSTEM SHALL render the Parkland AP Policy 4.3 statement in a shadcn `Alert` styled `bg-primary/5 border-primary` with policy reference "AP-POL-4.3-2026"
- [ ] THE SYSTEM SHALL render the summary strip as a 5-cell horizontal flex row with `divide-x divide-border` separators: In Queue, Total Target (`text-destructive`), Recovered (`text-success` + percentage), Success Rate (color-coded), SLA Overdue (`text-destructive` if > 0, `text-muted-foreground` if 0)
- [ ] THE SYSTEM SHALL color the Success Rate using `text-success` ≥ 80%, `text-warning` ≥ 50%, `text-destructive` < 50%

**Recovery trend chart**
- [ ] THE SYSTEM SHALL render a full-width shadcn `Card` containing a Recharts `ComposedChart` with two `Area` series — Target (dashed stroke `var(--destructive)`, tint `var(--destructive)/20%`) and Recovered (solid stroke `var(--success)`, fill `var(--success)/30%`)
- [ ] THE SYSTEM SHALL include a custom tooltip and legend rendered with theme tokens (`bg-popover text-popover-foreground border-border`)

**Recovery queue (left column)**
- [ ] THE SYSTEM SHALL render the queue as a shadcn `Card` containing select-all `Checkbox`, "Active recoveries" label, SLA policy note, optional bulk action toolbar, and a list of `RecoveryRow` items separated by `divide-y divide-border`
- [ ] WHEN at least one actionable row (status `pending` or `in_progress`) is selected THE SYSTEM SHALL render the bulk action toolbar with shadcn `Button` "Bulk Escalate", "Send Follow-up Emails", "Export Selected"
- [ ] WHEN the select-all checkbox is in partial-selection state THE SYSTEM SHALL render the indeterminate visual
- [ ] WHEN a user clicks an actionable row THE SYSTEM SHALL expand it to show the outcome recording form and status history timeline

**SLA badges**
- [ ] THE SYSTEM SHALL render SLA badges using shadcn `Badge` with theme-derived styling: `variant="destructive"` for overdue/critical, `bg-warning/10 text-warning border-warning` for warning, `bg-success/10 text-success border-success` for ok
- [ ] THE SYSTEM SHALL hide the SLA badge for records with status `recovered` or `closed`

**Right column (320px sticky)**
- [ ] THE SYSTEM SHALL render exactly four stacked shadcn `Card` instances: Recovery Agent stats (with shadcn `Progress` bars), SLA Compliance breakdown, Agent Activity Log (7 entries), Vendor Scoring navigation link
- [ ] THE SYSTEM SHALL render the right column with `lg:sticky lg:top-4`

**Outcome recording**
- [ ] WHEN a user selects "Fully Recovered" THE SYSTEM SHALL set status to `recovered` and require recovered amount > 0
- [ ] WHEN a user selects "Partially Recovered" THE SYSTEM SHALL set status to `partial` and require recovered amount > 0
- [ ] WHEN a user selects "Vendor Filed Dispute" or "Vendor Unresponsive" THE SYSTEM SHALL keep status `in_progress` and allow amount 0
- [ ] WHEN a user selects "Closed — Write Off" THE SYSTEM SHALL set status to `closed` and allow amount 0
- [ ] WHEN a bulk action completes THE SYSTEM SHALL clear the selection and fire a toast

**Loading and safety**
- [ ] WHEN the page mounts THE SYSTEM SHALL display shadcn `Skeleton` placeholders for the summary strip, trend chart, queue, and right column for 400ms before real content
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable all expand/collapse and chart entrance animations
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on all interactive elements

## Layout

Renders inside `SidebarProvider` + `SidebarInset` (per v2.0 app shell).

- **Header region**: Title `text-2xl font-semibold` "Recovery Queue" with a `TrendingUp` Lucide icon, breadcrumb-style label `text-sm text-muted-foreground` ("Healthcare AP - Recovery Agent"), subtitle, and a shadcn `Button variant="outline"` "Refresh" top-right.
- **Policy info banner**: shadcn `Alert` styled `bg-primary/5 border-primary` showing the Parkland Health Recovery Policy statement and policy reference (AP-POL-4.3-2026).
- **Summary strip**: A 5-cell horizontal `flex` row with `divide-x divide-border` separators, displaying: In Queue (count + active count `text-muted-foreground`), Total Target (`text-destructive`), Recovered (`text-success` + percentage), Success Rate (color-coded per Acceptance Criteria), SLA Overdue (`text-destructive` if > 0). Shadcn `Skeleton` for 400ms on mount.
- **Recovery Trend chart**: Full-width shadcn `Card` with `CardHeader` (`CardTitle` "Recovery Trend") and `CardContent` containing the Recharts `ComposedChart` per Acceptance Criteria.
- **Two-column layout** (`grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6`):
  - **Left column**: Recovery queue card per Acceptance Criteria.
  - **Right column** (320px, `lg:sticky lg:top-4`): Four stacked shadcn `Card` instances per Acceptance Criteria.

## Business Rules

### Summary Metrics (computed from records)
- **In Queue**: `records.length` total, with `pendingCount` = records where status is `pending` or `in_progress`.
- **Total Target**: Sum of all `targetAmount` values.
- **Recovered**: Sum of all `recoveredAmount` values. Percentage shown as `(totalRecovered / totalTarget) * 100`.
- **Success Rate**: `(records with status "recovered" / total records) * 100`. Color: green >= 80%, amber >= 50%, red < 50%.
- **SLA Overdue**: Count of records where status is not `recovered`/`closed`, has an `slaDeadline`, and `daysUntilDeadline < 0`.

### SLA Compliance (from PARKLAND_RECOVERY_CONFIG)
SLA transitions:
| From              | To                | SLA (business days) |
|-------------------|-------------------|---------------------|
| Identified        | Vendor Contacted  | 2                   |
| Vendor Contacted  | Under Review      | 5                   |
| Under Review      | Credit Pending    | 10                  |
| Credit Pending    | Resolved          | 15                  |

Escalation trigger: 10 business days with no vendor response after initial contact.

### SLA Badge Logic
- Not shown for `recovered` or `closed` records.
- Urgency levels: `overdue` (days < 0), `critical` (days <= 2), `warning` (days <= 5), `ok` (days > 5).
- Each urgency level has distinct text, background, border, and dot colors defined in `lib/recovery-config.ts`.

### Outcome Recording
When an analyst expands a record and submits an outcome:
- **"Fully Recovered"** -> status becomes `recovered`
- **"Partially Recovered"** -> status becomes `partial`
- **"Vendor Filed Dispute"** or **"Vendor Unresponsive"** -> status stays `in_progress`
- **"Closed -- Write Off"** -> status becomes `closed`

Validation: Amount must be > 0 unless outcome is "Vendor Unresponsive", "Vendor Filed Dispute", or "Closed -- Write Off".

### Bulk Actions
Available when 1+ actionable records are selected:
- **Bulk Escalate**: Shows toast "{N} record(s) escalated".
- **Send Follow-up Emails**: Shows toast "Follow-up emails sent for {N} record(s)".
- **Export Selected**: Shows toast "{N} record(s) exported".
Selection clears after any bulk action.

### Select-All Logic
- Only actionable records (status `pending` or `in_progress`) participate in select-all.
- Checkbox supports indeterminate state when only some actionable records are selected.

### Status-to-Phase Mapping (legacy compatibility)
| Legacy Status  | Display Phase      |
|----------------|--------------------|
| pending        | Vendor Contacted   |
| in_progress    | Under Review       |
| recovered      | Resolved           |
| partial        | Credit Pending     |
| closed         | Resolved           |

## Data Model

### Interfaces
- **`RecoveryRecord`**: `{ id, exceptionId, vendor, invoiceNumber, targetAmount, status: RecoveryStatus, initiatedAt, emailSentTo, recoveredAmount?, closedReason?, analystNote?, slaDeadline?, lastContactDate?, nextFollowupDate?, statusHistory?: StatusHistoryEntry[] }`
- **`RecoveryStatus`**: `"pending" | "in_progress" | "recovered" | "partial" | "closed"`
- **`StatusHistoryEntry`**: `{ status: string, date: string, note?: string }`
- **`RecoveryPhase`**: `"identified" | "vendor_contacted" | "under_review" | "credit_pending" | "resolved" | "escalated"`

### Data Sources
- **`recoveryQueue`** from `lib/data.ts`: Mutable array of `RecoveryRecord` objects. State is modified in-place via `updateRecoveryRecord()`.
- **`recoveryTrendData`** from `lib/data.ts`: 12 months of `{ month, target, recovered, successRate }` objects for the trend chart.
- **`vendorCategoryMap`** from `lib/data.ts`: Maps vendor name to category string.
- **`PARKLAND_RECOVERY_CONFIG`** from `lib/recovery-config.ts`: Policy statement, SLA transitions, escalation triggers, phase definitions.
- **`AGENT_LOG`**: Inline array of 7 agent activity entries defined in the page component.

### Data Relationships
- Each `RecoveryRecord.exceptionId` links to an exception in the exceptions queue.
- Vendor names in recovery records map to categories via `vendorCategoryMap`.
- Recovery percentages feed into vendor scoring (linked via the bottom-right navigation card).

## Workflow
1. **Page load**: Records load from `recoveryQueue` with a 400ms simulated loading delay (skeleton UI). Summary strip, trend chart, and right sidebar populate.
2. **Browse queue**: Analyst scrolls the recovery queue. Each row shows ID, status badge, phase badge, SLA countdown badge, vendor (with category), invoice number, analyst note, contact info (email, last contact date, next follow-up), initiated date, and target/recovered amounts with a progress bar.
3. **Expand a record**: Clicking an actionable row (pending/in_progress) expands it to show the outcome recording form and status history timeline.
4. **Record outcome**: Analyst enters recovered amount, selects an outcome from the dropdown, optionally adds notes, and clicks "Save outcome". Record status updates, toast confirms, row collapses.
5. **Bulk operations**: Analyst checks multiple rows via checkboxes. A toolbar appears with "Bulk Escalate", "Send Follow-up Emails", and "Export Selected" buttons.
6. **Refresh**: Clicking "Refresh" reloads records from the mutable `recoveryQueue` array and shows a toast.
7. **Navigation**: "Vendor Recovery Scores" card at the bottom-right links to `/vendor-scoring`.

## State Machine

```
pending ──→ in_progress ──→ recovered
                │              
                ├──→ partial   
                │              
                └──→ closed    
```

| From | To | Trigger | Actor |
|------|----|---------|-------|
| pending | in_progress | Analyst opens case and begins review | User |
| in_progress | recovered | Analyst records "Fully Recovered" with amount > 0 | User |
| in_progress | partial | Analyst records "Partially Recovered" with amount > 0 | User |
| in_progress | closed | Analyst records "Closed -- Write Off" | User |
| in_progress | in_progress | Analyst records "Vendor Filed Dispute" or "Vendor Unresponsive" | User |

Terminal states: `recovered`, `partial`, `closed`. No transitions out of terminal states.

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Exceptions | reads from | Each recovery record links to an exception via `exceptionId` |
| Vendor Scoring | feeds into | Recovery success rates influence vendor risk scores |
| Dashboard | feeds into | Recovery target/recovered amounts displayed on dashboard KPIs |
| Pipeline | triggered by | Recovery agent in pipeline creates recovery cases |

## Forbidden Patterns

Use affirmative phrasing per SpecLayer v1.1.

- **Require a verified amount > 0 to mark a recovery as `recovered` or `partial`** — Reason: zero-amount completions are data errors; recovery means actual money returned.
- **Respect Parkland AP Policy 4.3 SLA timelines before auto-escalation** — Reason: premature escalation damages vendor relationships.
- **Append new outcomes as new entries rather than editing or deleting prior ones** — Reason: outcomes are audit events; corrections record a new outcome with a note referencing the original.
- **Require analyst review of the recipient list before sending bulk follow-up emails** — Reason: automated emails to wrong vendors or closed cases damage relationships and create legal exposure.
- **Use shadcn `Card`, `Alert`, `Badge`, `Button`, `Checkbox`, `Progress` primitives for the queue surface, banner, badges, buttons, selection, and progress indicators** — Reason: deprecates ad-hoc `.alert-bar`, `.card`, `.badge.*` utility classes from v1.
- **Use theme tokens (`bg-card`, `text-foreground`, `text-destructive`, `text-warning`, `text-success`, `text-muted-foreground`) for all surfaces and status text** — Reason: hex tokens (`--critical`, `--warning`, `--success`, `--text-primary`) removed in v2.0.
- **Use chart series tokens (`var(--destructive)` for Target, `var(--success)` for Recovered) for the trend chart** — Reason: status overlays use semantic tokens, not chart-1..5 palette.

## AJ Feedback (Parkland Demo)

### AJ Feedback (Recording 17)

- **Positive reaction**: "Very good. I like that." Recovery tracking with progress/pending/denied status was well-received.
- **Parkland policy alignment needed**: Recovery workflow must align with Parkland's specific vendor recovery policies. "We have to get with Parkland to understand what's your policy and how do you work with the vendors."

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-14: Added AJ feedback from Recording 17 — positive reaction, Parkland policy alignment needed -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system per ui-standard.md v2.0. App shell wraps in SidebarProvider+SidebarInset. Policy banner → shadcn `Alert` styled bg-primary/5. Summary strip retokenized to text-destructive / text-success / text-warning. Recovery trend chart uses var(--destructive) for Target, var(--success) for Recovered (semantic status tokens, not chart-1..5 palette). Queue card and right-column cards → shadcn `Card`. SLA badges → shadcn `Badge` with variant/styled theming. Bulk actions, refresh, outcome form → shadcn `Button` variants. Progress bars in Recovery Agent stats → shadcn `Progress`. Loading → `Skeleton`. Added 20 EARS Acceptance Criteria covering app shell, banner/summary, trend chart, queue, SLA badges, right column, outcome recording, loading, accessibility. Forbidden Patterns rewritten in affirmative form per SpecLayer v1.1. -->
