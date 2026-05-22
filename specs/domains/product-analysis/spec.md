# Product Category Analysis -- Specification

## Overview

The Product Category Analysis page provides a bird's-eye view of how invoice exceptions distribute across product categories. It helps procurement leaders identify which product categories have the most billing problems, the highest dollar exposure, and the worst resolution rates -- enabling them to prioritize vendor negotiations and process improvements by category rather than by individual exception.

In v2.0 this page also receives the "By Category" breakdown content that was removed from the dashboard's Overview tab during the shadcn redesign.

## Acceptance Criteria

EARS notation.

**App shell**
- [ ] THE SYSTEM SHALL render the Product Analysis page inside the shared `SidebarProvider` + `SidebarInset` shell provided by `app/layout.tsx` — the page component itself renders only page content, never a second shell
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens

**Summary strip**
- [ ] THE SYSTEM SHALL render a 4-panel summary strip in a shadcn `Card` separated by `divide-x divide-border`: Total Categories (`Package` icon), Most Flagged Category (`AlertTriangle` icon, `text-destructive`), Highest Value Category (`BarChart3` icon, `text-warning-text`), Resolution Rate (`TrendingUp` icon, `text-success-text`)
- [ ] THE SYSTEM SHALL compute the Resolution Rate panel value from `allExceptions` (`resolvedCount / totalCount`) — never a frozen literal

**Category table**
- [ ] THE SYSTEM SHALL render the category table using shadcn `Table` primitives wrapped in a shadcn `Card`, with horizontal scroll (`min-w-[900px]`)
- [ ] THE SYSTEM SHALL render exactly 7 columns: Category, Exception Count, Total Flagged Amount, Avg Discrepancy %, Resolution Rate, Top Vendor, Trend
- [ ] THE SYSTEM SHALL color Resolution Rate values: `text-success-text` >= 40%, `text-warning-text` >= 20%, `text-destructive` < 20%
- [ ] THE SYSTEM SHALL color Total Flagged Amount values `text-destructive`
- [ ] THE SYSTEM SHALL default sort to exceptionCount descending
- [ ] WHEN a user clicks a sortable column header THE SYSTEM SHALL toggle desc/asc on that column, reset others to default
- [ ] THE SYSTEM SHALL expose `aria-sort` (`ascending`/`descending`/`none`) on every sortable column header, and render the sort control as a focusable `<button>`

**Trend indicators**
- [ ] THE SYSTEM SHALL render trend icons: `up` = `TrendingUp` in `text-destructive` (worsening), `down` = `TrendingUp` rotated 180° in `text-success-text` (improving), `flat` = "—" in `text-muted-foreground` — each paired with an accessible label so color is not the only signal

**Exception distribution chart**
- [ ] THE SYSTEM SHALL render a shadcn `Card` containing a horizontal Recharts `BarChart` (`layout="vertical"`) at 280px height
- [ ] THE SYSTEM SHALL color each bar using `CATEGORY_CONFIG[category].text` (preserves the InvoiceIQ-specific category color mapping)
- [ ] THE SYSTEM SHALL render a color legend below the chart (wrapped flex row of swatches + names)
- [ ] THE SYSTEM SHALL use shadcn `ChartTooltip` for hover tooltips

**Loading and safety**
- [ ] WHEN the page mounts THE SYSTEM SHALL display shadcn `Skeleton` placeholders for the summary strip and 5 table rows for 400ms before real content
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable chart entrance animations
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on all interactive elements

## Layout

The shared `SidebarProvider` + `SidebarInset` shell is supplied by `app/layout.tsx`; the Product Analysis page renders page content only.

### Header (px-4 lg:px-6, pt-6 pb-4)
- Title: `h1`, `text-2xl font-semibold text-foreground` "Product Category Analysis"
- Subtitle: `text-sm text-muted-foreground` "Exception distribution across {totalCategories} product categories"

### Summary Strip (px-4 lg:px-6, py-4)
- Shadcn `Card` containing a 4-panel `flex` bar with `divide-x divide-border`
- Each panel has an icon, label (`text-xs text-muted-foreground uppercase`), and a bold value per Acceptance Criteria
- Loading state: shadcn `Skeleton` per panel

### Category Table (px-4 lg:px-6, pb-4)
- Shadcn `Card` containing shadcn `Table` with horizontal scroll (`overflow-x-auto`, `min-w-[900px]`)
- 7 columns per Acceptance Criteria — `Category` column uses `CategoryBadge` (InvoiceIQ-specific component retained); all numeric columns use `tabular-nums`. Sortable headers expose `aria-sort` and a focusable `<button>`.

### Exception Distribution Chart (px-4 lg:px-6, pb-6)
- Shadcn `Card` with `CardHeader` (a real `<h2>` inside `CardTitle`, "Exception Distribution by Category") and `CardContent` containing the horizontal Recharts `BarChart` per Acceptance Criteria. The chart is wrapped in a `role="img"` container with an `aria-label` describing the data.
- Color legend below chart in `CardFooter`

## Business Rules

- **Category grouping**: exceptions are grouped by `ex.category` field; items without a category fall into "Uncategorized"
- **Avg Discrepancy %**: computed as `(totalFlagged / totalAmount) * 100` per category
- **Resolution Rate**: `(resolvedCount / totalCount) * 100` per category
- **Top Vendor**: most frequently occurring vendor within each category
- **Trend logic**: >5 exceptions = "up" (worsening), resolution rate >50% = "down" (improving), otherwise "flat"
- **Default sort**: by exceptionCount descending
- **Sort toggles**: clicking a sortable column header toggles between asc/desc; clicking a different column resets to desc
- **Chart data**: sorted by exception count descending for visual priority
- **Bar colors**: pulled from `CATEGORY_CONFIG` in `lib/data.ts` -- each category has a distinct text color used as the bar fill
- **Loading state**: 400ms simulated delay

