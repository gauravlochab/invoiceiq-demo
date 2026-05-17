# Exceptions List -- Specification

## Overview

The Exceptions page is the primary work queue for AP analysts. It presents all detected invoice exceptions in a filterable, sortable, searchable table with two view modes: a standard exception list and a dedicated duplicate invoice comparison view. Analysts use this page to triage, prioritize, and act on billing discrepancies before drilling into individual exception detail pages.

## Acceptance Criteria

EARS notation.

**App shell**
- [ ] THE SYSTEM SHALL render the Exceptions page inside the global `SidebarProvider` + `SidebarInset` shell with `AppSidebar` and `SiteHeader`
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens

**View toggle**
- [ ] THE SYSTEM SHALL render a shadcn `Tabs` component with exactly two tabs: "Exceptions ({count})" and "Duplicates ({count})"
- [ ] THE SYSTEM SHALL exclude SOM exception types (`type.startsWith("som_")`) from the Exceptions tab count and table

**Filter and search**
- [ ] THE SYSTEM SHALL render filter chips as shadcn `ToggleGroup type="single"`, with each `ToggleGroupItem` showing label + live count `Badge variant="secondary"`
- [ ] THE SYSTEM SHALL compute filter counts dynamically from the `allExceptions` array
- [ ] WHEN a user changes the active filter, vendor filter, or search query THE SYSTEM SHALL reset pagination to page 0
- [ ] WHEN a user types in the search bar THE SYSTEM SHALL match case-insensitively across id, vendor, invoiceNumber, and type label

**Data table**
- [ ] THE SYSTEM SHALL render the exception table using shadcn `Table` primitives wrapped in a shadcn `Card` + `CardContent`
- [ ] THE SYSTEM SHALL render exactly 9 columns: Checkbox, Exception, Type, Category, Vendor, Flagged, Severity, Status, Action
- [ ] THE SYSTEM SHALL render the Flagged column right-aligned with `tabular-nums` and color-coded text (`text-destructive` for critical/high, `text-warning` for medium, `text-foreground` for low)
- [ ] THE SYSTEM SHALL render Status badges using shadcn `Badge` variants (destructive / outline / secondary / `bg-success` custom) — never inline-styled badges
- [ ] WHEN a user clicks a sortable column header THE SYSTEM SHALL sort by flaggedAmount, severity, or category
- [ ] WHEN the table has zero rows after filtering THE SYSTEM SHALL display an `EmptyState` with `FileSearch` icon, message, and shadcn `Button variant="outline"` "Clear filter"

**Bulk actions**
- [ ] WHEN at least one row is selected via Checkbox THE SYSTEM SHALL enable the "Assign" dropdown
- [ ] WHEN the select-all checkbox is in partial-selection state THE SYSTEM SHALL render the indeterminate visual

**Duplicates view**
- [ ] WHILE the Duplicates tab is active THE SYSTEM SHALL render one `DuplicatePairCard` per pair from `duplicatePairs`, each built on shadcn `Card`
- [ ] THE SYSTEM SHALL render the similarity bar using shadcn `Progress` with `bg-destructive` fill for similarity >= 99%, `bg-warning` otherwise
- [ ] WHEN a user clicks Reject, Approve with Override, or Escalate THE SYSTEM SHALL open the corresponding shadcn `Dialog` modal
- [ ] IF the Reject reason, Override justification, or Escalate manager selection is empty THEN THE SYSTEM SHALL disable the confirm button in the modal

**Loading and safety**
- [ ] WHEN the page mounts THE SYSTEM SHALL display shadcn `Skeleton` placeholders for the filter row and 7 table rows for 350ms before real content
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable all entrance animations
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on all interactive elements

## Layout

### App Shell (v2.0)

The page renders inside the global `SidebarProvider` + `SidebarInset` shell (per `ui-standard.md` v2.0). `AppSidebar` + `SiteHeader` provide navigation and topbar. The dashboard layout sections below describe content inside `SidebarInset > main`.

### Header (px-4 lg:px-6, pt-6 pb-3)
- Left: title "Exceptions" (`text-2xl font-semibold`), subtitle (`text-sm text-muted-foreground`) showing total exception count, duplicate pair count, and period ("Q1 2026")
- Right: two action buttons
  - **Assign** — shadcn `DropdownMenu` button with manager list (David Kim, Lisa Rodriguez, Michael Chang, Jennifer Walsh); assigns selected exceptions or all if none selected
  - **Export** — shadcn `DropdownMenu` with "Export as PDF", "Export as CSV", "Email to Stakeholder"

### View Toggle (px-4 lg:px-6, pt-3)
- Shadcn `Tabs` with two `TabsTrigger`: "Exceptions ({count})" and "Duplicates ({count})"
- Exception count excludes SOM types (`!e.type.startsWith("som_")`)

### List View (inside `TabsContent value="exceptions"`)

