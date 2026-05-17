# InvoiceIQ Detect — Event Contract Standard

## Purpose

Domains communicate through events. Each domain spec declares its emitted events in a `## Events Emitted` section — this file defines the standard shape and rules that all events must follow.

## Event Shape

```
{
  domain:    string    — source module (e.g., "extract", "recovery")
  event:     string    — action name (e.g., "invoice.extracted", "recovery.escalated")
  entityId:  string    — ID of the affected record
  timestamp: string    — ISO 8601 UTC
  actor:     string    — who triggered it (user ID, agent name, or "system")
  payload:   object    — event-specific data (varies by event type)
}
```

## Naming Convention

Events follow the pattern: `{domain}.{past_tense_verb}`

Examples:
- `pipeline.agent_completed`
- `invoice.flagged`
- `recovery.outcome_recorded`
- `contract.breach_detected`
- `vendor.score_recalculated`

## Event Registry

This is the consolidated list of all domain events. Each domain spec's `## Events Emitted` section is the authoritative source — this registry is the cross-reference.

| Event | Source Domain | Consumers | Description |
|-------|-------------|-----------|-------------|
| `extract.document_uploaded` | Extract | Pipeline | New invoice document submitted for processing |
| `extract.invoice_extracted` | Extract | Pipeline, Exceptions | AI extraction completed, fields available |
| `pipeline.agent_completed` | Pipeline | Dashboard | Single agent step finished processing |
| `pipeline.run_completed` | Pipeline | Dashboard, Exceptions | Full 5-agent pipeline finished |
| `exception.created` | Exceptions | Dashboard, Recovery | New exception flagged by pipeline |
| `exception.resolved` | Exceptions | Dashboard, Recovery | Exception resolved (approved/rejected) |
| `exception.escalated` | Exceptions | Dashboard | Exception escalated to manager |
| `invoice.approved` | Invoice Detail | Recovery, Dashboard | User agreed with AI assessment |
| `invoice.rejected` | Invoice Detail | Recovery, Dashboard | User disagreed with AI assessment |
| `recovery.outcome_recorded` | Recovery | Vendor Scoring, Dashboard | Analyst recorded recovery result |
| `recovery.escalated` | Recovery | Dashboard | Recovery case escalated |
| `contract.breach_detected` | Contracts | Dashboard, Exceptions | Contract spending cap exceeded |
| `contract.renewal_approaching` | Contracts | Dashboard | Contract renewal within 90 days |
| `vendor.score_updated` | Vendor Scoring | Dashboard | Vendor risk score recalculated |
| `som.order_flagged` | SOM | Dashboard, Exceptions | Suspicious controlled substance order detected |
| `som.order_cleared` | SOM | Dashboard | Flagged order verified as legitimate |
| `product.category_flagged` | Product Analysis | Exceptions | Product category anomaly detected |

## Rules

1. **Events are facts, not commands** — they describe what happened, not what should happen next
2. **Consumers must be idempotent** — processing the same event twice produces the same result
3. **Events are immutable** — once emitted, an event is never modified
4. **Payload must be self-contained** — consumers should not need to query back to the source domain to understand the event
5. **No sensitive data in payloads** — apply the same redaction rules as the audit trail (see `audit-trail.md`)
