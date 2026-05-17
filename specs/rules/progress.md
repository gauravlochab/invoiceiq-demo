# Progress Log
_Append only — newest entries at top_

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
