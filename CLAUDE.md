@AGENTS.md

# InvoiceIQ Detect

## Spec-Driven Development

This project uses spec-driven development. Specs are the source of truth — update specs before changing code.

### Rules (cross-cutting)
@specs/rules/mission.md
@specs/rules/architecture.md
@specs/rules/ui-standard.md
@specs/rules/memory.md
@specs/rules/audit-trail.md
@specs/rules/events.md
@specs/rules/boundaries.md
@specs/rules/html-outputs.md
@specs/rules/activeContext.md

### Domain Specs
When modifying a module, read its spec first:
- Dashboard: `specs/domains/dashboard/spec.md`
- Exceptions list: `specs/domains/exceptions/spec.md`
- Invoice detail (three-way match): `specs/domains/invoice-detail/spec.md`
- Pipeline: `specs/domains/pipeline/spec.md`
- Recovery: `specs/domains/recovery/spec.md`
- Extract: `specs/domains/extract/spec.md`
- Contracts: `specs/domains/contracts/spec.md`
- Vendor Scoring: `specs/domains/vendor-scoring/spec.md`
- Product Analysis: `specs/domains/product-analysis/spec.md`
- SOM: `specs/domains/som/spec.md`

### Workflow
1. Receive feedback → update the relevant `specs/domains/<module>/spec.md`
2. Generate/update code from the updated spec
3. Verify: `npm run build && npm test`
4. Commit spec and code changes together

### Key Rules
- No hardcoded hex colors — use CSS variables from `app/globals.css`
- Responsive padding: `px-6 lg:px-8` (never fixed `px-8`)
- Legal disclaimer required before any action that commits the organization
- `--legacy-peer-deps` required for npm installs (@tremor/react peer conflict)
