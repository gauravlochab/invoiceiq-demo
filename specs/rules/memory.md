# InvoiceIQ Detect — AI Context Management

## Spec-Driven Workflow

This project uses a spec-driven development approach. The workflow is:

1. **Receive feedback** (from demos, stakeholders, users)
2. **Update the relevant spec** in `specs/domains/<module>/spec.md`
3. **Generate/update code** from the updated spec
4. **Verify** — build, test, visual check
5. **Commit** — spec change and code change together

Never give feedback as a raw prompt. Always update the spec first.

## Folder Structure

```
specs/
├── rules/          → Cross-cutting concerns (read by all agents)
│   ├── mission.md
│   ├── architecture.md
│   ├── memory.md       (this file)
│   └── ui-standard.md
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

## Token Efficiency

- Specs are structured so AI only needs to read the changed section
- Use `<!-- SECTION: name -->` markers for targeted updates
- Keep each spec under 200 lines for optimal AI context adherence
