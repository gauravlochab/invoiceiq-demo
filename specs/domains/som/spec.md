# Suspicious Order Monitoring (SOM) -- Specification

## Overview

The SOM module implements DEA-compliant suspicious order monitoring for drug distributors. It provides a complete workflow for reviewing incoming controlled substance orders: a queue dashboard with pharmacy risk scoring, an automated 4-check verification pipeline per order, SOM-specific exceptions, a pharmacy risk-scoring directory, a manufacturer contract-pricing reference, and override/audit capabilities for blocked orders. This is a separate vertical from the AP (accounts payable) exception flow, with vocabulary tuned for the drug distribution context ("Pharmacy" instead of "Vendor", "Order" instead of "Invoice").

## Acceptance Criteria

EARS notation. Applies across all 6 SOM pages.

**Design system (v2.0 shadcn)**
- [ ] THE SYSTEM SHALL use shadcn theme tokens for all SOM surfaces, text, and borders — `bg-background`/`bg-card`/`bg-muted`, `text-foreground`/`text-muted-foreground`, `border-border`, `destructive`, `primary` — with zero v1 `var(--*)` tokens and zero raw hex
- [ ] THE SYSTEM SHALL color status text with the AA-safe `text-destructive` / `text-warning-text` / `text-success-text` tokens — `--warning` / `--success` are reserved for fills, dots, and borders only (per `ui-standard.md` v2.0.1)
- [ ] THE SYSTEM SHALL render every surface, table, badge, action button, modal, and filter chip with shadcn `Card` / `Table` / `Badge` / `Button` / `Dialog` / `ToggleGroup` primitives
- [ ] THE SYSTEM SHALL expose `aria-sort` on every sortable table header and maintain a real `<h1>`/`<h2>`/`<h3>` document outline
- [ ] THE SYSTEM SHALL use page padding `px-4 lg:px-6`

**App shell**
- [ ] THE SYSTEM SHALL render all SOM pages inside `SidebarProvider` + `SidebarInset` with `AppSidebar` and `SiteHeader`
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens

**Queue dashboard (`/som`)**
- [ ] THE SYSTEM SHALL render 4 stat cards using shadcn `Card` with `CardHeader`/`CardDescription`/`CardTitle`/`CardFooter`: Orders in queue, Auto-blocked (`text-destructive`), Flagged this batch (`text-warning-text`), Blocked exposure (`text-destructive`)
- [ ] THE SYSTEM SHALL render the orders table using shadcn `Table` primitives wrapped in a shadcn `Card` + `CardContent`, with 9 columns: Order, Pharmacy, Location, Score, Lines, Controlled, Value, Received, Action
- [ ] WHEN a pharmacy score is below `BLOCK_THRESHOLD` (60) THE SYSTEM SHALL tint the row `bg-destructive/5` and render "Override required" `Button variant="destructive"` in the Action column
- [ ] WHEN a pharmacy score is >= 60 THE SYSTEM SHALL render "Run checks" as a shadcn `Button variant="ghost"` link to `/som/order/{id}`
- [ ] WHEN a user clicks "Override required" THE SYSTEM SHALL open `OverrideModal` (shadcn `Dialog`) requiring justification `Textarea` + approver name `Input` + approver role `Select`
- [ ] WHEN the override is submitted THE SYSTEM SHALL append an audit entry via `appendAuditEntry()`, fire a toast, and transition the row to "Released after override" with `text-success`

**Order verification runner (`/som/order/[id]`)**
- [ ] WHEN the page mounts THE SYSTEM SHALL auto-run the 4-check verification pipeline (Address, License, Price, Pattern) exactly once via `hasAutoStarted` ref
- [ ] THE SYSTEM SHALL render each TaskCard as a shadcn `Card` with numbered circle, status icon, and `Badge` showing "Verified" (`bg-success/10 text-success-text border-success`), "Review" (`bg-warning/10 text-warning-text border-warning`), "Failed" (`variant="destructive"`), or "Error" (`variant="secondary"`)
- [ ] WHILE a task is in `running` state THE SYSTEM SHALL overlay `BorderBeam` animation and a "Running" label
- [ ] THE SYSTEM SHALL render decision buttons using shadcn `Button` variants in the Decision Row: Approve (`variant="default"`), Hold (`variant="outline"`), Escalate (`variant="outline"`)
- [ ] IF the overall status is `fail` THEN THE SYSTEM SHALL disable the Approve button
- [ ] THE SYSTEM SHALL render the right column (Order Summary + Line Items) as stacked shadcn `Card` instances with `lg:sticky lg:top-4`

