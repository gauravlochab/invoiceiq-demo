# Plan — Suspicious Order Monitoring (SOM) Demo Extension

**Vertical:** Pharmaceutical Distributor (Emery Source–style middleware)
**Source:** `cto_call_transcript_3_timestamps.txt` (28 Apr 2026) + scope diagram
**Author:** Gaurav Lochab → for review by Rajesh Jaluka
**Status:** DRAFT — awaiting Rajesh's feedback before implementation
**Repo:** to be pushed to GitHub; collaborator: **@rjaluka**

---

## 0. TL;DR

We extend the existing **InvoiceIQ Detect** Next.js demo with a second vertical: a **Drug Distributor's Suspicious Order Monitoring** workflow. The new workflow has 4 checks — **Address Verification → License Verification → Price Deviation → Outliers (stretch)** — wired into the same UI shell, sidebar, and exception model. We **reuse** the invoice/contract matching engine for the price-deviation step, mock the ARCOS-style address DB and license lookups, and call the real **NPI Registry** once for live realism.

---

## 1. What Already Exists (Audit)

```
demo-app/                  ← Next.js 16, React 19, TS, Tailwind v4
├── app/
│   ├── layout.tsx         ← Sidebar + ToastProvider shell
│   ├── page.tsx           ← Dashboard (24 KB)
│   ├── extract/           ← Invoice/PO/Packing-slip extraction (56 KB)
│   ├── exceptions/
│   │   ├── page.tsx       ← Exceptions list (38 KB)
│   │   └── [id]/page.tsx  ← Exception detail w/ 3-way match (99 KB)
│   ├── duplicates/        ← Duplicate billing screen (20 KB)
│   ├── contracts/         ← Contract compliance (16 KB)
│   ├── vendor-scoring/    ← Vendor scoring (15 KB)
│   └── api/extract/       ← Anthropic SDK PDF extraction route
├── components/
│   ├── Sidebar.tsx        ← 4 nav items (Extract / Dashboard / Exceptions / Vendor Scoring)
│   ├── Toast.tsx
│   └── magicui/           ← animated-beam, border-beam, number-ticker
├── lib/data.ts            ← 30 KB of typed mock data (exceptions, contracts, dupes, vendors)
└── public/documents/      ← 12 real PDFs + matching HTML
```

**Stack confirmed:**
- Next.js 16 (App Router) — note: `AGENTS.md` warns "this is NOT the Next.js you know" → consult `node_modules/next/dist/docs/` before writing routes.
- React 19, TypeScript 5
- Tailwind v4, Radix UI primitives, `@tremor/react` charts, `recharts`, `framer-motion`, `lucide-react`
- shadcn-style component config (`components.json`)
- `@anthropic-ai/sdk` for live PDF extraction
- `puppeteer` (likely for HTML→PDF generation in `scripts/generate-pdfs.js`)

**Existing extraction flow** (`app/api/extract/route.ts`):
- Two paths: multipart file upload OR JSON body with document name from `public/documents/pdfs/`
- Sends PDF as base64 to Claude Sonnet with structured-JSON prompts (invoice / packing slip / PO)
- Returns parsed JSON or raw text fallback

**Mental model of the current demo:** *"AI layer between hospital vendors and AP team — reads invoices, cross-checks PO/packing/contracts, catches errors before money moves."* Q1 numbers: $1.8M processed → **$392,720 caught**.

---

## 2. The New Vertical (from Transcript 3 + Diagram)

### 2.1 End-to-end pipeline (context, not all in scope)
```
Demand Generation → [Suspicious Order Monitoring] → Replenishment Analysis
                  → Aggregate Procurement → Receive Shipment
ERP underlies all stages.
Personas: CSR, SOM Analyst, Replenishment Analyst (×2), Receiving Clerk.
```
**Demo focus:** the **SOM Analyst**'s workspace.

### 2.2 SOM checks (the actual scope)

| # | Check | Data source (per diagram) | Status |
|---|---|---|---|
| 1 | Address Verification | ARCOS-style mock DB + Google Maps lookup | In scope |
| 2 | License Verification | State Board of Pharmacy mock + NPI Registry live | In scope |
| 3 | Price Deviation | Excel + Manufacturer Contract Pricing | In scope (reuse) |
| 4 | Outliers | Demographics + prescription trends | **Stretch (red ?)** |

