# Dashboard -- Specification

## Overview

The main dashboard is the landing page of InvoiceIQ Detect. It provides a single-screen summary of invoice processing health for Northfield Medical Center, surfacing KPI metrics, AI agent operational status, spend and exception trends, and the most urgent exceptions requiring analyst attention. The dashboard is designed for a VP of Supply Chain or AP Director who needs to assess the current state of their procurement risk in under 10 seconds.

## Acceptance Criteria

EARS notation — `WHEN [trigger]`, `WHILE [state]`, `IF [condition] THEN`, or ubiquitous `THE SYSTEM SHALL`.

**App shell**
- [ ] THE SYSTEM SHALL render the dashboard inside a `SidebarProvider` + `SidebarInset` shell with `AppSidebar` and `SiteHeader`
- [ ] THE SYSTEM SHALL set `--sidebar-width: calc(var(--spacing) * 72)` and `--header-height: calc(var(--spacing) * 12)` as inline CSS variables on `SidebarProvider`
- [ ] WHEN the sidebar is collapsed THE SYSTEM SHALL persist the collapsed state across page navigation
- [ ] THE SYSTEM SHALL support both light and dark mode — every surface, text, and chart token reads from the active theme

**Initial render**
- [ ] WHEN the dashboard mounts THE SYSTEM SHALL display shadcn `Skeleton` placeholders for the KPI grid, chart area, and data table for 400ms before real content

**Primary KPIs (`<SectionCards />` pattern)**
- [ ] THE SYSTEM SHALL display exactly four primary KPI cards (Invoices Processed, Exceptions Found, Amount at Risk, Recovered) in a container-query grid: `grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4`
- [ ] THE SYSTEM SHALL render each KPI using shadcn `Card` + `CardHeader` + `CardDescription` + `CardTitle` + `CardAction` + `CardFooter` primitives
- [ ] THE SYSTEM SHALL render a trend `Badge variant="outline"` inside `CardAction` containing `IconTrendingUp` or `IconTrendingDown` plus a percentage delta
- [ ] THE SYSTEM SHALL compute "Exceptions Found" as the length of AP exceptions (`!type.startsWith("som_")`)
- [ ] THE SYSTEM SHALL compute "Amount at Risk" as the sum of `flaggedAmount` across all AP exceptions, formatted with a `$` prefix, with `CardTitle` styled `text-destructive`
- [ ] THE SYSTEM SHALL compute "Recovered" as the sum of `recoveredAmount` for recovery queue items with status "recovered", with `CardTitle` styled `text-success`
- [ ] THE SYSTEM SHALL apply `tabular-nums` to all KPI values so digits align across cards
- [ ] WHEN the card container width crosses 250px THE SYSTEM SHALL upsize `CardTitle` from `text-2xl` to `text-3xl` via `@[250px]/card` container query

**Secondary stats strip**
- [ ] THE SYSTEM SHALL render exactly three secondary stats (Contracts at Risk, GPO Compliance, GPO Savings) in a `flex flex-wrap gap-x-6` row below the primary KPI grid
- [ ] THE SYSTEM SHALL prefix each stat with a `size-1.5 rounded-full` dot using `bg-warning` / `bg-success` / `bg-warning` respectively
- [ ] WHEN any secondary stat is hovered THE SYSTEM SHALL transition the text color from `text-muted-foreground` to `text-foreground`

**Agent strip**
- [ ] THE SYSTEM SHALL render the five AI agents as a single shadcn `Card`-wrapped inline row using container query `@container/main`
- [ ] THE SYSTEM SHALL render each agent dot using `bg-[var(--agent-*)]` where `*` is one of `invoice|validation|compliance|recovery|insight`
- [ ] WHEN the agent strip is hovered THE SYSTEM SHALL apply `hover:bg-accent`
- [ ] WHEN the agent strip is clicked THE SYSTEM SHALL navigate to `/pipeline`