**SOM exceptions list (`/som/exceptions`)**
- [ ] THE SYSTEM SHALL display only exceptions where `type.startsWith("som_")`
- [ ] THE SYSTEM SHALL render the 4-panel summary strip in a shadcn `Card` with `divide-x divide-border`: Total exceptions, Open / Under Review (`text-warning-text`), Critical (`text-destructive`), Total flagged $ (`text-destructive`)
- [ ] THE SYSTEM SHALL render filter chips using shadcn `ToggleGroup type="single"` with `ToggleGroupItem` for each filter (All, Open, Critical, High, Address Mismatch, License Invalid, Price Deviation, Volume Outlier)
- [ ] WHEN a filter chip's count is 0 THE SYSTEM SHALL disable that `ToggleGroupItem`
- [ ] THE SYSTEM SHALL render the exceptions table using shadcn `Table` primitives wrapped in a shadcn `Card`, with 9 columns: Exception, Type, Pharmacy (NOT "Vendor"), Order # (NOT "Invoice #"), Flagged, Severity, Status, Detected, Action
- [ ] THE SYSTEM SHALL render Type badges using shadcn `Badge`: `variant="destructive"` for license_invalid/quantity_outlier, `bg-warning/10 text-warning-text border-warning` for address_mismatch/price_deviation

**Pharmacy risk scoring (`/som/pharmacy-scoring`)**
- [ ] THE SYSTEM SHALL render the 4-panel summary strip in a shadcn `Card` with `divide-x divide-border`: Pharmacies scored, High / Critical risk (`text-destructive`), Total flagged $ (`text-warning-text`), Avg risk score (score-color-mapped)
- [ ] THE SYSTEM SHALL render the pharmacy directory as a shadcn `Table` wrapped in a shadcn `Card`, with sortable Score / Spend / Flagged $ / Flagged % headers exposing `aria-sort`, and expandable rows
- [ ] WHEN a pharmacy row is expanded THE SYSTEM SHALL show a score-component breakdown (License/Address/Price/Pattern/Identity) using a token-driven meter with `role="progressbar"` + ARIA values, and a shadcn `Table` of that pharmacy's SOM exception history
- [ ] THE SYSTEM SHALL render flag / penalize / remove actions as shadcn `Button` instances (`variant="outline"` / `variant="destructive"`)

**Manufacturer contract pricing (`/som/manufacturers`)**
- [ ] THE SYSTEM SHALL render one shadcn `Card` per manufacturer, each containing a shadcn `Table` with 6 columns: NDC, Product, Form, Contract price, Tolerance, Risk
- [ ] THE SYSTEM SHALL render the Risk column with shadcn `Badge`: `bg-warning/10 text-warning-text border-warning` "Controlled", `variant="secondary"` "High-risk", `text-muted-foreground` "Standard"

**Override audit log (`/som/audit-log`)**
- [ ] THE SYSTEM SHALL render the 4-panel summary strip in a shadcn `Card` with `divide-x divide-border`: Total overrides, Released at Critical (`text-destructive`), Unique pharmacies, Unique approvers
- [ ] THE SYSTEM SHALL render each override entry as a shadcn `Card` with rating `Badge`, full justification block, approver identity, and timestamp
- [ ] THE SYSTEM SHALL treat the audit log as append-only and re-read `getAuditLog()` on every mount so override-modal entries appear

**Loading and safety**
- [ ] WHEN any SOM page mounts THE SYSTEM SHALL display shadcn `Skeleton` placeholders for 400ms before real content
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable BorderBeam, spinner, and chart entrance animations
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on all interactive elements
- [ ] THE SYSTEM SHALL keep DEA-required language and "Pharmacy"/"Order" vocabulary throughout — never substitute "Vendor"/"Invoice"

