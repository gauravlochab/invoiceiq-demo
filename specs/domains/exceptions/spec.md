# Exceptions List -- Specification

## Overview

The Exceptions page is the primary work queue for AP analysts. It presents all detected invoice exceptions in a filterable, sortable, searchable table with two view modes: a standard exception list and a dedicated duplicate invoice comparison view. Analysts use this page to triage, prioritize, and act on billing discrepancies before drilling into individual exception detail pages.

## Layout

### Header (px-6 lg:px-8, pt-8)
- Left: title "Exceptions", subtitle showing total exception count, duplicate pair count, and period ("Q1 2026")
- Right: two action buttons
  - **Assign** -- dropdown with manager list (David Kim, Lisa Rodriguez, Michael Chang, Jennifer Walsh); assigns selected exceptions or all if none selected
  - **Export** -- dropdown with "Export as PDF", "Export as CSV", "Email to Stakeholder"
- Separated by `<hr>` divider with `divider mt-4` class

### View Toggle Tabs (px-6 lg:px-8, pt-3)
- Two tab buttons: "Exceptions ({count})" and "Duplicates ({count})"
- Active tab: primary text, medium weight, subtle background, visible border
- Inactive tab: secondary text, transparent background, hover effect
- Exception count excludes SOM types (`!e.type.startsWith("som_")`)

### List View

**Filter Row (px-6 lg:px-8, py-3)**
- Horizontal filter chips with live counts derived from data:
  - All ({total}), Open ({open}), Critical ({critical}), High ({high}), Duplicate ({dup}), Match Exception ({match})
- Active chip: primary text, medium weight, subtle bg, visible border
- Counts computed dynamically from `allExceptions` array

**Vendor Filter** -- dropdown button beside filter chips
- "All Vendors" default; active vendor shows blue highlight styling
- Dropdown lists all unique vendors alphabetically from exception data
- Closes on outside click

**Search Bar (px-6 lg:px-8, pb-3)**
- Input with Search icon, placeholder "Search exceptions..."
- Searches across: id, vendor, invoiceNumber, type label
- Fixed width: `w-72`

**Data Table (px-6 lg:px-8, pb-8)**
- Card wrapper with `data-table` class, 9 columns:
  1. **Checkbox** -- select-all in header (with indeterminate state), per-row selection
  2. **Exception** -- ID (mono 11px, muted) + invoice number below
  3. **Type** -- badge with color coding: critical for suspicious_invoice/contract_overage, warning for duplicate/tier_pricing, neutral for others
  4. **Category** -- `CategoryBadge` component (color-coded pill)
  5. **Vendor** -- `VendorBadge` component (avatar + name)
  6. **Flagged** -- right-aligned, sortable, color-coded by severity (red for critical/high, amber for medium)
  7. **Severity** -- sortable, dot + label (uses `severityConfig` colors)
  8. **Status** -- badge (critical=Open, warning=Under Review, blue=Escalated, success=Resolved)
  9. **Action** -- "Review" link to `/exceptions/{id}`, appears on row hover

**Pagination** -- `DataTablePagination` component below table
- Shows page index, page count, page size selector, total rows, selected count
- Default page size: 25
- Resets to page 0 on filter/search change

**Empty State** -- `EmptyState` component with FileSearch icon, "No exceptions match this filter" message, and "Clear filter" action button

### Duplicates View

**Summary line**: "AI scanned 1,847 invoices . {count} pairs flagged . {amount} at risk"

**How It Works** -- horizontal 3-step process strip:
1. **Ingest** -- "All invoices received via email, mail, EDI, and vendor portal"
2. **Vectorize** -- "Line items, amounts, dates, and vendor IDs converted to similarity vectors"
3. **Flag** -- "Pairs exceeding 97% similarity threshold surfaced for review"

**Duplicate Pair Cards** -- one `DuplicatePairCard` per pair:
- Header: VendorBadge + pair ID (left), flagged amount + status badge (right)
- Similarity row: progress bar with fill color (red >=99%, amber otherwise), percentage, amount delta and days-apart text
- Side-by-side comparison: Invoice A vs Invoice B in 3-column grid (1fr | divider | 1fr)
  - Each side shows: invoice number (mono), date, amount (15px semibold), submission channel
- AI Analysis section: bullet list of system-generated findings (3 items per pair)
- Actions: Reject (red), Approve with Override (outline), Escalate to Manager (outline); resolved pairs show green "Resolved -- {amount} saved" badge

**Action Modals** (3 modal types):
- **Reject Modal**: title, description, required reason textarea, Cancel/Reject buttons
- **Override Modal**: title, description, amber warning about audit logging, required justification textarea, Cancel/Approve buttons
- **Escalate Modal**: title, description, manager selector dropdown, optional note textarea, Cancel/Escalate buttons (disabled until manager selected)

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

## AJ Feedback (Parkland Demo)

"Color-code by product category, don't look like a spreadsheet"

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
