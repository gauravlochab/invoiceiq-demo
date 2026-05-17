# Dashboard -- Specification

## Overview

The main dashboard is the landing page of InvoiceIQ Detect. It provides a single-screen summary of invoice processing health for Northfield Medical Center, surfacing KPI metrics, AI agent operational status, spend and exception trends, and the most urgent exceptions requiring analyst attention. The dashboard is designed for a VP of Supply Chain or AP Director who needs to assess the current state of their procurement risk in under 10 seconds.

## Layout

### Header (px-6 lg:px-8, pt-6 pb-5)
- Left: page title "Invoice Intelligence", customer name from `PARKLAND_CONFIG.customer`, period label ("Q1 2026"), invoice count
- Right: "Export" button (opens `ExportDialog` for CSV/PDF), "Run Scan" button (simulated 2-second scan, transitions to "Last scan: just now" after completion, fires toast notification)

### KPI Section (px-6 lg:px-8, pt-4 pb-3)

**Primary KPIs**: 4 cards in `grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4`

Each card contains:
- Section label (uppercase 10px)
- `NumberTicker` animated value with optional prefix ($)
- Subtitle (muted text)
- `Sparkline` SVG component (64x24px) showing 6-point trend data, aligned bottom-right
- Subtle gradient background with 3% accent tint
- Staggered slide-up entrance animation
- Hover: border highlight with `--acl-primary`

Cards:
1. **Invoices Processed** -- links to `/pipeline`, value: 1,847, subtitle: "Q1 2026", accent: `--acl-primary`, sparkline: invoices trend
2. **Exceptions Found** -- links to `/exceptions`, value: `apExceptions.length`, subtitle: "{openCount} open", accent: `--warning`, sparkline: exceptions trend
3. **Amount at Risk** -- links to `/exceptions`, value: sum of AP exception `flaggedAmount`, prefix "$", red text, subtitle: "22% of period spend", accent: `--critical`, sparkline: risk trend
4. **Recovered** -- links to `/recovery`, value: sum of recovered amounts, prefix "$", green text, subtitle: "{recoveredCount} resolved", accent: `--success`, sparkline: recovered trend

**Secondary Stats Strip**: Compact inline row (`flex flex-wrap gap-x-6`) below the KPI grid, `mt-3 px-1`

Three inline stats, each as a `<Link>` with:
- Colored dot (1.5x1.5 rounded-full)
- Label + value + optional suffix
- Pipe separator between items
- Hover: text color transitions from secondary to primary

Stats:
1. **Contracts at Risk** -- value: count of breached + warning contracts, suffix: "({breachedCount} breached)", links to `/contracts`, dot color: `--warning`
2. **GPO Compliance** -- value: `getGPOComplianceRate()%`, links to `/contracts`, dot color: `--success`
3. **GPO Savings** -- value: `formatCurrency(getGPOPotentialSavings())`, links to `/contracts`, dot color: `--warning`

### Agent Status Strip (px-6 lg:px-8, pb-4)

Single-row inline bar (`flex items-center gap-1`), wrapped in a `<Link>` to `/pipeline`:
- `Activity` icon (13px, muted)
- Section label "AI Agents"
- 5 agent indicators, each showing:
  - Colored dot (1.5x1.5 rounded-full) using agent CSS variable
  - Agent name (11px)
  - Count value (11px, font-semibold, primary color)
  - Middle-dot separator between agents
- `ArrowUpRight` icon at far right (ml-auto)
- Hover: border highlight with `--acl-primary`

Agents displayed inline:
1. Invoice (1,847) -- `--agent-invoice`
2. Validation (188) -- `--agent-validation`
3. Compliance (12) -- `--agent-compliance`
4. Recovery (14) -- `--agent-recovery`
5. Insight (9) -- `--agent-insight`

### Tabbed Content Section (px-6 lg:px-8, pb-6)

Uses `Tabs` component (Radix-based, `@/components/ui/tabs`) with three tabs:

**Overview tab** (default):
- Two-column grid: `grid-cols-1 lg:grid-cols-[1fr_360px] gap-6`
- **Left -- Spend & Exception Trend**: `ComposedChart` (Recharts), height 260px, Area for spend + Bar for exceptions, custom `SpendTooltip`, legend with inline indicators
- **Right -- By Category**: Stacked horizontal bar for `flaggedByType`, total as "$XXK", legend list with color swatch, category name, percentage, and currency. Clicking navigates to `/exceptions`