## Pages

The SOM module spans six pages:
1. `/som` -- Incoming order queue (main dashboard)
2. `/som/order/[id]` -- Single order verification pipeline runner
3. `/som/exceptions` -- SOM-scoped exception list
4. `/som/pharmacy-scoring` -- Pharmacy risk-scoring directory (expandable rows)
5. `/som/manufacturers` -- Manufacturer contract-pricing reference
6. `/som/audit-log` -- Override audit trail (compliance record)

---

## Page 1: SOM Queue Dashboard (`/som/page.tsx`)

### Layout (v2.0)

Renders inside `SidebarProvider` + `SidebarInset`.

**Header** (px-4 lg:px-6, pt-6 pb-4)
- `ShieldAlert` icon + label `text-xs uppercase text-primary` "Drug Distributor • SOM Analyst"
- Title `text-2xl font-semibold` "Suspicious Order Monitoring"
- Subtitle `text-sm text-muted-foreground`: "Incoming orders pending verification — Address, License, Pricing, Pattern checks. High/Critical-risk pharmacies require override."

**Stats Strip** (px-4 lg:px-6, py-4, container-query `@container/main` grid: `grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 gap-4`)
- 4 shadcn `Card` metric panels (CardHeader/CardDescription/CardTitle/CardFooter pattern):
  1. **Orders in queue** (Activity icon) — `orders.length` (aliased from `sampleOrders` import), subtitle: "{controlledCount} with controlled substances"
  2. **Auto-blocked** (Lock icon) — count of orders with pharmacy score < 60, `CardTitle` in `text-destructive`, subtitle: "awaiting human override"
  3. **Flagged this batch** (ShieldCheck icon) — percentage of orders with SOM exceptions, `CardTitle` in `text-warning`, subtitle: "{flaggedCount} of {total} orders flagged"
  4. **Blocked exposure** (DollarSign icon) — sum of flagged amounts from SOM exceptions, `CardTitle` in `text-destructive`, subtitle: "across {count} SOM exceptions"

**Orders Table** (px-4 lg:px-6, pb-6)
- Shadcn `Card` with `CardHeader`: `CardTitle` "Incoming orders" + `CardAction` `text-sm text-muted-foreground` "High/Critical pharmacies require human override"
- `CardContent` containing shadcn `Table` with 9 columns:
  1. **Order** — order ID (`font-mono text-sm`), status label below ("Fresh • just arrived" in `text-success`, or "Auto-blocked" in `text-destructive` with Lock icon)
  2. **Pharmacy** — Pill icon + pharmacy name
  3. **Location** — MapPin icon + city, state (`text-muted-foreground`)
  4. **Score** — `ScoreCell` component: score/100 (color-coded per Score Color rules) + rating `Badge` (`text-xs uppercase`)
  5. **Lines** — line item count, `tabular-nums`
  6. **Controlled** — shadcn `Badge` styled `bg-warning/10 text-warning border-warning` "Yes" if any line item is controlled, `text-muted-foreground` "No" otherwise
  7. **Value** — right-aligned, `tabular-nums`, formatted currency
  8. **Received** — Clock icon + formatted timestamp
  9. **Action** — `ActionCell` component with 3 states:
     - Score >= 60 (not blocked): shadcn `Button variant="ghost" size="sm"` "Run checks" link to `/som/order/{id}`
     - Score < 60 (blocked, no override): shadcn `Button variant="destructive" size="sm"` "Override required"
     - After override: `text-success` "Released after override" + link to audit log

- Blocked rows have `bg-destructive/5` background tint

### Business Rules

