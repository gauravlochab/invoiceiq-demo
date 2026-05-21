# Dashboard — Specification

> **Version:** 2.3 — May 2026
> **Status:** Active — supersedes v2.2
> **Driver:** Product-owner decision (2026-05-21) — all-in-one v2.3 rebuild after the 2026-05-21 4-agent audit (`dashboard-audit-2026-05-21.html`). v2.3 declutters the crammed v2.2 layout, fixes data-integrity defects, adds 4 stakeholder features, fixes WCAG criticals, and fixes chart theming — without removing any v2.2 feature.

## Overview

The dashboard is the **command surface** for the AP analyst and the supply-chain VP at Northfield Medical Center. It answers, at a glance: "How much is at risk right now, what is the pipeline doing, what needs triage, and how is recovery tracking?"

v2.3 keeps every v2.2 feature but reorganizes the page so it reads top-to-bottom as **one hero answer → grouped context → the work → the analysis**. The 4-agent audit found v2.2 crammed ~17 figures into the first viewport with no hierarchy, contradicted its own numbers, and failed WCAG 2.1 AA. v2.3 fixes all five fronts: declutter, stakeholder gaps, data integrity, accessibility, theming.

## Acceptance Criteria

EARS notation.

**App shell**
- [ ] THE SYSTEM SHALL render only page content inside the `<main>` provided by `app/layout.tsx` — `SidebarProvider` + `SidebarInset` + `AppSidebar` + `SiteHeader` are owned by the layout and SHALL NOT be duplicated on this page
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `text-destructive`, `text-warning-text`, `text-success-text`, `border-border`, `bg-accent`, `--chart-1..5`)

**Page header**
- [ ] THE SYSTEM SHALL render a page header: title "Invoice Intelligence" (`text-2xl font-semibold`) + subtitle ("{customer} · Q1 2026") in `text-sm text-muted-foreground` — the subtitle SHALL NOT restate the invoice count (shown once, in the secondary trio)
- [ ] THE SYSTEM SHALL render two header actions top-right: an "Export" `Button variant="outline"` opening `ExportDialog`, and a "Run Scan" `Button variant="default"` that runs a read-only scan
- [ ] WHEN "Run Scan" completes THE SYSTEM SHALL toast a truthful message that claims no data change (e.g. "Scan complete — no new exceptions") because the scan does not mutate the dataset

**Hero KPI — Amount at Risk**
- [ ] THE SYSTEM SHALL render an asymmetric hero band: an "Amount at Risk" hero card spanning ~1.6fr and a secondary KPI trio spanning ~1fr each, in a `@container/main`-driven grid that stacks on narrow widths
- [ ] THE hero card SHALL render the Amount at Risk value larger than the trio values (`text-3xl @[300px]/card:text-4xl`), in `text-destructive`, animated with `NumberTicker`
- [ ] THE hero card SHALL render exactly ONE `Sparkline` on the page — no other KPI renders a sparkline
- [ ] THE hero card SHALL render an action line linking to the pre-filtered triage view (`/exceptions?severity=critical`) showing the open critical count

**Secondary KPI trio**
- [ ] THE SYSTEM SHALL render exactly 3 secondary KPI `Card`s — Invoices Processed, Exceptions Found, Recovery Rate — each with `CardHeader` (`CardDescription` label + `CardTitle` value) and `CardFooter` (context line); NONE renders a sparkline
- [ ] WHEN a secondary KPI card is clicked THE SYSTEM SHALL navigate to its target (Invoices → `/pipeline`, Exceptions → `/exceptions`, Recovery Rate → `/recovery`)

