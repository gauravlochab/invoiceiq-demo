# Contract Compliance -- Specification

## Overview
The Contracts page provides a centralized view of GPO and vendor contract compliance for Northfield Medical Center. It surfaces spend-vs-cap progress bars, unclaimed rebate alerts, tiered pricing validations, and breach notifications with action buttons. The page is designed so AP analysts and procurement leadership can immediately see which contracts need intervention -- breached contracts sort to the top, followed by at-risk, then compliant.

## Acceptance Criteria

EARS notation.

**App shell**
- [ ] THE SYSTEM SHALL render the Contracts page inside `SidebarProvider` + `SidebarInset` with `AppSidebar` and `SiteHeader`
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens

**Summary strip**
- [ ] THE SYSTEM SHALL render a 4-cell summary strip in a shadcn `Card`, separated by `divide-x divide-border`: Total Contract Value, Current Spend (Q1 2026), Unclaimed Rebates (`text-warning-text`), Contracts Breached (`text-destructive`)

**Contract sorting and styling**
- [ ] THE SYSTEM SHALL sort contracts by status priority: breached/expired (0) → warning (1) → compliant (2)
- [ ] THE SYSTEM SHALL render each contract as a shadcn `Card` with left border color from theme: `border-l-4 border-destructive` for breached/expired, `border-l-4 border-warning` for warning, `border-l-4 border-border` for compliant

**Spend-vs-cap progress**
- [ ] THE SYSTEM SHALL render spend-vs-cap as shadcn `Progress` with fill color: `bg-destructive` when spend >= 100% of cap, `bg-warning` when >= 70%, `bg-primary` otherwise
- [ ] WHILE spend exceeds the cap THE SYSTEM SHALL display "{pct}% of cap — {overage} over limit" in `text-destructive`
- [ ] IF `capType === "both"` THEN THE SYSTEM SHALL render two `Progress` bars (value + quantity), each color-coded independently

**Status badges and alerts**
- [ ] THE SYSTEM SHALL render Status badges using shadcn `Badge`: `variant="destructive"` "Breached", `bg-warning/10 text-warning-text border-warning` "At Risk", `bg-success/10 text-success-text border-success` "Compliant"
- [ ] WHEN `rebateMissed > 0` THE SYSTEM SHALL display an inline shadcn `Alert` styled `bg-warning/10 border-warning` with `text-warning-text` body copy: "UNCLAIMED REBATE: {amount} not received — No credit memo for Q1 2026"
- [ ] WHEN a contract status is `breached` THE SYSTEM SHALL display a breach block: shadcn `Alert variant="destructive"` containing "CONTRACT BREACHED" header, detail text, and three shadcn `Button` actions: "Pause Vendor Payments" (`variant="destructive"`), "Contact Vendor" (`variant="outline"`), "Notify CFO" (`variant="outline"`)

**Cardinal Health warning actions**
- [ ] IF a Cardinal Health contract has `warning` status THEN THE SYSTEM SHALL render two action buttons: shadcn `Button variant="outline"` "Request Rebate Credit Memo" and "Submit Pricing Correction"

**Renewal timeline table**
- [ ] THE SYSTEM SHALL render the renewal timeline using shadcn `Table` primitives wrapped in a shadcn `Card` + `CardContent`, with five columns: Vendor, Contract #, Expires, Status, Action

**Loading and safety**
- [ ] WHEN the page mounts THE SYSTEM SHALL display shadcn `Skeleton` placeholders for the summary strip, 4 contract cards, and 3 renewal table rows for 400ms before real content
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable all expand/entrance animations
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on all interactive elements

## Layout

Renders inside `SidebarProvider` + `SidebarInset` (per v2.0 app shell).

