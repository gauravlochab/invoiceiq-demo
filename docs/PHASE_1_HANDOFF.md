# Phase 1 Handoff — Hospital Demo Polish (Transcript-2 Items)

**For:** the next Claude Code session that will actually implement this.
**Plan reference:** `docs/PLAN_SOM_DRUG_DISTRIBUTOR.md` §6
**Scope:** Phase 1 only. Do **NOT** touch Phase 2 (SOM / drug distributor) work.
**Goal:** Ship the 8 transcript-2 polish items before the customer demo Bala is arranging.

---

## Quick context (read first)

This is a Next.js 16 + React 19 + Tailwind v4 + TypeScript demo app: an AI-powered hospital invoice intelligence tool ("InvoiceIQ Detect" by "Agile C-Level"). It catches duplicates, contract overages, missing rebates, three-way-match exceptions, suspicious invoices.

**Important:**
- `AGENTS.md` warns this is **NOT** the Next.js you know — read `node_modules/next/dist/docs/` before touching routes.
- Extraction backend just got swapped to **OpenAI gpt-4o** (commit `47f5e0e`). Don't break that.
- Rajesh Jaluka (`@rjaluka`) is collaborator and reviewer. Push commits to `main`.

---

## Files you'll be touching (skim these first)

| File | Why |
|---|---|
| `app/exceptions/[id]/page.tsx` | 99 KB — three-way match table, accept/reject buttons, approve/escalate flow. Most of the work lives here. |
| `app/exceptions/page.tsx` | Exceptions list — minor changes for outright-reject path |
| `app/extract/page.tsx` | "Contract" tab to remove |
| `app/page.tsx` | Dashboard — add vendor scoring donut |
| `app/vendor-scoring/page.tsx` | Exception history scroll fix |
| `lib/data.ts` | Mock data shapes — may need new fields for rejection reasons |
| `components/Toast.tsx` | Already exists — use for confirmation toasts |
| `app/exceptions/[id]/page.tsx` | Document comparison overlay (new component, lives in same page or split) |

---

## The 8 items to implement (from CTO call transcript 2, 17 Apr 2026)

### H1 — Mandatory reason note when going against system finding
**Where:** `app/exceptions/[id]/page.tsx` — line-item Accept/Reject buttons in the three-way match table.

**Rule:** Whenever the user disagrees with the system's finding, force a reason.
- Line item is **matched** (system says ✓) AND user clicks **Reject** → modal with mandatory note
- Line item is **mismatched** (system says ✗) AND user clicks **Accept** → modal with mandatory note ("override reason")
- Line item is matched AND user clicks Accept → no modal (silent confirm)
- Line item is mismatched AND user clicks Reject → no modal (silent confirm — agreeing with system)

**UI:** Modal with textarea (required, min 10 chars), Cancel + Confirm buttons. Disable Confirm until note has content.

**State:** Track `lineItemDecisions: Record<itemCode, { decision: 'accept' | 'reject', reason?: string }>`.

---

### H2 — Grey out "Approve with Override" when any line item rejected
**Where:** `app/exceptions/[id]/page.tsx` — the bottom action bar with Approve / Request Correction / Escalate buttons.

**Rule:** If `Object.values(lineItemDecisions).some(d => d.decision === 'reject')` → button disabled with tooltip: "You can't approve since at least one line item is rejected."

**Visual:** `opacity-40 cursor-not-allowed` + tooltip via `title=""` or a Radix tooltip if installed.

---

### H3 — Outright Rejection path (e.g., for duplicates)
**Where:** `app/exceptions/[id]/page.tsx` action bar.

**Rule:** Add a fourth action: **"Reject Invoice"** — for cases like clear duplicates. Click → confirmation modal ("Reject and close this invoice? This action ends the workflow.") → on confirm, mark exception as `status: 'rejected'`, no further action available.

