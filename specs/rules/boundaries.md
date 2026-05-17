# InvoiceIQ Detect — Agent Boundaries

## Purpose

This file defines the three-tier boundary system for AI agent behavior in this codebase.
It supplements the Forbidden Patterns sections in individual domain specs.

---

## Always (do without asking)

- Read the relevant domain spec (`specs/domains/<module>/spec.md`) before modifying any module
- Use CSS variables from `app/globals.css` — never hardcode hex colors
- Add a legal disclaimer before any action that commits the organization
- Create an audit trail entry for every user action and AI agent decision
- State which spec sections were satisfied before marking a task complete
- Update `specs/rules/activeContext.md` and `specs/rules/progress.md` at the end of every session
- Commit spec changes and code changes in the same commit — never separate
- Use `--legacy-peer-deps` for npm installs (required: @tremor/react peer conflict)
- Use `px-6 lg:px-8` for page padding — never fixed `px-8`
- Declare HITL checkpoints before starting any task: state upfront which actions will require approval (data model changes, cross-domain edits, file deletions)
- Cite spec in code: append `// [Spec: domains/<module>/spec.md#Section]` on every substantive code block

---

## Ask Before (confirm before proceeding)

- Changes that touch more than one domain module in a single task
- Refactors or renames that could break imports or contracts in other modules
- Adding new UI patterns not already defined in `ui-standard.md`
- Adding new CSS variables to `globals.css`
- Changing the data model in `lib/data.ts` or `lib/vendors.ts`
- Any change to event schema defined in `specs/rules/events.md`
- Modifying audit trail schema from `specs/rules/audit-trail.md`
- **Two valid spec interpretations exist — halt, surface both options explicitly, wait for human decision. Do not guess.**
- Removing or deprecating an existing component in `components/`
- Changing the sidebar navigation structure
- Any change that affects the demo flow for Parkland or hospital clients

---

## Never (refuse and explain why)

- Commit code without updating the relevant domain spec — **Reason:** spec drift makes specs unreliable and they get ignored
- Invent UI components, business logic, or data fields not in the domain spec — **Reason:** agents hallucinate features that break the product's coherence
- Hardcode hex colors in component files — **Reason:** theming breaks; use CSS variables from `globals.css`
- Skip the legal disclaimer before any action that commits the organization — **Reason:** regulatory requirement
- Log or transmit PHI (patient health information) — **Reason:** HIPAA compliance; no patient data in logs, audit trails, or external API calls
- Change code in a module not related to the current task without flagging it first — **Reason:** prevents silent cross-module regressions
- Use the word "sample", "test", or "demo" in any user-facing string — **Reason:** enterprise credibility
- Skip the spec-code reconciliation check at end of a task — **Reason:** drift prevention protocol requires it
- Add `--no-verify` to git commits — **Reason:** hooks exist for a reason
- Expose the CTO call transcript files (`docs/cto_call_transcript_*.txt`) in git — **Reason:** contains participant names and confidential business discussion

---

## Spec-Code Reconciliation Checklist

Before marking any task as complete, the agent must confirm:

- [ ] Which domain spec sections were addressed in this change?
- [ ] Are there any spec sections that were NOT satisfied and why?
- [ ] Is there any code written that has no corresponding spec section? (→ update the spec)
- [ ] Has the domain spec's `<!-- CHANGELOG -->` been updated with a dated entry?
- [ ] Has `activeContext.md` been updated with recent changes?

---

<!-- CHANGELOG -->
<!-- 2026-05-18: Initial boundaries.md created from SpecLayer brainstorm. Always/Ask/Never tier standardized for InvoiceIQ Detect. -->
<!-- 2026-05-18: v1.1 additions from 8-framework research synthesis — HITL checkpoint declaration, spec citation in code, Confusion Protocol (halt on ambiguity), EARS notation reference, Karpathy context engineering principles. -->
