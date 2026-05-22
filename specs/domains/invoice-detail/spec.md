# Invoice Detail (Three-Way Match) -- Specification

## Overview

The invoice detail page is the CORE product view of InvoiceIQ Detect. It renders a per-exception deep dive with template routing based on exception type. The most important template is the EX-006 three-way match analysis, which was recently revamped from a fixed 10-column spreadsheet into a dynamic discrepancy view that only shows flagged items grouped by discrepancy type. This page is where analysts make the actual approve/reject/escalate decisions on individual invoice line items.

## Acceptance Criteria

EARS notation.

**App shell**
- [ ] THE SYSTEM SHALL render the invoice detail page content inside the root layout's `SidebarProvider` + `SidebarInset` + `AppSidebar` shell (provided by `app/layout.tsx`; the page itself renders a `<main>` content region only)
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens — every template (EX-003, EX-006, MatchExceptionDetail, DuplicateDetail, ContractOverageDetail, MissingRebateDetail, TierPricingDetail, GenericExceptionPage, SomExceptionDetail) must theme correctly in both modes

**Template routing**
- [ ] WHEN the URL exception ID matches a known template mapping THE SYSTEM SHALL render that template's component (Ex003Page, Ex006Page, MatchExceptionDetail, DuplicateDetail, ContractOverageDetail, SuspiciousInvoiceDetail, MissingRebateDetail, TierPricingDetail, SOMExceptionDetail)
- [ ] IF no template matches the exception type THEN THE SYSTEM SHALL render the fallback `PageShell` + `ActionPanel` template

**Three-way match (EX-006)**
- [ ] THE SYSTEM SHALL render the discrepancy summary as a shadcn `Card` with subtle `bg-muted` background, listing total line items, flagged items, and `Badge variant="outline"` per active discrepancy type
- [ ] THE SYSTEM SHALL render each discrepancy group as a collapsible shadcn `Card` with header containing expand icon, type label, item count, and `Badge` of variant matching discrepancy severity
- [ ] THE SYSTEM SHALL group discrepancies in fixed order: price → qty → description → unit
- [ ] WHEN a user expands a discrepancy group THE SYSTEM SHALL render each item with three columns: identifier (item code + description), expected vs actual values, and Agree/Disagree action area
- [ ] THE SYSTEM SHALL render row backgrounds using `bg-destructive/5` for price-flagged items and `bg-warning/5` for qty/unit/description-flagged items

**Agree / Disagree actions**
- [ ] WHEN a user clicks Agree or Disagree THE SYSTEM SHALL open `LegalDisclaimerDialog` (shadcn `Dialog`) before the action takes effect
- [ ] WHEN a user clicks Disagree THE SYSTEM SHALL additionally open an "Override Automated Determination" shadcn `Dialog` requiring a justification `Textarea`
- [ ] WHILE a line item is in `pending` state THE SYSTEM SHALL render Agree (`Button variant="default"` with Check icon) and Disagree (`Button variant="destructive"` with X icon) buttons
- [ ] WHILE a line item is in `accepted` state THE SYSTEM SHALL render a `Badge` with `bg-success` "Agreed" + undo `Button variant="ghost" size="sm"`
- [ ] WHILE a line item is in `rejected` state THE SYSTEM SHALL render a `Badge variant="destructive"` "Disagreed" + undo `Button variant="ghost" size="sm"`

**Action panel (right column)**
- [ ] THE SYSTEM SHALL render the right column as a shadcn `Card` containing Exception Details, Documents, Actions, and Agent History sections
- [ ] WHILE any line item remains `pending` THE SYSTEM SHALL disable Initiate Recovery and Approve with Override buttons with a `text-muted-foreground` hint "Review all line items above to unlock actions"
- [ ] IF any line item is in `rejected` state THEN THE SYSTEM SHALL keep Approve with Override disabled
- [ ] WHEN a user changes the selected PO or Packing Slip document THE SYSTEM SHALL recalculate all line item flags via `sterisLineItemsByPO` / `sterisLineItemsByPS` lookups and fire a toast confirming recalculation

**Invoice status stepper**
- [ ] THE SYSTEM SHALL render the 4-step stepper (Pending Review → Waiting on Correction → Escalated to Manager → Approved) using semantic theme tokens — past steps use `bg-success`, active step uses `bg-primary`, future steps use `bg-muted`
- [ ] THE SYSTEM SHALL render connecting lines between steps with `bg-success` for completed segments and `bg-border` for pending segments