- **Block threshold**: `BLOCK_THRESHOLD = 60` — pharmacies with risk score < 60 are auto-blocked
- **Score color mapping (v2.0.1)**: `text-destructive` < 30, `text-warning-text` < 60, `text-primary` < 80, `text-success-text` >= 80 — AA-safe text tokens, since score values render as text
- **Rating labels**: "Critical", "High Risk", "Medium Risk", "Low Risk" (from `pharmacyScores` data)
- **Override flow**: clicking "Override required" opens `OverrideModal` (shadcn `Dialog`) requiring justification `Textarea` + approver name `Input` + approver role `Select`; creates audit log entry via `appendAuditEntry()`; toast notification with override details
- **Override state**: tracked in component state (`overriddenOrders`), resets on page refresh
- **SOM exceptions**: filtered from `exceptions` where `type.startsWith("som_")`
- **Flagged order identification**: orders whose invoice numbers appear in SOM exceptions

### Data Model

- **Source files**: `lib/som/data/orders.ts` (sampleOrders), `lib/som/data/pharmacyScoring.ts` (pharmacyScores), `lib/som/data/auditLog.ts` (appendAuditEntry, AuditLogEntry), `lib/data.ts` (exceptions)
- **Key interfaces**:
  - `Order`: id, pharmacy (id, name, address, city, state, permitNumber, npi), lineItems (ndc, description, quantity, unitPrice, isControlled), totalAmount, receivedAt, isFresh
  - `PharmacyScore`: id, score, rating
  - `AuditLogEntry`: id, orderId, pharmacyId, pharmacyName, scoreAtOverride, ratingAtOverride, justification, approverName, approverRole
- **Components**: OverrideModal

---

## Page 2: Order Verification Runner (`/som/order/[id]/page.tsx`)

### Layout (v2.0)

Renders inside `SidebarProvider` + `SidebarInset`.

**Breadcrumb** (pt-6, px-4 lg:px-6)
- Shadcn `Button variant="ghost" size="sm"` "Back to SOM queue" navigating to `/som`

**Header** (px-4 lg:px-6, pt-3 pb-4)
- Order ID (`font-mono text-xs text-muted-foreground`) + `ShieldAlert` icon + label `text-xs uppercase text-primary` "SOM workflow"
- Controlled substance shadcn `Badge` styled `bg-warning/10 text-warning border-warning` if applicable
- Pharmacy name `text-2xl font-semibold`
- Address, line item count, total amount in `text-sm text-muted-foreground`

**Two-Column Layout** (px-4 lg:px-6, pb-6, `grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5`)

**LEFT: Verification Pipeline**
- Section label `text-sm font-semibold` "Verification pipeline" with shadcn `Button variant="outline" size="sm"` "Re-run pipeline"
- 4 TaskCards (shadcn `Card`) — auto-run on mount:
  1. **Verify Address** (MapPin icon) — checks pharmacy address against database and geocode distance
  2. **Verify License** (ScrollText icon) — checks state board permit and NPI registry
  3. **Check Price Deviation** (DollarSign icon) — compares ordered prices against contract prices
  4. **Detect Pattern Outlier** (BarChart3 icon) — 5 sub-checks: demographics, population, history, quota, raw_material

Each `TaskCard` shows (v2.0 theme tokens):
- Numbered circle with status icon (Check/X/AlertTriangle/Loader2/number)
- Task title and description
- Shadcn `Badge`: "Verified" (`bg-success/10 text-success-text border-success`), "Review" (`bg-warning/10 text-warning-text border-warning`), "Failed" (`variant="destructive"`), "Error" (`variant="secondary"`)
- Running state: `BorderBeam` animation around the card + "Running" label
- Evidence panel specific to each task type:
  - Address: database source + geocoded distance (with Google Maps link)
  - License: state board record + NPI registry status (with portal link)
  - Price: shadcn `Table` (Product, Ordered, Contract, Delta %)
  - Pattern: sub-check rows with dot + label + status + message

**Decision Row** (shadcn `Card`, p-5, mt-2)
- "Analyst decision" label + overall status `Badge`
- 3 shadcn `Button` decision buttons (disabled until all checks complete):
  - **Approve** (`variant="default"`) — disabled if any check failed
  - **Hold** (`variant="outline"`) — always available when done
  - **Escalate** (`variant="outline"`) — always available when done
