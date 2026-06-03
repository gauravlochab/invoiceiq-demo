# InvoiceIQ Detect — UI Standard

> **Version:** 2.0 — May 2026
> **Source:** Adopts shadcn/ui design system (`ui.shadcn.com`, MIT, by shadcn) — specifically `dashboard-01` block, new-york-v4 registry, OKLCH color space.
> **Migration:** v1.x InvoiceIQ tokens are being replaced. See "v1→v2 Migration Map" below. Domain specs and components must use v2 tokens.

## Design Philosophy

Enterprise-grade, data-dense, never looks like a spreadsheet. Built on the shadcn/ui token system (the de facto standard for AI-generated React UIs in 2026).

**Principles:**
- Color is data, not decoration
- Only show problems — hide what's working
- Every number needs context (label, unit, comparison)
- Animations serve function (state transitions), not aesthetics
- **Native dark mode** — every token has a `.dark` variant; components must work in both
- **Sidebar + inset layout** — `SidebarProvider` wraps the app; main content lives in `SidebarInset`

## Design Token Architecture

Two-tier system in `app/globals.css`, sourced from shadcn `dashboard-01` registry. All color values use **OKLCH** color space (perceptually uniform, better dark mode behavior than HSL/hex).

1. **Theme tokens** — Light + dark values on `:root` and `.dark` (e.g., `--background`, `--card`, `--primary`)
2. **Component tokens** — Scoped via `@theme inline` (e.g., `--color-card`, `--color-sidebar`)

### Core Theme Tokens (shadcn standard)