**Context band (merged)**
- [ ] THE SYSTEM SHALL render ONE bordered context row split into two labelled groups: "Pipeline" (the 5 agents) and "Contracts & GPO" (3 stats: Contracts at Risk, GPO Compliance, GPO Savings)
- [ ] THE context band SHALL NOT render `|` or `·` glyph separators — groups are separated by a labelled heading and whitespace/border only
- [ ] THE SYSTEM SHALL color each agent dot with its InvoiceIQ agent token (`--agent-invoice` … `--agent-insight`); the "Pipeline" group links to `/pipeline`, each "Contracts & GPO" stat links to `/contracts`
- [ ] THE GPO Savings stat SHALL be labelled "GPO Savings (potential)" because the figure is missed/potential savings, not realized

**Exceptions work table (promoted)**
- [ ] THE SYSTEM SHALL render the recent-exceptions table always visible, directly under the context band — NOT inside a tab
- [ ] THE table SHALL list the top 6 AP exceptions (`!type.startsWith("som_")`) with columns ID, Type, Vendor, Flagged, Severity, Status, Review — default-sorted by severity (critical=0 … low=3)
- [ ] WHEN a sortable column header is clicked THE SYSTEM SHALL re-sort by that column, toggle direction, and set `aria-sort` on that header to `ascending`/`descending` (other sortable headers `none`)
- [ ] THE flagged-amount column SHALL convey severity with a non-color cue (a severity icon) in addition to color — color SHALL NOT be the only severity signal
- [ ] WHEN a row's "Review" link is clicked THE SYSTEM SHALL navigate to `/exceptions/{id}`

**Invoice-status overview**
- [ ] THE SYSTEM SHALL render an aggregate count-by-status breakdown of all AP exceptions (Open, Under Review, Escalated, Resolved) with a count per status; each status links to `/exceptions` pre-filtered where a filter exists

**Analysis section (2 tabs)**
- [ ] THE SYSTEM SHALL render a 2-tab section using shadcn `Tabs`: "Trends" and "By Category"
- [ ] THE Trends tab SHALL render the spend & exception trend chart plus `<DiscrepancyBarChart />`
- [ ] THE By-Category tab SHALL render the amount-at-risk breakdown by exception type as a Recharts donut plus a single legend list — the distribution SHALL be shown once, not duplicated as a separate segmented bar
- [ ] THE SYSTEM SHALL render a vendor-risk donut (`/vendor-scoring`-linked) in the analysis area showing the distribution of vendors across risk tiers

**Data integrity**
- [ ] THE SYSTEM SHALL derive the 5 agent counts from computed values of `lib/data.ts` — no hardcoded count literals
- [ ] THE Amount at Risk hero value and the By-Category breakdown total SHALL derive from the same source (the AP exception set) OR be labelled to make the distinct scope explicit
- [ ] THE Exceptions-Found count and the Validation-agent count SHALL be consistent (both derive from the AP exception set)
- [ ] THE SYSTEM SHALL NOT display a frozen "% of period spend" string — the percentage SHALL be computed from data or omitted
- [ ] THE "Recovered" framing SHALL handle the Q4-2025 case — the Recovery Rate metric SHALL count only recovery cases initiated in the reporting period (2026), excluding prior-period carry-over

**Accessibility (WCAG 2.1 AA)**
- [ ] THE SYSTEM SHALL color status text with the AA-contrast `--warning-text` / `--success-text` tokens; `--warning` / `--success` are reserved for fills and dots only
- [ ] IF `prefers-reduced-motion` is set THEN `NumberTicker` SHALL skip the spring animation and render the final value immediately
- [ ] THE By-Category chart SHALL render each category in a distinct color (no two categories share a color)
- [ ] THE SYSTEM SHALL render one `<h2>` per page region (sr-only where the region has no visible heading) and render card titles as `<h3>` (`CardTitle asChild` wrapping an `<h3>`, since `CardTitle` renders a `<div>`)
- [ ] THE SYSTEM SHALL render chart containers with a meaningful `aria-label` describing the data shown (not just the chart type) and `role="img"`
- [ ] THE SYSTEM SHALL render focus rings via `var(--ring)` on all interactive elements

