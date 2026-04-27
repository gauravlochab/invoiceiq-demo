# Demo Requirements — Questions for Rajesh

**Context:** We are showing this to Andy Sharma (Flowtogen), Rajesh's contact, as a touch-base demo. Andy knows it's early stage. The goal is to impress him with the idea, the intelligence of the system, and the potential dollar impact — not production readiness. These questions are about what the demo actually shows and what rules it follows.

---

## 1. The Impact Numbers

**Q1.** What is the total dollar figure the demo scenario represents across all the errors caught — duplicates, missing discounts, contract overages, match exceptions combined? We need a specific number to anchor the story. What is Rajesh planning to show?

**Q2.** Does the demo show this as savings from a single invoice batch, a month, or a year of invoices? The timeframe sets how big the number feels.

---

## 2. How the System Behaves

**Q3.** Does the system proactively surface exceptions on its own, or does a user have to run a check? Even for a demo, showing it autonomously catch issues is far more impressive than showing it respond to queries.

**Q4.** When the system flags something — a duplicate, a missing discount, a contract overage — what does it show? Just the flag, or does it also show the recommended action (e.g., "hold this invoice," "request credit memo from vendor")?

---

## 3. Three-Way Match Rules

**Q5.** Partial delivery: PO for 100 units, packing slip confirms 60 received, invoice bills 100. What should the demo show the system doing?

**Q6.** What is the price deviation threshold before a mismatch is flagged — any difference, or only above a certain percentage?

**Q7.** If the product description differs between the invoice and PO but the item code/SKU matches exactly — does the demo treat this as a clean match, a soft flag, or a discrepancy?

**Q8.** Standing orders: one PO covering recurring monthly shipments, each invoiced separately. Does the system track cumulative billed vs. total PO value, or treat each invoice independently?

---

## 4. Duplicate & Fraud Detection

**Q9.** What is the specific near-duplicate scenario in the demo — the one where the vendor slightly altered the amount or date, and the system catches it? What are the two invoice amounts and dates? This is likely the sharpest moment in the demo and needs to be concretely defined.

**Q10.** What time window does the system use when scanning for duplicates — 30 days, 90 days, full history?

**Q11.** What is the shell company / fraudulent invoice scenario in the demo, and what signals surface it? (e.g., vendor not in the approved master list, invoice for services outside the vendor's known category)

---

## 5. Missing Discounts & Rebates

**Q12.** Are rebates in the demo applied as a line-item discount on each invoice, or as a periodic credit memo (e.g., quarterly)? A "missing rebate" looks different depending on the structure — what does the demo actually show?

**Q13.** Is tiered pricing in scope — where the contracted price drops after a volume threshold? If yes, does the system flag when the vendor billed at the wrong tier based on actual cumulative volume?

**Q14.** Is there a mid-year contract renegotiation scenario where the vendor kept billing at old rates after the new rate took effect? If yes, what are the specific numbers?

---

## 6. Contract Spend Limits

**Q15.** What is the specific overage scenario — which vendor, what was the contract cap, and what did actual spend reach? The story needs a concrete number (e.g., "contract cap was $2M, actual spend hit $2.4M because the contract expired but invoices kept coming").

**Q16.** Should the system warn before the cap is hit (e.g., at 80% and 95%) or only flag after the limit is exceeded?

**Q17.** Does the spend cap apply across multiple hospital facilities combined, or per facility independently?

---

## 7. Scope Boundaries

**Q18.** Are certain invoice types out of scope for matching — utilities, lease/rent, professional services with no packing slip? Should the demo show the system routing these separately rather than flagging them as errors?

**Q19.** Is there a dollar threshold below which a PO-less invoice passes through without needing a PO match?

**Q20.** When a purchased item is not on any active contract (off-contract spend), should the system flag it — or is that out of scope for this demo?

---

*Return with answers and we'll finalize the demo data and the story arc.*