**Chart section (`<ChartAreaInteractive />` pattern)**
- [ ] THE SYSTEM SHALL render a single full-width `Card` containing a Recharts `AreaChart` with two series: invoice spend (`var(--chart-1)`, area fill gradient) and flagged amount (`var(--destructive)`, dashed line, no fill)
- [ ] THE SYSTEM SHALL provide a `ToggleGroup` in `CardAction` with three options: "Last 3 months" (default), "Last 30 days", "Last 7 days"
- [ ] WHEN a user selects a period toggle THE SYSTEM SHALL filter the chart data and update both series and the x-axis range

**Recent Exceptions table (`<DataTable />` pattern)**
- [ ] THE SYSTEM SHALL display only AP exceptions (`!type.startsWith("som_")`), sorted by severity (critical first), limited to top 6, inside a shadcn `Card`
- [ ] THE SYSTEM SHALL render the table using shadcn `Table` primitives with seven columns: ID, Type, Vendor, Flagged, Severity, Status, Action
- [ ] WHEN a user clicks a column header THE SYSTEM SHALL sort by Type, Flagged, Severity, or Status
- [ ] THE SYSTEM SHALL render status badges using shadcn `Badge` variants (destructive / outline / secondary) — never inline-styled badges
- [ ] THE SYSTEM SHALL render the Flagged column right-aligned with `tabular-nums`, color-coded `text-destructive` for critical/high, `text-warning` for medium, `text-foreground` for low

**Run Scan and Export**
- [ ] WHEN a user clicks "Run Scan" THE SYSTEM SHALL show a "Scanning..." state for 2 seconds, disable the button on completion, and fire a toast: "2 new exceptions identified"
- [ ] WHEN a user clicks "Export" THE SYSTEM SHALL open `ExportDialog` for CSV or PDF download

**Navigation**
- [ ] WHEN any KPI card or secondary stat is clicked THE SYSTEM SHALL navigate to its declared target page (Invoices Processed → `/pipeline`, Exceptions Found → `/exceptions`, Amount at Risk → `/exceptions`, Recovered → `/recovery`, all three secondary stats → `/contracts`)

**Accessibility and safety**
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable all entrance animations and chart transitions
- [ ] THE SYSTEM SHALL display a legal disclaimer dialog before any action that commits the organization
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on all interactive elements (cards, buttons, links, table rows)

## Layout

### Header (px-6 lg:px-8, pt-6 pb-5)
- Left: page title "Invoice Intelligence", customer name from `PARKLAND_CONFIG.customer`, period label ("Q1 2026"), invoice count
- Right: "Export" button (opens `ExportDialog` for CSV/PDF), "Run Scan" button (simulated 2-second scan, transitions to "Last scan: just now" after completion, fires toast notification)

### App Shell (NEW in v2.0 — shadcn pattern)

The entire authenticated app wraps in `SidebarProvider` + `SidebarInset` per `ui-standard.md` v2.0. The dashboard renders inside `SidebarInset` and inherits the shell. Layout sections below describe the dashboard content area only.

```tsx
<SidebarProvider style={{
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)"
}}>
  <AppSidebar variant="inset" />
  <SidebarInset>
    <SiteHeader />
    <main className="@container/main flex flex-1 flex-col">
      {/* dashboard content (sections below) */}
    </main>
  </SidebarInset>
</SidebarProvider>
```

`SiteHeader` replaces the old custom topbar — it holds breadcrumb, search, sync status, notifications, and the page title "Invoice Intelligence".

### KPI Section — `<SectionCards />` pattern (px-4 lg:px-6, py-4 md:py-6)

Adopts shadcn `dashboard-01` `section-cards.tsx` pattern: shadcn `Card` primitives with `CardHeader` / `CardDescription` / `CardTitle` / `CardAction` / `CardFooter`. Container query grid: `grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4`.

