# Contract Compliance -- Specification

## Overview
The Contracts page provides a centralized view of GPO and vendor contract compliance for Northfield Medical Center. It surfaces spend-vs-cap progress bars, unclaimed rebate alerts, tiered pricing validations, and breach notifications with action buttons. The page is designed so AP analysts and procurement leadership can immediately see which contracts need intervention -- breached contracts sort to the top, followed by at-risk, then compliant.

## Layout
- **Header region**: Title "Contract Compliance" with a subtitle showing total contract count, at-risk count, and breached count. Two action buttons top-right: "Download Report" (outlined) and "Add Contract" (primary filled).
- **Summary strip**: A 4-cell horizontal bar (flex row with border dividers) inside a white card:
  1. Total Contract Value (with contract count)
  2. Current Spend (labeled "Q1 2026")
  3. Unclaimed Rebates (amber, with vendor count)
  4. Contracts Breached (red, labeled "Immediate action")
- **Contract cards**: Vertically stacked cards, one per contract, with a colored left border indicating status (red = breached, amber = warning, default border = compliant). Each card contains a header, spend progress section, and conditional alert blocks.
- **Renewal timeline table**: A `data-table` at the bottom with columns: Vendor, Contract #, Expires, Status, Action. Shows 3 hardcoded renewal entries.
- **Responsive behavior**: `px-6 lg:px-8` padding. No grid -- single column layout with stacked cards.

## Business Rules

### Contract Sorting
Contracts are sorted by status priority:
| Status    | Sort Order | Left Border Color |
|-----------|------------|--------------------|
| breached  | 0 (first)  | `--critical` (red) |
| expired   | 0 (first)  | `--critical` (red) |
| warning   | 1          | `--warning` (amber)|
| compliant | 2 (last)   | `--border` (gray)  |

### Spend-vs-Cap Progress Bar
- Color thresholds: >= 100% of cap -> red (`--critical`). >= 70% -> amber (`--warning`). < 70% -> blue (`--acl-primary`).
- Over-limit text: When spend exceeds cap, shows "{pct}% of cap -- {overage} over limit" in red.
- **Dual-bar contracts**: When `capType === "both"`, two progress bars render -- one for value spend and one for quantity. Each has independent color coding.

### Status Badges
- **Breached**: `badge critical` with text "Breached"
- **Warning**: `badge warning` with text "At Risk"
- **Compliant**: `badge success` with text "Compliant"

### Rebate Alerts
Shown when `rebateMissed > 0`. Displays: "UNCLAIMED REBATE: {amount} not received -- No credit memo for Q1 2026" in amber text.

### Tiered Pricing Validation
Shown when `tieredPricing` is truthy. Hardcoded display:
- Tier 1: <= 1,000 units/month -> $85.00/unit
- Tier 2: > 1,000 units/month -> $72.00/unit, with amber annotation: "should apply (2,340 units in Mar)"

### Breach Block
Shown only for breached contracts. Contains:
- Red background section with "CONTRACT BREACHED" header.
- Detail text: "23 invoices processed after cap exceeded - {overage} overspend - Contract expired {date}"
- Three action buttons: "Pause Vendor Payments" (red filled), "Contact Vendor" (red outlined), "Notify CFO" (neutral outlined).

### Cardinal Health Warning Actions
Shown specifically for Cardinal Health contracts with `warning` status. Two action buttons:
- "Request Rebate Credit Memo"
- "Submit Pricing Correction"

### Renewal Timeline (hardcoded)
| Vendor                 | Contract #         | Expires       | Status   |
|------------------------|--------------------|---------------|----------|
| BioMed Equipment Inc.  | CTR-2024-BIO-009   | Dec 31, 2025  | Expired  |
| Cardinal Health        | CTR-2025-CAR-003   | Mar 31, 2026  | Expiring |
| Steris Corporation     | CTR-2025-STE-007   | May 31, 2026  | Active   |

## Data Model

### Interfaces
- **`Contract`**: `{ id, vendor, contractNumber, startDate, endDate, capType: "value" | "quantity" | "both", capValue, currentSpend, capQuantity?, currentQuantity?, rebateRate?, rebateThreshold?, rebateApplied?, rebateMissed?, tieredPricing?: { upToQty, unitPrice }[], status: "compliant" | "warning" | "breached" | "expired", category }`

### Data Sources
- **`contracts`** from `lib/data.ts`: Array of `Contract` objects.
- **`formatCurrency`** and **`formatDate`** from `lib/data.ts`: Formatting helpers.
- **`VendorBadge`** from `components/VendorBadge`: Renders vendor name with avatar/icon.

### Data Relationships
- Contract vendor names correspond to vendor names used across exceptions, recovery, and vendor scoring modules.
- Contract numbers appear in compliance agent findings in the pipeline activity feed (e.g., "CTR-2025-STE-007", "CTR-2025-CAR-003").
- `rebateMissed` values feed into the recovery queue as exception type `missing_rebate`.

## Workflow
1. **Page load**: 400ms simulated loading with skeleton placeholders for summary strip (4 cells), contract cards (4 skeleton cards with fake spend bars), and renewal timeline table (3 skeleton rows). Data loads via `useEffect` into state.
2. **Review contracts**: Analyst scrolls through contract cards. Breached contracts appear first with red left borders and prominent breach blocks.
3. **Assess spend**: Each card shows a progress bar comparing current spend to contract cap. Dual bars for contracts with both value and quantity caps.
4. **Identify rebate gaps**: Amber "UNCLAIMED REBATE" alerts appear inline in affected contract cards.
5. **Take action on breaches**: For breached contracts, analyst can click "Pause Vendor Payments", "Contact Vendor", or "Notify CFO". For Cardinal Health warning, "Request Rebate Credit Memo" or "Submit Pricing Correction".
6. **Review renewals**: Bottom table shows upcoming contract expirations with "Renew" links.
7. **Export**: "Download Report" button in header (no implementation -- UI only).

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Exceptions | feeds into | Contract overage and tier pricing violations create exceptions |
| Invoice Detail | reads from | Invoice line items compared against contract pricing |
| Dashboard | feeds into | At-risk contract count and spend alerts on dashboard KPIs |
| Vendor Scoring | feeds into | Contract compliance history influences vendor risk scores |

## Forbidden Patterns

- **NEVER allow contract price edits without audit trail** — Reason: Contract pricing is the legal reference for discrepancy detection. Unauthorized changes undermine the entire compliance system.
- **NEVER show spend-vs-cap progress without the cap source** — Reason: Users must see which GPO contract defines the cap. Progress bars without context are meaningless.
- **NEVER auto-dismiss breach alerts** — Reason: Contract breaches require explicit acknowledgment. Auto-dismissal creates compliance gaps that auditors will flag.
- **NEVER display rebate percentages without the qualifying tier** — Reason: Rebate rates change by volume tier. Showing the rate without the tier misleads procurement into expecting wrong amounts.

## AJ Feedback (Parkland Demo)
- Note: Pending -- no specific feedback for this module yet.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-14: Added 400ms loading state with skeleton placeholders (summary strip, contract cards, renewal table) -->
