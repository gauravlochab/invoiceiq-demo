# InvoiceIQ — Demo Guide for Andy Sharma

**App:** http://localhost:3000
**Start server:** `cd /Users/gauravlochab/Demo-Hospital-Usecase/demo-app && npm run dev`
**Repo:** https://github.com/gauravlochab/invoiceiq-demo
**Presenter tip:** Full screen Chrome, 100% zoom, sidebar visible

---

## The One-Sentence Pitch

> "We built an AI layer that sits between a hospital's vendors and its AP team — it reads every incoming invoice, cross-checks it against POs, packing slips, and contracts, and catches errors and fraud before any money moves."

---

## Context to Set Before You Open the App

Tell Andy:
- This is Northfield Medical Center, a mid-size Chicago hospital
- Q1 2026 — $1.8M in invoices processed across 5 vendors
- The system found **$392,720 in errors and fraud** in one quarter
- We're going to walk through how it caught each one

---

## Screen 1 — Extract (Features 1 & 2) — 90 seconds

**Click:** "Extract" in the sidebar (top item)

This is the entry point — where invoices and packing slips come in.

1. Point to the **pipeline diagram** at the top of the center panel: *"This is the flow — invoice PDF goes in, the AI agent reads it, structured data comes out, exceptions get routed to the queue. Fully automated."*

2. The left panel shows 6 documents — invoices, a PO, a packing slip. Point to them: *"These arrived via email and postal mail. The system ingests everything."*

3. The Steris invoice is pre-selected. The PDF renders in the center — *"This is the actual invoice. Real PDF, not a mock."*

4. Click **"Extract with AI →"** (top right of center panel). The card border animates while the agent reads it. Watch the right panel — fields populate section by section:
   - **VENDOR** — name, address, email, phone
   - **BILL TO** — hospital department, address
   - **INVOICE** — invoice #, date, PO reference, payment terms, due date, total
   - **LINE ITEMS (6)** — each row appears one by one: item code, description, quantity, unit price, total
   - *"Every field. Pulled directly from the PDF. No manual entry."*

5. Click **"Match Against PO →"** at the bottom — *"Now it cross-references what was extracted against the PO and packing slip."* This takes you directly to the three-way match (Screen 4).

6. Go back to Extract. Now click **"invoice-MTS-INV-00291"** (MedTech Solutions) in the left panel and extract it. Point to the **FLAGS DETECTED** section: *"Four red flags — no PO reference, non-standard payment terms, vendor not in master, mixed product and services billing. The system caught all of this from the document alone, before any matching."*

7. Now click **"packingslip-STC-PS-2026-0392"** — *"Works for packing slips too."* Extract it. Point to the PARTIAL DELIVERY status in the results.

**Key line:** *"Every document — invoice, packing slip, PO — goes through this pipeline. The extraction feeds the matching engine. Nothing is entered manually."*

---

## Screen 2 — Dashboard (45 seconds)

**Click:** "Dashboard" in sidebar

*"Here's what one quarter looks like after the system has processed everything."*

Point to:
1. The **$392,720** figure (red, top row) — watch it count up when the page loads. *"That's the total amount flagged. 22% of Q1 spend."*
2. The chart — *"The red bars are flagged amounts by month. Notice March — that's when the contract breach compounded."*
3. The exceptions table — *"Ten exceptions. Seven still open. Let's walk through the critical ones."*

---

## Screen 3 — Duplicate Billing (Feature 5) — 90 seconds

**Click:** "Duplicates" in sidebar

1. Point to the **MedSupply** card at the top:
   - *"January 15th — MedSupply submits an invoice for $47,120 by postal mail."*
   - *"January 21st — same vendor submits by email. Different invoice number. Different date. Amount: $47,320 — $200 more."*
   - Point to the **99.6% similarity** score: *"Same line items. Same PO reference. The $200 difference is on a single saline line — unit price bumped by $1."*
   - *"A human reviewer sees two different invoice numbers and approves both. We caught it."*

2. Point to the AI Analysis box: *"The system explains exactly why — same vendor ID, identical SKUs, amount delta of 0.42% which is a known evasion pattern."*

**Key line:** *"Most duplicate detection only catches exact matches. This catches near-duplicates — which is how it actually happens in the wild."*

---

## Screen 4 — Three-Way Match (Feature 3) — 90 seconds

**Click:** "Exceptions" in sidebar → click the **Steris Corporation** row (EX-006)

1. Point to the alert bar: *"4 discrepancies. $4,600 flagged. 98.7% confidence."*

2. The **Three-Way Match table** — walk across the columns:
   - *"Three columns: what the PO says we agreed to pay, what the packing slip says arrived, what Steris billed."*
   - Point to the red cell on row 1: *"$2.10 on the PO. $2.50 on the invoice. 19% price increase — just applied without notice."*
   - Point to the amber row: *"Face shields — 3,000 billed, only 2,980 delivered. 20 units we'd be paying for that never arrived."*

