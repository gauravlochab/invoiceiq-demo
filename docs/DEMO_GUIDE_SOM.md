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
- **Demo data:** 20 pharmacies across NC + CA — **16 of 20 backed by real NPI Registry records** (status verified live via cms.hhs.gov), 4 synthetic for state-board edge cases (suspended/expired/inactive — those portals aren't programmatically queryable). 5 manufacturers (Pfizer, J&J, Biogen, Mylan, Teva), 14 NDCs on contract.
- **Source of the spec:** Rajesh Jaluka's call (28 Apr 2026), captured in `docs/cto_call_transcript_3_timestamps.txt`

---

## Sidebar Tour — 30 seconds

**Click:** the sidebar.

Two verticals visible:
- **Healthcare AP** group: Extract, Dashboard, Exceptions, Vendor Scoring (the original hospital demo)
- **Drug Distributor** group: SOM Analyst, Exceptions, Pharmacy Scoring, Audit Log, Manufacturers (the new vertical)

Say: *"Same shell, same exception inbox, same engineering team — but now we've added a second vertical for a pharmaceutical distributor. The architecture is layered: workflows compose tasks, tasks compose actions. Adding a third vertical is mostly a data exercise."*

---

## Screen 1 — SOM Queue — 60 seconds

**Click:** "SOM Analyst" in sidebar.

Page header: *"Suspicious Order Monitoring."*

Top row — 4 metrics, all derived live from the loaded data:
1. **Orders in queue:** 4 (3 with controlled substances)
2. **Flagged this batch:** 75% (3 of 4 orders flagged) — every number here is real, no fudges
3. **Blocked exposure:** $58,375 across 4 SOM exceptions
4. **Total order value:** $51,032 (real `sampleOrders` sum) awaiting analyst review

Below — the queue. Point to it: *"Four incoming orders right now. Three involve controlled substances (the warning chip). The top one — Gurleys Pharmacy in Durham, NC — is fresh, just arrived seconds ago. Real pharmacy, real NPI, real address."*

Pause for one beat. *"Let's run the SOM pipeline on it."*

---

## Screen 2 — Gurleys Pharmacy: clean order — 90 seconds

**Click:** "Run checks" on **ORD-1001 — Gurleys Pharmacy**.

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
   - **Talk track:** *"NC Board of Pharmacy lookup confirms the permit. And here's the live one — we just hit the actual NPI Registry, public US government endpoint, no auth needed. That latency you see is real network roundtrip — proxied through our Next.js server because the registry doesn't send CORS headers."*

3. **Price Deviation** (icon: dollar)
   - Resolves to ✓ Verified
   - *"All 2 lines within contract tolerance (max deviation 2.3%)."*
   - Evidence table: ordered price vs contract price per NDC
   - **Talk track:** *"Same matching engine we use for hospital invoice/contract pricing — pointed at manufacturer NDCs instead. Pfizer Lipitor $3.78 vs $3.75 contract, well inside the 5% tolerance."*

4. **Pattern Outlier** (icon: bar chart) — runs **five** sub-checks in parallel:
   - **Demographics** — order vs. city catchment baseline
   - **Population** — vs. 30-day historical regional trend
   - **Order History** — vs. this pharmacy's own 30-day controlled-unit average
   - **Controlled Quota** — pharmacy's 30-day quota cap and current usage
   - **Raw-Material** — for compound drugs, ingredient ratios vs. recipe BOM
   - Card status = worst sub-check (rank: pass < warn < fail)
   - For ORD-1001: all five pass — clean order
   - **Talk track:** *"Rajesh asked for this. Volume alone doesn't tell the story — patterns do. Five orthogonal sub-checks, each pulling its own data source. The card surfaces the worst result, but the analyst can drill into all five reasons. That's the agentic value: not 'flag the outlier' but 'here are five reasons this looks unusual, ranked, with evidence.'"*

Bottom card — **Analyst decision** with **Approve / Hold / Escalate** buttons.

Click **Approve**. Toast: *"Order approved — released to fulfilment."*

**Key line:** *"That's 4 verifications + a live API call in under 4 seconds. The analyst's day used to be 50 of these orders by hand. Now they're reviewing exceptions only."*

---

## Screen 3 — Apex Family Pharmacy: address mismatch — 60 seconds

**Back to** `/som`. **Click "Run checks"** on **ORD-1002 — Apex Family Pharmacy Inc**.

The pipeline runs. This time:

1. **Address Verification** → ✗ Failed
   - *"Address mismatch — declared coordinates ~215 km from actual address geocode."*
   - **Talk track:** *"This is a real pharmacy in Raleigh — Apex Family Pharmacy, NC permit 09471, NPI 1114065513. But the geocode on the declared address resolves over 200 km away in Charlotte. In production this would be a data-lag, a moved branch, or someone trying to redirect a controlled-substance shipment. The system flags it; the auditor decides which."*

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

3. Price runs — passes. **Pattern Outlier** runs the 5 sub-checks: demographics passes, population passes, **order history warns** (3.6× this pharmacy's 30-day average — note that's *the pharmacy's own* baseline, not a population-wide one), controlled quota fails (42% over the 30-day cap), raw-material warns (33% drift). The 300-tablet order isn't a population-level outlier, but it *is* a pattern outlier when you compare against the pharmacy's own history and quota. The license is the headline failure, but the pattern is suspicious too.

Click **Escalate**. Toast: *"Order escalated to compliance manager."*

---

## Screen 5 — Westside Pharmacy: blocked at queue (override required) — 90 seconds

**Back to** `/som`. Notice **Westside Pharmacy** in the queue: row is shaded red, status chip says **Auto-blocked**, action column shows a red **"Override required"** button instead of "Run checks".

**Talk track:** *"Westside has a risk score of 20 out of 100 — Critical. Per Rajesh's spec, the system blocks the order at intake. The analyst can't even run the workflow until they record a justification. This is the audit trail compliance regulators need to see."*

**Click:** "Override required" on **ORD-1004 — Westside Pharmacy**.

The override modal opens. Show the context strip — pharmacy name, order ID, score 20/100, Critical rating. Show the form:
- **Justification** (required, min 20 chars)
- **Approver name** (required)
- **Role** dropdown (Compliance Manager / Head of Procurement / Pharmacy Director / Other)

Type a justification: *"Pharmacy is on a remediation plan with the state board. NDC-specific volume verified by compliance team. Approved for this order only with 14-day re-evaluation."*

Approver: *"Anita Kowalski"*. Role: *"Head of Procurement"*.

Click **Override + Release**. Toast confirms.

The queue row flips to **"Released after override · View AUD-004 →"**.

---

## Screen 6 — Audit Log — 30 seconds

**Click:** "Audit Log" in sidebar.

Header: *"Override Audit Log."* Summary strip: total overrides, released at Critical, unique pharmacies, unique approvers.

Scroll to **AUD-004** at the top. Point to it: *"Every override the analyst made in this session lives here. Score-at-override, full justification, approver name, role, timestamp. This is what the analyst hands to the regulator when they ask 'why did you ship to this pharmacy?'"*

**Talk track:** *"In production this persists to the database. In the demo it's module-level memory — refresh resets to seed. That's a 1-day fix, not an architectural one."*

---

## Screen 7 — Pharmacy Scoring — 30 seconds

**Click:** "Pharmacy Scoring" in sidebar.

20 pharmacies, sortable, expandable rows. Show how the score breaks down: 40% license + 20% address + 15% price + 15% Pattern (15%) + 10% identity. Westside is 20/100 (Critical) — that's why it was auto-blocked. Gurleys is 100/100 (Low Risk). Tarheel is 35/100 (High Risk) because of the expired license.

**Talk track:** *"This is the source-of-truth that drives the queue's blocking logic. A pharmacy doesn't have to be in the order queue to have a score — every pharmacy you've ever shipped to has a rolling risk score derived from past orders, license status, and address checks."*

---

## Screen 8 — Manufacturers — 30 seconds

**Click:** "Manufacturers" in sidebar.

*"Quick reference. The price-deviation check works against this contract pricing, broken down per manufacturer. Pfizer, J&J, Biogen, Mylan, Teva — 14 NDCs across the 5. Each has a contracted unit price and a tolerance band. Adding a new contract is a single row in this table."*

Point to the controlled-substance chips (Tylenol w/ Codeine, Xanax, Concerta, Lyrica, Hydrocodone) — *"These are the ones SOM watches most closely."*

---

## Screen 9 — Unified Inbox — 45 seconds

**Click:** "Exceptions" in sidebar (under Drug Distributor, or under Healthcare AP — both routes feed the same data model).

Scroll to the bottom. Point to the **SOM-001 through SOM-004** entries: *"SOM exceptions land in the same exception inbox as hospital exceptions. One queue, one set of analyst tools, two verticals' worth of catches. Address mismatch, license invalid, price deviation, volume outlier — distinct types, same workflow."*

**Key line:** *"This is the architectural payoff. We didn't build two products. We built one inspection layer with two specialised workflows on top."*

---

## The 4 Checks — Reference Card

| Check | Pass | Warn | Fail | Real data source |
|---|---|---|---|---|
| Address Verification | ≤1 km declared/geocoded | 1–10 km | >10 km or no DB hit | Pharmacy Address DB (mock) + Google Maps (mock) |
| License Verification | Permit active + NPI confirmed | Permit active, NPI mismatch | Permit expired/suspended/inactive/not-found | State Board (mock) + **NPI Registry (live)** |
| Price Deviation | All lines within tolerance | At least one NDC has no contract | Any line over tolerance | Manufacturer contract pricing |
| Pattern Outlier | All 5 sub-checks pass | At least one warns | Any sub-check fails | Demographics + history + quotas + raw-material BOM (synthetic) |

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

**"What about Phase 4+ outliers refinement?"** — Pattern Outlier already runs five sub-checks (demographics, population trend, pharmacy order history, controlled-substance quota, raw-material BOM). Production version would replace the synthetic baselines with the distributor's actual prescription-fulfilment history per pharmacy.

**"Where's the audit trail for the override?"** — Audit Log tab in the sidebar. Every override entry has the score-at-override, full justification, approver name, role, timestamp. In demo it's module-level memory; production persists to DB. That's a 1-day fix, not architectural.

**"Does the analyst have to run checks on a blocked order before overriding?"** — No. Per Rajesh's spec, the system blocks at intake based on the pharmacy's risk score. The override modal captures the justification regardless of whether checks have run — because the analyst is overriding the *system block*, not a specific check failure. If they want detailed evidence first, they can navigate manually to the runner; but the modal flow is designed for fast triage with full audit capture.

---

## After the Demo

Move into pricing / engagement model. The demo proves the inspection layer is real and works. The rest of the conversation is about scope, integrations, deployment.

---

*End of SOM demo guide. Source: docs/PLAN_SOM_DRUG_DISTRIBUTOR.md, docs/cto_call_transcript_3_timestamps.txt.*
