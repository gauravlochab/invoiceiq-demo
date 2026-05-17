# Invoice Detail (Three-Way Match) -- Specification

## Overview

The invoice detail page is the CORE product view of InvoiceIQ Detect. It renders a per-exception deep dive with template routing based on exception type. The most important template is the EX-006 three-way match analysis, which was recently revamped from a fixed 10-column spreadsheet into a dynamic discrepancy view that only shows flagged items grouped by discrepancy type. This page is where analysts make the actual approve/reject/escalate decisions on individual invoice line items.

## Template Routing

The page uses `useParams()` to read the exception ID, then routes to a specific template function based on the exception type and ID:

| Exception ID/Type | Template | Description |
|-------------------|----------|-------------|
| EX-003 | `Ex003Page` | Suspicious invoice -- PO match search, vendor verification |
| EX-006 | `Ex006Page` | Full three-way match with Agree/Disagree per line item |
| EX-007, EX-010 (match_exception) | `MatchExceptionDetail` | Read-only three-way match |
| duplicate | `DuplicateDetail` | Side-by-side invoice comparison |
| contract_overage | `ContractOverageDetail` | Contract cap analysis |
| suspicious_invoice | `SuspiciousInvoiceDetail` | Fraud indicators |
| missing_rebate | `MissingRebateDetail` | Rebate shortfall analysis |
| tier_pricing | `TierPricingDetail` | Volume discount analysis |
| SOM types (som_*) | `SOMExceptionDetail` | Suspicious order analysis |
| Fallback | `PageShell` + `ActionPanel` | Generic exception detail |

## Layout (EX-006 -- Primary Template)

### Breadcrumb (pt-6, px-8)
- "Back" button using `router.back()`

### Header (px-8, pt-3 pb-6)
- Badge row: Exception ID (mono 11px), type badge ("Match Exception", warning), status badge ("Under Review", warning), `CategoryBadge` ("Sterilization")
- Title: vendor name "Steris Corporation" (22px, semibold)
- Subtitle: Invoice number, date, PO number

### Alert Bar (mx-8, mb-6)
- Red left-border card (`border-l-4 border-red-600 bg-red-50`)
- Dynamic text: "{N} discrepancies detected -- $4,600 flagged this invoice . recurrence . AI confidence 98.7%"

### Escalation Banner (mx-8)
- `EscalationBanner` component with flagged amount

### Two-Column Layout (px-8, pb-8, grid-cols-1 lg:grid-cols-[1fr_280px] gap-6)

**LEFT COLUMN -- Three-Way Match Analysis**

This is the `DiscrepancyView` component -- the revamped core of the product. It replaces the old fixed 10-column spreadsheet.

#### Summary Banner
- Subtle background card: "This invoice has {N} line items. Showing {M} with {K} discrepancies."
- Right side: badges per active discrepancy type with counts (e.g., "2 Price Mismatch", "1 Quantity Mismatch")

#### Discrepancy Sections (grouped by type)
- Group order: price -> qty -> description -> unit
- Each group is a collapsible card with:
  - **Group header**: expandable button with ChevronDown/Right icon, type label (e.g., "Price Mismatch"), item count, type badge
  - **Expanded items**: each item shows:
    - Col 1 (flex-1): Item code (mono 11px), description
    - Col 2 (min-w 280px): Expected vs Actual values specific to the discrepancy type:
      - **Price**: PO Price vs Invoice Price vs Variance (amount + percentage)
      - **Qty**: PO Qty vs Packing Slip Qty vs Invoice Qty vs Variance
      - **Description**: PO description vs Invoice description (quoted)
      - **Unit**: PO Unit vs Invoice Unit
    - "Also flagged:" row if the item has additional flags beyond the current group
    - Col 3 (w-140px): Agree/Disagree action buttons (EX-006 only)

#### Agree/Disagree Actions (EX-006 only)
- **Pending**: "Agree" (green, Check icon) + "Disagree" (red, X icon) buttons
- **Agreed**: green pill "Agreed" with Check icon + "undo" text button
- **Disagreed**: red pill "Disagreed" with X icon + "undo" text button
- Each action triggers `LegalDisclaimerDialog` FIRST, then executes
- Disagree additionally opens a "Override Automated Determination" modal requiring justification text

#### Matched Items (collapsed by default)
- Collapsible section at bottom: "{N} items matched -- no discrepancies"
- Right side: green "{N} OK" badge
- When expanded: simple list with item code, description, qty x price, green "Match" badge

#### Totals Section (border-t, px-6 py-4)
- Three metrics in a row:
  - **PO Total**: computed from `poQty * poUnitPrice` across all items
  - **Invoice Total**: computed from `invoiceQty * invoiceUnitPrice` (red text)
  - **Variance**: difference with percentage (red text, + prefix)

