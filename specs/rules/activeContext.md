# Active Context
_Last updated: 2026-05-22 by Claude_

## Current Focus

Phase 1 complete — InvoiceIQ Detect is fully migrated to the shadcn v2.0 design system. All 13 product routes, the internal specs-viewer, and the shared `components/` layer are on v2 theme tokens; the legacy v1 design-system layer has been removed from `globals.css`. Build, lint, and tests are green; dark mode and WCAG 2.1 AA were addressed per cluster.

## Recent Changes

- 6-cluster app-wide v2.0 migration merged to `main` (PRs #2–#7) — see `progress.md` 2026-05-22
- `app/globals.css` — v1 design-system layer removed (875 → 308 lines)
- All 10 domain specs reconciled to v2.0/v2.0.1 with dated CHANGELOG entries
- Repo-wide lint backlog cleared (0 errors / 0 warnings); `scripts/**` excluded from ESLint

## Open Questions

- `OverrideModal` "Authorize Release" is now shadcn `Button variant="destructive"`; if a solid-red treatment is wanted for that high-stakes action, it is a small styling tweak (noted in PR #7)
- AJ's customizable / two-mode per-role dashboard — still deferred

## Next Steps

- **Manual visual QA** — walk every route in light + dark mode before the Parkland demo
- **Phase 2** — author the InvoiceIQ use case as SatinFlow's first `agent/domains/` worked example (gated on SatinFlow `NEXT-STEPS.md` / PR #3 decisions with Rajesh)
