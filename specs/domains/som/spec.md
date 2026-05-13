# Suspicious Order Monitoring (SOM) -- Specification

## Overview

The SOM module implements DEA-compliant suspicious order monitoring for drug distributors. It provides a complete workflow for reviewing incoming controlled substance orders: a queue dashboard with pharmacy risk scoring, an automated 4-check verification pipeline per order, SOM-specific exceptions, and override/audit capabilities for blocked orders. This is a separate vertical from the AP (accounts payable) exception flow, with vocabulary tuned for the drug distribution context ("Pharmacy" instead of "Vendor", "Order" instead of "Invoice").

## Pages

The SOM module spans three pages:
1. `/som` -- Incoming order queue (main dashboard)
2. `/som/order/[id]` -- Single order verification pipeline runner
3. `/som/exceptions` -- SOM-scoped exception list

---

## Page 1: SOM Queue Dashboard (`/som/page.tsx`)

### Layout

**Header** (px-6 lg:px-8, pt-6 pb-5, white bg, border-b)
- ShieldAlert icon + label: "Drug Distributor . SOM Analyst" (11px uppercase, acl-primary)
- Title: "Suspicious Order Monitoring" (22px, semibold)
- Subtitle: "Incoming orders pending verification -- Address, License, Pricing, Pattern checks. High/Critical-risk pharmacies require override."

**Stats Strip** (px-6 lg:px-8, py-4, grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4)
- 4 metric cards:
  1. **Orders in queue** (Activity icon) -- `sampleOrders.length`, subtitle: "{controlledCount} with controlled substances"
  2. **Auto-blocked** (Lock icon) -- count of orders with pharmacy score < 60, red text, subtitle: "awaiting human override"
  3. **Flagged this batch** (ShieldCheck icon) -- percentage of orders with SOM exceptions, amber text, subtitle: "{flaggedCount} of {total} orders flagged"
  4. **Blocked exposure** (DollarSign icon) -- sum of flagged amounts from SOM exceptions, red text, subtitle: "across {count} SOM exceptions"

**Orders Table** (px-6 lg:px-8, pb-8)
- Card with header: "Incoming orders" (left), "High/Critical pharmacies require human override" note (right)
- `data-table` with 9 columns:
  1. **Order** -- order ID (mono), status label below ("Fresh . just arrived" in green, or "Auto-blocked" in red with Lock icon)
  2. **Pharmacy** -- Pill icon + pharmacy name
  3. **Location** -- MapPin icon + city, state
  4. **Score** -- `ScoreCell` component: score/100 (color-coded) + rating label (9px uppercase)
  5. **Lines** -- line item count
  6. **Controlled** -- "Yes" badge (warning) if any line item is controlled, "No" text otherwise
  7. **Value** -- right-aligned, formatted currency
  8. **Received** -- Clock icon + formatted timestamp
  9. **Action** -- `ActionCell` component with 3 states:
     - Score >= 60 (not blocked): "Run checks" link to `/som/order/{id}`
     - Score < 60 (blocked, no override): "Override required" red button
     - After override: "Released after override" green label + link to audit log

- Blocked rows have `bg-red-50/40` background tint

### Business Rules

- **Block threshold**: `BLOCK_THRESHOLD = 60` -- pharmacies with risk score < 60 are auto-blocked
- **Score color mapping**: <30 = red, <60 = amber, <80 = blue, >=80 = emerald
- **Rating labels**: "Critical", "High Risk", "Medium Risk", "Low Risk" (from `pharmacyScores` data)
- **Override flow**: clicking "Override required" opens `OverrideModal` component requiring justification text + approver name + approver role; creates audit log entry via `appendAuditEntry()`; toast notification with override details
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

### Layout

**Breadcrumb** (pt-6, px-6 lg:px-8)
- "Back to SOM queue" button navigating to `/som`

**Header** (px-6 lg:px-8, pt-3 pb-5)
- Order ID (mono) + ShieldAlert icon + "SOM workflow" label
- Controlled substance badge if applicable
- Pharmacy name (22px, semibold)
- Address, line item count, total amount

**Two-Column Layout** (px-6 lg:px-8, pb-8, grid-cols-1 lg:grid-cols-[1fr_320px] gap-5)