**Compliance and safety**
- [ ] THE SYSTEM SHALL display `LegalDisclaimerDialog` before every action that commits the organization (Agree, Disagree, Block, Approve, Escalate, Recover, Dismiss)
- [ ] THE SYSTEM SHALL render the AI Recommendation card with an inline confidence score (e.g., "AI confidence 98.7%") — never without
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on all interactive elements (shadcn `Button` / `Badge` / `Dialog` / `Select` provide these natively; collapsible group headers render as `Button variant="ghost"`)
- [ ] THE SYSTEM SHALL color status text with AA-safe tokens — `text-destructive` for critical, `text-warning-text` for amber, `text-success-text` for emerald — never `text-red-400` / `text-amber-600` / `text-emerald-600` raw scales
- [ ] THE SYSTEM SHALL render a single document-outline heading hierarchy per template — `<h1>` for the exception title, `<h2>` for each major region (Three-Way Match Analysis, Exception Details, Documents, Actions), `<h3>` for sub-regions and dialog titles
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable all expand/collapse and entrance animations (CSS transitions are disabled by the `globals.css` reduced-motion block)

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

### Page padding

All templates use `px-4 lg:px-6` for horizontal page padding (shadcn standard; replaces v1 `px-8` / `mx-8`). The page root is a `<main className="min-h-screen bg-background">` content region (the sidebar shell is supplied by `app/layout.tsx`).

### Breadcrumb (pt-6, px-4 lg:px-6)
- shadcn `Button variant="ghost" size="sm"` "Back" using `router.back()`

### Header (px-4 lg:px-6, pt-3 pb-6)
- Badge row: Exception ID (`font-mono text-xs text-muted-foreground`), type `Badge` (`variant="outline"` styled with `text-warning border-warning`), status `Badge` (`variant="outline"` styled with `text-warning border-warning`), `CategoryBadge` ("Sterilization", InvoiceIQ-specific component retained)
- Title: vendor name "Steris Corporation" (`text-2xl font-semibold`)
- Subtitle: Invoice number, date, PO number (`text-sm text-muted-foreground`)

### Alert Bar (mx-4 lg:mx-6, mb-6)
- shadcn `Alert variant="destructive"` (uses `--destructive` token); left border emphasis via Tailwind `border-l-4 border-destructive bg-destructive/10`
- Dynamic text: "{N} discrepancies detected — $4,600 flagged this invoice • recurrence • AI confidence 98.7%"

### Escalation Banner (mx-4 lg:mx-6)
- `EscalationBanner` component (InvoiceIQ-specific, retained) — styled with `bg-warning/10 border-warning` per v2.0 Warning override

### Two-Column Layout (px-4 lg:px-6, pb-6, grid-cols-1 lg:grid-cols-[1fr_280px] gap-6)

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
- **Pending**: shadcn `Button variant="default"` "Agree" (Check icon) + `Button variant="destructive"` "Disagree" (X icon)
- **Agreed**: shadcn `Badge` styled `bg-success text-success-foreground` "Agreed" with Check icon + `Button variant="ghost" size="sm"` "undo"
- **Disagreed**: shadcn `Badge variant="destructive"` "Disagreed" with X icon + `Button variant="ghost" size="sm"` "undo"
- Each action triggers `LegalDisclaimerDialog` (shadcn `Dialog`) FIRST, then executes
- Disagree additionally opens an "Override Automated Determination" shadcn `Dialog` requiring justification `Textarea`

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
- **Row background**: price-flagged items get `bg-destructive/5`, qty/unit/description-flagged items get `bg-warning/5` (uses v2.0 destructive/warning tokens with Tailwind opacity)
- **Reject reasons**: predefined list of 7 compliance-appropriate justifications plus "Other"
- **Recovery initiation**: creates entry in recovery queue via `addToRecoveryQueue()`, updates exception status to "under_review"
- **Invoice status transitions**: pending_review -> waiting_correction (after recovery) or waiting_manager (after escalation) or approved_override (after override)

### Known Data Integrity Issue (audit DI-1)

The 2026-05-21 UI/UX audit flagged EX-006 (STC-2026-19847, the Parkland demo invoice): the on-page three-way match computes a `+$200` variance from `sterisLineItems`, while the alert bar, escalation banner, and recovery modal all assert `$4,600` (the quarterly recurrence figure) and the override modal asserts `$27,750` (the invoice total). The three figures have no on-screen bridge and the alert bar copy ("$4,600 flagged this invoice") is factually wrong — `$4,600` is the cumulative quarterly recurrence, not the per-invoice flag. **Resolving this requires correcting the mock figures in `lib/data.ts` and is out of scope for the v2.0 token migration** (the migration must not change `lib/data.ts`). The v2.0 migration keeps the existing copy faithful; DI-1 is tracked separately for the data-integrity pass. The alert-bar wording is left as-is pending that pass.

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