Each card structure:
```tsx
<Card className="@container/card">
  <CardHeader>
    <CardDescription>{label}</CardDescription>
    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
      {value}
    </CardTitle>
    <CardAction>
      <Badge variant="outline">
        {trend > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
        {trendPct}
      </Badge>
    </CardAction>
  </CardHeader>
  <CardFooter className="flex-col items-start gap-1.5 text-sm">
    <div className="line-clamp-1 flex gap-2 font-medium">{trendLine}</div>
    <div className="text-muted-foreground">{contextLine}</div>
  </CardFooter>
</Card>
```

**Inline `Sparkline` is REMOVED in v2.0.** The shadcn pattern conveys trend via `CardAction` badge (`IconTrendingUp` + percentage) and `CardFooter` text line. This is intentional — replaces the 64x24 SVG sparkline with a cleaner, more readable indicator. Sparkline component is kept in `components/Sparkline.tsx` for use elsewhere if needed.

Cards (4 total, each is a `<Link>` wrapping the `<Card>`):
1. **Invoices Processed** — links to `/pipeline`, value: 1,847, trendLine: "Trending up this period", contextLine: "Q1 2026", trend badge: chart-1 styled
2. **Exceptions Found** — links to `/exceptions`, value: `apExceptions.length`, trendLine: "{openCount} open", contextLine: "Requires analyst attention", trend badge: derived from open count delta
3. **Amount at Risk** — links to `/exceptions`, value: sum of AP exception `flaggedAmount`, prefix "$", `CardTitle` uses `text-destructive`, trendLine: "22% of period spend", contextLine: "Across {n} flagged invoices"
4. **Recovered** — links to `/recovery`, value: sum of recovered amounts, prefix "$", `CardTitle` uses `text-success`, trendLine: "{recoveredCount} resolved this period", contextLine: "Recovery rate {pct}%"

### Secondary Stats Strip (px-4 lg:px-6)

Three inline stats below the KPI cards. Uses shadcn `text-muted-foreground` + small dots from theme tokens (`bg-warning`, `bg-success`, `bg-destructive`), `flex flex-wrap gap-x-6` row with pipe `|` separators (border-l + pl-6 on subsequent items).

Stats:
1. **Contracts at Risk** — value: count of breached + warning contracts, suffix: "({breachedCount} breached)", links to `/contracts`, dot: `bg-warning`
2. **GPO Compliance** — value: `getGPOComplianceRate()%`, links to `/contracts`, dot: `bg-success`
3. **GPO Savings** — value: `formatCurrency(getGPOPotentialSavings())`, links to `/contracts`, dot: `bg-warning`

### Agent Status Strip (px-4 lg:px-6, pb-4)

Single-row inline bar wrapped in `<Link>` to `/pipeline`. Uses shadcn `Card` (compact variant — `py-2` instead of default) for surface, theme-driven `text-foreground` and `text-muted-foreground` for text:
- `Activity` icon (size-4, `text-muted-foreground`)
- Section label "AI Agents" (`text-xs text-muted-foreground`)
- 5 agent indicators inline, each:
  - Colored dot (`size-1.5 rounded-full`) using `bg-[var(--agent-*)]`
  - Agent name (`text-xs`)
  - Count value (`text-xs font-semibold text-foreground`)
  - Middle-dot separator (`text-muted-foreground`) between agents
- `ArrowUpRight` icon at far right (`ml-auto size-4 text-muted-foreground`)
- Hover: `hover:bg-accent` (shadcn convention) — replaces custom `--acl-primary` border

Agents displayed inline:
1. Invoice (1,847) — `--agent-invoice`
2. Validation (188) — `--agent-validation`
3. Compliance (12) — `--agent-compliance`
4. Recovery (14) — `--agent-recovery`
5. Insight (9) — `--agent-insight`

### Chart Section — `<ChartAreaInteractive />` (px-4 lg:px-6)

Adopts shadcn `chart-area-interactive.tsx` pattern. Single full-width `Card` containing:
- `CardHeader` with `CardTitle` ("Spend & Exceptions"), `CardDescription` ("Last 3 months" / period selector), `CardAction` with `ToggleGroup` for "Last 3 months / Last 30 days / Last 7 days"
- `CardContent` with Recharts `AreaChart` — two series:
  - **Series 1 (chart-1):** invoice spend (area fill gradient from chart-1/30% to chart-1/0%)
  - **Series 2 (destructive):** flagged amount overlay (destructive color, dashed line, no fill — semantic status, not chart palette)
