# Dashboard — Specification

> **Version:** 2.1 — May 2026
> **Status:** Active — supersedes v2.0
> **Driver:** Senior UX audit (2026-05-18) found v2.0 was still trying to show too much. v2.1 commits to a single job-to-be-done.

## Overview

The dashboard is the **daily triage queue** for AP analysts at Northfield Medical Center. Its single job is: "Show me the 5 things requiring my attention right now, so I can decide which to work on first."

It is NOT a status display, NOT a sales-deck visualization of the agent pipeline, and NOT an executive summary. Those are different surfaces (Pipeline, marketing site, future Executive view). This is a work surface for the analyst who lives in it 6 hours a day.

## Acceptance Criteria

EARS notation.

**Job-to-be-done**
- [ ] THE SYSTEM SHALL render the dashboard such that an AP analyst can identify the top 5 exceptions requiring action within 3 seconds of page load
- [ ] WHEN any exception in the triage list is clicked THE SYSTEM SHALL navigate to `/exceptions/{id}` for detailed review

**App shell**
- [ ] THE SYSTEM SHALL render the dashboard inside `SidebarProvider` + `SidebarInset` with `AppSidebar` and `SiteHeader`
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens

**Page header (compact)**
- [ ] THE SYSTEM SHALL render a single-line page header: title "Inbox" (`text-2xl font-semibold`) + subtitle ("{open count} open · {critical count} critical · Q1 2026") in `text-sm text-muted-foreground`
- [ ] THE SYSTEM SHALL render a single `•••` `DropdownMenu` action button top-right containing: "Run Scan", "Export as CSV", "Export as PDF"

**Triage list (HERO — primary surface, ~70% of viewport)**
- [ ] THE SYSTEM SHALL render the top 6 AP exceptions (`!type.startsWith("som_")`), sorted by severity (critical first) then `flaggedAmount` desc, as the largest visual element on the page
- [ ] THE SYSTEM SHALL render each row as a shadcn `Card`-bordered list item (NOT a `Table`) with: severity dot (`size-2 rounded-full`, colored only if critical/high), vendor name + invoice number (mono), exception type + category, flagged amount (`text-base font-semibold tabular-nums`, color-coded per rule below), and "Review →" action
- [ ] WHEN a row is hovered THE SYSTEM SHALL apply `hover:bg-accent`, raising visual affordance for click
- [ ] THE SYSTEM SHALL render below the list: "Showing 6 of {total} open exceptions · View all →" as a shadcn `Button variant="link"` linking to `/exceptions`