**State change:** Add `'rejected'` to `Status` type in `lib/data.ts` (it's currently `"open" | "under_review" | "resolved" | "escalated"`).

---

### H4 — Exception History expansion shows ALL exceptions with scroll
**Where:** `app/vendor-scoring/page.tsx` — the expandable row that currently shows just one or a few exceptions.

**Rule:** When a vendor row is expanded, show **every** exception for that vendor (filter `lib/data.ts` `exceptions` array by vendor name) inside a `max-h-[400px] overflow-y-auto` container so it scrolls instead of overflowing the layout.

**Polish:** Sticky table header inside the scroll container.

---

### H5 — Vendor scoring donut on Dashboard
**Where:** `app/page.tsx` — Dashboard.

**Rule:** Add a donut/ring chart visualizing vendor risk distribution. Use `recharts` (already installed) — `<PieChart>` + `<Pie>` with `innerRadius` set for donut shape.

**Data:** Group vendors from `lib/data.ts` by risk band (Low / Medium / High / Critical based on flag count or score). Show count per band. Place it next to or below the existing recent-exceptions table — match the existing card style.

**Click behavior:** clicking a band navigates to `/vendor-scoring?risk=high` (filter param).

---

### H6 — Remove Contracts tab from invoice/exception detail
**Where:** Currently in `app/exceptions/[id]/page.tsx` (or `app/extract/page.tsx` — confirm by grepping).

**Rule:** Per Rajesh: *"the invoice is the baseline, you are only changing the PO and the packing slip."* The Contract tab in invoice detail confused that — remove it from the tab list. The standalone `/contracts` page (sidebar nav) stays.

**Action:** Find the tab definition (likely a `TabsList` from Radix) and delete the Contract tab + its TabsContent. Confirm no other code references it.

---

### H7 — Document comparison overlay for "Changed" docs
**Where:** New component referenced from `app/exceptions/[id]/page.tsx`.

**Rule:** When user clicks a "Changed" indicator on a PO or packing slip in the exception detail, open a **side-by-side overlay** (Radix Dialog modal, full-screen) showing the original vs. the changed document. **Never the invoice** — invoice is the baseline.

**Data shape:** Add to relevant document objects:
```ts
type ChangedDoc = {
  original: string;  // path to original PDF/HTML
  current: string;   // path to current
  diffSummary: string[]; // human-readable diffs ["Quantity 3000 → 2980", ...]
};
```

**UI:**
- Two PDF iframes side-by-side (use `<embed src="/documents/pdfs/x.pdf" />` or `<iframe>`)
- Diff summary panel below or to the right
- Close button top-right

**Skip if too heavy:** if PDF iframe rendering is sluggish, fall back to rendering the existing HTML versions in `public/documents/*.html` instead.

---

### H8 — Realistic invoice/PO PDFs (mostly already done)
**Where:** `public/documents/pdfs/`

**Status:** 12 PDFs already exist. Skim them — if any look unrealistic, regenerate via `scripts/generate-pdfs.js` (uses puppeteer + the HTML versions). No new PDFs likely needed unless Rajesh flags specific ones.

---

## Order of operations (suggested)

1. **Read** the plan (`docs/PLAN_SOM_DRUG_DISTRIBUTOR.md`) and the current state of `app/exceptions/[id]/page.tsx` end-to-end — that file is where most of the work happens.
2. **Sweep** for the contracts tab (H6) — the smallest item, do it first to warm up.
3. **H1 + H2 + H3 together** — they all touch the same action bar / decision state. Implement as one pass.
4. **H4** — small, isolated to vendor-scoring page.
5. **H5** — recharts donut on dashboard.
6. **H7** — biggest. Save for last. Side-by-side overlay component.
7. **H8** — only if Rajesh has feedback on specific PDFs.

---

## Testing checklist

After all 8 items, run through the existing `docs/DEMO_GUIDE.md` script end-to-end:
- [ ] Extract still works (gpt-4o extraction returns JSON)
- [ ] Dashboard counts up + donut renders
- [ ] Duplicates page unchanged
- [ ] Three-way match: accept on mismatch → modal appears, reason required
- [ ] Three-way match: reject on match → modal appears, reason required
- [ ] Three-way match: reject any line → Approve grey + tooltip
- [ ] Three-way match: outright Reject Invoice → confirmation modal → status = rejected
- [ ] Vendor Scoring expansion → scrolls when many exceptions
- [ ] No "Contract" tab in invoice detail
- [ ] Document comparison overlay opens for PO + packing slip (not invoice)
- [ ] All other DEMO_GUIDE flows still work (no regressions)

---

## Commit strategy

One commit per H-item, prefixed `feat(h1):`, `feat(h2):`, etc. Or batch:
- `feat: line-item decision modal + rejection rules (H1, H2, H3)`
- `feat: vendor scoring exception scroll (H4)`
- `feat: dashboard vendor risk donut (H5)`
- `chore: remove contracts tab from invoice detail (H6)`
- `feat: document comparison overlay (H7)`

Push to `main` after each batch. Rajesh (`@rjaluka`) reviews on GitHub.

---

## Hard rules

1. **Don't** modify `app/api/extract/route.ts` — just-swapped to OpenAI, leave it alone.
2. **Don't** start Phase 2 (any `/som` routes, drug distributor stuff) — that's a separate session.
3. **Don't** break the existing demo flow in `docs/DEMO_GUIDE.md`.
4. **Do** read `AGENTS.md` and `node_modules/next/dist/docs/` for any Next.js 16-specific patterns before adding routes/components.

---

## When done

1. All H1–H7 implemented + tested
2. Commits pushed to `main`
3. Update `docs/PLAN_SOM_DRUG_DISTRIBUTOR.md` §6 — mark items complete
4. Notify Gaurav so he can demo to Rajesh / Bala

---

*End of handoff. Open a new Claude Code session with `cd demo-app && claude` and paste/reference this file in the first message.*
