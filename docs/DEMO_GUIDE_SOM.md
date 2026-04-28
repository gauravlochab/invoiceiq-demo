# InvoiceIQ — SOM Demo Guide (Drug Distributor Vertical)

**App:** http://localhost:3000/som
**Start server:** `cd /Users/gauravlochab/Demo-Hospital-Usecase/demo-app && npm run dev`
**Repo:** https://github.com/gauravlochab/invoiceiq-demo
**Presenter tip:** Full screen Chrome, 100% zoom, sidebar visible. Internet on (live NPI Registry call).

---

## The One-Sentence Pitch

> "We took the same AI inspection layer we built for hospital invoices and pointed it at a drug distributor's most painful manual process — Suspicious Order Monitoring — automating address, license, pricing, and volume checks on every controlled-substance order before it ships."

---

## Context to Set Before You Open the App

Tell the customer:
- **Persona:** SOM Analyst at a pharmaceutical distributor (Emery Source-style middleware)
- **Today's pain:** every controlled-substance order from a pharmacy needs manual checks — is the pharmacy real? Is its license valid? Is the price within contract? Is the volume reasonable?
- **What we automated:** all four checks, in a single 4-second pipeline, with one genuine live API call to the NPI Registry for credibility
- **Demo data:** 16 mock pharmacies across NC + CA, 5 manufacturers (Pfizer, J&J, Biogen, Mylan, Teva), 14 NDCs on contract
- **Source of the spec:** Rajesh Jaluka's call (28 Apr 2026), captured in `docs/cto_call_transcript_3_timestamps.txt`

---

## Sidebar Tour — 30 seconds

**Click:** the sidebar.

Two verticals visible:
- **Healthcare AP** group: Extract, Dashboard, Exceptions, Vendor Scoring (the original hospital demo)
- **Drug Distributor** group: SOM Analyst, Manufacturers (the new vertical)

Say: *"Same shell, same exception inbox, same engineering team — but now we've added a second vertical for a pharmaceutical distributor. The architecture is layered: workflows compose tasks, tasks compose actions. Adding a third vertical is mostly a data exercise."*

---

## Screen 1 — SOM Queue — 60 seconds

**Click:** "SOM Analyst" in sidebar.

Page header: *"Suspicious Order Monitoring."*

Top row — 4 metrics:
1. **Orders processed:** 247 this quarter
2. **Suspicion rate:** ~8.5% (21 of 247 flagged)
3. **Blocked exposure:** ~$58,375 across 4 SOM exceptions in current queue
4. **Pending queue:** 4 orders awaiting verification

Below — the queue. Point to it: *"Four incoming orders right now. Three involve controlled substances (the warning chip). The top one — Joseph's Pharmacy in Durham, NC — is fresh, just arrived seconds ago."*

Pause for one beat. *"Let's run the SOM pipeline on it."*

---

## Screen 2 — Joseph's Pharmacy: clean order — 90 seconds

**Click:** "Run checks" on **ORD-1001 — Joseph's Pharmacy**.

The page loads and the workflow auto-starts. 4 cards stack vertically:

1. **Address Verification** (icon: pin)
   - Border-beam animates while it runs
   - Resolves to ✓ Verified
   - Says: *"Address verified — declared and geocoded coordinates match within 1 km."*
   - Evidence row: "Pharmacy Address Database" record + geocoded distance "0 km from declared"
   - **Talk track:** *"We hit our internal pharmacy address DB — modeled on what an ARCOS-style registry would expose — then cross-referenced Google Maps geocode coordinates. Match within tolerance."*

2. **License Verification** (icon: scroll)
   - Resolves to ✓ Verified
   - *"Permit NC-PH-018472 active until 2027-06-30; NPI Registry confirmed."*
   - Evidence: NC Board of Pharmacy + **NPI Registry · live** with millisecond latency
   - **Talk track:** *"NC Board of Pharmacy lookup confirms the permit. And here's the live one — we just hit the actual NPI Registry, public US government endpoint, no auth needed. That latency you see is real network roundtrip."*
   - *(Click the NC Board of Pharmacy evidence — it deep-links to the real public lookup site.)*