**Loading and safety**
- [ ] WHEN the page mounts THE SYSTEM SHALL display `Skeleton` placeholders for the hero band, context band, table, and analysis section for ~300ms before real content
- [ ] THE SYSTEM SHALL render a legal disclaimer before any action that commits the organization — Run Scan and Export are read-only and require none

## Layout

Renders inside the layout-provided `<main>` (per `ui-standard.md` v2.0). The page is a `@container/main` flex column. Section gutters use `gap-6 py-6` per `ui-standard.md` Vertical rhythm (32px rhythm); horizontal padding `px-4 lg:px-6`.

```
┌───────────────────────────────────────────────────────────────┐
│ Invoice Intelligence            [Export] [Run Scan]            │  header
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│ │ AMOUNT AT RISK          │ │ Invoices │ │Exceptions│ │Recov.││  hero band
│ │ $2.2M        ╱╲╱╲       │ │  1,847   │ │   184    │ │ 86%  ││  (~1.6fr + 3×1fr)
│ │ 4 critical open → triage│ │  Q1 2026 │ │ 146 open │ │ rate ││
│ └─────────────────────────┘ └──────────┘ └──────────┘ └──────┘│
├───────────────────────────────────────────────────────────────┤
│ PIPELINE                          CONTRACTS & GPO              │  context band
│ ● Invoice 1847 ● Validation 184…  ● At Risk 3 ● GPO 87%  …     │  (one bordered row)
├───────────────────────────────────────────────────────────────┤
│ Recent Exceptions                              View all 184 → │  work table
│ [ID][Type][Vendor][⚠ Flagged][Severity][Status][Review]        │  (always visible)
├───────────────────────────────────────────────────────────────┤
│ Invoice Status   ● Open 92  ● Under Review 41  ● Escalated …   │  status overview
├───────────────────────────────────────────────────────────────┤
│ [ Trends | By Category ]                                       │  analysis (2 tabs)
│   trend chart + discrepancy bars   /   donut + vendor-risk     │
└───────────────────────────────────────────────────────────────┘
```

### Hero band (`px-4 lg:px-6`, `py-6`)
- Grid: `grid-cols-1 @3xl/main:grid-cols-[1.6fr_1fr_1fr_1fr] gap-4`
- Hero card: shadcn `Card` `@container/card` — `CardDescription` "Amount at Risk", `CardTitle` (`h3`) value `text-3xl @[300px]/card:text-4xl text-destructive` wrapping `NumberTicker`, one `Sparkline` in `CardAction`, `CardFooter` an action `<Link>` to `/exceptions?severity=critical`
- Trio cards: shadcn `Card` `@container/card` — `CardDescription` label, `CardTitle` (`h3`) `text-2xl tabular-nums`, `CardFooter` context line; no sparkline

### Context band (`px-4 lg:px-6`, `py-6`)
- One `rounded-lg border bg-card` row; on `@3xl/main` a 2-column grid, stacks below
- Left group: small-caps `<h3>` "Pipeline" + 5 agents (colored `--agent-*` dot + name + computed count), wrapped in a `<Link>` to `/pipeline`
- Right group: small-caps `<h3>` "Contracts & GPO" + 3 stats (colored dot + label + value), each a `<Link>` to `/contracts`
- A vertical `border-l` divides the two groups on wide widths; no glyph separators inside either group

### Exceptions work table (`px-4 lg:px-6`, `py-6`)
- A `Card` (`py-0`) with a header row ("Recent Exceptions" `<h3>` + "View all {total} →" link) and a shadcn `Table`
- Sortable headers (Type, Flagged, Severity, Status) carry `aria-sort`; Flagged cell shows a severity icon + amount

### Invoice-status overview (`px-4 lg:px-6`, `py-6`)
- A `Card` — `<h3>` "Invoice Status" + a `flex flex-wrap` of 4 status chips (colored dot + label + count); resolvable statuses link to `/exceptions`