3. Point to the AI Recommendation: *"Hold invoice. Request correction at contracted rate. Estimated saving: $4,600 across 23 recurrences this quarter."*

4. Point to the action buttons: *"One click — invoice is held and a correction request goes to the vendor."*

**Key line:** *"Individually each variance looks like a rounding error. The system sees it's happened 23 times — that's systematic overcharging."*

---

## Screen 5 — PO-Less Invoice / Shell Company (Feature 4) — 75 seconds

**Click:** Back to Exceptions → click **MedTech Solutions LLC** (EX-003)

1. Point to the alert bar: *"No PO found. Vendor not in approved master. Mixed product and service billing."*

2. Walk through the **PO Match Search** panel on the left:
   - *"The system tried to find a matching PO — vendor name lookup, fuzzy matching, open PO search by product."*
   - Point to the ✗ step: *"Nothing above 34% confidence. No match."*
   - Point to the candidate table: *"These are the closest open POs for IV Catheter Kits — none of them are from MedTech."*

3. Point to the red callout: *"MedTech Solutions is registered as a management consulting firm. They're billing for IV Catheter Kits. The bank account doesn't match any known vendor. This is a ghost vendor invoice."*

**Key line:** *"$45,200. There's nothing technically wrong with the invoice format — it would pass through any standard AP system. The intelligence is in cross-referencing the vendor master, their registered category, and the bank account simultaneously."*

---

## Screen 6 — Contract Compliance (Features 6 & 7) — 90 seconds

**Click:** "Contracts" in sidebar

1. **BioMed Equipment** (top, red border):
   - *"Annual cap: $500,000. Actual Q1 spend: $623,890."*
   - Point to the progress bar breaching the cap: *"$123,890 over. The contract expired December 31st — nobody stopped the payments. 23 invoices went through after the breach."*

2. **Cardinal Health** (amber border):
   - *"The contract entitles us to an 8.5% quarterly rebate on spend above $200K. Q1 spend was $312K. We're owed $89,430 — no credit memo was ever received."*
   - Point to the tier pricing section: *"On top of that — Cardinal billed all 2,340 units at $85. The contract says above 1,000 units the price drops to $72. That's $52,680 in tier pricing errors."*

3. Renewals section: *"The system tracks expiry proactively. BioMed is already expired — that's the root cause of the breach."*

**Key line:** *"Hospitals negotiate great contracts and then leave money on the table because nobody's watching whether vendors actually honour them. This watches."*

---

## Close — 30 seconds

*"One quarter. One hospital. Duplicates blocked: $47K. Ghost vendor invoice stopped: $45K. Pricing errors: $57K. Missing rebates: $89K. Contract breach: $124K. Total: $392K."*

*"Annualised at this hospital's scale — $1.2 to $1.5 million per year. The AP team is three people processing 7,000 invoices. They were never going to catch this. The system did."*

---

## Questions Andy Will Likely Ask

**"How does the extraction work — can you show me?"**
> Go back to Extract in the sidebar, pick any document, hit "Extract with AI →". The agent reads the PDF and populates: vendor details, bill-to, invoice number, PO reference, payment terms, due date, all line items with quantities and unit prices, total amount, and any flags it detects. About 5–10 seconds per document live. In production it runs asynchronously as invoices arrive.

**"What's the ingestion pipeline — email, scan, EDI?"**
> All three. Invoices arrive via email attachment, postal scan, EDI feed, or vendor portal. The extraction layer handles any format — PDF, image, structured EDI. The output is always the same structured JSON that feeds the matching engine.

**"How do you get the PO and contract data?"**
> Day-one ingestion from whatever the hospital uses — Epic, Meditech, SAP, Oracle Lawson. We read the PO database and contract repository. That's the ground truth for all the matching. Vendor master comes from the same source.

**"What's the false positive rate?"**
> Every flag has a confidence score. Below 90% goes to human review, not automatic hold. The system is conservative — it surfaces and asks, it doesn't block autonomously unless confidence is above 97%.

**"How long to deploy at a real hospital?"**
> The ingestion connectors for the major ERP systems are pre-built. A typical deployment is 2–3 weeks — one week to connect to the PO/contract database, one week to tune the matching thresholds on historical data, one week of parallel running before go-live.

---

## Source Documents (show if asked)

All accessible at `http://localhost:3000/documents/pdfs/[filename].pdf`:
- `invoice-MS-2026-0847.pdf` — original MedSupply invoice ($47,120)
- `invoice-MS-2026-0923.pdf` — duplicate ($47,320 — compare side by side)
- `invoice-STC-2026-19847.pdf` — Steris invoice ($2.50 price)
- `po-NMC-2026-PO-2847.pdf` — Northfield PO ($2.10 contracted price)
- `invoice-MTS-INV-00291.pdf` — MedTech suspicious invoice
- `packingslip-STC-PS-2026-0392.pdf` — Steris packing slip (partial delivery)

---

*Total runtime: ~9 minutes + Q&A. Recommended order: Extract → Dashboard → Duplicates → Three-Way Match → PO-Less → Contracts.*
