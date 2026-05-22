# Vendor Scoring -- Specification

## Overview
The Vendor Scoring page provides a risk-ranked table of all vendors with composite scores, discrepancy metrics, recovery rates, and actionable risk management controls. It serves as the Insight Agent's output -- consolidating exception data across the entire invoice lifecycle into per-vendor scorecards. Analysts use this page to identify high-risk vendors, flag or penalize problematic suppliers, and drill into each vendor's exception history.

## Acceptance Criteria

EARS notation.

**App shell**
- [ ] THE SYSTEM SHALL render the Vendor Scoring page inside `SidebarProvider` + `SidebarInset` with `AppSidebar` and `SiteHeader`
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens

**Summary strip**
- [ ] THE SYSTEM SHALL render a 5-cell summary strip in a shadcn `Card` separated by `divide-x divide-border`: Vendors Scored, High Risk (`text-destructive`), Total Discrepancy (`text-warning-text`), Avg Score (color-coded), Avg Recovery (color-coded)

**Score and rating color coding**
- [ ] THE SYSTEM SHALL color score values: `text-destructive` < 30, `text-warning-text` 30-59, `text-success-text` >= 60
- [ ] THE SYSTEM SHALL render Rating badges using shadcn `Badge`: `variant="destructive"` for Critical, `bg-warning/10 text-warning-text border-warning` for High Risk, `variant="secondary"` for Medium Risk, `bg-success/10 text-success-text border-success` for Low Risk
- [ ] THE SYSTEM SHALL color Discrepancy % values: `text-destructive` > 15%, `text-warning-text` > 5%, `text-muted-foreground` <= 5%
- [ ] THE SYSTEM SHALL color Recovery % values: `text-success-text` >= 80%, `text-warning-text` >= 40%, `text-destructive` < 40%

**Row tinting and table**
- [ ] THE SYSTEM SHALL render the vendor table using shadcn `Table` primitives wrapped in a shadcn `Card` + `CardContent`, with horizontal scroll (`overflow-x-auto`, `min-w-[900px]`)
- [ ] THE SYSTEM SHALL tint rows by Discrepancy %: `bg-destructive/5` > 15%, `bg-warning/5` > 5%, no tint <= 5%
- [ ] THE SYSTEM SHALL render exactly 10 columns: expand chevron, Vendor, Invoices, Total Spend, Discrepancy, Discrepancy %, Recovery %, Score, Rating, Actions

**Sorting and pagination**
- [ ] THE SYSTEM SHALL default sort to Discrepancy % descending
- [ ] WHEN a user clicks a sortable column header THE SYSTEM SHALL sort by that column (toggling desc/asc on repeat clicks)
- [ ] WHEN sort changes THE SYSTEM SHALL reset pagination to page 0
- [ ] THE SYSTEM SHALL render pagination with default page size 10 (adjustable)

**Expanded row**
- [ ] WHEN a user clicks a vendor row THE SYSTEM SHALL toggle an expanded sub-row showing exception history cards inside a `bg-muted/30` sub-row
- [ ] THE SYSTEM SHALL render each exception card as a shadcn `Card` containing ID (`font-mono text-xs text-muted-foreground`), type `Badge` (`variant="secondary"`), date, description, amount (`text-destructive` right-aligned)
- [ ] THE SYSTEM SHALL expose `aria-sort` (`ascending` / `descending` / `none`) on every sortable column header

**Vendor actions**
- [ ] THE SYSTEM SHALL render three action buttons per row using shadcn `Button variant="ghost" size="sm"`: Flag (Flag icon), Penalize (AlertTriangle icon), Remove (XCircle icon + text)
- [ ] WHEN a user clicks any action button THE SYSTEM SHALL stop event propagation (no row expansion) and open a shadcn `AlertDialog` confirmation
- [ ] WHEN the user confirms the action THE SYSTEM SHALL record the flag action, fire a toast, and replace the action area with "Done"

**Loading and safety**
- [ ] WHEN the page mounts THE SYSTEM SHALL display shadcn `Skeleton` placeholders for the summary strip and 5 table rows for 400ms before real content
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable expand/collapse animations
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on all interactive elements

## Layout

Renders inside `SidebarProvider` + `SidebarInset` (per v2.0 app shell).

- **Header region**: Title `text-2xl font-semibold` "Vendor Scoring" with subtitle `text-sm text-muted-foreground` (vendor count + "Q1 2026"). Shadcn `Button variant="outline"` "Export Report" top-right.
- **Summary strip**: Shadcn `Card` containing a 5-cell `flex` row with `divide-x divide-border`. Cells per Acceptance Criteria.
- **Vendor table**: Shadcn `Card` + `CardContent` containing shadcn `Table` with horizontal scroll (`overflow-x-auto`, `min-w-[900px]`). 10 columns per Acceptance Criteria.
- **Pagination**: `DataTablePagination` block below the table. Default page size 10.
- **Expanded row**: Sub-row tinted `bg-muted/30` containing exception history cards (per Acceptance Criteria).
- **Responsive behavior**: `px-4 lg:px-6` padding (v2.0 standard). Table scrolls horizontally on narrow viewports.

## Business Rules

### Score Color Coding (v2.0.1 theme tokens — AA-safe text)
| Score Range | Class |
|-------------|-------|
| < 30        | `text-destructive` |
| 30-59       | `text-warning-text` |
| >= 60       | `text-success-text` |