- After decision: shadcn `Alert` confirmation styled per chosen action (`bg-success/10 border-success` / `bg-warning/10 border-warning` / `bg-primary/5 border-primary`)

**RIGHT: Order Summary** (`lg:sticky lg:top-4`)
- Order details shadcn `Card`: Order ID, Received timestamp, Permit on file, NPI on file, Total
- Line items shadcn `Card`: list of items with description, NDC, quantity × unit price, `Badge bg-warning/10 text-warning border-warning` "Controlled" if applicable

### Business Rules

- **Auto-run**: workflow starts automatically on mount (only once via `hasAutoStarted` ref)
- **Task execution**: sequential via `runSuspiciousOrderMonitoring()` with callback for state updates
- **Overall status**: derived from worst individual task result (fail > warn > pass)
- **Approve blocked**: cannot approve if overall status is "fail"
- **Decision persistence**: component state only, resets on page refresh
- **Re-run**: re-runs all 4 checks from scratch, clears decision state
- **Price deviation tolerance**: evidence includes tolerance percentage per product
- **Pattern sub-checks**: 5 independent checks each with pass/warn/fail/error status

### Data Model

- **Source files**: `lib/som/data/orders.ts` (findOrderById), `lib/som/workflows/suspiciousOrderMonitoring.ts` (runSuspiciousOrderMonitoring, suspiciousOrderMonitoring), `lib/som/types.ts` (TaskRunState, WorkflowRunState, TaskStatus)
- **Components**: BorderBeam (magicui)

---

## Page 3: SOM Exceptions (`/som/exceptions/page.tsx`)

### Layout (v2.0)

Renders inside `SidebarProvider` + `SidebarInset`.

**Header** (px-4 lg:px-6, pt-6 pb-4)
- `ShieldAlert` icon + label `text-xs uppercase text-primary` "Drug Distributor • SOM"
- Title `text-2xl font-semibold` "Exceptions"
- Subtitle `text-sm text-muted-foreground`: "{count} suspicious-order exceptions across {pharmacyCount} pharmacies"

**Summary Strip** (px-4 lg:px-6, py-4)
- Shadcn `Card` containing 4-panel `flex` row with `divide-x divide-border` per Acceptance Criteria

**Filter Chips** (px-4 lg:px-6, pb-3)
- Shadcn `ToggleGroup type="single"` with `ToggleGroupItem` for each filter (All, Open, Critical, High, Address Mismatch, License Invalid, Price Deviation, Volume Outlier)
- Each item shows label + count `Badge variant="secondary"` for live counts
- Active item uses `data-[state=on]:bg-accent`
- `ToggleGroupItem` is disabled when its count is 0

**Table** (px-4 lg:px-6, pb-6)
- Shadcn `Card` + `CardContent` containing shadcn `Table` with 9 columns:
  1. **Exception** — ID (`font-mono text-sm`)
  2. **Type** — shadcn `Badge` per Acceptance Criteria (`variant="destructive"` or `bg-warning/10 text-warning border-warning`)
  3. **Pharmacy** — MapPin icon + pharmacy name (NOT "Vendor")
  4. **Order #** — `font-mono text-sm` (NOT "Invoice #")
  5. **Flagged** — sortable, right-aligned, `tabular-nums`, color-coded by severity (`text-destructive` / `text-warning` / `text-foreground`)
  6. **Severity** — dot (`size-1.5 rounded-full`) + label
  7. **Status** — shadcn `Badge` (`variant="destructive"` for Open, `variant="outline"` for Under Review, `variant="secondary"` for Escalated, `bg-success/10 text-success border-success` for Resolved)
  8. **Detected** — sortable, formatted date `text-muted-foreground`
  9. **Action** — shadcn `Button variant="ghost" size="sm"` "Review" link to `/exceptions/{id}`

### Business Rules