#### AI Recommendation (px-6, pb-5)
- Subtle card with section label "AI Recommendation"
- Text explaining recommended action with specific dollar amounts and recurrence data

#### GPO Comparison Section
- `GPOComparisonSection` component for contract price comparison

#### Invoice Status Stepper (card, px-6 py-4, mt-4)
- 4-step horizontal stepper:
  1. Pending Review (warning color)
  2. Waiting on Correction (agent-invoice color)
  3. Escalated to Manager (agent-validation color)
  4. Approved (agent-recovery color)
- Active step: white text on colored circle; past steps: white check on colored circle; future: subtle bg
- Connecting lines between steps (blue for past, gray for future)

**RIGHT COLUMN -- Info Panel (card, p-5)**

- **Exception Details**: key-value pairs (Assigned to, Detected, Recurrences, Cumulative impact)
- **Documents**: 3 document links with FileIcon
  - Invoice PDF (read-only)
  - PO PDF (changeable via dropdown -- 3 PO options)
  - Packing Slip PDF (changeable via dropdown -- 3 PS options)
  - Changing PO/PS triggers dynamic recalculation of the three-way match via `sterisLineItemsByPO` / `sterisLineItemsByPS` lookup tables
  - "changed" label appears when document differs from default
- **Actions** (locked until all line items are resolved):
  - "Review all line items above to unlock actions" hint when items remain pending
  - **Initiate Recovery** (amber outline, enabled when allResolved) -- opens modal with vendor email, subject, pre-drafted message body; creates recovery queue entry, updates exception status
  - **Approve with Override** (gray outline, enabled when allResolved AND no rejections) -- opens modal with amber warning, required reason; blocked if any line item disagreement exists
  - **Escalate to Manager** (gray outline, always accessible) -- opens modal with manager dropdown (4 options with titles) and required note
- **Agent History** (collapsible section):
  - Per-exception agent timeline from `AGENT_TIMELINES` record
  - Each entry: colored left bar, agent name badge (9px uppercase), timestamp, message
  - Agents: Invoice Agent, Validation Agent, Compliance Agent, Recovery Agent (added dynamically after recovery action)

## Layout (EX-003 -- Suspicious Invoice)

- PO Match Search workflow with 4 verification steps (vendor name lookup, fuzzy matching, open PO search, PO cross-match)
- PO Candidates table showing closest matches with match percentages
- "Vendor Not in Approved Master" red alert card
- Actions: Block Payment (primary-red), Report to Compliance (outline-red), Request Vendor Verification (outline-gray), Dismiss (ghost)
- All actions gated by `LegalDisclaimerDialog` with `PostDisagreeSteps` shown after blocking/reporting

## Business Rules

- **Legal disclaimer**: EVERY action that commits the organization (Agree, Disagree, Block, Approve, Escalate, Recover, Dismiss) must pass through `LegalDisclaimerDialog` first
- **Disagree override**: when an analyst disagrees with the AI finding, they MUST provide a written justification (logged for compliance audit)
- **Approve with Override**: blocked if ANY line item has a "rejected" (disagreed) state -- enforces consistency
- **Dynamic document selection**: changing the PO or Packing Slip document triggers recalculation of all line item flags via lookup tables (`sterisLineItemsByPO`, `sterisLineItemsByPS`)
- **Flag computation**: flags are dynamically computed per line item by comparing invoice values against the selected PO/PS values:
  - Price flag: `invoiceUnitPrice !== poUnitPrice`
  - Qty flag: `packingSlipQty !== invoiceQty`
  - Description flag: `poDescription !== invoiceDescription` (when both present)
  - Unit flag: `poUnit !== invoiceUnit` (when both present)
- **Row background**: price-flagged items get `bg-red-50`, qty/unit/description-flagged items get `bg-amber-50`
- **Reject reasons**: predefined list of 7 compliance-appropriate justifications plus "Other"
- **Recovery initiation**: creates entry in recovery queue via `addToRecoveryQueue()`, updates exception status to "under_review"
- **Invoice status transitions**: pending_review -> waiting_correction (after recovery) or waiting_manager (after escalation) or approved_override (after override)

## Data Model

- **Source files**: `lib/data.ts` (sterisLineItems, sterisLineItemsByPO, sterisLineItemsByPS, medlineLineItems, owensLineItems, exceptions, exceptionContracts, exceptionDuplicates, duplicatePairs, addToRecoveryQueue, updateExceptionStatus, formatCurrency)
- **Key interfaces**:
  - `InvoiceLineItem`: itemCode, description, invoiceQty, invoiceUnitPrice, poQty, poUnitPrice, packingSlipQty, poDescription, invoiceDescription, poUnit, invoiceUnit, flags
  - `Exception`: id, type, severity, status, vendor, invoiceNumber, flaggedAmount, category, amount, detectedAt, invoiceDate, assignee
