# Vendor Scoring -- Specification

## Overview
The Vendor Scoring page provides a risk-ranked table of all vendors with composite scores, discrepancy metrics, recovery rates, and actionable risk management controls. It serves as the Insight Agent's output -- consolidating exception data across the entire invoice lifecycle into per-vendor scorecards. Analysts use this page to identify high-risk vendors, flag or penalize problematic suppliers, and drill into each vendor's exception history.

## Layout
- **Header region**: Title "Vendor Scoring" with subtitle showing total vendor count and time period ("Q1 2026"). "Export Report" button top-right.
- **Summary strip**: A 5-cell horizontal bar (flex row with border dividers) inside a white card:
  1. Vendors Scored (total count)
  2. High Risk (count, red -- vendors with score < 40)
  3. Total Discrepancy (sum of all discrepancy amounts, amber)
  4. Avg Score (out of 100, color-coded)
  5. Avg Recovery (percentage, color-coded)
  Shows skeleton loading for 400ms on mount.
- **Vendor table**: A `data-table` inside a card with horizontal scroll support (`overflow-x-auto`, `min-w-[900px]`). Columns: expand chevron, Vendor, Invoices, Total Spend, Discrepancy, Discrepancy %, Recovery %, Score, Rating, Actions.
- **Pagination**: `DataTablePagination` component below the table. Default page size: 10 rows.
- **Expanded row**: When a vendor row is clicked, a sub-row appears below with exception history cards on a subtle background.
- **Responsive behavior**: `px-6 lg:px-8` padding. Table scrolls horizontally on narrow viewports.

## Business Rules

### Score Color Coding
| Score Range | Color        | CSS Class        |
|-------------|--------------|------------------|
| < 30        | Red          | `text-red-600`   |
| 30-59       | Amber        | `text-amber-600` |
| >= 60       | Green        | `text-emerald-600` |

### Rating Badges
| Rating       | Badge Style      |
|--------------|------------------|
| Critical     | `badge critical` |
| High Risk    | `badge warning`  |
| Medium Risk  | `badge neutral`  |
| Low Risk     | `badge success`  |

### Discrepancy Color Coding
| Discrepancy % | Color        |
|---------------|--------------|
| > 15%         | Red          |
| > 5%          | Amber        |
| <= 5%         | Default gray |

### Recovery Percentage Color Coding
| Recovery %  | Color        |
|-------------|--------------|
| >= 80%      | Green        |
| >= 40%      | Amber        |
| < 40%       | Red          |

### Row Background Tinting
Rows with high discrepancy percentages get subtle background tints:
- Discrepancy > 15%: `bg-red-50/50`
- Discrepancy > 5%: `bg-amber-50/30`
- Discrepancy <= 5%: No tint

### Sorting
- **Default sort**: Discrepancy % descending (highest risk first).
- **Sortable columns** (click to toggle): Total Spend, Discrepancy, Discrepancy %, Recovery %, Score. Each column header has an ArrowUpDown icon.
- Clicking the same column toggles between descending and ascending. Clicking a different column resets to descending.
- Changing sort resets pagination to page 0.

### Summary Metrics (computed)
- **Vendors Scored**: `sorted.length`
- **High Risk**: Count of vendors with `score < 40`.
- **Total Discrepancy**: Sum of all `discrepancyAmount` values.
- **Avg Score**: Mean of all `score` values, rounded.
- **Avg Recovery**: Mean of all `recoveryPct` values, rounded.

### Vendor Actions
Three action buttons per vendor row (click stops propagation to prevent row expansion):
1. **Flag** (Flag icon): Confirms "Flag {vendor} as high-risk vendor?". Sets flag action to "Flagged". Shows warning toast.
2. **Penalize** (AlertTriangle icon): Confirms "Recommend penalty for {vendor}?". Sets flag action to "Penalized". Shows error toast.
3. **Remove** (XCircle icon + "Remove" text): Confirms "Remove {vendor} as supplier?". Sets flag action to "Removed". Shows error toast.

After any action, the vendor's action column shows "Done" and the vendor name gets a critical badge with the action text.

