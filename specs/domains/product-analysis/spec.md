# Product Category Analysis -- Specification

## Overview

The Product Category Analysis page provides a bird's-eye view of how invoice exceptions distribute across product categories. It helps procurement leaders identify which product categories have the most billing problems, the highest dollar exposure, and the worst resolution rates -- enabling them to prioritize vendor negotiations and process improvements by category rather than by individual exception.

## Layout

### Header (px-6 lg:px-8, pt-8 pb-6)
- Title: "Product Category Analysis" (xl, semibold)
- Subtitle: "Exception distribution across {totalCategories} product categories"
- Separated by `<hr>` divider

### Summary Strip (px-6 lg:px-8, py-6)
- Horizontal 4-panel metric bar in a single card with internal border-right dividers
- Each panel has an icon, section-label, and a bold value:
  1. **Total Categories** (Package icon) -- count of distinct categories from exception data
  2. **Most Flagged Category** (AlertTriangle icon) -- category name with highest exception count, red text, count subtitle
  3. **Highest Value Category** (BarChart3 icon) -- category name with highest total flagged amount, amber text, formatted currency subtitle
  4. **Avg Resolution Time** (TrendingUp icon) -- hardcoded "3.2 days", emerald text
- Loading state: skeleton placeholders per panel

### Category Table (px-6 lg:px-8, pb-6)
- Card with `data-table` class, `min-w-[900px]` for horizontal scroll
- 7 columns:
  1. **Category** -- sortable (alpha), rendered as `CategoryBadge` component (color-coded pill)
  2. **Exception Count** -- sortable (numeric), right-aligned, tabular-nums, medium weight
  3. **Total Flagged Amount** -- sortable (numeric), right-aligned, tabular-nums, red text
  4. **Avg Discrepancy %** -- right-aligned, tabular-nums, one decimal place
  5. **Resolution Rate** -- right-aligned, tabular-nums, semibold, color-coded: >=40% emerald, >=20% amber, <20% red
  6. **Top Vendor** -- text, truncated at 180px
  7. **Trend** -- icon indicator: "up" = red TrendingUp, "down" = green TrendingUp (rotated 180deg), "flat" = "--" muted text
- Loading state: 5-row skeleton placeholders

### Exception Distribution Chart (px-6 lg:px-8, pb-8)
- Card with title "Exception Distribution by Category"
- Horizontal bar chart (`BarChart` layout="vertical", Recharts)
  - `ResponsiveContainer` at height 280px
  - Y-axis: category names (130px width, 11px font)
  - X-axis: exception count (11px font)
  - Each bar colored using `CATEGORY_CONFIG[category].text` color
  - Bar size: 24, rounded right corners (radius [0,3,3,0])
  - Custom `ChartTooltip` with category dot, "Exceptions" label, count value
- Color legend below chart: wrapped flex row of category swatches + names
- Only rendered after loading completes

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
2. Summary strip shows top-level metrics (total categories, most flagged, highest value, avg resolution time)
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

- **NEVER merge product categories without showing the mapping** — Reason: Category standardization involves judgment calls (is "Surgical Gloves" the same as "Exam Gloves"?). Users must see and approve the mapping.
- **NEVER show category spend without normalizing units** — Reason: Comparing spend across categories with different units (boxes vs. cases vs. each) produces meaningless totals.
- **NEVER auto-flag a category as anomalous without baseline context** — Reason: Seasonal variations (flu season PPE spikes) are normal. Anomaly detection must account for historical baselines.

## AJ Feedback (Parkland Demo)

### AJ Feedback (Recording 17)

- **Product category visual differentiation**: "Based on type of product, it should have a different background. So it's easily identifiable -- disposable, surgical, etc." Different background colors per product category.
- **Sortable by category**: Users should be able to sort/filter by product category to spot patterns ("I'm always having problems with this area").
- **Product analysis view**: AJ suggested a product analysis similar to existing vendor analysis. Rajesh agreed to build this.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-14: Added AJ feedback from Recording 17 — product category visual differentiation, sorting, product analysis view -->