### Analysis section (`px-4 lg:px-6`, `py-6`)
- shadcn `Tabs defaultValue="trends"` with `TabsList`: Trends / By Category
- **Trends**: `Card` with the Spend & Exception Trend `ComposedChart`, and `Card` with `<DiscrepancyBarChart />`
- **By Category**: a 2-column grid — left `Card` a Recharts donut of `flaggedByType` + one legend list; right `Card` a Recharts donut of vendor risk-tier distribution, the whole card a `<Link>` to `/vendor-scoring`

## Components

shadcn primitives: `Card` (+ header/title/description/action/content/footer), `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `Table` (+ header/body/row/head/cell), `Badge`, `Button`, `Skeleton`.

InvoiceIQ extensions reused (public APIs unchanged): `NumberTicker`, `Sparkline`, `DiscrepancyBarChart`, `VendorBadge`, `ExportDialog`.

New on this page (page-local, no new shared components): `StatusOverview` count-by-status strip, `CategoryDonut` (Recharts `PieChart`), `VendorRiskDonut` (Recharts `PieChart`) — all inline in `app/page.tsx`.

> The work table follows the v2.0 column set (ID, Type, Vendor, Flagged, Severity, Status); the Category column was dropped at v2.0 — `CategoryBadge` is not used here.

## Business Rules

- **AP exceptions filter**: dashboard metrics use only AP exceptions (`!type.startsWith("som_")`) from `allExceptions`
- **Top exceptions**: the work table shows the top 6 AP exceptions from `exceptions`, sorted by severity by default
- **Open count**: count of AP exceptions with status `open`, `under_review`, or `escalated`
- **Amount at Risk** (hero): sum of `flaggedAmount` across all AP exceptions
- **Agent counts** (data integrity, Front 4): computed from `lib/data.ts` — Invoice = AP invoices processed (`kpiSummary.totalInvoicesProcessed`); Validation = AP exception count (`apCount`); Compliance = AP exceptions of compliance types (`contract_overage`, `missing_rebate`, `tier_pricing`); Recovery = `recoveryQueue.length`; Insight = distinct AP vendors with exceptions. No hardcoded literals.
- **flaggedByType** reconciliation: `lib/data.ts#exceptionTypeBreakdown` derives the by-type breakdown from the AP exception set so the By-Category total equals the Amount at Risk hero value. The legacy hand-authored `flaggedByType` array is retained for non-dashboard callers but is not used by the dashboard.
- **Recovery Rate** (Front 2, Bala): `recovered ÷ total` over `recoveryQueue` cases **initiated in 2026** (excludes the REC-008 Q4-2025 carry-over). "Recovered" counts `status === "recovered"`. Shown against an ~85% historical baseline (from `recoveryTrendData`).
- **Amount in recovery**: sum of `targetAmount` for `recoveryQueue` items with an in-progress status (`pending`, `in_progress`, `partial`) — surfaced on the Recovery Rate card footer as a forward-looking figure.
- **Invoice-status overview**: count of AP exceptions grouped by `status`
- **Vendor risk distribution**: count of `vendorScores` grouped by `rating` tier (Critical / High Risk / Medium Risk / Low Risk)
- **Contracts at Risk**: count of `contracts` with status `breached` or `warning`; "breached" sub-count is status `breached`
- **GPO Compliance / GPO Savings**: from `getGPOComplianceRate()` / `getGPOPotentialSavings()` — GPO Savings labelled "(potential)"
- **% of period spend**: not displayed (the v2.2 frozen "22% of period spend" string is removed) — the hero card footer shows the critical-open triage line instead
- **Color discipline**: status text uses `--warning-text` / `--success-text` / `text-destructive`; fills and dots use `--warning` / `--success` / `--destructive`. Color always pairs with a label or icon — never the sole signal.
- **Run Scan honesty**: the scan is read-only and mutates nothing; its toast claims no data change
- **Loading state**: ~300ms `Skeleton` placeholders

## Data Model

