# InvoiceIQ Detect — Audit Trail Standard

## Purpose

Every user action and AI agent decision in InvoiceIQ Detect must be recorded in an append-only audit trail. This ensures regulatory compliance (HIPAA, SOX), supports dispute resolution with vendors, and provides a complete chain of custody for every invoice from ingestion to payment.

## Audit Entry Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Immutable entry identifier |
| `timestamp` | ISO 8601 UTC | When the action occurred |
| `actor` | string | User ID or agent name (e.g., `user:jane.doe`, `agent:validation`) |
| `actor_type` | enum | `user`, `ai_agent`, `system` |
| `domain` | string | Module where the action occurred (e.g., `invoice-detail`, `recovery`) |
| `entity_id` | string | ID of the affected record (exception ID, invoice number, etc.) |
| `action` | string | What happened (see Action Vocabulary below) |
| `confidence` | float (0-1) | AI confidence score — required when `actor_type = ai_agent`, null otherwise |
| `detail` | JSON | Action-specific payload (changed fields, amounts, reasons) |
| `previous_state` | string | Entity state before the action |
| `new_state` | string | Entity state after the action |

## Action Vocabulary

| Action | Description | Domains |
|--------|-------------|---------|
| `invoice.extracted` | AI extracted fields from uploaded document | Extract |
| `invoice.flagged` | AI or user flagged an invoice for review | Pipeline, Exceptions |
| `invoice.approved` | User approved a flagged invoice (Agree) | Invoice Detail |
| `invoice.rejected` | User rejected a flagged invoice (Disagree) | Invoice Detail |
| `invoice.escalated` | User or system escalated to manager | Invoice Detail, Exceptions |
| `recovery.outcome_recorded` | Analyst recorded a recovery outcome | Recovery |
| `recovery.escalated` | Analyst escalated a recovery case | Recovery |
| `recovery.bulk_action` | Analyst performed bulk escalate/follow-up | Recovery |
| `contract.breach_detected` | System detected contract cap breach | Contracts |
| `vendor.score_updated` | Insight agent recalculated vendor risk | Vendor Scoring |
| `som.order_flagged` | System flagged suspicious controlled substance order | SOM |
| `som.order_verified` | Analyst verified/cleared a flagged order | SOM |
| `disclaimer.accepted` | User accepted legal disclaimer before action | Any |

## Sensitive Field Redaction

The following fields must be replaced with `**REDACTED**` in audit entries:
- Vendor banking details (account numbers, routing numbers)
- SSN or tax ID numbers
- Patient health information (PHI) — even if accidentally present in invoice data
- User credentials or session tokens

## Storage Rules

- **Append-only**: Audit entries are never updated or deleted
- **Same transaction**: The audit write must be in the same transaction as the business action — both commit or both rollback
- **Retention**: 7 years minimum (healthcare regulatory requirement)
- **System actions**: Use `actor: "system:invoiceiq"` for automated processes with no user trigger

## AI Agent Audit Requirements

When an AI agent makes a decision:
1. The confidence score is mandatory in the audit entry
2. The `detail` field must include the reasoning summary (1-2 sentences)
3. If the agent's decision was later overridden by a human, a separate `*.overridden` audit entry is created linking to the original entry
4. Agent decisions below the confidence threshold (< 0.85) must include `requires_review: true` in detail

## Query Patterns

The audit trail must support these access patterns efficiently:
- All actions on a specific invoice (by `entity_id`)
- All actions by a specific user (by `actor`)
- All AI decisions below confidence threshold (by `confidence < 0.85`)
- All actions in a time range (by `timestamp`)
- All escalations across domains (by `action` contains "escalated")
