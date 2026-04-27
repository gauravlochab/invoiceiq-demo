# Hospital Invoice Processing Demo — Requirements & Context

## Problem Statement

Approximately 5–15% of healthcare invoices contain "match exception" errors. The demo addresses the most critical failure modes in hospital accounts payable workflows.

---

## Core Problem Areas

### 1. Three-Way Match Exceptions
The most frequent issue. Occurs when the **Purchase Order (PO)**, **packing slip (receipt)**, and **invoice** do not align across:
- Price
- Quantity
- Product description

### 2. Invoices Without a Corresponding PO
Invoices arrive without a PO because orders were placed:
- Urgently (outside normal procurement channels)
- Informally (verbal or email orders not entered into the system)

### 3. Duplicate Billing
Manual systems are highly vulnerable. Scenarios include:
- Vendor sends the same invoice via both email and postal mail
- A "shell company" submits a fraudulent invoice that goes undetected
- Slight modifications to amount or date are used to evade simple duplicate detection

### 4. Missing Discounts and Rebates
Hospitals have complex contracts with tiered pricing based on volume. Invoices may fail to reflect:
- Negotiated discounts
- Volume-based rebates
- Contract amendments

This leads to significant overpayment that often goes undetected.

### 5. Contract Threshold Violations
Cumulative spend with a vendor may exceed the total value, quantity, or duration permitted under the contract — a compliance and financial risk that requires aggregate tracking.

---

## Demo Features

### Feature 1 — Invoice Data Extraction
- Input: scanned document or email
- Output: structured invoice data (vendor, line items, quantities, prices, dates)

### Feature 2 — Packing Slip Extraction
- Input: scanned document or email
- Output: structured receipt data (items received, quantities, delivery date)

### Feature 3 — Three-Way Match & Discrepancy Highlighting
- Cross-reference invoice against PO and packing slip
- Highlight mismatches in: product description, quantity, price
- Surface actionable discrepancy report per invoice

### Feature 4 — PO Search for Unmatched Invoices
- If no PO is found for an invoice, search for potential matches using:
  - Vendor name
  - Product description
- Return ranked candidate POs for human review

### Feature 5 — Duplicate Invoice Detection
- Detect duplicates across: same vendor, similar amount, similar timeframe
- "Similar" (not exact) matching required because vendors may slightly alter amount or date to evade detection
- Fuzzy matching logic needed

### Feature 6 — Contract Compliance Check (Missing Discounts & Rebates)
- Compare invoiced prices against contract terms
- Flag invoices that do not apply negotiated discounts or rebates

### Feature 7 — Cumulative Vendor Spend vs. Contract Limits
- Aggregate all invoices from a given vendor
- Compare totals against contract caps on:
  - Total value ($)
  - Total quantity
  - Contract duration / expiry
- Flag when approaching or exceeding limits

---

## Notes

- This is a demo for an interview/presentation context
- All seven features above are in scope for the demo
- The system must handle both scan-based and email-based document ingestion
- Fuzzy/semantic matching is required (not just exact string matching) for duplicate detection and PO search