- X-axis: dates, ticks every 7 days, `text-muted-foreground`
- Y-axis: hidden (shadcn convention) or muted ticks
- Tooltip: shadcn `ChartTooltip` (built into `chart` block)

This **replaces the v1 Overview tab two-column grid** (Spend & Exception Trend left + By Category right). The "By Category" breakdown moves to the Exceptions section below or a separate `/product-analysis` view.

### Recent Exceptions Section — `<DataTable />` (px-4 lg:px-6, pb-6)

Adopts shadcn `data-table.tsx` block. Single full-width `Card`:
- `CardHeader` with `CardTitle` ("Recent Exceptions") and `CardAction` containing "View all {count}" link to `/exceptions`
- `CardContent` with shadcn `Table` (TanStack-backed):
  1. **ID** — `font-mono text-sm tabular-nums`
  2. **Type** — sortable, `Badge variant="destructive"` for contract_overage/suspicious_invoice, `Badge variant="secondary"` otherwise
  3. **Vendor** — `VendorBadge` + invoice number below (`text-xs text-muted-foreground`)
  4. **Flagged** — right-aligned, `tabular-nums`, `text-destructive` for critical/high severity, `text-warning` for medium, `text-foreground` for low
  5. **Severity** — sortable, dot + label
  6. **Status** — sortable, `Badge` variant matching status
  7. **Action** — "Review →" link to `/exceptions/{id}`

**Tabs (Overview/Exceptions/Trends) are REMOVED in v2.0.** The shadcn pattern is linear — KPIs → chart → data table. Trends content moves into the chart (period toggle); category breakdown moves to `/product-analysis`.

## Components

shadcn primitives (from `components/ui/`, installed via `npx shadcn add`):
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardFooter`, `CardContent` — surface container
- `Badge` (variants: default, outline, secondary, destructive) — status indicators
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` — data table
- `Sidebar`, `SidebarProvider`, `SidebarInset`, `SidebarTrigger` — app shell
- `ToggleGroup`, `ToggleGroupItem` — period selector in chart
- `Skeleton` — loading state
- `Tabs` (TabsList, TabsTrigger, TabsContent) — still present in codebase, no longer used by dashboard in v2.0

shadcn blocks (from `components/blocks/` or inlined):
- `SectionCards` — 4-card KPI grid (replaces the v1 custom KPI cards + Sparkline)
- `ChartAreaInteractive` — Recharts AreaChart with ToggleGroup period selector
- `DataTable` — TanStack-backed table with shadcn `Table` primitives
- `AppSidebar` — app navigation sidebar (replaces `components/Sidebar.tsx`)
- `SiteHeader` — app header bar (replaces `components/TopBar.tsx`)

InvoiceIQ-specific (preserved):
- `VendorBadge` — vendor avatar + name, retained for table Vendor column
- `ExportDialog` — CSV/PDF export modal
- `LegalDisclaimerDialog` — legal confirmation before commit actions
- `Sparkline` (`components/Sparkline.tsx`) — kept in codebase but **NOT used by dashboard in v2.0**. May be used by other domain pages if appropriate.

## Business Rules