- **SOM filtering**: only shows exceptions where `type.startsWith("som_")`
- **Type labels**: som_address_mismatch="Address Mismatch", som_license_invalid="License Invalid", som_price_deviation="Price Deviation", som_quantity_outlier="Volume Outlier"
- **Type badge colors**: license_invalid/quantity_outlier = critical, address_mismatch/price_deviation = warning
- **Sort options**: flaggedAmount (desc default), detectedAt (desc default)
- **Filter logic**: "Open" includes open, under_review, escalated statuses
- **Deep link**: "Review" links to `/exceptions/{id}` which routes SOM exception IDs to `SOMExceptionDetail` template
- **Empty state**: "No exceptions match this filter." centered message
- **Vocabulary**: "Pharmacy" column, "Order #" column (drug distributor context, not hospital AP)

### Data Model

- **Source files**: `lib/data.ts` (exceptions, formatCurrency, formatDate, Severity, Status)
- **SOM type constants**: som_address_mismatch, som_license_invalid, som_price_deviation, som_quantity_outlier
- **State**: filter (FilterKey), sortKey, sortDir

---

## Page 4: Pharmacy Risk Scoring (`/som/pharmacy-scoring/page.tsx`)

### Layout (v2.0)

Renders inside `SidebarProvider` + `SidebarInset`. SOM analog of `/vendor-scoring`.

**Header** (px-4 lg:px-6, pt-6 pb-4)
- `ShieldAlert` icon + label `text-xs uppercase text-primary` "Drug Distributor • SOM"
- Title `text-2xl font-semibold` "Pharmacy Risk Scoring"
- Subtitle `text-sm text-muted-foreground` + shadcn `Button variant="outline" size="sm"` "Export Report"

**Summary Strip** (px-4 lg:px-6, py-4)
- Shadcn `Card` with a 4-panel `flex` row, `divide-x divide-border`: Pharmacies scored, High / Critical risk (`text-destructive`), Total flagged $ (`text-warning-text`), Avg risk score (score-color-mapped). Skeleton placeholders for 400ms on mount.

**Pharmacy Table** (px-4 lg:px-6, pb-6)
- Shadcn `Card` + `CardContent` containing shadcn `Table` with columns: expander, Pharmacy, Location, Score (sortable), Rating, Spend (sortable), Flagged $ (sortable), Flagged % (sortable), Action
- Sortable headers expose `aria-sort`; rows below score 60 tinted `bg-destructive/5`
- Expandable row: score-component breakdown — five token-driven meters (`role="progressbar"`, `aria-valuenow/min/max`) for License/Address/Price/Pattern/Identity — plus a shadcn `Table` of exception history. Each meter's fill colour is score-mapped (`bg-destructive`/`bg-warning`/`bg-primary`/`bg-success`).
- Action column: flag (`Button variant="outline"`), penalize + remove (`Button variant="destructive"`); after action, a `text-warning-text`/`text-destructive` confirmation label

### Business Rules

- **Score color mapping**: same as Page 1 — `text-destructive` < 30, `text-warning-text` < 60, `text-primary` < 80, `text-success-text` >= 80
- **Sort default**: score ascending (lowest = highest risk on top); `$`-valued columns sort descending first
- **Actions**: flag / penalize / remove are session-state only, reset on refresh

### Data Model

- **Source files**: `lib/som/data/pharmacyScoring.ts` (`pharmacyScores`, `PharmacyScore`), `lib/data.ts` (`formatCurrency`)
- `PharmacyScore`: id, name, city, state, score, rating, totalSpend, flaggedAmount, flaggedPct, components (license/address/price/volume/identity), exceptions[]

---

## Page 5: Manufacturer Contract Pricing (`/som/manufacturers/page.tsx`)

### Layout (v2.0)

Renders inside `SidebarProvider` + `SidebarInset`. Reference table for the Price Deviation check.

**Header** (px-4 lg:px-6, pt-6 pb-4)
- `Pill` icon + label `text-xs uppercase text-primary` "Drug Distributor • Contract pricing"
- Title `text-2xl font-semibold` "Manufacturers"
- Subtitle `text-sm text-muted-foreground`