### 2.3 Demo narrative (what the SOM Analyst sees)
1. A controlled-substance order arrives from "Joseph's Pharmacy, Durham NC."
2. System runs the 4 checks in sequence, each animating like the existing extract pipeline.
3. **Address Verification** → green ✓ (matches DB + Google Maps geocode within tolerance) OR red ✗ (address not on file / mismatched coords).
4. **License Verification** → looks up by name on NC Board of Pharmacy mock; surfaces permit #, status (active/inactive/expired), expiry date. Optionally cross-checks NPI Registry live.
5. **Price Deviation** → reuses 3-way match engine: order line items vs. manufacturer contract pricing sheet. Flags >X% deviation.
6. **Outliers (stretch)** → city demographics ("Durham pop. 1,000; this order = 500 controlled-substance pills → anomaly").
7. Decision panel: **Approve / Hold / Escalate** (mirrors existing Approve / Approve-with-Override / Escalate flow).

---

## 3. Architecture (Layered, per Rajesh's preference)

Rajesh mentioned: *"layered architecture — business layer (CrewAI / LangChain), database layer (MCP), workflow designer, task library, action library."* For a demo we adopt a **lightweight version** of that idea — same conceptual layering, no extra runtime dependencies yet:

```
┌─────────────────────────────────────────────────────────────┐
│  UI LAYER — app/som/...  (Next.js pages)                    │
├─────────────────────────────────────────────────────────────┤
│  WORKFLOW LAYER — lib/som/workflows/                        │
│    suspiciousOrderMonitoring.ts                             │
│      → orchestrates Tasks in sequence with status streaming │
├─────────────────────────────────────────────────────────────┤
│  TASK LIBRARY — lib/som/tasks/                              │
│    verifyAddress.ts  · verifyLicense.ts                     │
│    checkPriceDeviation.ts  · detectOutliers.ts              │
├─────────────────────────────────────────────────────────────┤
│  ACTION LIBRARY — lib/som/actions/                          │
│    geocodeAddress · queryArcos · queryStateBoard            │
│    queryNpi · matchContractPrice · queryDemographics        │
├─────────────────────────────────────────────────────────────┤
│  DATA LAYER — lib/som/data/                                 │
│    pharmacies.ts  · stateBoards.ts                          │
│    manufacturerPricing.ts  · cityDemographics.ts            │
└─────────────────────────────────────────────────────────────┘
```

**Why this matters for Rajesh's reusability goal:**
- A future "Receiving Clerk" workflow (cold-chain check, barcode verify) reuses the **same Task/Action interfaces** and just composes different tasks.
- Workflow is data-driven — adding a 5th check = drop a file in `tasks/` + add to workflow array.

**Type sketch:**
```ts
type TaskResult = {
  status: "pass" | "warn" | "fail" | "error";
  evidence: Record<string, unknown>;
  message: string;
  durationMs: number;
};
type Task = (ctx: WorkflowContext) => Promise<TaskResult>;
type Workflow = { id: string; name: string; tasks: Task[] };
```

---

## 4. Data Strategy

### 4.1 Pharmacy DB (mock — ARCOS-style)
- ~15–20 pharmacies across **NC** (Durham, Raleigh, Charlotte) and **CA** (San Diego, Los Angeles, Sacramento) — picked because they were referenced in the call and have public license sites we can model after.
- Mix of **legitimate-looking** + **fraudulent variants**: address fuzz, expired license, controlled-substance volume spike, no NPI on file.
- Fields: `name, dba, npi, deaNumber, permitNumber, state, address, lat, lng, licenseStatus, licenseExpiry, owner, demographicsCity`.
- File: `lib/som/data/pharmacies.ts` (typed).

### 4.2 State Board mock
- `lib/som/data/stateBoards.ts` returns realistic JSON shaped like real NC/CA pharmacy-board responses.
- For the demo: synchronous in-memory lookup; UI animates "Querying NC Board of Pharmacy…" with a 600–900 ms artificial delay.

### 4.3 NPI Registry (live, optional)
- Public REST: `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=<NPI>` or `&organization_name=<name>&taxonomy_description=Pharmacy`
- No auth, no rate limit officially, CORS friendly.
- Used **once** in the demo for "live network call" wow-factor — fall back to mock if offline.
- Wrapped in `lib/som/actions/queryNpi.ts` with strict timeout.

### 4.4 Google Maps
- For the demo: **mock geocoding** to avoid billing key in repo.
- Visual: an `<iframe>` to Google Maps embed (no key needed) or a static map image keyed by lat/lng so it looks live.
- If Rajesh wants a real key, env var `GOOGLE_MAPS_API_KEY` already isolated in `.env.local`.

### 4.5 Manufacturer pricing
- `lib/som/data/manufacturerPricing.ts`
- Manufacturers: **Pfizer, J&J, Biogen** (per call) + 1–2 generics suppliers.
- 8–12 NDCs per manufacturer with contract price + volume tiers.
- Reuse existing `Contract` type in `lib/data.ts` where possible.