### Expanded Exception History
Clicking a vendor row toggles an expanded sub-row showing that vendor's exception history. Each exception is displayed as a card with:
- Exception ID (monospace)
- Exception type badge (warning style)
- Date
- Description text
- Amount (red, right-aligned)

## Data Model

### Interfaces
- **`VendorScore`**: `{ id, name, totalInvoices, totalSpend, discrepancyAmount, discrepancyPct, score, rating: "Critical" | "High Risk" | "Medium Risk" | "Low Risk", recoveryPct, exceptions: { id, type, amount, date, description }[] }`
- **`VendorSortKey`**: `"score" | "discrepancyPct" | "discrepancyAmount" | "totalSpend" | "recoveryPct" | null`

### Data Sources
- **`vendorScores`** from `lib/data.ts`: Array of `VendorScore` objects. Contains 18 vendors (as indicated by the pipeline agent stat "18 vendors scored").
- **`formatCurrency`** and **`formatDate`** from `lib/data.ts`: Formatting helpers.
- **`VendorBadge`** from `components/VendorBadge`: Renders vendor name with avatar.
- **`DataTablePagination`** from `components/ui/data-table-pagination`: Pagination controls.

### Data Relationships
- `VendorScore.exceptions[].id` references exception IDs from the exceptions module (e.g., EX-001 through EX-010).
- Vendor names in `vendorScores` correspond to the same vendors appearing in contracts, recovery queue, and extraction modules.
- `recoveryPct` reflects the recovery rate tracked in the recovery queue for that vendor.
- The vendor scoring page is linked from the recovery page's right sidebar ("Vendor Recovery Scores" card).

## Workflow
1. **Page load**: Summary strip shows skeleton for 400ms, then populates with computed metrics. Table shows 5 skeleton rows, then renders the first page of vendor data sorted by discrepancy % descending.
2. **Browse vendors**: Analyst scans the table. High-risk rows are visually highlighted with red/amber background tints and colored score/discrepancy values.
3. **Sort**: Analyst clicks column headers to re-sort by spend, discrepancy, recovery, or score. Pagination resets to page 1 on sort change.
4. **Drill into vendor**: Clicking a row expands it to show exception history cards. Clicking again collapses.
5. **Take action**: Analyst clicks Flag, Penalize, or Remove on a vendor. A browser confirm dialog appears. On confirmation, the action is recorded in local state, a toast fires, and the action column shows "Done".
6. **Paginate**: Analyst uses pagination controls to navigate through vendors (10 per page default, adjustable).
7. **Export**: "Export Report" button triggers a toast "Vendor risk report exported as PDF" (no actual file generated).

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Exceptions | reads from | Exception history per vendor drives the discrepancy component of risk score |
| Recovery | reads from | Recovery success rates influence the financial reliability component |
| Contracts | reads from | Contract compliance track record feeds into the compliance component |
| Dashboard | feeds into | High-risk vendor count and top vendors displayed on dashboard |
| Invoice Detail | reads from | Invoice patterns (late delivery, pricing inconsistency) per vendor |

## Forbidden Patterns

- **NEVER display a vendor risk score without showing the component breakdown** — Reason: A single number is opaque. Stakeholders need to see which factors (delivery, pricing, compliance, recovery) drive the score to take targeted action.
- **NEVER auto-block a vendor based on risk score alone** — Reason: Vendor relationships are complex. A high-risk score triggers review, not automatic action. Blocking requires human decision with legal disclaimer.
- **NEVER compare vendor scores across different time periods without noting the date range** — Reason: Scores are point-in-time calculations. Comparing Q1 scores to Q3 without context is misleading.
- **NEVER expose raw exception data in the vendor scorecard** — Reason: Vendor scorecards may be shared with vendors during negotiations. Show aggregated metrics only, not individual invoice details.

## AJ Feedback (Parkland Demo)

### AJ Feedback (Recording 17)

- **Company logos**: "Use the actual logo of the company... it validates a little bit better and it's legitimate." Replace plain text vendor names with actual company logos + brand colors. Applies to vendor scorecards and anywhere vendor names appear.
- **Enterprise credibility**: "If you're providing an enterprise solution, it cannot look like a spreadsheet." Vendor cards must feel premium.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-14: Added AJ feedback from Recording 17 — company logos, enterprise credibility -->