- **Header region**: Title `text-2xl font-semibold` "Contract Compliance" with subtitle `text-sm text-muted-foreground` showing total/at-risk/breached counts. Two shadcn `Button` instances top-right: "Download Report" (`variant="outline"`) and "Add Contract" (`variant="default"`).
- **Summary strip**: Shadcn `Card` containing a 4-cell `flex` row with `divide-x divide-border`. Cells per Acceptance Criteria.
- **Contract cards**: Vertically stacked shadcn `Card` instances, one per contract. Left border per Acceptance Criteria. Each card has `CardHeader` (vendor + contract #), `CardContent` (spend progress + tier info + conditional alerts), and optional breach block.
- **Renewal timeline**: Shadcn `Card` + `CardContent` with shadcn `Table` per Acceptance Criteria.
- **Responsive behavior**: `px-4 lg:px-6` padding (v2.0 standard). Single column, stacked cards.

## Business Rules

### Contract Sorting
Contracts are sorted by status priority (v2.0 theme tokens):
| Status    | Sort Order | Left Border (Tailwind class) |
|-----------|------------|------------------------------|
| breached  | 0 (first)  | `border-l-4 border-destructive` |
| expired   | 0 (first)  | `border-l-4 border-destructive` |
| warning   | 1          | `border-l-4 border-warning` |
| compliant | 2 (last)   | `border-l-4 border-border` |

### Spend-vs-Cap Progress Bar
- Shadcn `Progress` component, fill color via Acceptance Criteria thresholds (`bg-destructive` / `bg-warning` / `bg-primary`)
- Over-limit text: When spend exceeds cap, shows "{pct}% of cap — {overage} over limit" in `text-destructive`
- **Dual-bar contracts**: When `capType === "both"`, two `Progress` bars render — one for value spend and one for quantity, each color-coded independently

### Status Badges
- **Breached**: shadcn `Badge variant="destructive"` with text "Breached"
- **Warning**: shadcn `Badge` styled `bg-warning/10 text-warning-text border-warning` with text "At Risk"
- **Compliant**: shadcn `Badge` styled `bg-success/10 text-success-text border-success` with text "Compliant"

### Rebate Alerts
Shown when `rebateMissed > 0`. Displays: "UNCLAIMED REBATE: {amount} not received -- No credit memo for Q1 2026" in `text-warning-text` (AA-safe amber text).

### Tiered Pricing Validation
Shown when `tieredPricing` is truthy. Hardcoded display:
- Tier 1: <= 1,000 units/month -> $85.00/unit
- Tier 2: > 1,000 units/month -> $72.00/unit, with `text-warning-text` annotation: "should apply (2,340 units in Mar)"

### Breach Block
Shown only for breached contracts. Contains:
- Shadcn `Alert variant="destructive"` with "CONTRACT BREACHED" header (`AlertTitle`)
- `AlertDescription`: "23 invoices processed after cap exceeded — {overage} overspend — Contract expired {date}"
- Three shadcn `Button` actions: "Pause Vendor Payments" (`variant="destructive"`), "Contact Vendor" (`variant="outline"`), "Notify CFO" (`variant="outline"`)

### Cardinal Health Warning Actions
Shown specifically for Cardinal Health contracts with `warning` status. Two shadcn `Button variant="outline"` actions:
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

Use affirmative phrasing per SpecLayer v1.1.

- **Write an audit trail entry for every contract price edit** — Reason: contract pricing is the legal reference for discrepancy detection; unauthorized changes undermine compliance.
- **Display the cap source (GPO contract identifier) alongside every spend-vs-cap progress bar** — Reason: progress without context is meaningless.
- **Require explicit user acknowledgment to dismiss breach alerts** — Reason: auto-dismissal creates compliance gaps that auditors will flag.
- **Display the qualifying volume tier alongside every rebate percentage** — Reason: rebate rates change by tier; rate without tier misleads procurement.
- **Use shadcn `Card`, `Alert`, `Badge`, `Button`, `Progress`, `Table` primitives for contract cards, alerts, status badges, action buttons, spend bars, and renewal table** — Reason: deprecates ad-hoc `.card`, `.alert-bar`, `.badge.*`, `.data-table` utility classes.
- **Use theme tokens for all surfaces, borders, and status text** — surfaces/borders use `bg-card` / `border-destructive` / `border-warning` / `border-border`; status TEXT uses `text-destructive` / `text-warning-text` / `text-success-text` (AA-safe per ui-standard.md v2.0.1); the vivid `--warning` / `--success` are reserved for fills, dots, and borders only — Reason: hex tokens (`--critical`, `--warning`, `--success`, `--acl-primary`) removed in v2.0, and `text-warning` / `text-success` fail WCAG 1.4.3 as body text.

## AJ Feedback (Parkland Demo)
- Note: Pending -- no specific feedback for this module yet.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-14: Added 400ms loading state with skeleton placeholders (summary strip, contract cards, renewal table) -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system per ui-standard.md v2.0. App shell wraps in SidebarProvider+SidebarInset. Contract cards + summary strip + renewal table → shadcn `Card`. Spend bars → shadcn `Progress` with `bg-destructive` / `bg-warning` / `bg-primary` thresholds. Rebate alerts + breach blocks → shadcn `Alert` (warning-styled or `variant="destructive"`). Status badges → shadcn `Badge` (`variant="destructive"` for Breached, theme-styled for At Risk/Compliant). All action buttons → shadcn `Button` variants. Renewal table → shadcn `Table` primitives. Loading → `Skeleton`. All v1 hex tokens (`--critical`, `--warning`, `--success`, `--acl-primary`, `--border`) migrated to v2 theme classes. Added 14 EARS Acceptance Criteria. Forbidden Patterns rewritten in affirmative form per SpecLayer v1.1. -->
<!-- 2026-05-22 v2.0.1 reconciliation: Migrated app/contracts/page.tsx from v1 to v2.0 shadcn (Cluster 2). Status-text criteria corrected to AA-safe `text-warning-text` / `text-success-text` (ui-standard.md v2.0.1); `--warning`/`--success` kept for fills/borders. Code reconciliation: `.card`→`Card` with `border-l-4` status border, hand-rolled `.progress-track`/`.progress-fill` spend bars→shadcn `Progress` with `ProgressIndicator` color override, breach/rebate blocks→shadcn `Alert`, `.badge.*`→`Badge`, raw `<button>`→`Button`, `.data-table` renewal table→shadcn `Table` primitives, skeletons→`Skeleton`. All v1 `var(--*)` tokens, `bg-white`, `bg-red-50/border-red-200`, `text-amber-700/red-600/red-900` retired. Real `<h1>`/`<h2>` outline; `<h3>` per contract card via VendorBadge heading. Dark mode verified. -->
