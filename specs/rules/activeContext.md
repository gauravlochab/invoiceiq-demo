# Active Context
_Last updated: 2026-05-21 by Claude_

## Current Focus

Dashboard v2.3 — all-in-one rebuild after the 2026-05-21 4-agent audit. Declutter + 4 new stakeholder features + data integrity + WCAG 2.1 AA + chart theming. Spec-first per SpecLayer.

## Recent Changes

- `specs/domains/dashboard/spec.md` — rewritten to v2.3 "Active — supersedes v2.2": decluttered layout (hero + grouped context band + promoted table + 2-tab analysis), 4 new features, data-integrity rules, WCAG criteria, EARS ACs
- `specs/rules/ui-standard.md` — v2.0.1: corrected the false "OKLCH tokens tuned for AA" claim (added `--warning-text`/`--success-text`) and the false "CardTitle = semantic h3" claim
- `app/globals.css` — `--warning-text`/`--success-text` tokens; distinct-hue `--chart-1..6` categorical palette
- `app/page.tsx` — v2.3 dashboard: Amount-at-Risk hero, calm KPI trio, merged context band, promoted exceptions table, invoice-status overview, 2-tab analysis with category + vendor-risk donuts, computed agent counts, honest Run Scan, a11y fixes
- `components/magicui/number-ticker.tsx` — reduced-motion guard
- `components/DiscrepancyBarChart.tsx` — re-themed onto shadcn v2 / `--chart-*`
- `lib/data.ts` — derived `exceptionTypeBreakdown`
- `app/exceptions/page.tsx` — pre-filtered drill-through via `?severity=`/`?status=`/`?type=`

## Open Questions

- AJ's customizable / two-mode per-role dashboard remains deferred — v2.3 decluttering makes it easier to slot in later
- Pre-existing repo-wide lint issues (15 errors in untouched files: `Sidebar.tsx`, `scripts/generate-pdfs.js`, several pages) — out of v2.3 scope, candidate for a separate cleanup pass

## Next Steps

- **Immediate:** Product-owner review of the v2.3 dashboard (not committed — per task constraints)
- **Upcoming:** Optional shared `CardTitle` Slot/`asChild` support so headings nest without a wrapper `<div>`
- **Upcoming:** Repo-wide lint cleanup pass for the pre-existing issues