**Exceptions tab**:
- Card with header "Recent Exceptions" + "View all {count}" link to `/exceptions`
- `data-table` with 7 columns:
  1. **ID** -- mono font
  2. **Type** -- sortable, badge (critical for contract_overage/suspicious_invoice, neutral otherwise)
  3. **Vendor** -- `VendorBadge` + invoice number below
  4. **Flagged** -- right-aligned, color-coded by severity
  5. **Severity** -- sortable, status dot + label
  6. **Status** -- sortable, badge (critical/warning/blue/success)
  7. **Action** -- "Review ->" link to `/exceptions/{id}`

**Trends tab**:
- Card containing `<DiscrepancyBarChart />` component

## Components

- `Sparkline` (`components/Sparkline.tsx`) -- Pure SVG sparkline, no external dependencies. Props: `data: number[]`, `width` (default 64), `height` (default 24), `color` (default `--acl-primary`), `fillOpacity` (default 0.1). Generates an SVG path (area fill + line stroke) from data points. Used in each primary KPI card.
- `Tabs` (`components/ui/tabs.tsx`) -- Radix-based tab component (TabsList, TabsTrigger, TabsContent)

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
- **Sparkline data**: Hardcoded 6-point arrays in `sparklineData` for invoices, exceptions, risk, recovered trends
- **Key interfaces**: `Exception` (id, type, severity, status, vendor, invoiceNumber, flaggedAmount, category, amount, detectedAt, invoiceDate, assignee)
- **Computed values**: `apExceptions` (non-SOM), `openCount`, `amountAtRisk`, `recoveredAmount`, `recoveredCount`, `contractsAtRiskCount`, `contractsBreachedCount`, `totalFlagged`

## Workflow

1. Page loads with 400ms skeleton state (KPI cards, secondary stats, tabs all show pulse placeholders)
2. KPI cards animate in with staggered slide-up (`NumberTicker` counts up), sparklines render inline
3. Agent strip appears as single clickable row
4. Tabbed content defaults to Overview tab (charts)
5. User can switch to Exceptions tab to see the table, or Trends tab for discrepancy chart
6. User can sort the Recent Exceptions table by type, flaggedAmount, severity, or status
7. Clicking any KPI card or secondary stat navigates to its target page
8. Clicking agent strip navigates to `/pipeline`
9. "Run Scan" triggers a simulated scan with toast notification
10. "Export" opens `ExportDialog` for CSV/PDF download

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Pipeline | reads from | Agent status and processing counts displayed in agent strip |
| Exceptions | reads from | Exception counts, severity breakdown, and recent exceptions table |
| Recovery | reads from | Recovery target and recovered amounts for KPI cards |
| Contracts | reads from | Contract alerts and at-risk count for KPI cards |
| Vendor Scoring | reads from | High-risk vendor count for KPI cards |

## Forbidden Patterns

- **NEVER show raw exception counts without severity breakdown** — Reason: It misleads stakeholders into thinking all exceptions are equal. Always show critical/high/medium/low split.
- **NEVER hardcode KPI values** — Reason: KPI cards must compute from the underlying data arrays. Hardcoded numbers drift from reality as data changes.
- **NEVER auto-refresh the dashboard without user action** — Reason: Mid-analysis refreshes cause data loss if the user is mid-review. Use the explicit "Run Scan" button.
- **NEVER display financial amounts without proper formatting** — Reason: Enterprise users expect locale-aware currency formatting ($X,XXX.XX). Raw numbers look unprofessional.

## AJ Feedback (Parkland Demo)

"Customizable dashboard -- widget arrangement per user role"

## AJ Feedback (Recording 17)

- **Trend analysis bar charts**: Horizontal bars showing discrepancy volume by time period (monthly by day, quarterly by month). Referenced IPO dashboards as inspiration.
- **Dashboard customization**: Two modes -- full dashboard (all metrics) + personal daily dashboard (user-selectable). Customer brand colors. Company name visible on dashboard area, not just sidebar.
- **Enterprise UI quality**: "Cannot look like a spreadsheet." Infographic-quality visuals. Current look is "too simple" and "very generic." Left sidebar "not very sharp."
- **Company logos**: Replace plain vendor names with actual company logos + brand colors for enterprise credibility.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-14: Updated spec to match dashboard modernization — reduced from 7 KPI cards (4+3) to 4 primary KPIs with sparklines + compact secondary stats strip; replaced 5-card agent grid with single-row inline agent bar; wrapped charts + exceptions table + discrepancy chart in 3-tab layout (Overview/Exceptions/Trends); removed <hr> separator; tightened padding; removed Category column from exceptions table (8→7 columns) -->