**Filter Row (px-4 lg:px-6, py-3)**
- shadcn `ToggleGroup type="single"` with `ToggleGroupItem` for each filter:
  - All ({total}), Open ({open}), Critical ({critical}), High ({high}), Duplicate ({dup}), Match Exception ({match})
- Each item shows label + count `Badge variant="secondary"` for live counts derived from `allExceptions`
- Active item uses `data-[state=on]:bg-accent`

**Vendor Filter** — shadcn `Select` or `DropdownMenu` button beside the toggle group
- "All Vendors" default; active vendor shown as `Badge variant="outline"`
- Dropdown lists all unique vendors alphabetically from exception data

**Search Bar (px-4 lg:px-6, pb-3)**
- shadcn `Input` with `Search` icon prefix, placeholder "Search exceptions..."
- Searches across: id, vendor, invoiceNumber, type label
- Fixed width: `w-72`

**Data Table (px-4 lg:px-6, pb-6)**
- Wrapped in shadcn `Card` + `CardContent`. 9 columns using shadcn `Table` primitives:
  1. **Checkbox** — shadcn `Checkbox`, select-all in `TableHead` (with indeterminate state), per-row selection
  2. **Exception** — ID (`font-mono text-xs text-muted-foreground`) + invoice number below
  3. **Type** — shadcn `Badge`: `variant="destructive"` for suspicious_invoice/contract_overage, `variant="outline"` for duplicate/tier_pricing, `variant="secondary"` for others
  4. **Category** — `CategoryBadge` (InvoiceIQ-specific, retained), color via category brand color tokens
  5. **Vendor** — `VendorBadge` (InvoiceIQ-specific, retained)
  6. **Flagged** — right-aligned, sortable, `tabular-nums`, `text-destructive` for critical/high severity, `text-warning` for medium, `text-foreground` for low
  7. **Severity** — sortable, dot (`size-1.5 rounded-full`) + label (uses `severityConfig` colors mapped to theme tokens)
  8. **Status** — shadcn `Badge`: `variant="destructive"` for Open, `variant="outline"` for Under Review, `variant="secondary"` for Escalated, custom `bg-success` for Resolved
  9. **Action** — "Review →" link to `/exceptions/{id}`, appears on row hover (`group-hover:opacity-100`)

**Pagination** — `DataTablePagination` block (shadcn pattern, TanStack-backed)
- Shows page index, page count, page size selector, total rows, selected count
- Default page size: 25
- Resets to page 0 on filter/search change

**Empty State** — `EmptyState` component with `FileSearch` icon, "No exceptions match this filter" message, and shadcn `Button variant="outline"` "Clear filter" action

**Loading State** — shadcn `Skeleton` placeholders, 350ms simulated delay, 7-row table skeleton

### Duplicates View (inside `TabsContent value="duplicates"`)

**Summary line** — `text-sm text-muted-foreground`: "AI scanned 1,847 invoices • {count} pairs flagged • {amount} at risk"

**How It Works** — horizontal 3-step process strip, each step inside a small shadcn `Card`:
1. **Ingest** — "All invoices received via email, mail, EDI, and vendor portal"
2. **Vectorize** — "Line items, amounts, dates, and vendor IDs converted to similarity vectors"
3. **Flag** — "Pairs exceeding 97% similarity threshold surfaced for review"

**Duplicate Pair Cards** — one `DuplicatePairCard` per pair, built on shadcn `Card`:
- `CardHeader`: VendorBadge + pair ID (left), `CardAction` with flagged amount + status `Badge` (right)
- Similarity row: shadcn `Progress` component (fill color `bg-destructive` for >=99%, `bg-warning` otherwise), percentage, amount delta and days-apart text in `text-xs text-muted-foreground`
- `CardContent`: side-by-side comparison, Invoice A vs Invoice B in 3-column grid (1fr | `border-l` | 1fr)
  - Each side shows: invoice number (`font-mono text-sm`), date, amount (`text-base font-semibold tabular-nums`), submission channel
- AI Analysis section: bullet list of system-generated findings (3 items per pair), `text-sm`
- `CardFooter`: Reject (`Button variant="destructive"`), Approve with Override (`Button variant="outline"`), Escalate to Manager (`Button variant="outline"`); resolved pairs show `Badge` with `bg-success` "Resolved — {amount} saved"

**Action Modals** — shadcn `Dialog` (3 modal types):
- **Reject Modal**: `DialogHeader` + `DialogDescription`, required reason `Textarea`, `DialogFooter` with Cancel/Reject `Button variant="destructive"`
- **Override Modal**: `DialogHeader` + `DialogDescription`, `Alert variant="warning"` (uses `bg-warning/10 border-warning` since shadcn lacks built-in warning variant) about audit logging, required justification `Textarea`, Cancel/Approve buttons
- **Escalate Modal**: `DialogHeader` + `DialogDescription`, manager selector `Select`, optional note `Textarea`, Cancel/Escalate buttons (Escalate disabled until manager selected)