3. **Price Deviation** (icon: dollar)
   - Resolves to ✓ Verified
   - *"All 2 lines within contract tolerance (max deviation 2.3%)."*
   - Evidence table: ordered price vs contract price per NDC
   - **Talk track:** *"Same matching engine we use for hospital invoice/contract pricing — pointed at manufacturer NDCs instead. Pfizer Lipitor $3.78 vs $3.75 contract, well inside the 5% tolerance."*

4. **Volume Outliers** (icon: bar chart)
   - Resolves to ✓ Verified (no controlled substances in this order)
   - *"No controlled substances in this order — outlier check N/A."*

Bottom card — **Analyst decision** with **Approve / Hold / Escalate** buttons.

Click **Approve**. Toast: *"Order approved — released to fulfilment."*

**Key line:** *"That's 4 verifications + a live API call in under 4 seconds. The analyst's day used to be 50 of these orders by hand. Now they're reviewing exceptions only."*

---

## Screen 3 — Carolina Health: address mismatch — 60 seconds

**Back to** `/som`. **Click "Run checks"** on **ORD-1002 — Carolina Health Pharmacy**.

The pipeline runs. This time:

1. **Address Verification** → ✗ Failed
   - *"Address mismatch — declared coordinates 208.55 km from actual address geocode."*
   - **Talk track:** *"Pharmacy declared a Raleigh address. But the geocode on the address actually resolves in Charlotte — over 200 km away. That's either a data lag, a moved branch, or someone trying to redirect a controlled-substance shipment. Either way — auditor's job to find out, not the analyst's job to chase."*