### 4.6 City demographics (stretch)
- 10 cities across NC + CA: population, age skew, prescription baseline by category.
- Used only by the outlier task; visually flagged in red per the diagram.

---

## 5. UI Plan

### 5.1 Sidebar — add a vertical switcher
Top of sidebar gets a small **vertical selector** (Healthcare AP / Drug Distributor) — when user picks "Drug Distributor" the nav items flip:

```
Drug Distributor mode:
  · Order Intake
  · SOM Analyst   ← new primary screen
  · Exceptions    (shared, scoped by vertical)
  · Manufacturers (contract pricing view)
  · Dashboard
```

Lighter alternative if vertical-switch feels heavy: just **append** "SOM" + "Manufacturers" to existing sidebar with a small "Pharma" group label.

> **Decision needed from Rajesh:** vertical switcher vs. flat nav addition. Recommend **flat addition** for the demo to avoid context-switch confusion in the meeting.

### 5.2 New routes
```
app/som/
├── page.tsx              ← SOM dashboard (queue of incoming orders)
├── order/[id]/page.tsx   ← single-order workflow run UI
└── manufacturers/
    └── page.tsx          ← contract pricing per manufacturer
```

### 5.3 Order workflow page — the visual hero
Mirrors the existing `extract/` animated pipeline. Center column shows 4 cards stacked vertically; each animates from `pending → running → done` with `border-beam` (already in `components/magicui/`):

```
┌────────────────────────────────────────────┐
│ ① ADDRESS VERIFICATION       [✓ verified] │
│   ARCOS DB hit + Google Maps coords match  │
│   📍 mini map preview                       │
├────────────────────────────────────────────┤
│ ② LICENSE VERIFICATION       [✓ active]   │
│   NC Board of Pharmacy · Permit #12345     │
│   Expires: 2027-06-30                       │
│   NPI Registry: 1234567890 ✓                │
├────────────────────────────────────────────┤
│ ③ PRICE DEVIATION            [⚠ 12% high] │
│   Pfizer Lipitor 20mg: ordered $4.20       │
│   Contract price: $3.75  (+12%)             │
├────────────────────────────────────────────┤
│ ④ OUTLIERS (BETA)            [⚠ spike]    │
│   Durham pop. 1k · 500 ct controlled       │
└────────────────────────────────────────────┘
[ Approve ]  [ Hold ]  [ Escalate to Manager ]
```

### 5.4 Exceptions integration
- Add `som_address_mismatch | som_license_invalid | som_price_deviation | som_quantity_outlier` to `ExceptionType`.
- They flow into the **same** Exceptions list — unified inbox.

---

## 6. The Three Open Items From Transcript 2 (Don't Forget)

These hospital-demo polish items were never closed in transcript 3 — assume still in scope:

| # | Item | Rough effort |
|---|---|---|
| H1 | Mandatory reason note when user goes against system finding (Accept on mismatch / Reject on match) | S |
| H2 | Grey out "Approve with Override" if any line item rejected | S |
| H3 | Outright reject path (e.g., duplicate) — terminates flow | S |
| H4 | Exception History expansion → show ALL exceptions with scroll | S |
| H5 | Vendor Scoring donut chart on dashboard | S |
| H6 | Remove Contracts tab from invoice detail (per call: contract is baseline, not edited) | XS |
| H7 | Document comparison overlay for "Changed" docs (PO + packing slip only, NOT invoice) | M |
| H8 | More realistic invoice/PO PDFs (already 12 in `pdfs/` — confirm enough) | XS |

**Recommendation:** knock these out **first** in a small batch — they're surface-level polish and shipping them clears Rajesh's outstanding feedback before he reviews new SOM work.

---

## 7. Phased Delivery

### Phase 0 — Repo hygiene (before any code)
1. Push current `demo-app/` to GitHub (`gauravlochab/invoiceiq-demo` already in DEMO_GUIDE).
2. Add **@rjaluka** as collaborator.
3. Push **this plan markdown** as the first PR / file in `/docs/`.
4. Wait for Rajesh's review before Phase 1.

### Phase 1 — Hospital polish (Transcript 2 leftovers)
- H1–H8 above. Single PR. No new screens; just behavior fixes.
- Acceptance: re-run DEMO_GUIDE script end-to-end without snags.

### Phase 2 — SOM scaffolding (no real logic yet)
- New routes (`app/som/...`), sidebar entry, empty data files with types.
- Workflow + task + action skeletons returning hardcoded `pass` results.
- One sample order ("Joseph's Pharmacy, Durham") wired end-to-end visually.