**Color discipline (rule applies to all numbers everywhere on this page)**
- [ ] THE SYSTEM SHALL color a number `text-destructive` ONLY when it represents a problem requiring action (critical/high severity exception's `flaggedAmount`; overdue counts; breached counts)
- [ ] THE SYSTEM SHALL color a number `text-warning` ONLY when it represents a deadline approaching or attention recommended (medium severity; at-risk counts)
- [ ] THE SYSTEM SHALL color a number `text-success` ONLY when it represents a positive completion event (recovered amounts)
- [ ] THE SYSTEM SHALL render all other numbers (totals, counts, currencies that are simply data) in `text-foreground` — never colored
- [ ] WHEN a critical/high severity exception's flaggedAmount is rendered THE SYSTEM SHALL color it `text-destructive`; for medium `text-warning`; for low `text-foreground`

**Secondary metrics row (compact, below the triage list)**
- [ ] THE SYSTEM SHALL render exactly 4 stats as a single horizontal flex row with `divide-x divide-border`, total height ≤ 64px: Open Exceptions, Amount at Risk, Recovered (Q1), SLA Overdue
- [ ] THE SYSTEM SHALL render each stat as label (`text-xs uppercase text-muted-foreground`) + value (`text-lg font-semibold tabular-nums`), NOT as `Card` (no card border, no padding-heavy KPI treatment)
- [ ] THE SYSTEM SHALL apply color discipline rules above — only "SLA Overdue > 0" and "Amount at Risk" (when total > policy threshold) get colored; counts and totals stay `text-foreground`
- [ ] WHEN any secondary stat is clicked THE SYSTEM SHALL navigate to its target page (Open Exceptions → `/exceptions`, Amount at Risk → `/exceptions`, Recovered → `/recovery`, SLA Overdue → `/recovery`)

**REMOVED from dashboard in v2.1 (compared to v2.0)**
- [ ] THE SYSTEM SHALL NOT render: sparklines, trend chart, By Category breakdown, agent strip, Run Scan as a primary button, Export as primary buttons, KPI cards with `CardHeader`/`CardDescription`/`CardTitle`/`CardAction`/`CardFooter` treatment, Tabs (Overview/Exceptions/Trends), Contracts at Risk / GPO Compliance / GPO Savings secondary stats
- [ ] THE "By Category" content SHALL live at `/product-analysis`
- [ ] THE agent strip SHALL be available on `/pipeline` only (already its primary content)
- [ ] THE spend trend chart SHALL be available on `/recovery` (already specced there) and a future `/analytics` page

**Loading and safety**
- [ ] WHEN the page mounts THE SYSTEM SHALL display shadcn `Skeleton` placeholders for the triage list (6 row skeletons) and the 4-stat strip for 300ms before real content
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable all entrance animations
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on all interactive elements
- [ ] THE SYSTEM SHALL display a legal disclaimer dialog before any action that commits the organization (no action on the dashboard itself triggers commitment — actions live on `/exceptions/{id}`)

## Layout

Renders inside `SidebarProvider` + `SidebarInset` (per `ui-standard.md` v2.0).

### Header strip (px-4 lg:px-6, pt-6 pb-4)
- Left: title `text-2xl font-semibold` "Inbox" + subtitle `text-sm text-muted-foreground` ("{openCount} open · {criticalCount} critical · Q1 2026")
- Right: single shadcn `DropdownMenu` triggered by `Button variant="outline" size="icon"` with `MoreHorizontal` icon. Menu items: "Run Scan" (with `Sparkles` icon), separator, "Export as CSV", "Export as PDF"

### Triage list (px-4 lg:px-6, pb-6) — HERO

```
┌─────────────────────────────────────────────────────────────┐
│ Top 6 exceptions                              View all 188→ │
├─────────────────────────────────────────────────────────────┤
│ ● BME · BME-2026-Q1-047 · Contract Overage    $123,890  →  │
│ ● MS  · MS-2026-0923  · Duplicate Billing      $47,320  →  │
│ ● MT  · MTS-INV-00291 · Suspicious Invoice     $45,200  →  │
│ ● STE · STC-2026-19847· Match Exception         $4,600  →  │
│ ◐ STC · STC-2026-19211· Tier Pricing            $3,200  →  │
│ ◐ CH  · CHE-2026-0089 · Missing Rebate          $2,150  →  │
└─────────────────────────────────────────────────────────────┘
                Showing 6 of 188 open exceptions · View all →
```

- Outer container: shadcn `Card` with `CardHeader` (`CardTitle` "Top 6 exceptions" + `CardAction` "View all {total} →" `Button variant="link"`)
- `CardContent` containing a list of 6 rows separated by `divide-y divide-border` — NOT a `Table`. List feels lighter, more inbox-like.
- Each row:
  - 8px severity dot (`bg-destructive` for critical, `bg-destructive/60` for high, `bg-warning` for medium, `bg-border` for low)
  - Vendor (`VendorBadge` — name + avatar) + invoice number below (`font-mono text-xs text-muted-foreground`)
  - Exception type as plain text (`text-sm`) + `CategoryBadge` (existing InvoiceIQ component preserved)
  - Flagged amount, right-aligned, `tabular-nums font-semibold text-base`, color per discipline rule
  - `ChevronRight` icon (`size-4 text-muted-foreground`) on hover
- Row wraps in a `<Link>` to `/exceptions/{id}` — entire row is the click target
- `CardFooter`: "Showing 6 of {totalOpen} open exceptions · View all →"

### Secondary metrics strip (px-4 lg:px-6, pb-6)

```
OPEN EXCEPTIONS │ AMOUNT AT RISK │ RECOVERED (Q1) │ SLA OVERDUE
146             │ $2,209,166     │ $14,458        │ 4
```

- Single horizontal flex row, `divide-x divide-border`, max height 64px
- 4 cells, each a `<Link>` to its target page
- Each cell: label (`text-xs uppercase text-muted-foreground tracking-wider`) + value (`text-lg font-semibold tabular-nums`)
- Color applied ONLY per discipline rule: `SLA Overdue` colored `text-destructive` IF > 0; `Amount at Risk` colored `text-destructive` IF > $1M policy threshold; otherwise neutral `text-foreground`

## Components

shadcn primitives:
- `Card`, `CardHeader`, `CardTitle`, `CardAction`, `CardContent`, `CardFooter` — for the triage list outer container
- `Button` (`variant="link"`, `variant="outline" size="icon"`) — for "View all" and `•••` menu trigger
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` — for Run Scan / Export menu
- `Skeleton` — loading state

InvoiceIQ extensions preserved:
- `VendorBadge` — vendor avatar + name in triage rows
- `CategoryBadge` — color-coded category pill in triage rows
- `ExportDialog` — opened from Export menu items
- `LegalDisclaimerDialog` — opened from Run Scan if it triggers commitment (currently no — Run Scan is read-only)

Removed in v2.1:
- `Sparkline` — not on this page anymore
- `Tabs` — not on this page anymore
- `Section card` pattern (CardDescription/CardTitle big number) — not on this page anymore; secondary stats are inline strip

## Business Rules

- **Triage filtering**: dashboard shows only AP exceptions (`!type.startsWith("som_")`)
- **Triage sorting**: by severity (critical=0, high=1, medium=2, low=3), then `flaggedAmount` desc within each tier
- **Triage limit**: top 6 rows; everything else hidden behind "View all"
- **Status filter**: only `open`, `under_review`, `escalated` shown in triage; `resolved` hidden (out of inbox)
- **Open Exceptions count**: total of statuses `open` + `under_review` + `escalated` for AP exceptions
- **Amount at Risk**: sum of `flaggedAmount` across open AP exceptions
- **Recovered (Q1)**: sum of `recoveredAmount` for recovery queue items with status `recovered`
- **SLA Overdue**: count of recovery queue items where `slaDeadline < now` AND status is not `recovered`/`closed`
- **Color discipline (cross-cutting)**: see Acceptance Criteria — color = action required. Never decorate.
- **Loading state**: 300ms shadcn `Skeleton` placeholders

## Data Model

- **Source files**: `lib/data.ts` (allExceptions, recoveryQueue, formatCurrency, severityConfig, statusConfig, typeConfig), `lib/workflow-config.ts` (PARKLAND_CONFIG)
- **Computed values**: `apExceptions`, `openExceptions`, `criticalCount`, `topSix` (sorted slice), `openCount`, `amountAtRisk`, `recoveredAmount`, `slaOverdueCount`
- **No hardcoded sparkline data, no spend trend, no flaggedByType import** — those moved to other pages

## Workflow

1. AP analyst opens `/` first thing in the morning
2. 300ms `Skeleton` while data loads
3. Triage list renders — analyst scans the 6 rows, sees the top critical at the top
4. Analyst clicks the top row → navigates to `/exceptions/{id}` for the three-way match review
5. After resolving, returns to `/` (or to `/exceptions` via "View all") to pick the next item
6. Secondary strip (Open Exceptions, Amount at Risk, Recovered, SLA Overdue) provides peripheral awareness — clicked when analyst wants to see the broader queue or recovery status
7. `•••` menu used occasionally: Run Scan to refresh, Export for stakeholder reports

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Exceptions | reads from | The 6 triage rows are derived from `allExceptions` filtered + sorted |
| Recovery | reads from | Recovered (Q1) and SLA Overdue stats |
| Invoice Detail | navigates to | Clicking any triage row goes to `/exceptions/{id}` |
| Pipeline | (no direct dependency in v2.1) | Agent strip removed from dashboard — Pipeline page owns that |
| Product Analysis | (no direct dependency in v2.1) | By Category breakdown moved to `/product-analysis` |
| Contracts | (no direct dependency in v2.1) | Contracts at Risk / GPO stats removed from dashboard — Contracts page owns those |

## Forbidden Patterns

Use affirmative phrasing per SpecLayer v1.1.

- **Render the triage list as the largest visual element on the page** — Reason: this is the page's single job; everything else is secondary.
- **Apply status color (destructive/warning/success) only to values that represent an action required** — Reason: when everything is colored, nothing stands out; color discipline is the single biggest lever for enterprise credibility (per AJ Parkland feedback).
- **Render Run Scan and Export inside a `DropdownMenu` triggered by `•••`** — Reason: these are infrequent actions; primary buttons steal attention from the triage list.
- **Cap the triage list at 6 rows; route to `/exceptions` for the rest** — Reason: an inbox should fit on one screen; longer than 6 invites scrolling and dilutes the "next action" framing.
- **Use shadcn `Card` + `divide-y` list pattern for the triage**, not `Table` — Reason: list feels lighter and more inbox-like; tables imply browseable data, lists imply work queue.
- **Use shadcn primitives (`Card`, `Button`, `DropdownMenu`, `Skeleton`) for all surfaces and controls** — Reason: deprecates ad-hoc `<div className="card">` and inline-styled buttons from v1; consistent disabled/focus/hover states.
- **Use theme tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `text-destructive`, `text-warning`, `text-success`, `bg-accent`, `border-border`) for all surfaces, text, and emphasis** — Reason: hex tokens and v1 design system removed in v2.0; consistent light/dark behavior.
- **Render the secondary stats strip in ≤ 64px total height, with no Card border** — Reason: v2.0 used full KPI Cards for these (160px+); v2.1 audit found that pattern stole attention from the triage hero.

## AJ Feedback (Parkland Demo)

"Customizable dashboard — widget arrangement per user role"

### AJ Feedback (Recording 17)

- **Trend analysis bar charts**: Horizontal bars showing discrepancy volume by time period (monthly by day, quarterly by month). Referenced IPO dashboards as inspiration. → **v2.1 decision: moved to `/recovery` (already specced) and a future `/analytics` page. Dashboard is not the place for trends.**
- **Dashboard customization**: Two modes — full dashboard (all metrics) + personal daily dashboard (user-selectable). → **v2.1 decision: dashboard IS the "personal daily" view. The "all metrics" view is the sum of individual domain pages (Exceptions, Recovery, Contracts, etc.).**
- **Enterprise UI quality**: "Cannot look like a spreadsheet." Infographic-quality visuals. → **v2.1 decision: addressed by aggressive color discipline + hero-list pattern + removal of stat-card overload.**
- **Company logos**: Replace plain vendor names with actual company logos + brand colors. → **v2.1 decision: `VendorBadge` already supports this; ensure brand colors render in dark mode.**

## Decision Log

<!-- 2026-05-18: v2.1 — adopted single job-to-be-done framing (triage > status > sales-deck). Audit found v2.0 was still showing 17+ items in first viewport; reduced to triage list + 4-stat strip + nothing else. Primary user clarified as AP analyst (not VP) — VP gets summary via the 4-stat strip. Color discipline made absolute: color = action required, no decoration. Run Scan + Export demoted to `•••` dropdown. Removed sparklines, tabs, by-category, agent strip, contracts stats from dashboard — they live on their owner pages. Justified by 8-finding senior UX audit (2026-05-18). -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system (Phase 2 of UI revamp, follows ui-standard.md v2.0). App shell SidebarProvider+SidebarInset. KPI grid shadcn Card primitives. Tabs removed. Linear layout. Token migration. -->
<!-- 2026-05-14: Updated spec to match dashboard modernization — reduced from 7 KPI cards (4+3) to 4 primary KPIs with sparklines + compact secondary stats strip; replaced 5-card agent grid with single-row inline agent bar; wrapped charts + exceptions table + discrepancy chart in 3-tab layout (Overview/Exceptions/Trends); removed <hr> separator; tightened padding; removed Category column from exceptions table (8→7 columns) -->
<!-- 2026-05-14: Initial spec created from current codebase -->

<!-- CHANGELOG -->
<!-- 2026-05-18 v2.1: Senior UX audit-driven rewrite. Single job: AP analyst triage. Hero: 6-row exceptions list (Card + divide-y, NOT Table). Secondary: 4-stat compact strip (≤64px, no Card border). Removed from dashboard: sparklines, trend chart, by-category, agent strip, tabs, Contracts/GPO stats, Run Scan/Export as primary buttons. Run Scan + Export moved into `•••` DropdownMenu. Aggressive color discipline: only action-required values get colored. Acceptance Criteria: 21 EARS criteria. Forbidden Patterns: 8 affirmative rules including "color = action required" cross-cutting rule. -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system. App shell, Card primitives, container queries, tokens migrated. -->
<!-- 2026-05-18: Added Acceptance Criteria section using EARS notation (SpecLayer v1.1 worked example). -->
<!-- 2026-05-14: Initial spec + dashboard modernization (sparklines + tabs + agent strip). -->