- **Source files**: `lib/data.ts` (`exceptions`, `allExceptions`, `recoveryQueue`, `contracts`, `flaggedByType`, `exceptionTypeBreakdown`, `spendTrend`, `recoveryTrendData`, `vendorScores`, `kpiSummary`, `formatCurrency`, `severityConfig`, `statusConfig`, `typeConfig`), `lib/workflow-config.ts` (`PARKLAND_CONFIG`), `lib/gpo-contracts.ts` (`getGPOComplianceRate`, `getGPOPotentialSavings`)
- **Computed values**: `topExceptions`, `apExceptions`, `apCount`, `openCount`, `amountAtRisk`, `agentCounts`, `recoveryRate`, `amountInRecovery`, `statusCounts`, `vendorRiskCounts`, `categoryBreakdown`
- **`lib/data.ts` change authorized for v2.3**: a new exported `exceptionTypeBreakdown` (derived from the AP exception set) reconciles the by-category total with the Amount at Risk hero
- **Sparkline data**: one fixed 6-point trend array for the hero only, defined locally in the page

## Workflow

1. Analyst/VP opens `/` first thing in the morning
2. ~300ms `Skeleton` while data loads
3. The eye lands on the **Amount at Risk** hero — the single number the dashboard exists to answer — and follows its action line to triage
4. The context band confirms the pipeline is healthy and surfaces contract/GPO posture
5. The analyst scans the always-visible exceptions table, clicks "Review →" on a row → `/exceptions/{id}`
6. The Invoice-status overview shows how the backlog is distributed
7. The analyst opens the Trends / By-Category tabs for deeper analysis after triage
8. Export / Run Scan used occasionally for stakeholder reports and refresh

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Exceptions | reads from + links to | KPI counts, Amount at Risk, work table, status overview; KPIs link to pre-filtered `/exceptions?severity=…` |
| Recovery | reads from | Recovery Rate KPI + amount-in-recovery from `recoveryQueue` |
| Contracts | reads from | Contracts at Risk + GPO Compliance / GPO Savings |
| Pipeline | links to + reads from | Agent counts (computed); the Pipeline group links to `/pipeline` |
| Vendor Scoring | reads from + links to | Vendor-risk donut from `vendorScores`; links to `/vendor-scoring` |
| Invoice Detail | navigates to | "Review →" goes to `/exceptions/{id}` |
| Product Analysis | (related) | By-Category donut is summary-level; the full breakdown lives on `/product-analysis` |

## Forbidden Patterns

Use affirmative phrasing per SpecLayer v1.1.

- **Render only page content inside the layout-provided `<main>`** — Reason: `app/layout.tsx` owns the shell; duplicating chrome breaks it.
- **Use shadcn primitives (`Card`, `Tabs`, `Table`, `Badge`, `Button`, `Skeleton`) for all surfaces and controls** — Reason: deprecates ad-hoc v1 markup; consistent disabled/focus/hover states.
- **Use shadcn theme tokens and `--chart-*` for all surfaces, text, emphasis, and charts** — Reason: raw hex and v1 tokens (`var(--text-muted)`, `var(--chart-grid)`, `bg-white`) break dark mode.
- **Color status text with `--warning-text` / `--success-text`; reserve `--warning` / `--success` for fills and dots** — Reason: `--warning`/`--success` measure < 4.5:1 as text and fail WCAG 1.4.3.
- **Pair every status color with a label or icon** — Reason: color alone fails WCAG 1.4.1.
- **Derive on-screen numbers from `lib/data.ts` computed values** — Reason: hardcoded literals drift from the data and contradict each other (audit Front 3).
- **Reuse `NumberTicker`, `Sparkline`, `DiscrepancyBarChart`, `VendorBadge` without changing their public APIs** — Reason: shared across pages; an API change is a cross-module regression.
- **Keep the page calm — one hero, one sparkline, grouped context, 32px section rhythm** — Reason: the audit's core finding was cramming; feature-completeness must not re-crowd the first viewport.

## AJ Feedback (Parkland Demo)