### Phase 3 — Real data + 3 of 4 checks
- Build pharmacy mock DB (15–20 entries, NC + CA).
- Implement Address Verify (mock DB + mock geocode).
- Implement License Verify (state board mock + real NPI Registry call).
- Implement Price Deviation (port matching engine).
- 3–4 sample orders covering: clean pass, address mismatch, expired license, price spike.

### Phase 4 — Outliers (stretch) + polish
- City demographics dataset, anomaly detection task.
- Manufacturer pricing screen.
- Dashboard widgets (orders processed, suspicion rate, $ blocked).

### Phase 5 — Demo runbook
- New `DEMO_GUIDE_SOM.md` mirroring existing demo guide structure.
- Suggested 8–10 minute narrative for customer meeting Bala is arranging.

---

## 8. Risks & Open Questions

### Decisions needed from Rajesh
1. ~~**GitHub handle confirmation**~~ → confirmed: **@rjaluka**.
2. **State pick** — NC + CA OK, or align with the customer's actual footprint if Bala discloses it?
3. **ARCOS naming** — keep "ARCOS" label (domain credibility but ambiguous since real ARCOS isn't queryable) or genericize to "Pharmacy Address Database"?
4. **Vertical switcher vs. flat nav addition** (see §5.1).
5. **Outliers in v1?** — diagram has it in red with "?". Recommend deferring to Phase 4.
6. **Customer footprint** — any data Rajesh has on the prospect's geographic footprint to pick more relatable cities?

### Technical risks
- **Next.js 16 conventions** — `AGENTS.md` warns of breakage. Read `node_modules/next/dist/docs/` before any new route.
- **NPI Registry CORS** — confirm browser-side call works; if not, proxy via Next route handler.
- **Demo realism vs. legal** — scraping live state-board pages risks TOS issues; mocking is cleaner.
- **Customer meeting timing** — Bala arranging; Phase 1 must be production-quality before Phase 2 starts.

### Architectural reconciliation
Rajesh's antigravity sketch had **CrewAI / LangChain + MCP + workflow designer**. This demo uses a **degenerate, in-process** version of that pattern (Task/Action library, no LLM agents in the workflow itself). A follow-up doc should compare the two and note which pieces are worth promoting to actual CrewAI tasks vs. staying as plain TS functions — proposed for a later PR after he reviews this plan.

---

## 9. File-Level Implementation Targets

| New file | Purpose |
|---|---|
| `app/som/page.tsx` | SOM order queue dashboard |
| `app/som/order/[id]/page.tsx` | Single order workflow runner UI |
| `app/som/manufacturers/page.tsx` | Manufacturer contract pricing |
| `lib/som/types.ts` | Workflow / Task / Action types |
| `lib/som/workflows/suspiciousOrderMonitoring.ts` | Composes the 4 tasks |
| `lib/som/tasks/verifyAddress.ts` | Task 1 |
| `lib/som/tasks/verifyLicense.ts` | Task 2 |
| `lib/som/tasks/checkPriceDeviation.ts` | Task 3 (delegates to existing engine) |
| `lib/som/tasks/detectOutliers.ts` | Task 4 (stretch) |
| `lib/som/actions/queryArcos.ts` | Mock pharmacy DB lookup |
| `lib/som/actions/geocodeAddress.ts` | Mock or real Google Maps geocode |
| `lib/som/actions/queryStateBoard.ts` | Mock state board response |
| `lib/som/actions/queryNpi.ts` | Real NPI Registry call w/ fallback |
| `lib/som/actions/matchContractPrice.ts` | Reuses invoice/contract matching logic |
| `lib/som/data/pharmacies.ts` | 15–20 mock pharmacies |
| `lib/som/data/stateBoards.ts` | Per-state board mock responses |
| `lib/som/data/manufacturerPricing.ts` | Per-manufacturer NDC pricing + tiers |
| `lib/som/data/cityDemographics.ts` | 10-city demographics (stretch) |
| `lib/som/data/orders.ts` | 4–6 sample incoming orders |
| `app/api/som/run/route.ts` | (Optional) workflow runner if we want streaming |
| `docs/PLAN_SOM_DRUG_DISTRIBUTOR.md` | This file (move to /docs/ on push) |
| `DEMO_GUIDE_SOM.md` | Customer-meeting runbook |

---

## 10. What's NOT in scope
- Cold-chain integrity, supply-chain serial-number checks (mentioned in call as "not a very big deal" for this demo).
- Receiving / Replenishment workflows — covered in diagram for context only.
- Real CrewAI / LangChain runtime — deferred to a separate architecture exercise post-customer-demo.
- Real DEA / ARCOS integration (not publicly queryable; mocked).
- Production auth, persistence, multi-tenancy.

---

*End of plan. Ready for Rajesh's review. Reply on the PR or ping with feedback.*