| Token | Purpose | Light (oklch) | Dark (oklch) |
|-------|---------|---------------|--------------|
| `--background` | App background | `1 0 0` | `0.145 0 0` |
| `--foreground` | Body text | `0.145 0 0` | `0.985 0 0` |
| `--card` | Card surface | `1 0 0` | `0.205 0 0` |
| `--card-foreground` | Card text | `0.145 0 0` | `0.985 0 0` |
| `--popover` | Popover/menu surface | `1 0 0` | `0.205 0 0` |
| `--primary` | Primary action | `0.205 0 0` | `0.922 0 0` |
| `--primary-foreground` | Text on primary | `0.985 0 0` | `0.205 0 0` |
| `--secondary` | Secondary surface | `0.97 0 0` | `0.269 0 0` |
| `--muted` | Muted surface | `0.97 0 0` | `0.269 0 0` |
| `--muted-foreground` | Muted text/labels | `0.556 0 0` | `0.708 0 0` |
| `--accent` | Hover/active accent | `0.97 0 0` | `0.371 0 0` |
| `--destructive` | Critical/error | `0.577 0.245 27.325` | `0.5 0.2 22.216` (corrected 2026-05-23 v2 — was `0.704 0.191 22.216`; the brighter fill made `--destructive-foreground` (white) only 2.77:1; darkening to 0.5 raises that pair to **6.40:1**, AA) |
| `--destructive-foreground` | Text on solid destructive fill | `0.97 0.01 17` | `0.985 0 0` (near-white; now passes **6.40:1** against the darkened dark `--destructive`) |
| `--destructive-text` | AA-safe destructive text on `destructive/10` chip (light) / `destructive/20` chip (dark) | `0.45 0.20 27` (6.55:1 on /10 chip) | `0.78 0.16 22` (added 2026-05-23 v2 — measures **8.69:1** on dark `--background` and **~7.96:1** on `bg-destructive/20` chip; replaces the prior dark-mode use of `text-destructive` on the chip, which dropped below AA after the fill was darkened) |
| `--border` | Borders | `0.922 0 0` | `1 0 0 / 10%` |
| `--input` | Input borders | `0.922 0 0` | `1 0 0 / 15%` |
| `--ring` | Focus ring | `0.55 0 0` (corrected 2026-05-23 — was `0.708 0 0` which measured 2.59:1 on white, below WCAG 2.4.11 / 1.4.11's 3:1 minimum) | `0.556 0 0` (passes 4.18:1) |

### Chart Tokens (chart-1 through chart-5)

shadcn uses an ordered chart palette (chart-1 = primary series, chart-2 = secondary, etc.) sourced from the blue scale by default:

| Token | Default value | Use for |
|-------|---------------|---------|
| `--chart-1` | `--color-blue-300` | Primary series (e.g., processed invoices) |
| `--chart-2` | `--color-blue-500` | Secondary series (e.g., recovered) |
| `--chart-3` | `--color-blue-600` | Tertiary series |
| `--chart-4` | `--color-blue-700` | Comparison/baseline |
| `--chart-5` | `--color-blue-800` | Highest emphasis |

**InvoiceIQ overlay:** Domain-specific status colors (critical/warning/success) come from semantic theme tokens (`--destructive` for critical), not the chart palette. Charts use chart-1..5 unless a specific datum is a status (then `--destructive`, `--warning`, `--success`).

### Sidebar Tokens

shadcn's sidebar is a first-class component with its own token set:

| Token | Purpose |
|-------|---------|
| `--sidebar` | Sidebar background |
| `--sidebar-foreground` | Sidebar text |
| `--sidebar-primary` | Selected nav item |
| `--sidebar-primary-foreground` | Selected text |
| `--sidebar-accent` | Hover state |
| `--sidebar-accent-foreground` | Hover text |
| `--sidebar-border` | Sidebar dividers |
| `--sidebar-ring` | Focus ring inside sidebar |

### Radius Scale

```
--radius: 0.625rem     (10px — base)
--radius-sm:  0.6 * radius
--radius-md:  0.8 * radius
--radius-lg:  radius
--radius-xl:  1.4 * radius
--radius-2xl: 1.8 * radius
```

**Rule:** No hardcoded hex colors in components. Use shadcn theme tokens (`bg-card`, `text-muted-foreground`, `border-border`) — Tailwind class names map directly to the tokens above.

## Layout Architecture

Every authenticated page wraps in `SidebarProvider` + `SidebarInset`:

```tsx
<SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" }}>
  <AppSidebar variant="inset" />
  <SidebarInset>
    <SiteHeader />
    <main className="flex flex-1 flex-col">{children}</main>
  </SidebarInset>
</SidebarProvider>
```

Container queries (`@container/main`) drive responsive grids — preferred over media queries for component-level responsiveness.

## Component Patterns (shadcn primitives)

| Component | shadcn block | Use for |
|-----------|--------------|---------|
| `Card` + `CardHeader`/`CardTitle`/`CardDescription`/`CardAction`/`CardFooter` | `ui/card` | All surface containers (replaces `.card`). Note: `CardTitle` and `CardDescription` render `<div>`s, not headings — render a real `<h2>`/`<h3>` inside `CardTitle` when a region needs a heading in the document outline. |
| `Badge` (variants: default, outline, secondary, destructive) | `ui/badge` | Status indicators (replaces `.badge.*` classes) |
| `Table` + `TableHeader`/`TableRow`/`TableCell` (or `DataTable` block) | `ui/table` | Data tables (replaces `.data-table`) |
| `Sidebar` + `SidebarProvider`/`SidebarInset` | `ui/sidebar` | App navigation |
| `Tabs` + `TabsList`/`TabsTrigger`/`TabsContent` | `ui/tabs` | Already in use; standardize on this |

**KPI card pattern (from `section-cards.tsx`):**
```tsx
<Card className="@container/card">
  <CardHeader>
    <CardDescription>Metric name</CardDescription>
    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
      $1,250.00
    </CardTitle>
    <CardAction>
      <Badge variant="outline"><IconTrendingUp />+12.5%</Badge>
    </CardAction>
  </CardHeader>
  <CardFooter className="flex-col items-start gap-1.5 text-sm">
    <div className="line-clamp-1 flex gap-2 font-medium">Trend line</div>
    <div className="text-muted-foreground">Context line</div>
  </CardFooter>
</Card>
```

## Responsive Rules

| Pattern | Rule |
|---------|------|
| Page padding | `px-4 lg:px-6` (shadcn standard; replaces `px-6 lg:px-8`) |
| KPI grids | `grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4` (container queries) |
| Card grids | Always use `@container/main` parent + `@`-prefixed responsive classes |
| Vertical rhythm | `gap-4 py-4 md:gap-6 md:py-6` |
| Wide-screen content cap | The `SidebarInset` main content region is capped at `max-w-[1536px] mx-auto w-full` (applied on the content wrapper inside `ClientShell`) so reading columns stay sane beyond ~1536px instead of stretching edge-to-edge (added 2026-05-23 audit — was uncapped, sprawled at 1920px). The sidebar and sticky header still span the full viewport — only the scrolling content region is capped. |
| Mobile detail-page row reflow | Multi-field detail rows (e.g. three-way-match discrepancy items) stack vertically below `sm` (≤640px); right-column info panels stack below the left column below `lg` (≤1024px). |

## Touch Targets (added 2026-05-23 audit)

The audit measured the live DOM: sidebar nav rows at 32px, header icon buttons at 28×28px, in-table "Review" links at ~15px tall — all below the 44×44px minimum mandated in the Accessibility section. WCAG 2.5.5 (AAA) and Apple HIG / Material both target 44px.

**Rule:** every primary interactive element must have a **≥44×44px effective hit area** on viewports `≤md` (768px). The visual element may stay smaller — use padding to extend the click/tap region without inflating the visible chrome. Desktop (≥md) may stay denser.

Component-specific applications:

| Component | Visible size | Hit-area technique |
|-----------|--------------|--------------------|
| Sidebar nav rows (`SidebarMenuButton`) | 32px visible | `md:before:absolute md:before:-inset-x-2 md:before:-inset-y-1.5` pseudo-element on mobile, or `min-h-11` below the `md` breakpoint |
| Header icon buttons (`SiteHeader`, `size="icon"`) | 28–32px visible | `min-h-11 min-w-11` below `md`; use a slightly larger `size="icon-lg"` (36px) above |
| Table action links (e.g. "Review →") | ~15px tall text | Wrap in `<Link className="... block py-3 -my-3 ...">` so the row-cell click area extends ≥44px vertically without changing visible line height (negative margin offsets the padding) |
| Theme toggle, dropdown triggers | 28px visible | Same `min-h-11 min-w-11` floor on mobile |

The pattern is: keep the *visual* element compact for desktop density, expand the *hit target* on mobile via padding or an `::before` overlay. Never bloat the visible button just to hit 44px.

## Typography Scale (shadcn-aligned)

| Use | Class | Notes |
|-----|-------|-------|
| KPI value | `text-2xl font-semibold tabular-nums @[250px]/card:text-3xl` | Container-responsive |
| Card title | `CardTitle` (built-in) | **Renders a `<div>`, NOT a heading** (corrected 2026-05-21 audit). For a semantic heading, pass an `asChild`-style child or render the `<h3>` yourself inside `CardTitle`, or place an `<h3>` adjacent. `font-medium`, `text-base`. |
| Card description | `CardDescription` (built-in) | Renders a `<div>`, `text-muted-foreground`, `text-sm` |
| Body text | `text-sm` | 14px |
| Labels | `text-xs text-muted-foreground` | 12px muted |
| Monospace IDs | `font-mono text-sm tabular-nums` | tabular-nums for alignment |

## Icons

**Standard:** `@tabler/icons-react` (used in shadcn dashboard-01) — supplements Lucide React. Use Tabler for chart trends (`IconTrendingUp`/`IconTrendingDown`) and Lucide for everything else.

## Accessibility (WCAG 2.1 AA)

- `prefers-reduced-motion` — all **CSS** animations/transitions disabled via the `globals.css` media block. **JS-driven animation (Framer Motion springs, e.g. `NumberTicker`) is NOT covered by that block** — it must guard itself with `useReducedMotion()` and render the final value immediately when reduced motion is set.
- Focus-visible rings via `--ring` token on all interactive elements
- ARIA labels on chart containers (`role="img" aria-label="..."`) — the label must describe the **data shown**, not just the chart type
- Sortable table headers expose `aria-sort` (`ascending` / `descending` / `none`)
- `strokeDasharray` on chart lines for colorblind differentiation
- Minimum touch target: 44×44px effective hit area on mobile (see "Touch Targets" below for the padding-not-bloat pattern — applies to sidebar nav, header buttons, and table action links)
- **Color contrast — corrected (2026-05-21 + 2026-05-23 audits):** The neutral pairs (`--foreground` / `--background` / `--card`, `--muted-foreground`) are tuned for AA. **The semantic status tokens `--warning` and `--success` are NOT AA-safe as text** — on `--background` they measure ~2.15:1 (`--warning`) and ~2.50:1 (`--success`); AA body text needs 4.5:1. Use the dedicated `--warning-text` / `--success-text` tokens for any `text-*` status coloring; reserve `--warning` / `--success` for fills, dots, and borders only. See "Warning + Success Overrides" below. The 2026-05-23 audit additionally measured three failures that survived the 2026-05-21 pass:
  - Dark `--destructive-foreground` (was `oklch(0.58 0.22 27)`, red text on the red destructive fill) — **1.65:1** (effectively invisible). Set to `oklch(0.985 0 0)` (near-white). The 2026-05-23 v1 fix raised this to 2.77:1 (still under 4.5:1 because the fill itself was bright). The 2026-05-23 v2 fix additionally darkened the dark `--destructive` from `oklch(0.704 0.191 22.216)` to `oklch(0.5 0.2 22.216)` — the pair now measures **6.40:1**, AA.
  - Light `--ring` (was `oklch(0.708 0 0)`, mid-grey on white) — **2.59:1** vs the WCAG 2.4.11 / 1.4.11 minimum of 3:1 for focus indicators. Set to `oklch(0.55 0 0)` — raises to **4.85:1**.
  - Light `Badge variant="destructive"` text on `bg-destructive/10` chip — **3.99:1** vs the 4.5:1 floor (10% red on white is no longer white). Added `--destructive-text: oklch(0.45 0.20 27)` and used in the `destructive` variant — **6.55:1**. Mirrors the existing warning/success two-role pattern. See "Destructive Two-Role Pattern" below.
  - Dark `Badge variant="destructive"` text on `bg-destructive/20` chip (2026-05-23 v2) — once the dark `--destructive` was darkened to oklch(0.5), the previous `dark:text-destructive` override on the chip became too dim. Added a symmetric dark `--destructive-text: oklch(0.78 0.16 22)` (mirrors the light token's two-role split) and dropped the `dark:text-destructive` override from Badge/Button — now both modes share `text-destructive-text`. Measures **~7.96:1** on the dark `/20` chip. The dark token is also the AA-safe choice for `text-destructive-*` on raw `--background` (8.69:1) and `--card` (7.86:1).
- Color is never the only signal — pair every status color with a text label or an icon (WCAG 1.4.1)

## Interaction Patterns

- **Transition duration**: 150ms (default), 200ms (modals/sheets)
- **Hover states**: shadcn `hover:bg-accent` (uses `--accent` token)
- **Click feedback**: immediate state change + toast (existing pattern)
- **Legal disclaimer**: required before any action that commits the organization

## Chart Standards

- Use Recharts `ResponsiveContainer` (100% width)
- Default series colors: `var(--chart-1)` through `var(--chart-5)` — categorical charts assign one distinct `--chart-N` per category (no two categories share a color)
- Status overlays: `var(--destructive)` for critical, `var(--warning)` for warn, `var(--success)` for success (semantic, not chart-N) — these are fills, not text
- Grid lines: `var(--border)` (semantic token — never `var(--chart-grid)` v1 hex)
- Tick labels: `var(--muted-foreground)`, 11px (never `var(--chart-tick)` v1 hex)
- Chart surfaces use `bg-card` / `bg-popover` tokens — never `bg-white` (breaks dark mode)
- Target/risk lines: `strokeDasharray="5 3"` for visual differentiation
- Chart area fills: gradient from `--chart-N/30%` to `--chart-N/0%` (matches shadcn `chart-area-interactive` pattern)

## v1→v2 Migration Map

This is the mapping that the 10 domain specs and all components must follow. Every v1 token has a v2 replacement.

| v1 token | v2 token (shadcn) | Notes |
|----------|-------------------|-------|
| `--bg-base` | `--background` | Page background |
| `--bg-surface` | `--card` | Card/panel surface |
| `--bg-subtle` | `--muted` | Subtle hover/section background |
| `--bg-muted` | `--accent` | Hover state |
| `--text-primary` | `--foreground` | Body text |
| `--text-secondary` | `--muted-foreground` | Secondary text |
| `--text-muted` | `--muted-foreground` | Same as secondary |
| `--text-inverse` | `--primary-foreground` | Text on primary buttons |
| `--critical` | `--destructive` | Error/critical states |
| `--critical-subtle` | `bg-destructive/10` | Tailwind opacity modifier |
| (new) `--destructive-text` | `--destructive-text` | AA-safe destructive text on `bg-destructive/10` chip (light) and `bg-destructive/20` chip (dark). Light token added 2026-05-23 v1; dark token added 2026-05-23 v2. See Destructive Two-Role Pattern. |
| `--warning` | (new) `--warning` (fills/dots/borders) + `--warning-text` (text) — see Warning + Success Overrides | shadcn has no built-in warning; two tokens by role |
| `--success` | (new) `--success` (fills/dots/borders) + `--success-text` (text) — see Warning + Success Overrides | shadcn has no built-in success; two tokens by role |
| `--warning-text` (v1, HTML artifacts) | `--warning-text` (v2 OKLCH) | AA-safe amber text token |
| `--success-text` (v1, HTML artifacts) | `--success-text` (v2 OKLCH) | AA-safe emerald text token |
| `--info` | `--chart-2` or `--primary` | Repurpose, no dedicated info token |
| `--agent-invoice` / `-validation` / `-compliance` / `-recovery` / `-insight` | Keep as InvoiceIQ-specific extension layer | Agent colors are domain-specific; preserve as `--agent-*` tokens alongside shadcn theme |
| `--pipeline-pass-*` | `bg-success/10 border-success` | Use new `--success` + opacity |
| `--pipeline-warn-*` | `bg-warning/10 border-warning` | Use new `--warning` + opacity |
| `--pipeline-fail-*` | `bg-destructive/10 border-destructive` | Use shadcn `--destructive` + opacity |
| `--chart-spend` | `--chart-1` | Primary chart series |
| `--chart-flagged` | `--destructive` | Status, not chart palette |
| `--chart-recovered` | `--success` | Status, not chart palette |
| `--chart-grid` | `--border` | Use semantic border |
| `--chart-tick` | `--muted-foreground` | Use semantic muted |

### Warning + Success Overrides

shadcn does not ship `--warning` or `--success` semantic tokens (only `--destructive`). InvoiceIQ requires both for amber/green status states.

**Two roles, two tokens (corrected 2026-05-21 audit).** The 4-agent audit found `text-warning` (~2.15:1) and `text-success` (~2.50:1) fail WCAG 1.4.3. The vivid `--warning` / `--success` are kept for **fills, dots, and borders** (large non-text elements, where AA needs only 3:1), and dedicated darker `--warning-text` / `--success-text` tokens are added for **text** (where AA needs 4.5:1). Add to `:root` and `.dark` in `globals.css`:

```css
:root {
  --warning: oklch(0.769 0.188 70.08);          /* amber — fills/dots/borders only */
  --warning-foreground: oklch(0.205 0 0);
  --warning-text: oklch(0.52 0.13 70);          /* darker amber — AA-safe as text */
  --success: oklch(0.7 0.15 162);               /* emerald — fills/dots/borders only */
  --success-foreground: oklch(0.985 0 0);
  --success-text: oklch(0.52 0.12 162);         /* darker emerald — AA-safe as text */
  --destructive-text: oklch(0.45 0.20 27);      /* darker red — AA-safe on destructive/10 chip (added 2026-05-23 audit) */
}
.dark {
  --destructive: oklch(0.5 0.2 22.216);         /* darkened 2026-05-23 v2 — was oklch(0.704 0.191 22.216); white on it now hits 6.40:1 (AA) */
  --destructive-foreground: oklch(0.985 0 0);   /* near-white — 6.40:1 on the darkened --destructive */
  --warning: oklch(0.828 0.189 84.429);
  --warning-foreground: oklch(0.205 0 0);
  --warning-text: oklch(0.85 0.15 85);          /* light amber — AA-safe on dark bg */
  --success: oklch(0.7 0.15 162);
  --success-foreground: oklch(0.205 0 0);
  --success-text: oklch(0.8 0.14 162);          /* light emerald — AA-safe on dark bg */
  --destructive-text: oklch(0.78 0.16 22);      /* added 2026-05-23 v2 — light red, ~7.96:1 on bg-destructive/20 chip, 8.69:1 on --background, 7.86:1 on --card */
}
```

Register in `@theme inline`:
```css
@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-warning-text: var(--warning-text);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-success-text: var(--success-text);
  --color-destructive-text: var(--destructive-text);  /* added 2026-05-23 v1 (light) + v2 (dark) */
}
```

This lets `bg-warning` / `bg-success` (fills), `border-warning` / `border-success` (borders), and `text-warning-text` / `text-success-text` / `text-destructive-text` (AA-safe text) all work natively.

**Token-role table:**

| Token | Role | Use for | AA target |
|-------|------|---------|-----------|
| `--warning` / `--success` | fill, dot, border | progress fills, status dots, chip backgrounds, borders | 3:1 (non-text) |
| `--warning-text` / `--success-text` | text | any `text-*` status coloring (amounts, labels, KPI values) | 4.5:1 (body text) |
| `--destructive` | fill, dot, border | progress fills, status dots, chip backgrounds, borders. **In dark mode the fill is darkened to oklch(0.5 0.2 22.216) (2026-05-23 v2) so white-on-fill hits 6.40:1.** Not used as text on raw `--background` / `--card` anymore — use `--destructive-text` for that. | 3:1 (non-text) |
| `--destructive-text` (both modes) | text | `text-*` destructive coloring on `bg-destructive/10` chip (light), `bg-destructive/20` chip (dark), and on `--background` / `--card` in either mode | 4.5:1 (body text) |
| `--destructive-foreground` | text on the SOLID `--destructive` fill | rare — most chips/badges use `text-destructive-text` on `bg-destructive/*` instead. Now passes AA (6.40:1) on the darkened dark `--destructive`. | 4.5:1 |

### Destructive Two-Role Pattern (added 2026-05-23 v1, extended 2026-05-23 v2)

The same fill-vs-text split that exists for `--warning` / `--success` now applies to `--destructive` — **symmetrically in both modes**. The 2026-05-23 v1 audit measured `text-destructive` on a `bg-destructive/10` chip at **3.99:1** in light mode and introduced the light-only `--destructive-text` (6.55:1 on the chip). The v2 audit (2026-05-23) closed the dark side: the dark `--destructive-foreground` on the dark `--destructive` was still 2.77:1 because the dark fill itself was too bright. v2 darkened the fill **and** added a dark `--destructive-text`:

```css
:root {
  /* Light-mode: darker red text for chips and any text-on-tinted-bg */
  --destructive-text: oklch(0.45 0.20 27);    /* 6.55:1 on destructive/10 chip */
}
.dark {
  /* Darkened fill so white-on-fill is AA. */
  --destructive: oklch(0.5 0.2 22.216);       /* white on it: 6.40:1 */
  --destructive-foreground: oklch(0.985 0 0);
  /* Lighter red text for chips and any text-on-tinted-bg */
  --destructive-text: oklch(0.78 0.16 22);    /* ~7.96:1 on destructive/20 chip; 8.69:1 on --background */
}
```

Register in `@theme inline`:
```css
@theme inline {
  --color-destructive-text: var(--destructive-text);
}
```

**Consumer rule:** any `text-*` destructive coloring uses `text-destructive-text`. `Badge variant="destructive"` and `Button variant="destructive"` use `text-destructive-text` in both light and dark mode (no `dark:text-destructive` override anymore) — the dark `--destructive-text` value is automatically lighter. `Alert variant="destructive"` uses `text-destructive-text` on `bg-card`. The same migration applies to standalone `text-destructive` usages anywhere in the app — those have been mass-migrated to `text-destructive-text` (2026-05-23 v2).

The `--destructive-foreground` token (named for "text on solid `--destructive`") was historically a saturated red — measured 1.65:1 in dark mode (a copy-paste of the light `--destructive` value). v1 set it to near-white (`oklch(0.985 0 0)`) which raised the pair to 2.77:1; v2 then darkened the dark `--destructive` fill itself to `oklch(0.5 0.2 22.216)` — the pair now measures **6.40:1** (AA). In practice no component renders text-destructive-foreground on a solid `--destructive` surface, but the named token now matches its named purpose.

**Contrast table (post-v2 fix, all numbers verified by OKLCH → sRGB → relative luminance → WCAG 2.1 in JS, not eyeballed):**

| Pair | Mode | Ratio | Floor | Result |
|------|------|-------|-------|--------|
| `--destructive-foreground` (white) on `--destructive` (solid fill) | dark | **6.40:1** | 4.5:1 | PASS |
| `--destructive-text` on `bg-destructive/10` chip | light | **6.55:1** | 4.5:1 | PASS |
| `--destructive-text` on `bg-destructive/20` chip | dark | **~7.96:1** | 4.5:1 | PASS |
| `--ring` on `--background` (white) — focus indicator | light | **4.85:1** | 3.0:1 | PASS |
| `--destructive-text` on `--background` | dark (informational) | **8.69:1** | 4.5:1 | PASS |
| `--destructive-text` on `--card` | dark (informational) | **7.86:1** | 4.5:1 | PASS |

### Agent Color Extension (InvoiceIQ-specific)

The 5-agent palette (`--agent-invoice` through `--agent-insight`) is preserved as an InvoiceIQ extension. These are NOT shadcn tokens — they are domain-specific brand colors. Convert to OKLCH for consistency with the shadcn system:

```css
:root {
  --agent-invoice:     oklch(0.555 0.16 250);  /* blue */
  --agent-validation:  oklch(0.555 0.22 295);  /* violet */
  --agent-compliance:  oklch(0.555 0.13 70);   /* amber */
  --agent-recovery:    oklch(0.555 0.14 152);  /* green */
  --agent-insight:     oklch(0.62 0.13 195);   /* cyan */
}
```

## Forbidden Patterns

Use affirmative phrasing per SpecLayer v1.1 — every "don't" gets ignored.

- Use `bg-card` / `text-foreground` / `border-border` for surfaces — Reason: hex colors break theming; v1 `--bg-surface` is removed
- Use shadcn `Card` + `CardHeader`/`CardTitle` for all KPI/metric containers — Reason: deprecates the `.card` utility class
- Use `Badge variant="..."` for all status indicators — Reason: deprecates `.badge.critical` / `.badge.warning` / `.badge.success` utility classes
- Use container queries (`@container/main`, `@xl/main:grid-cols-2`) for responsive layouts — Reason: shadcn dashboard-01 standard; better than media queries for components
- Use OKLCH for any new color tokens — Reason: perceptually uniform, better dark mode behavior, matches the shadcn token system

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial v1 ui-standard.md (Linear/Stripe/Vercel inspired, hex tokens, light-only) -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system (dashboard-01 block, new-york-v4 registry). OKLCH color space, dark mode native, sidebar+inset layout, container queries, Card/Badge/Sidebar primitives. Added v1→v2 migration map and Warning/Success override (shadcn ships destructive only). Agent palette preserved as InvoiceIQ extension. Domain specs and components must follow Phase 2/3 of revamp. -->
<!-- 2026-05-21 v2.0.1: Corrected two false claims found by the 2026-05-21 dashboard audit. (1) "OKLCH tokens are tuned for AA — never override" was FALSE for --warning/--success as TEXT (~2.15:1 / ~2.50:1, AA needs 4.5:1) — added --warning-text/--success-text tokens for text use, kept --warning/--success for fills/dots/borders only, updated the Accessibility section, the Warning+Success Overrides section (now with a token-role table), and the v1→v2 migration map. (2) "CardTitle (built-in) — semantic h3" was FALSE — CardTitle/CardDescription render <div>s; corrected the Typography Scale and Component Patterns tables to require a real <h2>/<h3> inside CardTitle when a heading is needed. Also: reduced-motion note now distinguishes CSS vs JS animation; chart standards now require distinct per-category colors and forbid v1 chart hex tokens / bg-white. -->
<!-- 2026-05-23 v2.0.2 (Phase 1 elite-UI audit fix-up): The 2026-05-21 v2.0.1 entry above claimed "WCAG 2.1 AA" coverage but never measured the destructive chip, the focus ring, or the dark destructive-foreground token numerically — the 2026-05-23 audit (OKLCH → sRGB → relative luminance → WCAG 2.1 ratio computed in JS, not eyeballed) found three failures that survived. This entry is the honest fix-up. (1) Dark --destructive-foreground: was oklch(0.58 0.22 27) (red), measured 1.65:1 on the dark --destructive fill — effectively invisible. Set to oklch(0.985 0 0) (near-white). New ratio: 2.77:1 — meaningfully improved but still under 4.5:1 because the dark --destructive itself is a bright red; the audit considered darkening the fill out of scope. In practice no component renders text-destructive-foreground on a solid --destructive surface — the shipped destructive variants use the bg-destructive/10 (light) or /20 (dark) chip pattern + text-destructive (or text-destructive-text). The bug fix matters because the *token's named purpose* was a copy-paste of the red value. (2) Light --ring: was oklch(0.708 0 0), measured 2.59:1 on white — below the 3:1 focus-indicator minimum in WCAG 2.4.11 / 1.4.11. Set to oklch(0.55 0 0). New ratio: 4.85:1. Dark --ring at 4.18:1 was already passing — unchanged. (3) Badge variant="destructive" text on bg-destructive/10 chip in light mode: measured 3.99:1 — the 10%-red blended onto white is no longer white, so text-destructive lost 0.78 ratio points. Added --destructive-text: oklch(0.45 0.20 27) (mirrors the existing --warning-text / --success-text two-role pattern), wired through @theme inline as --color-destructive-text, and used in Badge / Button destructive variants in light mode. New ratio on the /10 chip: 6.55:1. Dark mode unchanged — text-destructive on bg-destructive/20 measured 4.63:1, already AA. Also: codified the touch-target rule into a dedicated section with the padding-not-bloat pattern (sidebar nav, header icon buttons, table action links all extended to ≥44×44px hit area below md without changing their visible chrome), and added a wide-screen content cap (`max-w-screen-2xl mx-auto` on the SidebarInset main region) so 1920px+ monitors stop sprawling. The mobile detail-row stacking rule documents the v2.0 invoice-detail responsive AC (see specs/domains/invoice-detail/spec.md 2026-05-23 entry). -->
<!-- 2026-05-23 v2.0.3 (Phase 1 elite-UI audit fix-up, dark destructive token restructure): The v2.0.2 entry above admitted dark --destructive-foreground on dark --destructive was 2.77:1 — better than the 1.65:1 bug, but still under 4.5:1 — and called darkening the fill "out of scope". This entry closes that gap by darkening the fill **and** adding a symmetric dark --destructive-text. Numbers (verified via OKLCH → sRGB → WCAG luminance in scripts/check-contrast.mjs): (1) Dark --destructive: oklch(0.704 0.191 22.216) → **oklch(0.5 0.2 22.216)**. White on the new fill measures **6.40:1** (was 2.77:1). PASS. (2) Dark --destructive-text: ADDED at **oklch(0.78 0.16 22)** — mirrors the light token's two-role structure. Measures **~7.96:1** on bg-destructive/20 chip (was ~4.63:1 with the old text-destructive on the old bright fill — still AA, but now the chip-text token is a dedicated lighter red rather than reusing the fill color). Bonus: 8.69:1 on --background, 7.86:1 on --card. (3) Migrated every standalone `text-destructive` consumer in `app/` (page.tsx, pipeline, exceptions, recovery, contracts, product-analysis, som/*, vendor-scoring, exceptions/[id], extract, duplicates) and `components/` (EscalationBanner, CommandPalette, GPOComparisonSection, AppSidebar, OverrideModal, Toast, dropdown-menu) to `text-destructive-text` (perl negative lookahead — never touched -foreground or existing -text). (4) Badge/Button destructive variants: dropped the `dark:text-destructive` override — both modes now share `text-destructive-text` because dark has its own token. (5) Alert destructive variant: bg-card text-destructive (was 4.76:1 light, 2.68:1 dark after the fill darkened) → bg-card text-destructive-text (7.83:1 light, 7.86:1 dark). Contrast table earlier in this section was updated with the new ratios; the prior table is preserved in v2.0.2 above. Light mode tokens (`--destructive`, `--destructive-text`, `--ring`) untouched. -->