"Customizable dashboard — widget arrangement per user role" → v2.3: still a deferred future enhancement; v2.3 decluttering makes the eventual per-role mode easier to slot in.

### AJ Feedback (Recording 17)

- **Trend analysis bar charts** → v2.3: the Trends tab renders the spend trend + `DiscrepancyBarChart`.
- **Dashboard customization** (full + personal daily) → v2.3: full view shipped; per-role widgets remain future.
- **Enterprise UI quality** ("cannot look like a spreadsheet") → v2.3: hero hierarchy, donuts, grouped context, color discipline, 32px rhythm.
- **Company logos** → `VendorBadge` renders brand colors in both modes.

## Decision Log

<!-- 2026-05-21 v2.3: All-in-one rebuild per product-owner decision after the 2026-05-21 4-agent audit. Declutters the v2.2 layout (hero + grouped context band + promoted work table + 2-tab analysis), fixes data-integrity defects, adds 4 stakeholder features (recovery score/stage, vendor risk donut, invoice-status overview, pre-filtered drill-through), fixes 4 WCAG criticals, fixes chart theming. All v2.2 features retained. -->
<!-- 2026-05-21 v2.2: Product-owner decision — full revert to the v2.0 rich dashboard. The v2.1 triage-first design and its senior-UX-audit rationale are noted but overridden. SUPERSEDED by v2.3 — the 2026-05-21 audit found v2.2 crammed, with data-integrity, WCAG, and theming defects; v2.3 fixes all five fronts without removing features. -->
<!-- 2026-05-18: v2.1 — adopted single job-to-be-done framing (triage > status > sales-deck). SUPERSEDED by v2.2, then v2.3. -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system (Phase 2 of UI revamp, follows ui-standard.md v2.0). App shell SidebarProvider+SidebarInset. KPI grid shadcn Card primitives. Token migration. -->
<!-- 2026-05-14: Updated spec to match dashboard modernization — 4 primary KPIs with sparklines + compact secondary stats strip; single-row inline agent bar; 3-tab layout. -->
<!-- 2026-05-14: Initial spec created from current codebase -->

<!-- CHANGELOG -->
<!-- 2026-05-21 v2.3: All-in-one rebuild per product-owner decision after the 2026-05-21 4-agent audit. Declutters the v2.2 layout (hero + grouped context band + promoted work table + 2-tab analysis), fixes data-integrity defects, adds 4 stakeholder features (recovery score/stage, vendor risk donut, invoice-status overview, pre-filtered drill-through), fixes 4 WCAG criticals, fixes chart theming. All v2.2 features retained. Layout: Amount-at-Risk hero (~1.6fr, one sparkline) + calm 3-KPI trio; merged Pipeline + Contracts&GPO context band (no glyph separators); promoted exceptions table; Invoice-status overview; 2-tab analysis (Trends / By Category) with category + vendor-risk donuts. Data integrity: computed agent counts, exceptionTypeBreakdown reconciliation, honest Run Scan toast, removed frozen "22% of period spend", Recovery Rate excludes Q4-2025 carry-over, GPO Savings labelled potential. A11y: --warning-text/--success-text tokens, reduced-motion NumberTicker guard, non-color severity cue, distinct category colors, h2-per-region + h3 card titles, aria-sort, meaningful chart aria-labels. Theming: DiscrepancyBarChart + By-Category moved to --chart-* / shadcn tokens. -->
<!-- 2026-05-21 v2.2: Product-owner-driven revert to the v2.0 rich dashboard. SUPERSEDED by v2.3. -->
<!-- 2026-05-18 v2.1: Senior UX audit-driven rewrite to triage-first inbox. SUPERSEDED by v2.2. -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system. App shell, Card primitives, container queries, tokens migrated. -->
<!-- 2026-05-18: Added Acceptance Criteria section using EARS notation (SpecLayer v1.1 worked example). -->
<!-- 2026-05-14: Initial spec + dashboard modernization (sparklines + tabs + agent strip). -->