Use affirmative phrasing per SpecLayer v1.1.

- **Require explicit human Agree/Disagree on every flagged line item** — Reason: every flagged invoice needs human judgment; auto-approval bypasses the legal disclaimer and creates compliance liability.
- **Route every commit action through `LegalDisclaimerDialog`** — Reason: regulatory requirement; the disclaimer protects the organization from unauthorized financial commitments.
- **Display the AI recommendation's confidence score inline with the recommendation** — Reason: users must know how certain the AI is; a 95% confidence recommendation is very different from a 60% one.
- **Restrict escalated-exception resolution to managers, not the originating analyst** — Reason: escalation exists because the decision needs higher authority; same-analyst resolution defeats the purpose.
- **Surface vendor contact information only in the recovery workflow, not the exception detail** — Reason: exception review is about invoice data; vendor communication belongs downstream.
- **Use shadcn `Dialog` for `LegalDisclaimerDialog`, Override modal, Recovery modal, Escalation modal** — Reason: custom modal implementations diverge in focus trap and keyboard handling; Radix-backed `Dialog` is accessible by default.
- **Use shadcn `Button variant="default" | "destructive" | "outline" | "ghost"` for all action buttons** — Reason: deprecates ad-hoc styled buttons; ensures consistent disabled, hover, and focus states.
- **Use shadcn `Badge` for type, status, and category indicators (via `variant` or theme-colored styling)** — Reason: deprecates `.badge.*` utility classes from ui-standard.md v1.
- **Use theme tokens (`bg-card`, `text-foreground`, `text-destructive`, `text-warning`, `text-success`, `bg-destructive/5`, `bg-warning/5`) for all surfaces and emphasis colors** — Reason: hex tokens (`bg-red-50`, `bg-amber-50`, `--critical`, `--warning`) removed in v2.0.

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
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system per ui-standard.md v2.0. App shell wraps in SidebarProvider+SidebarInset. Alert bar → shadcn `Alert variant="destructive"`. Discrepancy groups → collapsible shadcn `Card`. Agree/Disagree → shadcn `Button` (default/destructive/ghost variants) + `Badge` for resolved states. All modals (LegalDisclaimer, Override, Recovery, Escalation) → shadcn `Dialog`. Row backgrounds → `bg-destructive/5` and `bg-warning/5` (Tailwind opacity on v2 tokens). Invoice status stepper retokenized to semantic theme colors (success/primary/muted). Added 23 EARS Acceptance Criteria covering app shell, template routing, three-way match, agree/disagree actions, action panel, status stepper, compliance/safety. Forbidden Patterns rewritten in affirmative form per SpecLayer v1.1. -->
<!-- 2026-05-22 v2.0 (cluster 1): Reconciled spec with v2.0 reality before migrating app/exceptions/[id]/page.tsx. (1) App shell criterion corrected — the page renders a `<main>` content region; the SidebarProvider/SidebarInset/AppSidebar shell is supplied by app/layout.tsx, not the page. (2) Added page-padding rule (`px-4 lg:px-6`, replaces v1 `px-8`/`mx-8`). (3) Added AA-safe status-text criterion (`text-destructive`/`text-warning-text`/`text-success-text` — never `text-red-400`/`text-amber-600`/`text-emerald-600`) per audit DI-3. (4) Added document-outline heading criterion (`<h1>`/`<h2>`/`<h3>`). (5) Dark-mode criterion now enumerates all 9 templates. (6) Documented audit DI-1 (EX-006 three non-reconciling amounts) as a known data-integrity issue out of scope for the token migration — fixing it touches `lib/data.ts`. Code migration: all v1 `var(--*)` tokens → shadcn theme tokens; `.card`→`Card`, `.data-table`→`Table`, `.badge.*`→`Badge`, raw `<button>`→`Button`, `.alert-bar`→`Alert`, hand-rolled `fixed inset-0` modals → shadcn `Dialog`; ChevronDown collapsible headers → `Button variant="ghost"`. -->
<!-- DI-1 (open, data-integrity pass): EX-006 alert bar / escalation banner / recovery modal assert $4,600, override modal asserts $27,750, on-page three-way match computes +$200 — three figures, no on-screen bridge. Fix requires correcting lib/data.ts mock figures. -->