2. License + Price + Outliers all run anyway (the workflow doesn't short-circuit — every check produces audit evidence). They pass.

Bottom — note that **Approve** is disabled because at least one check failed. The button has a tooltip: *"At least one check failed — cannot approve."*

Click **Hold**. Toast confirms.

**Key line:** *"The system doesn't make decisions. It surfaces evidence. The analyst always has final say — but they're acting on evidence, not gut."*

---

## Screen 4 — Tarheel Drugs: expired license — 45 seconds

**Back to** `/som`. **Click "Run checks"** on **ORD-1003 — Tarheel Drugs**.

1. Address Verification → ✓ pass
2. **License Verification** → ✗ Failed
   - *"Permit NC-PH-009847 is expired (expired 2025-08-15)."*
   - **Talk track:** *"This is a real-world catch. Their license expired in August. They're still placing orders — and importantly, they're trying to order Schedule III Tylenol with Codeine. Without this check, those 300 controlled tablets ship to a pharmacy with no current authority to dispense them."*

3. Price + Outliers run — both pass. The 300-tablet order is well under Charlotte's 3,100/month controlled-substance baseline (~10%), so volume isn't the issue. The license is.

Click **Escalate**. Toast: *"Order escalated to compliance manager."*

---

## Screen 5 — Westside Pharmacy: the boss case — 90 seconds

**Back to** `/som`. **Click "Run checks"** on **ORD-1004 — Westside Pharmacy**.

This one trips multiple checks. Walk through each:

1. **Address Verification** → ✓ pass (declared = geocoded)
2. **License Verification** → ✗ Failed (suspended permit, no NPI on file)
3. **Price Deviation** → ✗ Failed (Xanax 0.5mg ordered at $1.42 vs contract $1.20 = +18%, way over the 5% tolerance band)
4. **Volume Outliers** → ✗ Failed (35,000 controlled units = 3.6× the entire LA monthly baseline from a single pharmacy in a single order)

**Talk track:** *"This is the order that gets you on the front page of the Wall Street Journal. Suspended pharmacy. Schedule IV controlled substance. Price spike. Volume 3.6× LA's entire monthly controlled-substance baseline from a single pharmacy in a single order. The address checks out — they're brazen, not stupid. Manually, an analyst might catch one of these three red flags on a busy day. Probably not all three. The system catches all three in under 4 seconds."*

Bottom row: only **Hold** and **Escalate** are enabled. **Approve** is disabled.

Click **Escalate**.

---

## Screen 6 — Manufacturers — 30 seconds

**Click:** "Manufacturers" in sidebar.

*"Quick reference. The price-deviation check works against this contract pricing, broken down per manufacturer. Pfizer, J&J, Biogen, Mylan, Teva — 14 NDCs across the 5. Each has a contracted unit price and a tolerance band. Adding a new contract is a single row in this table."*

Point to the controlled-substance chips (Tylenol w/ Codeine, Xanax, Concerta, Lyrica, Hydrocodone) — *"These are the ones SOM watches most closely."*

---

## Screen 7 — Unified Inbox — 45 seconds

**Click:** "Exceptions" in sidebar (under Healthcare AP, but it's shared).

Scroll to the bottom. Point to the **SOM-001 through SOM-004** entries: *"SOM exceptions land in the same exception inbox as hospital exceptions. One queue, one set of analyst tools, two verticals' worth of catches. Address mismatch, license invalid, price deviation, volume outlier — distinct types, same workflow."*

**Key line:** *"This is the architectural payoff. We didn't build two products. We built one inspection layer with two specialised workflows on top."*

---

## The 4 Checks — Reference Card

| Check | Pass | Warn | Fail | Real data source |
|---|---|---|---|---|
| Address Verification | ≤1 km declared/geocoded | 1–10 km | >10 km or no DB hit | Pharmacy Address DB (mock) + Google Maps (mock) |
| License Verification | Permit active + NPI confirmed | Permit active, NPI mismatch | Permit expired/suspended/inactive/not-found | State Board (mock) + **NPI Registry (live)** |
| Price Deviation | All lines within tolerance | At least one NDC has no contract | Any line over tolerance | Manufacturer contract pricing |
| Volume Outliers | ≤25% of monthly catchment baseline | 25% – 3× baseline | >3× baseline | City demographics (synthetic) |

---

## What's NOT in this demo

- **Outbound shipping checks** (cold-chain, supply-chain serial verification) — Rajesh said *"not a very big deal"* in transcript 3, t=08:25. Receiving/Replenishment workflows in scope diagram for context only.
- **Real CrewAI / LangChain runtime** — the layered architecture mirrors that pattern in plain TypeScript so we can promote later without re-architecting.
- **Real ARCOS / DEA integration** — that's not publicly queryable; we model what a future integration would surface.
- **Production auth, persistence, multi-tenancy.**

---

## Q&A Preparation

**"What if the NPI Registry is down?"** — We timeout in 3.5 seconds and fall back to mocked evidence. The check still completes, just labeled "cached" instead of "live."

**"How do you keep the address DB current?"** — Production version would sync from the distributor's existing pharmacy master + ARCOS feed (state-mandated for controlled-substance distributors). Demo uses a static dataset.

**"Why these states?"** — NC and CA picked because their state board sites have the cleanest public lookup interfaces (Rajesh demoed the NC site live in the planning call). Aligning to your geographic footprint is a one-day data refresh.

**"Can we add a 5th check?"** — Yes — drop one file in `lib/som/tasks/`, register it in the workflow array. The architecture is intentionally additive.

**"Does this work for non-controlled orders too?"** — Today the workflow runs on every order; outlier check is a no-op for non-controlled. Easy to short-circuit if desired.

**"What about Phase 4+ outliers refinement?"** — Current outlier task uses static city demographics. Production version would use the distributor's actual prescription-fulfilment history per pharmacy as the baseline.

---

## After the Demo

Move into pricing / engagement model. The demo proves the inspection layer is real and works. The rest of the conversation is about scope, integrations, deployment.

---

*End of SOM demo guide. Source: docs/PLAN_SOM_DRUG_DISTRIBUTOR.md, docs/cto_call_transcript_3_timestamps.txt.*