- **Exception filtering**: Dashboard shows only AP exceptions (`!type.startsWith("som_")`), sorted by severity (critical first), limited to top 6
- **Severity sort order**: critical=0, high=1, medium=2, low=3
- **Status sort order**: open=0, under_review=1, escalated=2, resolved=3
- **Amount at Risk**: sum of `flaggedAmount` across all AP exceptions
- **Recovered**: sum of `recoveredAmount` from recovery queue items with status "recovered"
- **Contracts at Risk**: count of contracts with status "breached" or "warning"
- **Flagged color logic**: critical/high = `text-destructive`, medium = `text-warning`, low = `text-foreground`
- **Trend badge logic**: positive delta → `IconTrendingUp`; negative delta → `IconTrendingDown`. Both use `Badge variant="outline"`.
- **Period toggle (chart)**: defaults to "Last 3 months"; selecting "Last 30 days" or "Last 7 days" filters both series and updates x-axis
- **Run Scan**: simulated 2-second delay, shows "Scanning..." state, disables after completion, fires "2 new exceptions identified" toast
- **Export**: supports CSV and PDF formats via `exportToCSV` / `exportToPDF` from `lib/export`
- **Loading state**: 400ms simulated loading with shadcn `Skeleton` placeholders for KPI grid, chart, and table

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

Use affirmative phrasing per SpecLayer v1.1 — "use X for Y" not "don't use Z".

- **Show severity breakdown alongside any exception count** — Reason: raw counts mislead stakeholders into treating all exceptions as equal. Always split into critical/high/medium/low.
- **Compute KPI values from underlying data arrays at render time** — Reason: hardcoded numbers drift from reality as data changes; KPIs must derive from `apExceptions`, `recoveryQueue`, `contracts`.
- **Require explicit user action ("Run Scan" button) for all data refreshes** — Reason: mid-analysis auto-refresh causes data loss while the user is reviewing.
- **Use `formatCurrency(amount)` from `lib/utils` for all monetary values** — Reason: enterprise users expect locale-aware `$X,XXX.XX`; raw numbers look unprofessional.
- **Use shadcn `Card` + `CardHeader`/`CardTitle`/`CardAction`/`CardFooter` primitives for every KPI card** — Reason: ad-hoc `<div className="card">` markup deprecated in ui-standard.md v2.0; the primitives are the consistent surface.
- **Use shadcn `Badge variant="..."` for all status indicators** — Reason: `.badge.critical` / `.badge.warning` utility classes deprecated in v2.0.
- **Use theme tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `text-destructive`) for surfaces and text** — Reason: hex colors and v1 tokens (`--bg-surface`, `--critical`, `--text-primary`) are being removed.
- **Use container queries (`@container/main`, `@xl/main:grid-cols-2`) for KPI grid responsive layout** — Reason: shadcn `dashboard-01` standard; replaces media-query-based `sm:` / `lg:` for the KPI grid specifically.

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
<!-- 2026-05-18: Added Acceptance Criteria section using EARS notation (SpecLayer v1.1 worked example). 19 criteria covering initial render, primary KPIs, secondary stats, agent strip, tabbed content, Run Scan / Export, navigation, accessibility. Grounded in current code post-d59a2f2. -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system (Phase 2 of UI revamp, follows ui-standard.md v2.0). App shell wraps in SidebarProvider+SidebarInset (replaces custom topbar+sidebar). KPI grid uses shadcn `Card` primitives with `CardHeader`/`CardDescription`/`CardTitle`/`CardAction`/`CardFooter` and container queries (`@container/card`, `@xl/main:grid-cols-2 @5xl/main:grid-cols-4`). Inline `Sparkline` removed from KPI cards; trend conveyed via `IconTrendingUp`/`IconTrendingDown` badge in `CardAction`. Tabs (Overview/Exceptions/Trends) removed — layout is linear KPIs → ChartAreaInteractive → DataTable. Chart adds `ToggleGroup` period selector ("Last 3 months/30 days/7 days"). All tokens migrated to shadcn theme (`bg-card`, `text-destructive`, `text-warning`, `text-success`, `text-muted-foreground`) per ui-standard.md v1→v2 migration map. Forbidden Patterns rewritten in affirmative form per SpecLayer v1.1. -->
<!-- 2026-05-18 v2.0: Acceptance Criteria rewritten to match new layout — 28 EARS criteria covering app shell, container queries, shadcn Card/Badge/Table primitives, ChartAreaInteractive with period toggle, DataTable, and accessibility with `var(--ring)`. -->
