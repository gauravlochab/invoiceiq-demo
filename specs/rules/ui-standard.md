# InvoiceIQ Detect — UI Standard

## Design Philosophy

Enterprise-grade, data-dense, never looks like a spreadsheet. Inspired by Linear.app, Stripe Dashboard, and Vercel.

**Principles:**
- Color is data, not decoration
- Only show problems — hide what's working
- Every number needs context (label, unit, comparison)
- Animations serve function (state transitions), not aesthetics

## Design Token Architecture

Three-tier system in `app/globals.css`:

1. **Global tokens** — Raw values (`--bg-base: #f7f8fa`)
2. **Alias tokens** — Semantic meaning (`--critical: #dc2626`)
3. **Component tokens** — Scoped usage (`--agent-invoice: #0065cb`)

### Color System

| Category | Token | Usage |
|----------|-------|-------|
| Background | `--bg-base`, `--bg-surface`, `--bg-subtle` | Page, card, hover |
| Text | `--text-primary`, `--text-secondary`, `--text-muted` | Headings, body, labels |
| Semantic | `--critical`, `--warning`, `--success`, `--info` | Status indicators |
| Agent | `--agent-invoice` through `--agent-insight` | Agent identification |
| Pipeline | `--pipeline-pass-*`, `--pipeline-warn-*`, `--pipeline-fail-*` | Pipeline states |

**Rule:** No hardcoded hex colors in components. Always use CSS variables.

## Component Patterns

### Cards
```
.card — bg-surface, border, rounded-xl, shadow-sm
.card-interactive — adds hover:shadow-md, cursor-pointer, transition
```

### Badges
```
.badge — base badge (text-[10px], px-2, rounded-full)
.badge.critical — red (severity critical)
.badge.warning — amber (severity high/medium)
.badge.success — green (resolved, matched)
.badge.blue — blue (informational)
.badge.neutral — gray (low priority)
```

### Section Labels
```
.section-label — uppercase, text-[10px], font-semibold, tracking-wider, text-muted
```

### Data Tables
```
.data-table — minimal borders, right-aligned numbers
th — uppercase, 10px, muted text
td — 12px, tabular-nums for numbers
```

## Responsive Rules

| Pattern | Rule |
|---------|------|
| Page padding | `px-6 lg:px-8` (never fixed `px-8`) |
| KPI grids | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| Two-column layouts | `grid-cols-1 lg:grid-cols-[1fr_280px]` |
| Card grids | Always include `sm:` breakpoint |

## Typography Scale

| Use | Size | Weight |
|-----|------|--------|
| Page title | 22px | 600 |
| Section header | 13px | 600 |
| Body text | 12px (xs) | 400 |
| Labels | 10px | 600, uppercase, tracking-wider |
| Monospace IDs | 11px | 400, font-mono |
| Badge text | 10px | 500 |

## Accessibility (WCAG 2.1 AA)

- `prefers-reduced-motion` — all animations/transitions disabled
- Focus-visible rings on interactive elements
- ARIA labels on chart containers (`role="img" aria-label="..."`)
- `strokeDasharray` on chart lines for colorblind differentiation
- Minimum touch target: 44x44px on mobile

## Interaction Patterns

- **Transition duration**: 150ms (default), 200ms (modals)
- **Hover states**: subtle background shift (`--bg-subtle`)
- **Click feedback**: immediate state change, toast confirmation
- **Expandable sections**: ChevronDown/ChevronRight toggle, smooth transition
- **Legal disclaimer**: required before any action that commits the organization

## Chart Standards

- Use Recharts `ResponsiveContainer` (always 100% width)
- Color palette: `--chart-spend`, `--chart-flagged`, `--chart-recovered`
- Grid lines: `--chart-grid` (#f0f2f5)
- Tick labels: `--chart-tick` (#9ca3af), 11px
- Target/risk lines: `strokeDasharray="5 3"` for visual differentiation