## Business Rules

- **Filter logic**: "Open" includes status open, under_review, and escalated
- **Sort options**: flaggedAmount (desc default), severity (uses order map: critical=0, high=1, medium=2, low=3), category (alpha)
- **Search**: case-insensitive partial match across id, vendor, invoiceNumber, and type label
- **Pagination**: resets to page 0 when activeFilter, vendorFilter, or tableSearch changes
- **Duplicate similarity threshold**: 97% (pairs above this are flagged)
- **Similarity bar color**: >=99% = red (#DC2626), below = amber (#B45309)
- **Type badge mapping**: suspicious_invoice/contract_overage = critical, duplicate/tier_pricing = warning, all others = neutral
- **Duplicate pair actions**: recorded in component state (`pairActions`), toast notification describes the action taken
- **Modal validation**: Reject requires non-empty reason; Override requires non-empty justification; Escalate requires selected manager
- **Select-all checkbox**: uses indeterminate state when partial selection exists
- **Loading state**: 350ms simulated delay with 7-row skeleton placeholders

## Data Model

- **Source files**: `lib/data.ts` (allExceptions, duplicatePairs, formatCurrency, formatDate, severityConfig, statusConfig, typeConfig, DuplicatePair, ExceptionType, Severity, Status)
- **Key interfaces**:
  - `Exception`: id, type, severity, status, vendor, invoiceNumber, flaggedAmount, category, amount, detectedAt, invoiceDate, assignee
  - `DuplicatePair`: id, vendor, invoice1, invoice2, similarity, amountDelta, daysDelta, flaggedAmount, status
- **AI analysis data**: hardcoded `aiAnalysis` record keyed by pair ID (DUP-001, DUP-002, DUP-003)
- **Component state**: activeFilter, vendorFilter, tableSearch, sortKey, sortDir, pageIndex, pageSize, viewMode, selectedExceptions, pairActions

## Workflow

1. Page loads with 350ms skeleton state, defaults to "list" view with "all" filter
2. User can switch between Exceptions and Duplicates tabs
3. In list view: filter by chip -> filter by vendor -> search -> sort by column -> paginate
4. Clicking "Review" navigates to `/exceptions/{id}` for full detail
5. Checkbox selection enables bulk "Assign" action
6. In duplicates view: review AI analysis, take action (Reject/Override/Escalate) via modals
7. Duplicate actions show confirmation toast and update the card's action state inline

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Pipeline | reads from | Exceptions are created by the pipeline's Validation and Compliance agents |
| Invoice Detail | navigates to | Clicking an exception row navigates to the invoice detail page |
| Dashboard | feeds into | Exception counts and severity stats displayed on dashboard KPIs |
| Extract | reads from | Exception records reference extracted invoice data |

## Forbidden Patterns

Use affirmative phrasing per SpecLayer v1.1.

- **Default the filter to "All" on page load** — Reason: analysts must see the full queue; hiding exceptions creates audit blind spots.
- **Route every exception resolution through the invoice-detail page** — Reason: the list is for triage; resolution requires the three-way match human-in-the-loop gate. Bulk actions in this view limited to Assign only.
- **Render exception details only in `/exceptions/[id]`, not inline in the list** — Reason: the list is for triage (scan severity, type, amount); detail review needs the dedicated page's full context.
- **Show resolved exceptions in the list with a Status badge** — Reason: resolved exceptions remain visible for audit trail completeness; use the Status filter to hide them.
- **Use shadcn `Card` + `Table` primitives for the data table surface** — Reason: ad-hoc `<div className="data-table">` and `.card` utility classes are deprecated in ui-standard.md v2.0.
- **Use shadcn `Badge variant="..."` for all Type and Status indicators** — Reason: `.badge.critical` / `.badge.warning` / `.badge.success` utility classes deprecated in v2.0.
- **Use theme tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `text-destructive`, `text-warning`) for surfaces and text** — Reason: hex tokens (`--bg-surface`, `--critical`, `--text-primary`) removed in v2.0.
- **Use shadcn `Dialog` for the Reject / Override / Escalate modals** — Reason: custom modal implementations diverge in keyboard handling and focus trap; shadcn `Dialog` is Radix-backed and accessible by default.

## AJ Feedback (Parkland Demo)

"Color-code by product category, don't look like a spreadsheet"

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system per ui-standard.md v2.0. App shell wraps in SidebarProvider+SidebarInset. Filter chips → shadcn `ToggleGroup`; data table → shadcn `Table` + `Card`; Type/Status indicators → `Badge variant`; modals → shadcn `Dialog`; loading → shadcn `Skeleton`; similarity bar → shadcn `Progress`. All v1 hex tokens migrated to shadcn theme classes. Added 18 EARS Acceptance Criteria covering app shell, view toggle, filter/search, table, bulk actions, duplicates view, loading, accessibility. Forbidden Patterns rewritten in affirmative form per SpecLayer v1.1. -->