- **Dynamic state**: lineItemStates (Record<string, "pending"|"accepted"|"rejected">), selectedPO, selectedPS, docOverrides, invoiceStatus, actionTaken
- **Agent timelines**: `AGENT_TIMELINES` record with per-exception-ID arrays of {agent, color, time, msg}
- **Components used**: LegalDisclaimerDialog, CategoryBadge, VendorBadge, EscalationBanner, PostDisagreeSteps, WorkflowStepper, AuditTrail, GPOComparisonSection

## Workflow

1. Page loads, reads exception ID from URL params
2. Routes to appropriate template based on exception type/ID
3. **EX-006 flow**:
   a. Analyst sees discrepancy summary banner and grouped flagged items
   b. Expands each discrepancy group, reviews expected vs actual values
   c. For each flagged item: clicks Agree or Disagree
   d. Agree: legal disclaimer -> accepted (green pill)
   e. Disagree: legal disclaimer -> override justification modal -> rejected (red pill)
   f. After ALL items resolved: action buttons unlock
   g. Choose: Initiate Recovery (sends email), Approve with Override (requires reason), or Escalate to Manager (assigns to named manager)
   h. Invoice status stepper updates to reflect the chosen path
   i. Agent History updates with new recovery/escalation entry
4. **Document change flow**: analyst clicks "Change" on PO or PS -> selects alternative document -> three-way match recalculates all flags dynamically -> toast confirms recalculation

## State Machine

```
open ──→ under_review ──→ approved
              │
              ├──→ rejected
              │
              └──→ escalated ──→ approved
                                   │
                                   └──→ rejected
```

| From | To | Trigger | Actor |
|------|----|---------|-------|
| open | under_review | Analyst opens the exception detail page | User |
| under_review | approved | Analyst clicks "Agree" + accepts legal disclaimer | User |
| under_review | rejected | Analyst clicks "Disagree" + provides reason | User |
| under_review | escalated | Analyst clicks "Escalate to Manager" | User |
| escalated | approved | Manager approves the escalated exception | Manager |
| escalated | rejected | Manager rejects the escalated exception | Manager |

Terminal states: `approved`, `rejected`. Legal disclaimer is required before `approved` transition.

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Exceptions | reads from | Invoice detail page displays the full exception record |
| Extract | reads from | Extracted invoice fields shown in the three-way match |
| Contracts | reads from | GPO contract pricing used for comparison section |
| Recovery | feeds into | Rejected invoices (confirmed overcharges) create recovery cases |
| Dashboard | feeds into | Resolution counts update dashboard KPIs |
| Vendor Scoring | feeds into | Exception outcomes influence vendor risk scores |

## Forbidden Patterns

- **NEVER auto-approve a flagged invoice without human Agree/Disagree action** -- Reason: Every flagged invoice requires explicit human judgment. Auto-approval bypasses the legal disclaimer and creates compliance liability.
- **NEVER skip the legal disclaimer before any action that commits the organization** -- Reason: Regulatory requirement. The disclaimer protects the organization from unauthorized financial commitments.
- **NEVER show the AI recommendation without its confidence score** -- Reason: Users must know how certain the AI is. A 95% confidence recommendation is very different from a 60% one.
- **NEVER allow resolution of an escalated exception by the original analyst** -- Reason: Escalation exists specifically because the decision needs a higher authority. The original analyst reviewing their own escalation defeats the purpose.
- **NEVER display vendor contact information in the exception detail** -- Reason: Exception review is about the invoice data, not vendor communication. Contact info belongs in the recovery workflow.

## AJ Feedback (Parkland Demo)

"Only show problems not all items, dynamic columns not fixed, single unified table for N-way match, group by discrepancy type with expandable sections"

### AJ Feedback (Recording 17)

- **Legal disclaimer required**: Agree/Disagree actions must show a formal legal disclaimer popup. User must acknowledge before proceeding. "Is that legally binding if the company comes back and says, hey, why did you approve that?"
- **Formal language**: Replace casual wording ("Why do you disagree with the AI finding?") with formal, professional language. Current tone is "pedestrian."
- **Policy document link**: Add a "View Policy Document" button in the disagree flow linking to the company's internal policy.
- **Disclaimer on invoice open**: Consider showing disclaimer when an invoice is first opened, not just at the action point.
- **Consult attorney**: Legal language must be reviewed by counsel before Parkland pilot.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase — documents the revamp from fixed 10-column spreadsheet to dynamic DiscrepancyView grouped by discrepancy type -->
<!-- 2026-05-14: Added AJ feedback from Recording 17 — legal disclaimer, formal language, policy document link -->
