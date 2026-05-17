# Active Context
_Last updated: 2026-05-18 by Claude_

## Current Focus

SpecLayer v1.1 — framework improvements from 8-source research synthesis (BMAD, Spec-Kit, Kiro, OpenSpec, Temporal, EARS, Karpathy context engineering, gstack, LLM Wiki).

## Recent Changes

- `specs/rules/memory.md` — Updated: EARS notation for Acceptance Criteria, Token Efficiency section expanded with 400-line ceiling, spec citation in code, affirmative Forbidden Patterns rule
- `specs/rules/boundaries.md` — Updated: HITL checkpoint declaration, spec citation in code, Confusion Protocol (halt on ambiguity, do not guess)
- `specs/rules/activeContext.md` — This file, updated to reflect current session
- `speclayer/SPECLAYER.md` — v1.1: EARS in AC template, 400-line ceiling, spec citations, affirmative Forbidden Patterns, HITL + readiness gate in workflow (step 2a), HANDOFF.md at step 6, Confusion Protocol in boundaries, 3 new Framework Principles (8-10)
- vigorAI branch `speclayer-framework` — Pushed: boundaries.md, activeContext.md, progress.md, speclayer.md, html-outputs.md, README.md

## Open Questions

- P2 improvements to plan next: Constitution.md/CLAUDE.md split, sprint-status.yaml, implementation readiness gate, HANDOFF.md, supersession over deletion
- Which InvoiceIQ domain spec to use as first EARS AC reference example?
- Push SpecLayer v1.1 changes to vigorAI branch?

## Next Steps

- **Immediate:** Apply EARS notation to at least one domain spec as a worked example (dashboard or exceptions spec is highest visibility)
- **Upcoming:** AJ Parkland feedback UI overhaul (9 change areas identified) — priority after spec framework stabilizes
- **Upcoming:** Commit all graph view changes + spec rule changes to git
- **Upcoming (P2):** Constitution.md pattern, sprint-status.yaml, HANDOFF.md artifact on commits
