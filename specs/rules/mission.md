# InvoiceIQ Detect — Mission

## Product Vision

InvoiceIQ Detect is an AI-powered invoice intelligence platform for healthcare procurement. It automates the detection of billing discrepancies, duplicate invoices, contract overages, and vendor risk — reducing manual audit effort from days to minutes.

## Target Market

- **Primary**: Hospital and health system supply chain / procurement teams
- **Demo customer**: Northfield Medical Center (NMC), a mid-size acute care facility
- **Buyer persona**: VP of Supply Chain, Director of Procurement, CFO
- **User persona**: AP Analyst, Procurement Specialist, Compliance Officer

## Value Proposition

1. **Automated Three-Way Match** — PO vs Packing Slip vs Invoice comparison with dynamic discrepancy detection
2. **Duplicate Invoice Detection** — Fingerprint-based matching across submission channels (EDI, email, portal)
3. **Contract Compliance** — GPO contract price enforcement, tier pricing validation, annual cap monitoring
4. **Vendor Risk Scoring** — Composite risk scores from invoice patterns, payment history, and compliance signals
5. **Recovery Intelligence** — Automated credit memo tracking and recovery rate optimization
6. **Suspicious Order Monitoring (SOM)** — DEA compliance for controlled substance distribution

## Non-Negotiables

- Enterprise-grade UI — never looks like a spreadsheet
- AI recommendations always include confidence scores
- Every automated decision has a human override (Agree/Disagree) with audit trail
- Legal disclaimer before any action that commits the organization
- HIPAA-aware — no PHI in logs or external API calls

## AI Agent Architecture

Five specialized agents work as a pipeline:

| Agent | Color | Responsibility |
|-------|-------|----------------|
| Invoice Agent | `--agent-invoice` (#0065cb) | Document extraction, field mapping, line-item parsing |
| Validation Agent | `--agent-validation` (#7c3aed) | Three-way match, duplicate detection, data quality |
| Compliance Agent | `--agent-compliance` (#b45309) | Contract enforcement, cap monitoring, regulatory checks |
| Recovery Agent | `--agent-recovery` (#15803d) | Credit memo tracking, vendor communication, recovery optimization |
| Insight Agent | `--agent-insight` (#0891b2) | Vendor scoring, trend analysis, spend analytics |

## Success Metrics

- Invoice processing time: < 30 seconds per invoice
- Discrepancy detection accuracy: > 98%
- False positive rate: < 5%
- Recovery rate improvement: > 15% over manual baseline
