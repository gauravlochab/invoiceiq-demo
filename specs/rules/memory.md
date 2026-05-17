# InvoiceIQ Detect — AI Context Management

## Spec-Driven Workflow

This project uses a spec-driven development approach (SpecLayer framework). The workflow is:

1. **Receive feedback** (from demos, stakeholders, users)
2. **Update the relevant spec** in `specs/domains/<module>/spec.md`
3. **Generate/update code** from the updated spec
4. **Reconcile** — state which spec sections were satisfied; flag any drift
5. **Verify** — build, test, visual check
6. **Commit** — spec change and code change together (never separate)
7. **Generate HTML artifact** — if the task produces something a human needs to review or share (plan, PR explainer, stakeholder report), render it as HTML. See `specs/rules/html-outputs.md`.
8. **Update context** — agent updates `activeContext.md` and appends to `progress.md`

Never give feedback as a raw prompt. Always update the spec first.
Never commit code without updating the relevant spec.
Markdown is what agents read. HTML is what humans share.

## Folder Structure

```
specs/
├── rules/          → Cross-cutting concerns (read by all agents)
│   ├── mission.md
│   ├── architecture.md
│   ├── memory.md         (this file)
│   ├── ui-standard.md
│   ├── audit-trail.md
│   ├── events.md
│   ├── boundaries.md     → Always / Ask / Never agent behavior tier
│   ├── activeContext.md  → Current session working state (updated by agent each session)
│   └── progress.md       → Append-only log of session outcomes
└── domains/        → Per-module specifications
    ├── dashboard/spec.md
    ├── exceptions/spec.md
    ├── invoice-detail/spec.md
    ├── pipeline/spec.md
    ├── recovery/spec.md
    ├── extract/spec.md
    ├── contracts/spec.md
    ├── vendor-scoring/spec.md
    ├── product-analysis/spec.md
    └── som/spec.md
```

## Decision Log Convention

When a significant decision is made, add a dated entry to the bottom of the relevant spec:

```markdown
<!-- 2026-05-14: Switched from fixed-column table to dynamic discrepancy view per Bala's insight — only show problems, not all items -->
```

## How AI Agents Should Use Specs

1. Before modifying any module, read its `specs/domains/<module>/spec.md`
2. If the spec conflicts with the code, flag it — the spec is the source of truth
3. After making changes, update the spec to reflect new behavior
4. When adding new features, propose spec updates before writing code

## Integration with Claude Code

- `CLAUDE.md` imports all rule files via `@specs/rules/*.md`
- Domain specs are referenced when working in specific modules
- `.claude/rules/` contains always-on coding rules (separate from domain specs)
- Auto memory at `~/.claude/projects/` handles session-level context

## Domain Spec Standard Sections

Every domain spec (`specs/domains/<module>/spec.md`) must include these sections in order:

1. `## Overview` — What the module does, who uses it [required]
2. `## Acceptance Criteria` — Checklist of what must be true for this module to be "done" [required]
3. `## Layout` — UI structure and responsive behavior [required for UI modules]
4. `## Business Rules` — Logic, validation, computed values [required]
5. `## Data Model` — Interfaces, data sources, relationships [required]
6. `## State Machine` — Formal state transitions [optional — include when applicable]
7. `## Workflow` — Step-by-step user flow [required]
8. `## Dependencies` — Table of domain relationships (reads from / feeds into) [required]
9. `## Forbidden Patterns` — "NEVER do X — Reason: Y" constraints [required]
10. `## AJ Feedback` — Stakeholder feedback sections (Parkland Demo, Recording 17) [project-specific]
11. `## Decision Log` — Append-only record of WHY decisions were made [required]
12. `<!-- CHANGELOG -->` — Append-only record of WHAT changed and when [required]

### Acceptance Criteria Format

Use EARS notation for machine-parseable, QA-verifiable requirements:

| Pattern | Format | Use when |
|---------|--------|----------|
| Event-driven | `WHEN [trigger] THE SYSTEM SHALL [behavior]` | User action or system event |
| State-driven | `WHILE [state] THE SYSTEM SHALL [behavior]` | Ongoing condition |
| Ubiquitous | `THE SYSTEM SHALL [behavior]` | Always true |
| Error path | `IF [condition] THEN THE SYSTEM SHALL [behavior]` | Failure / edge case |

```markdown
## Acceptance Criteria
- [ ] WHEN an invoice is submitted THE SYSTEM SHALL write an audit trail entry within 500ms
- [ ] WHILE an exception is unresolved THE SYSTEM SHALL display a "Pending" badge
- [ ] THE SYSTEM SHALL display a legal disclaimer before any action that commits the organization
- [ ] IF three-way match fails THEN THE SYSTEM SHALL create an exception with the highest-severity mismatched field
```

### Decision Log Format

```markdown
## Decision Log
<!-- 2026-05-18: [Decision] — [Why chosen, alternatives considered] -->
```

### Spec-Code Reconciliation (required before marking any task done)

Before marking a task complete, the agent must confirm:
- Which spec sections were addressed
- Any spec sections NOT satisfied and why
- Any code written with no spec section (→ update the spec)
- Whether `<!-- CHANGELOG -->` has been updated

## Forbidden Patterns (Cross-Cutting)

In addition to per-domain forbidden patterns, these apply globally:

- **NEVER commit code without updating the relevant spec** — Reason: Spec drift makes the spec unreliable, and unreliable specs get ignored.
- **NEVER use hardcoded hex colors** — Reason: CSS variables in `globals.css` ensure consistent theming. See `ui-standard.md`.
- **NEVER skip the legal disclaimer before committing the organization** — Reason: Regulatory requirement across all modules.
- **NEVER log or transmit PHI** — Reason: HIPAA compliance. No patient data in logs, audit trails, or external API calls.

## Event Registry

See `specs/rules/events.md` for the full event contract standard and consolidated registry. Each domain spec's `## Events Emitted` section (to be added when backend is built) will be the authoritative source.

## Token Efficiency and Context Safety

- Specs are structured so AI only needs to read the changed section
- Use `<!-- SECTION: name -->` markers for targeted updates
- **Hard ceiling: no domain spec shall exceed 400 lines.** Beyond this, agents lose rules buried in the middle (lost-in-the-middle failure). Split into sub-specs instead.
- **Constraints must be in files, not conversation.** Any binding rule that must survive session compaction must live in a spec file — never only in chat history.
- **Cite specs in code.** Agent appends `// [Spec: domain/module.md#Section]` to every substantive code block — creates bidirectional traceability from code back to spec.
- **Forbidden Patterns use affirmative phrasing.** "Use CSS variable --color-primary for brand colors" enforces better than "don't hardcode colors."