### Rating Badges (shadcn `Badge`)
| Rating       | Class |
|--------------|-------|
| Critical     | `variant="destructive"` |
| High Risk    | `bg-warning/10 text-warning-text border-warning` (custom override since shadcn lacks built-in warning) |
| Medium Risk  | `variant="secondary"` |
| Low Risk     | `bg-success/10 text-success-text border-success` |

### Discrepancy % Color Coding
| Discrepancy % | Class |
|---------------|-------|
| > 15%         | `text-destructive` |
| > 5%          | `text-warning-text` |
| <= 5%         | `text-muted-foreground` |

### Recovery % Color Coding
| Recovery % | Class |
|------------|-------|
| >= 80%     | `text-success-text` |
| >= 40%     | `text-warning-text` |
| < 40%      | `text-destructive` |

### Row Background Tinting (v2.0 — Tailwind opacity on theme tokens)
- Discrepancy > 15%: `bg-destructive/5`
- Discrepancy > 5%: `bg-warning/5`
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
Three shadcn `Button variant="ghost" size="sm"` actions per vendor row (click stops propagation to prevent row expansion). Each opens a shadcn `AlertDialog` for confirmation:
1. **Flag** (Flag icon): Confirms "Flag {vendor} as high-risk vendor?". Sets flag action to "Flagged". Fires toast styled with `bg-warning/10 border-warning`.
2. **Penalize** (AlertTriangle icon): Confirms "Recommend penalty for {vendor}?". Sets flag action to "Penalized". Fires toast `variant="destructive"`.
3. **Remove** (XCircle icon + "Remove" text): Confirms "Remove {vendor} as supplier?". Sets flag action to "Removed". Fires toast `variant="destructive"`.

After any action, the vendor's action column shows "Done" and the vendor name gets a `Badge variant="destructive"` with the action text.

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
5. **Take action**: Analyst clicks Flag, Penalize, or Remove on a vendor. A shadcn `AlertDialog` confirmation appears. On confirmation, the action is recorded in local state, a toast fires, and the action column shows "Done".
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

Use affirmative phrasing per SpecLayer v1.1.

- **Display the component breakdown (delivery, pricing, compliance, recovery) alongside every vendor risk score** — Reason: a single number is opaque; stakeholders need the drivers to take targeted action.
- **Treat the risk score as a trigger for review, not a trigger for automatic action** — Reason: blocking requires human decision with legal disclaimer.
- **Annotate every vendor score comparison with its date range** — Reason: scores are point-in-time; comparing Q1 to Q3 without context misleads.
- **Show aggregated metrics in the vendor scorecard, not individual invoice details** — Reason: scorecards may be shared with vendors during negotiations.
- **Use shadcn `Card`, `Table`, `Badge`, `Button`, `AlertDialog` primitives for the table surface, badges, action buttons, and confirmation dialogs** — Reason: deprecates `.data-table`, `.badge.*`, browser `confirm()` from v1.
- **Use theme tokens for all status colors, row tints, and sub-row backgrounds** — status TEXT uses `text-destructive` / `text-warning-text` / `text-success-text` / `text-muted-foreground` (AA-safe per ui-standard.md v2.0.1); row tints use `bg-destructive/5` / `bg-warning/5`; sub-rows use `bg-muted/30` — Reason: hex tokens (`text-red-600`, `text-amber-600`, `text-emerald-600`, `bg-red-50/50`, `bg-amber-50/30`) removed in v2.0, and `text-warning` / `text-success` fail WCAG 1.4.3 as body text.

## AJ Feedback (Parkland Demo)

### AJ Feedback (Recording 17)

- **Company logos**: "Use the actual logo of the company... it validates a little bit better and it's legitimate." Replace plain text vendor names with actual company logos + brand colors. Applies to vendor scorecards and anywhere vendor names appear.
- **Enterprise credibility**: "If you're providing an enterprise solution, it cannot look like a spreadsheet." Vendor cards must feel premium.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-14: Added AJ feedback from Recording 17 — company logos, enterprise credibility -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system per ui-standard.md v2.0. App shell wraps in SidebarProvider+SidebarInset. Summary strip → shadcn `Card` with divide-x divide-border. Vendor table → shadcn `Table` primitives wrapped in `Card`. Score/Discrepancy %/Recovery % retokenized to text-destructive/text-warning/text-success/text-muted-foreground. Row tints → bg-destructive/5 / bg-warning/5. Rating badges → shadcn `Badge` variants. Action buttons → shadcn `Button variant="ghost" size="sm"` with shadcn `AlertDialog` confirmation (replaces browser confirm). Loading → `Skeleton`. Added 18 EARS Acceptance Criteria. Forbidden Patterns rewritten in affirmative form per SpecLayer v1.1. -->
<!-- 2026-05-22 v2.0.1 reconciliation: Migrated app/vendor-scoring/page.tsx from v1 to v2.0 shadcn (Cluster 2). Status-text criteria corrected to AA-safe `text-warning-text` / `text-success-text` (ui-standard.md v2.0.1). Code reconciliation: `.card`→`Card`, `.data-table`→shadcn `Table` primitives, `.badge.*`→`Badge` variants, raw `<button>` row actions→`Button variant="ghost" size="sm"`, browser `confirm()`→shadcn `AlertDialog` (3 confirmations: Flag/Penalize/Remove). Sortable headers now expose `aria-sort` (added AC + Forbidden-pattern follow-through; SortHead module-level component mirrors app/page.tsx idiom). All v1 `var(--*)` tokens, `bg-white`, `text-red/amber/emerald-600`, `bg-red-50/50`, `bg-amber-50/30`, `hover:bg-amber-50/red-50` retired. Real `<h1>`/`<h2>` outline. Dark mode verified. -->
