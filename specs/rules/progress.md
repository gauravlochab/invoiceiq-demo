# Progress Log
_Append only — newest entries at top_

---

## 2026-06-06 (Deep Audit Fix — all findings closed)

**Done:**
- 86-agent deep audit workflow executed (6 phases, 38 screenshots, 12 findings, 11 confirmed)
- All 7 actionable audit findings closed in single commit `09c6932` on `shared-shadcn-ui`:
  - F2 (critical): Agent color pill CSS bug — created `lib/agent-colors.ts` with `getAgentSubtleColor()` mapping
  - F5: Wired all 8 dead buttons on /contracts with LegalDisclaimerDialog + showToast
  - F7: Removed dead deps (@tremor/react, @anthropic-ai/sdk), moved puppeteer to devDeps, migrated Inter to next/font, deleted 5 orphan files (3.5MB savings). `--legacy-peer-deps` no longer required.
  - F9: Fixed cap-marker math (dynamic formula → fixed 66.67%)
  - F3: Added sr-only h1 to PageShell + GenericExceptionPage; fixed Ex003Page h3→h2
  - F4: Added aria-label to pagination select
  - F10: Fixed Parkland pill contrast (bg-muted/50 → bg-muted)
- Deep audit HTML report delivered: `cnui-audit/cnui-deep-audit-2026-06-04.html`
- 38 Playwright screenshots stored in `cnui-audit/shots/`

**Verify:** `npm run build` ✓ (22 routes) · `npm test` ✓ (153/153 passing, +7 new) · All buttons interactive · No render-blocking font import

**Decisions:**
- F8 (three-pane agent shell) held — contested finding, Rajesh should review before structural change
- npm install no longer needs --legacy-peer-deps (removed the @tremor/react peer conflict)

---

## 2026-05-22 (Phase 1 — app-wide v2.0 design-system migration)