**LEFT: Verification Pipeline**
- Section label: "Verification pipeline" with "Re-run pipeline" button
- 4 task cards (auto-run on mount):
  1. **Verify Address** (MapPin icon) -- checks pharmacy address against database and geocode distance
  2. **Verify License** (ScrollText icon) -- checks state board permit and NPI registry
  3. **Check Price Deviation** (DollarSign icon) -- compares ordered prices against contract prices
  4. **Detect Pattern Outlier** (BarChart3 icon) -- 5 sub-checks: demographics, population, history, quota, raw_material

Each `TaskCard` shows:
- Numbered circle with status icon (Check/X/AlertTriangle/Loader2/number)
- Task title and description
- Status badge: "Verified" (emerald), "Review" (amber), "Failed" (red), "Error" (gray)
- Running state: `BorderBeam` animation around the card + "Running" label
- Evidence panel specific to each task type:
  - Address: database source + geocoded distance (with Google Maps link)
  - License: state board record + NPI registry status (with portal link)
  - Price: comparison table (Product, Ordered, Contract, Delta %)
  - Pattern: sub-check rows with dot + label + status + message

**Decision Row** (card, p-5, mt-2)
- "Analyst decision" label + overall status badge
- 3 decision buttons (disabled until all checks complete):
  - **Approve** (emerald outline) -- blocked if any check failed
  - **Hold** (amber outline) -- always available when done
  - **Escalate** (blue outline) -- always available when done
- After decision: colored confirmation card showing chosen action

**RIGHT: Order Summary** (sticky top-4)
- **Order details card**: Order ID, Received timestamp, Permit on file, NPI on file, Total
- **Line items card**: list of items with description, NDC, quantity x unit price, "Controlled" badge if applicable

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

### Layout

**Header** (px-6 lg:px-8, pt-8 pb-6)
- ShieldAlert icon + "Drug Distributor . SOM" label
- Title: "Exceptions"
- Subtitle: "{count} suspicious-order exceptions across {pharmacyCount} pharmacies"

**Summary Strip** (px-6 lg:px-8, py-6)
- 4-panel metric bar (same style as product-analysis):
  1. **Total exceptions** -- count
  2. **Open / Under Review** -- amber text
  3. **Critical** -- red text
  4. **Total flagged $** -- formatted currency, red text

**Filter Chips** (px-6 lg:px-8, pb-3)
- Rounded-full pill buttons with counts:
  - All, Open, Critical, High, Address Mismatch, License Invalid, Price Deviation, Volume Outlier
- Active chip: acl-primary bg, white text
- Disabled chips (count=0): muted, cursor-not-allowed, 60% opacity

**Table** (px-6 lg:px-8, pb-8)
- Card with `data-table`, 9 columns:
  1. **Exception** -- ID (mono)
  2. **Type** -- badge with SOM-specific labels (Address Mismatch, License Invalid, Price Deviation, Volume Outlier)
  3. **Pharmacy** -- MapPin icon + pharmacy name (NOT "Vendor")
  4. **Order #** -- mono (NOT "Invoice #")
  5. **Flagged** -- sortable, right-aligned, color-coded by severity
  6. **Severity** -- dot + label
  7. **Status** -- badge (Open, Under Review, Escalated, Resolved)
  8. **Detected** -- sortable, formatted date
  9. **Action** -- "Review" link to `/exceptions/{id}`

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

## Workflow (Cross-Page)

1. SOM analyst opens `/som` to see incoming order queue
2. Reviews stats strip: orders in queue, auto-blocked count, flagged %, blocked exposure
3. For low-risk pharmacies (score >= 60): clicks "Run checks" to navigate to `/som/order/{id}`
4. Verification pipeline auto-runs 4 checks with animated progress
5. After all checks complete: makes Approve/Hold/Escalate decision
6. For high-risk pharmacies (score < 60): clicks "Override required", enters justification and approver in modal
7. Override creates audit log entry, row transitions to "Released after override"
8. SOM exceptions appear at `/som/exceptions` with SOM-specific filtering and vocabulary
9. "Review" from exceptions page navigates to `/exceptions/{id}` for full SOM exception detail

## AJ Feedback (Parkland Demo)

"Pending -- no specific feedback yet"

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase — covers all 3 SOM pages -->