**Manufacturer Cards** (px-4 lg:px-6, py-4, `flex flex-col gap-4`)
- One shadcn `Card` per manufacturer, with `CardHeader` (`CardTitle` = manufacturer name + NDC count via `CardAction`) and `CardContent` containing a shadcn `Table` with 6 columns: NDC, Product, Form, Contract price (right-aligned `tabular-nums`), Tolerance (right-aligned), Risk
- Risk column: shadcn `Badge` `bg-warning/10 text-warning-text border-warning` "Controlled", `variant="secondary"` "High-risk", `text-muted-foreground` "Standard"

### Data Model

- **Source files**: `lib/som/data/manufacturerPricing.ts` (`manufacturerPricing`)

---

## Page 6: Override Audit Log (`/som/audit-log/page.tsx`)

### Layout (v2.0)

Renders inside `SidebarProvider` + `SidebarInset`. The DEA compliance trail for block overrides.

**Header** (px-4 lg:px-6, pt-6 pb-4)
- `FileCheck2` icon + label `text-xs uppercase text-primary` "Drug Distributor • Compliance Trail"
- Title `text-2xl font-semibold` "Override Audit Log"
- Subtitle `text-sm text-muted-foreground`

**Summary Strip** (px-4 lg:px-6, py-4)
- Shadcn `Card` with a 4-panel `flex` row, `divide-x divide-border`: Total overrides, Released at Critical (`text-destructive`), Unique pharmacies, Unique approvers

**Entry List** (px-4 lg:px-6, pb-6, `flex flex-col gap-3`)
- One shadcn `Card` per entry: header row with entry ID (`font-mono`), rating `Badge`, pharmacy name `<h3>` + order ID, and score-at-override; a justification block (`bg-muted` with `border-l-2 border-primary`); footer row with approver identity + timestamp
- Empty state: shadcn `Card` with centered "No override entries yet." message

### Business Rules

- **Append-only**: the audit log is never edited or deleted (DEA requirement). The page re-reads `getAuditLog()` on every mount so entries added via the override modal appear when the analyst navigates back.
- **Rating colors**: Critical `text-destructive`, High Risk `text-warning-text`, Medium Risk `text-primary`

### Data Model

- **Source files**: `lib/som/data/auditLog.ts` (`getAuditLog`, `AuditLogEntry`)

---

## Workflow (Cross-Page)

1. SOM analyst opens `/som` -- 400ms simulated loading with skeleton placeholders for stats strip (4 metric cards) and orders table (header + 5 skeleton rows)
2. After loading, reviews stats strip: orders in queue, auto-blocked count, flagged %, blocked exposure
3. For low-risk pharmacies (score >= 60): clicks "Run checks" to navigate to `/som/order/{id}`
4. Verification pipeline auto-runs 4 checks with animated progress
5. After all checks complete: makes Approve/Hold/Escalate decision
6. For high-risk pharmacies (score < 60): clicks "Override required", enters justification and approver in modal
7. Override creates audit log entry, row transitions to "Released after override"
8. SOM exceptions appear at `/som/exceptions` with SOM-specific filtering and vocabulary
9. "Review" from exceptions page navigates to `/exceptions/{id}` for full SOM exception detail

## State Machine

### Order Verification States
```
pending ──→ running ──→ passed
                │
                ├──→ flagged ──→ under_review ──→ cleared
                │                      │
                │                      └──→ reported
                └──→ error
```

| From | To | Trigger | Actor |
|------|----|---------|-------|
| pending | running | Verification runner starts processing the order | System |
| running | passed | All checks pass, no suspicious indicators | System |
| running | flagged | One or more suspicious indicators detected | System |
| running | error | Verification process fails (data unavailable, timeout) | System |
| flagged | under_review | Analyst opens the flagged order for review | User |
| under_review | cleared | Analyst determines order is legitimate | User |
| under_review | reported | Analyst reports to DEA or internal compliance | User |

Terminal states: `passed`, `cleared`, `reported`. DEA reporting is irreversible.

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Dashboard | feeds into | Suspicious order counts and DEA compliance stats on dashboard |
| Exceptions | feeds into | Flagged orders create SOM-specific exceptions |
| Pipeline | reads from | Pipeline agents may flag controlled substance invoices for SOM review |
| Vendor Scoring | feeds into | SOM flags influence vendor risk scores for controlled substance distributors |

