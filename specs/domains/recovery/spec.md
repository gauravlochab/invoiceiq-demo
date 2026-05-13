# Recovery Queue -- Specification

## Overview
The Recovery page is the operational hub for tracking vendor overpayment recovery. It displays a queue of recovery cases initiated by AI agents, each tied to a detected exception. Analysts can record outcomes (full recovery, partial, dispute, write-off), track SLA compliance against Parkland Health AP Policy 4.3, view recovery trend charts, and perform bulk actions like escalation and follow-up emails. The page connects upstream to the exception detection pipeline and downstream to vendor scoring.

## Layout
- **Header region**: Title "Recovery Queue" with a TrendingUp icon, breadcrumb-style label ("Healthcare AP - Recovery Agent"), subtitle, and a "Refresh" button top-right.
- **Policy info banner**: A blue `alert-bar info` banner showing the Parkland Health Recovery Policy statement and policy reference number (AP-POL-4.3-2026).
- **Summary strip**: A 5-cell horizontal bar in a single `flex` row with `border-r` dividers, displaying: In Queue (count + active), Total Target (red), Recovered (green + percentage), Success Rate (color-coded), SLA Overdue (red if > 0). Shows skeleton loading for 400ms on mount.
- **Recovery Trend chart**: Full-width card with a Recharts `ComposedChart` showing two `Area` series -- "Target" (dashed stroke, red-tinted fill) and "Recovered" (solid stroke, green fill) -- over 12 months. Includes a custom tooltip and legend.
- **Two-column layout** (`grid grid-cols-1 lg:grid-cols-[1fr_320px]`):
  - **Left column**: Recovery queue table -- a card with a header row (select-all checkbox, "Active recoveries" label, SLA policy note), optional bulk action toolbar, and a list of `RecoveryRow` components separated by `divide-y`.
  - **Right column** (320px, sticky `top-4`): Four stacked cards:
    1. Recovery Agent stats (response rate bar, settlement rate bar, avg days to close)
    2. SLA Compliance breakdown (transition SLAs from config, escalation trigger)
    3. Agent Activity Log (timeline of 7 entries from all 5 agents, last 2 hours)
    4. Navigation link card to Vendor Scoring page

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

## AJ Feedback (Parkland Demo)
- Note: Pending -- no specific feedback for this module yet.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
