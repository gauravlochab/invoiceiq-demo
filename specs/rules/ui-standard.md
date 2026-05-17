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
| `--destructive` | Critical/error | `0.577 0.245 27.325` | `0.704 0.191 22.216` |
| `--border` | Borders | `0.922 0 0` | `1 0 0 / 10%` |
| `--input` | Input borders | `0.922 0 0` | `1 0 0 / 15%` |
| `--ring` | Focus ring | `0.708 0 0` | `0.556 0 0` |

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
| `Card` + `CardHeader`/`CardTitle`/`CardDescription`/`CardAction`/`CardFooter` | `ui/card` | All surface containers (replaces `.card`) |
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

## Typography Scale (shadcn-aligned)

| Use | Class | Notes |
|-----|-------|-------|
| KPI value | `text-2xl font-semibold tabular-nums @[250px]/card:text-3xl` | Container-responsive |
| Card title | `CardTitle` (built-in) | semantic h3, font-semibold |
| Card description | `CardDescription` (built-in) | text-muted-foreground, text-sm |
| Body text | `text-sm` | 14px |
| Labels | `text-xs text-muted-foreground` | 12px muted |
| Monospace IDs | `font-mono text-sm tabular-nums` | tabular-nums for alignment |

## Icons

**Standard:** `@tabler/icons-react` (used in shadcn dashboard-01) — supplements Lucide React. Use Tabler for chart trends (`IconTrendingUp`/`IconTrendingDown`) and Lucide for everything else.

## Accessibility (WCAG 2.1 AA)

- `prefers-reduced-motion` — all animations/transitions disabled
- Focus-visible rings via `--ring` token on all interactive elements
- ARIA labels on chart containers (`role="img" aria-label="..."`)
- `strokeDasharray` on chart lines for colorblind differentiation
- Minimum touch target: 44x44px on mobile
- Color contrast: OKLCH tokens are tuned for AA in both modes — never override foreground/background pairs

## Interaction Patterns

- **Transition duration**: 150ms (default), 200ms (modals/sheets)
- **Hover states**: shadcn `hover:bg-accent` (uses `--accent` token)
- **Click feedback**: immediate state change + toast (existing pattern)
- **Legal disclaimer**: required before any action that commits the organization

## Chart Standards

- Use Recharts `ResponsiveContainer` (100% width)
- Default series colors: `var(--chart-1)` through `var(--chart-5)`
- Status overlays: `var(--destructive)` for critical, `var(--warning)` for warn, `var(--success)` for success (semantic, not chart-N)
- Grid lines: `var(--border)` at 0.5 opacity
- Tick labels: `var(--muted-foreground)`, 11px
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
| `--warning` | (new) `--warning` token — see Warning Override below | shadcn has no built-in warning |
| `--success` | (new) `--success` token — see Success Override below | shadcn has no built-in success |
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

shadcn does not ship `--warning` or `--success` semantic tokens (only `--destructive`). InvoiceIQ requires both for amber/green status states. Add these to `:root` and `.dark` in `globals.css`:

```css
:root {
  --warning: oklch(0.769 0.188 70.08);          /* amber-500-ish */
  --warning-foreground: oklch(0.985 0 0);
  --success: oklch(0.7 0.15 162);               /* emerald-500-ish */
  --success-foreground: oklch(0.985 0 0);
}
.dark {
  --warning: oklch(0.828 0.189 84.429);
  --warning-foreground: oklch(0.205 0 0);
  --success: oklch(0.7 0.15 162);
  --success-foreground: oklch(0.205 0 0);
}
```

Register in `@theme inline`:
```css
@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
}
```

This lets Tailwind classes `bg-warning`, `text-warning-foreground`, `bg-success`, etc. work natively.

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