## Data Model

- **Source files**: `lib/data.ts` (allExceptions, formatCurrency, CATEGORY_CONFIG)
- **Key interfaces**:
  - `CategoryRow`: { category, exceptionCount, totalFlagged, avgDiscrepancy, resolutionRate, topVendor, trend }
  - `Exception`: id, type, severity, status, vendor, category, flaggedAmount, amount
- **Computed data**: `categoryData` is derived in a `useMemo` by grouping `allExceptions` by category and computing aggregates
- **Chart data**: sorted copy of `categoryData` mapped to { name, count, color }
- **State**: loading, sortKey ("category" | "exceptionCount" | "totalFlagged" | null), sortDir ("asc" | "desc")

## Workflow

1. Page loads with 400ms skeleton state
2. Summary strip shows top-level metrics (total categories, most flagged, highest value, resolution rate)
3. Table displays all categories with sortable columns
4. User clicks column headers to sort (Category alpha, Exception Count numeric, Total Flagged numeric)
5. Horizontal bar chart below provides visual distribution
6. No drill-down navigation from this page -- it is an analytics view
7. Category badges use the same color-coding as the exceptions list for visual consistency

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Exceptions | reads from | Exception distribution by product category drives the analysis charts |
| Contracts | reads from | Contract pricing by product category for standardization analysis |
| Extract | reads from | Product line items extracted from invoices provide the raw data |
| Dashboard | feeds into | Category-level spend and anomaly stats for dashboard KPIs |

## Forbidden Patterns

Use affirmative phrasing per SpecLayer v1.1.

- **Display the mapping table whenever product categories are merged or standardized** — Reason: standardization involves judgment calls ("Surgical Gloves" vs "Exam Gloves"); users must see and approve.
- **Normalize units before computing category spend totals** — Reason: comparing boxes vs cases vs each produces meaningless totals.
- **Compare current category anomalies against historical baselines** — Reason: seasonal variations (flu-season PPE spikes) are normal; anomaly detection without baseline misleads.
- **Use shadcn `Card`, `Table` primitives for the summary strip, category table, and chart surface** — Reason: deprecates `.card`, `.data-table` utility classes.
- **Use theme tokens for all status colors: `text-destructive` for critical, `text-warning-text` / `text-success-text` for amber/green TEXT, `text-muted-foreground` for neutral** — Reason: v1 status hex utility classes removed in v2.0; the vivid `--warning` / `--success` fail WCAG 1.4.3 as text, so the AA-safe `-text` variants are required for any `text-*` status coloring (ui-standard.md v2.0.1).
- **Compute every summary metric from `allExceptions`; never display a frozen literal** — Reason: the 2026-05-21 audit found a fabricated "Avg Resolution Time 3.2 days" with no backing data field; metrics must be traceable to data.
- **Preserve `CategoryBadge` and `CATEGORY_CONFIG` as InvoiceIQ extensions** — Reason: domain-specific category brand colors are not part of the shadcn theme; keep them as scoped extensions on top of v2 tokens.

## AJ Feedback (Parkland Demo)

### AJ Feedback (Recording 17)

- **Product category visual differentiation**: "Based on type of product, it should have a different background. So it's easily identifiable -- disposable, surgical, etc." Different background colors per product category.
- **Sortable by category**: Users should be able to sort/filter by product category to spot patterns ("I'm always having problems with this area").
- **Product analysis view**: AJ suggested a product analysis similar to existing vendor analysis. Rajesh agreed to build this.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-14: Added AJ feedback from Recording 17 — product category visual differentiation, sorting, product analysis view -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system per ui-standard.md v2.0. App shell wraps in SidebarProvider+SidebarInset. Summary strip → shadcn `Card` with divide-x divide-border. Category table → shadcn `Table` in `Card`. Chart → shadcn `Card` + `ChartTooltip` (Recharts bars preserved). Resolution Rate / Total Flagged retokenized to text-success/text-warning/text-destructive. Trend indicators retokenized. Loading → `Skeleton`. CategoryBadge + CATEGORY_CONFIG preserved as InvoiceIQ extension. Also receives the "By Category" content moved from dashboard's removed Overview tab. Added 13 EARS Acceptance Criteria. Forbidden Patterns rewritten in affirmative form per SpecLayer v1.1. -->
<!-- 2026-05-22 v2.0 code reconciliation (cluster 4): Migrated app/product-analysis/page.tsx from v1 tokens to v2.0 shadcn. The spec's v2.0 design intent was authored ahead of code; this entry records that the code now matches it, with three corrections. (1) The 4th summary panel is "Resolution Rate" (computed from allExceptions: resolvedCount/totalCount) — NOT "Avg Resolution Time 3.2 days" (a fabricated literal the 2026-05-21 audit flagged; the code already replaced it pre-migration). Spec ACs/Layout/Workflow corrected to match. (2) Status TEXT colors use the AA-safe `-text` variants (text-warning-text/text-success-text) per ui-standard.md v2.0.1 — vivid --warning/--success fail WCAG 1.4.3 as text. (3) Sortable headers now expose aria-sort and render as focusable <button>s (audit S7 finding). Token migration: v1 bg/text/border tokens and bg-white → shadcn theme tokens; v1 chart hex tokens (--chart-grid/--chart-tick) → border-border/text-muted-foreground; status hex utility classes → token classes. .card → shadcn `Card`; .data-table → shadcn `Table`; .section-label → real headings or muted labels. Chart wrapped in role="img" with a data-describing aria-label. Reconciliation note: the shared SidebarProvider+SidebarInset shell is owned by app/layout.tsx — the page renders content only; the App shell AC and Layout section corrected accordingly. -->