**Done:**
- App-wide migration to the shadcn v2.0 design system, in 6 file-disjoint reviewable PRs (#2–#7, all merged to `main`):
  - Cluster 1 — core workflow: `/pipeline`, `/exceptions`, `/exceptions/[id]` (all 9 exception-type templates)
  - Cluster 2 — financial & vendor: `/recovery`, `/contracts`, `/vendor-scoring`, `/duplicates`
  - Cluster 3 — SOM: `/som` + 5 sub-routes (order detail, exceptions, pharmacy-scoring, manufacturers, audit-log)
  - Cluster 4 — analysis: `/extract`, `/product-analysis`
  - specs-viewer: the 3 internal spec-browser routes
  - Cluster 6 — shared `components/`: 19 components migrated; orphaned `Sidebar.tsx`/`TopBar.tsx` deleted as dead code
- `app/globals.css` — the legacy v1 design-system layer removed (875 → 308 lines): v1 `:root` color tokens + every v1 utility class (`.card`, `.badge`, `.data-table`, `.btn-*`, `.modal-*`, `.prose-spec`, …); `body`/scrollbar/focus-ring/`::selection` rewritten onto v2 tokens
- All 10 domain specs reconciled to v2.0/v2.0.1 with dated CHANGELOG entries
- Repo-wide lint backlog cleared to 0 errors / 0 warnings

**Verify:** `npm run build` ✓ (22/22 static pages) · `npm run lint` ✓ (0 errors / 0 warnings) · `npm test` ✓ (146 passing) · `grep -rE 'bg-white|--bg-base|text-(red|amber|emerald)-[0-9]' app/` → empty

**Decisions:**
- Migration split into 6 file-disjoint clusters, each its own branch + PR, for reviewability
- `Sidebar.tsx`/`TopBar.tsx` deleted — the v2 layout uses `AppSidebar`; an import scan confirmed zero references
- The v1 layer was fully removed from `globals.css` per `ui-standard.md`'s own migration mandate, once every consumer was on v2 tokens
- `scripts/**` added to ESLint ignores — Node build scripts are not app code

**Spec updates:** all 10 `domains/*/spec.md` (v2.0/v2.0.1 reconciliation); `som/spec.md` gained 3 route sections

---

## 2026-05-21 (dashboard v2.3 — all-in-one rebuild)

**Done:**
- `specs/domains/dashboard/spec.md` → v2.3 "Active — supersedes v2.2" (decluttered layout, 4 new stakeholder features, data-integrity rules, WCAG 2.1 AA criteria, EARS ACs, < 400 lines)
- `specs/rules/ui-standard.md` → v2.0.1: corrected two false claims found by the 2026-05-21 audit — (1) `--warning`/`--success` are NOT AA-safe as text → added `--warning-text`/`--success-text` tokens + token-role table; (2) `CardTitle` renders a `<div>`, not a semantic `h3`
- `app/globals.css` — added `--warning-text`/`--success-text` (`:root` + `.dark` + `@theme inline`); recolored `--chart-1..6` as a distinct-hue categorical palette (added `--chart-6`)
- `app/page.tsx` — full v2.3 rebuild: Amount-at-Risk hero (~1.6fr, one sparkline) + calm KPI trio; merged Pipeline + Contracts&GPO context band (no glyph separators); promoted exceptions table; invoice-status overview; 2-tab analysis (Trends / By Category) with category + vendor-risk donuts; computed agent counts; honest Run Scan toast; non-color severity cue; `aria-sort`; per-region `<h2>` + `<h3>` card titles
- `components/magicui/number-ticker.tsx` — `useReducedMotion()` guard (public API unchanged)
- `components/DiscrepancyBarChart.tsx` — moved off raw hex / v1 tokens onto shadcn v2 + `--chart-*` (dark-mode correct)
- `lib/data.ts` — added derived `exceptionTypeBreakdown` (reconciles By-Category total with Amount at Risk)
- `app/exceptions/page.tsx` — honors `?severity=` / `?status=` / `?type=` filter param (pre-filtered drill-through); `Suspense`-wrapped for `useSearchParams`

**Verify:** `npm run build` ✓ · `tsc --noEmit` ✓ · `npm run lint` ✓ for all touched files (pre-existing repo-wide lint issues in untouched files unchanged)

**Decisions:**
- All-in-one v2.3 over phased A/B — product-owner decision (see dashboard spec Decision Log)
- `--warning-text`/`--success-text` + `--chart-6` added to `globals.css` — required for the WCAG criticals and the distinct-category-color fix; documented in `ui-standard.md`
- `CardTitle asChild` not used — `CardTitle` has no Slot; render `<h3>`/`<h2>` nested inside `CardTitle` instead (valid HTML, heading in the outline) rather than risk a shared-component change

**Spec updates:** `domains/dashboard/spec.md` (v2.3), `rules/ui-standard.md` (v2.0.1)

---

## 2026-05-18 (session 2 — framework research synthesis)

**Done:**
- 8-source framework research (BMAD v6.3, Spec-Kit, AWS Kiro, OpenSpec, Temporal, EARS notation, Karpathy context engineering, Garry Tan gstack, Karpathy LLM Wiki)
- SpecLayer v1.1: EARS notation in AC template, 400-line spec ceiling, spec citations in code, affirmative Forbidden Patterns, HITL checkpoint declaration, readiness gate at step 2a, Confusion Protocol, HANDOFF.md at step 6, 3 new Framework Principles
- `specs/rules/memory.md` — EARS notation section, token efficiency section expanded
- `specs/rules/boundaries.md` — HITL, spec citations, Confusion Protocol
- vigorAI branch `speclayer-framework` — pushed boundaries.md, activeContext.md, progress.md, speclayer.md, html-outputs.md, README.md

**Blocked:** Nothing currently blocked

**Decisions:**
- EARS notation adopted over GIVEN/WHEN/THEN (simpler to write, still machine-parseable)
- 400-line ceiling: domain specs split into sub-specs above this — "lost in the middle" failure mode from Karpathy
- Constraints must live in files, not conversation (compaction safety)
- Confusion Protocol: agent halts on ambiguity, surfaces both interpretations, waits — never guesses
- Affirmative phrasing: Forbidden Patterns use "use X for Y" not "don't use Z"
- P2 improvements queued: Constitution.md split, sprint-status.yaml, HANDOFF.md artifact

**Spec updates:** memory.md, boundaries.md, activeContext.md, progress.md; SPECLAYER.md v1.1

---

## 2026-05-18 (session 1 — SpecLayer founding)

**Done:**
- Graph view: dagre auto-layout replaces manual x/y positions — nodes no longer overlap
- Graph view: MiniMap removed (was rendering as white tile)
- Graph view: 14 edges (pruned 6 redundant dashboard edges from original 20)
- Graph view: Top/Bottom handles added to DomainNode for vertical edge routing
- SpecLayer methodology doc created at `/Ventures/agile-clevel/speclayer/SPECLAYER.md`
- `specs/rules/memory.md` updated with SpecLayer conventions
- `specs/rules/activeContext.md` and `progress.md` created
- `specs/rules/boundaries.md` created with Always/Ask/Never tier

**Blocked:** Nothing

**Decisions:**
- Named the framework "SpecLayer" — technical/precise, co-owned by Gaurav and Rajesh
- Acceptance Criteria format: checklist style (at the time — upgraded to EARS in session 2)
- ADR pattern: inline Decision Log per domain spec + `/decisions/` folder for cross-cutting
- Drift prevention: Medium — agent states spec sections satisfied before marking done
- Domain spec template: one unified template with [required] / [optional] markers
- activeContext.md + progress.md live in `specs/rules/` — Claude updates at end of session
- Repos stay independent (hospital-demo and vigorAI), same SpecLayer pattern, different specs

**Spec updates:** memory.md updated; activeContext.md and progress.md created

---

## 2026-05-17

**Done:**
- Specs viewer graph added to demo-app (`/specs-viewer/graph`)
- React Flow dependency graph with 16 nodes (6 rules, 10 domains)
- Sidebar navigation item added for specs viewer

**Blocked:** Nothing

**Decisions:** None recorded this session

**Spec updates:** None (graph viewer is infrastructure, not a product domain)

---

## 2026-05-14

**Done:**
- SOM domain added to graph-data.ts and specs viewer
- Parkland AJ feedback captured in UX_CRITIQUE.md and relevant domain specs
- Exception detail templates reviewed

**Blocked:** AJ Parkland UI overhaul — 9 change areas not yet implemented

**Decisions:**
- Legal disclaimer required before any action that commits the organization (cross-cutting rule)

**Spec updates:** exceptions/spec.md updated with AJ Feedback section