## Forbidden Patterns

Use affirmative phrasing per SpecLayer v1.1.

- **Require explicit human review on every flagged controlled substance order** — Reason: DEA regulations require human review; auto-clearing creates criminal liability.
- **Treat SOM audit log entries as append-only** — Reason: DEA requires complete audit trails for controlled substance monitoring; deletions trigger regulatory penalties.
- **Run the NPI verification step on every order before allowing approval** — Reason: NPI validation is a regulatory requirement for controlled substance transactions.
- **Operate on order-level data only (quantities, frequencies, pharmacy details) — never patient-level data** — Reason: HIPAA compliance.
- **Capture a written justification on every SOM exception resolution** — Reason: DEA auditors require justification for every cleared suspicious order; missing rationale = regulatory finding.
- **Use shadcn `Card`, `Table`, `Badge`, `Button`, `Dialog`, `ToggleGroup` primitives for all SOM surfaces, badges, action buttons, OverrideModal, and filter chips** — Reason: deprecates `.card`, `.data-table`, `.badge.*` utility classes and ad-hoc modals from v1.
- **Use theme tokens (`bg-card`, `text-destructive`, `text-warning`, `text-success`, `text-muted-foreground`, `bg-destructive/5`, `bg-warning/10`) for all surfaces, status text, and row tints** — Reason: hex tokens (`bg-red-50/40`, `--critical`, `--warning`, `--acl-primary`) removed in v2.0.
- **Keep "Pharmacy"/"Order" vocabulary throughout the SOM module — never substitute "Vendor"/"Invoice"** — Reason: DEA regulatory context; AP vocabulary breaks the drug-distributor framing.

## AJ Feedback (Parkland Demo)

"Pending -- no specific feedback yet"

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase — covers all 3 SOM pages -->
<!-- 2026-05-14: Added 400ms loading state with skeleton placeholders (stats strip + orders table); aliased sampleOrders to orders locally; removed "demo" from comments in audit-log and order detail pages -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system per ui-standard.md v2.0 across all 3 SOM pages (queue dashboard, order verification runner, exceptions list). App shell wraps in SidebarProvider+SidebarInset. All metric panels, tables, TaskCards, decision rows → shadcn `Card`. All tables → shadcn `Table` primitives. Status badges → shadcn `Badge` variants (destructive / styled warning / styled success / secondary). Action buttons → shadcn `Button` variants. OverrideModal → shadcn `Dialog`. Filter chips on `/som/exceptions` → shadcn `ToggleGroup`. Decision confirmation → shadcn `Alert` styled per outcome. Loading → `Skeleton`. Score color mapping retokenized: text-destructive (<30) / text-warning (<60) / text-primary (<80) / text-success (>=80). Blocked row tint → bg-destructive/5. All "Pharmacy" / "Order" vocabulary preserved per DEA context. Added 22 EARS Acceptance Criteria covering all 3 pages. Forbidden Patterns rewritten in affirmative form per SpecLayer v1.1. -->
<!-- 2026-05-22 v2.0.1: Spec-code reconciliation before the SOM design-system migration. (1) Spec covered only 3 of the 6 actual SOM routes — added Page 4 (pharmacy-scoring), Page 5 (manufacturers), Page 6 (audit-log) sections plus their Acceptance Criteria; "all 3 SOM pages" → "all 6 SOM pages". (2) Status-text tokens corrected per ui-standard.md v2.0.1: text-warning/text-success fail WCAG 1.4.3 as text — all status-TEXT references (stat cards, score color mapping, type badges, TaskCard badges, summary strips) now use the AA-safe text-warning-text/text-success-text; --warning/--success kept for fills/dots/borders. (3) Added a "Design system (v2.0 shadcn)" Acceptance Criteria group covering theme tokens, primitives, aria-sort, heading hierarchy, and px-4 lg:px-6 padding. Migration only — no SOM domain behavior (DEA controlled-substance compliance, suspicious-order logic, Pharmacy/Order vocabulary) changed. -->
