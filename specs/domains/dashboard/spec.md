# Dashboard -- Specification

## Overview

The main dashboard is the landing page of InvoiceIQ Detect. It provides a single-screen summary of invoice processing health for Northfield Medical Center, surfacing KPI metrics, AI agent operational status, spend and exception trends, and the most urgent exceptions requiring analyst attention. The dashboard is designed for a VP of Supply Chain or AP Director who needs to assess the current state of their procurement risk in under 10 seconds.

## Layout

### Header (px-6 lg:px-8, pt-6 pb-5)
- Left: page title "Invoice Intelligence", customer name from `PARKLAND_CONFIG.customer`, period label ("Q1 2026"), invoice count
- Right: "Export" button (opens `ExportDialog` for CSV/PDF), "Run Scan" button (simulated 2-second scan, transitions to "Last scan: just now" after completion, fires toast notification)
- Separated from body by `<hr>` divider

### KPI Cards (two rows)
- **Row 1 -- Primary KPIs**: 4 cards in `grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4`
  1. **Invoices Processed** -- links to `/pipeline`, value: 1,847, subtitle: "Q1 2026"
  2. **Exceptions Found** -- links to `/exceptions`, value: computed from `apExceptions.length`, subtitle: "{openCount} open"
  3. **Amount at Risk** -- links to `/exceptions`, value: sum of all AP exception `flaggedAmount`, prefix "$", red text, subtitle: "22% of period spend"
  4. **Recovered** -- links to `/recovery`, value: sum of recovered amounts from `recoveryQueue`, prefix "$", green text, subtitle: "{recoveredCount} resolved"

- **Row 2 -- Secondary KPIs**: 3 cards in `grid-cols-1 sm:grid-cols-3 gap-4 mt-4`
  5. **Contracts at Risk** -- links to `/contracts`, value: count of breached + warning contracts, subtitle: "{breachedCount} breached"
  6. **GPO Compliance** -- links to `/contracts`, value: `getGPOComplianceRate()`, suffix "%", subtitle: "Premier, Vizient, HealthTrust"
  7. **GPO Savings Opportunity** -- links to `/contracts`, value: `getGPOPotentialSavings()`, prefix "$", subtitle: "across active contracts"

- Each card is a `<Link>` with `card-metric card-interactive` classes, subtle gradient backgrounds, hover border highlight, animated `NumberTicker` for values, and staggered slide-up entrance animation
- Loading state: skeleton pulse placeholders matching card dimensions

### Agent Status Strip (px-6 lg:px-8, pb-4)
- Section label: "AI Agents"
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3`
- 5 agent cards, each showing:
  - Green status dot (2x2 rounded-full, `--success` color)
  - Agent name (11px, font-semibold)
  - Stat line (10px, muted): e.g., "1,847 processed . 0 errors"
- Agents displayed:
  1. Invoice Agent -- "1,847 processed" / "0 errors"
  2. Validation Agent -- "188 exceptions" / "6 escalated"
  3. Compliance Agent -- "12 alerts" / "reviewing Cardinal"
  4. Recovery Agent -- "14 in queue" / "$470K target"
  5. Insight Agent -- "9 vendors scored" / "4 high-risk"

### Charts Section (px-6 lg:px-8, pb-6)
- Two-column grid: `grid-cols-1 lg:grid-cols-[1fr_360px] gap-6`

**Left chart -- Spend and Exception Trend**
- `ComposedChart` (Recharts) with `ResponsiveContainer` at height 260px
- Area chart for `spend` (stroke: `--chart-spend`, fill: `--chart-area-fill`)
- Bar chart overlay for `exceptions` (fill: `--chart-flagged`, barSize 16, rounded top corners)
- Custom `SpendTooltip` with formatted currency
- Legend with inline color indicators ("Total spend" line, "Flagged" square)
- Data source: `spendTrend` from `lib/data.ts`

**Right chart -- By Category**
- Stacked horizontal bar showing `flaggedByType` proportionally
- Total amount displayed as "$XXK" (rounded)
- Subtitle: "Amount at risk by exception type"
- Legend list below with color swatch, category name, percentage, and formatted currency
- Clicking the bar or legend rows navigates to `/exceptions`

### Discrepancy Bar Chart (px-6 lg:px-8, pb-6)
- Full-width card containing `<DiscrepancyBarChart />` component
- Only rendered after loading completes

### Recent Exceptions Table (px-6 lg:px-8, pb-8)
- Card with header: "Recent Exceptions" (left) + "View all {count}" link to `/exceptions` (right, with ArrowUpRight icon)
- `data-table` with 8 columns:
  1. **ID** -- mono font
  2. **Type** -- sortable, badge (critical for contract_overage/suspicious_invoice, neutral otherwise)
  3. **Category** -- `CategoryBadge` component
  4. **Vendor** -- `VendorBadge` component + invoice number below
  5. **Flagged** -- right-aligned, color-coded by severity (red for critical/high, amber for medium, neutral for low)
  6. **Severity** -- sortable, status dot + label colored by severity
  7. **Status** -- sortable, badge (critical=Open, warning=Under Review, blue=Escalated, success=Resolved)
  8. **Action** -- "Review" link to `/exceptions/{id}`

## Business Rules

- **Exception filtering**: Dashboard shows only AP exceptions (`!type.startsWith("som_")`), sorted by severity (critical first), limited to top 6
- **Severity sort order**: critical=0, high=1, medium=2, low=3
- **Status sort order**: open=0, under_review=1, escalated=2, resolved=3
- **Amount at Risk**: sum of `flaggedAmount` across all AP exceptions
- **Recovered**: sum of `recoveredAmount` from recovery queue items with status "recovered"
- **Contracts at Risk**: count of contracts with status "breached" or "warning"
- **Flagged color logic**: critical/high = `--critical`, medium = `--warning`, low = `--neutral`
- **Run Scan**: simulated 2-second delay, shows "Scanning..." state, disables after completion, fires "2 new exceptions identified" toast
- **Export**: supports CSV and PDF formats via `exportToCSV` / `exportToPDF` from `lib/export`
- **Loading state**: 400ms simulated loading with skeleton placeholders for all sections

## Data Model

- **Source files**: `lib/data.ts` (exceptions, allExceptions, flaggedByType, spendTrend, recoveryQueue, contracts, formatCurrency, severityConfig, statusConfig, typeConfig), `lib/gpo-contracts.ts` (getGPOComplianceRate, getGPOPotentialSavings), `lib/workflow-config.ts` (PARKLAND_CONFIG)
- **Key interfaces**: `Exception` (id, type, severity, status, vendor, invoiceNumber, flaggedAmount, category, amount, detectedAt, invoiceDate, assignee)
- **Computed values**: `apExceptions` (non-SOM), `openCount`, `amountAtRisk`, `recoveredAmount`, `recoveredCount`, `contractsAtRiskCount`, `contractsBreachedCount`, `totalFlagged`

## Workflow

1. Page loads with 400ms skeleton state
2. KPI cards animate in with staggered slide-up (`NumberTicker` counts up)
3. User can sort the Recent Exceptions table by type, flaggedAmount, severity, or status (click column header to toggle asc/desc)
4. Clicking any KPI card navigates to its target page
5. Clicking the stacked bar or category legend navigates to `/exceptions`
6. "Run Scan" triggers a simulated scan with toast notification
7. "Export" opens `ExportDialog` for CSV/PDF download
8. "Review" links in table navigate to `/exceptions/{id}`

## AJ Feedback (Parkland Demo)

"Customizable dashboard -- widget arrangement per user role"

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
