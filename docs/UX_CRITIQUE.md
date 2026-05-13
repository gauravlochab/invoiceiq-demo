# InvoiceIQ Detect — Comprehensive UX & Functional Critique

**Perspective:** Hospital procurement analyst / AP manager evaluating this portal for daily use  
**Date:** May 2026  
**Scope:** Every page, every clickable element, every visible flow

---

## EXECUTIVE SUMMARY

The app has strong bones — the data model is realistic, the agent pipeline concept is compelling, and the extraction flow is genuinely impressive. But 23 issues would break credibility in a live hospital demo. The most dangerous ones are **silent no-ops** (buttons that look functional but do nothing), **hardcoded numbers that contradict computed data**, and **a date range selector that doesn't filter anything**.

### Severity Distribution
- **P0 — Demo-breaking** (would be caught in first 5 minutes): 7 issues
- **P1 — Credibility risk** (sharp observer catches it): 8 issues
- **P2 — Polish gap** (noticed over extended use): 8 issues

---

## P0 — DEMO-BREAKING ISSUES

### 1. Dashboard date range selector is cosmetic-only
**Page:** Dashboard (`/`)  
**What happens:** User selects "Q4 2025" or "Last 30 days" — the pill label changes but every KPI card, chart, and metric stays identical. The "1,847 invoices processed" subtitle and "Q1 2026" label remain frozen regardless of selection.  
**Why it's P0:** This is the first interactive element a demo viewer will touch. The disconnect is immediately obvious.  
**Fix:** Either (a) remove the selector and show a static "Q1 2026" label, or (b) create 3-4 pre-computed data snapshots and swap them on selection.

### 2. "Run Scan" always finds exactly 2 new exceptions
**Page:** Dashboard (`/`)  
**What happens:** The button runs a 2-second `setTimeout`, then shows the toast "Scan complete — 2 new exceptions identified for review." No actual exceptions are added to the data. Click it 5 times → 5 identical toasts, exception count unchanged.  
**Why it's P0:** Demonstrates that the "AI scanning" is fake if anyone clicks twice.  
**Fix:** Either (a) add 1-2 real exceptions from a reserve pool on first click, then show "No new exceptions" on subsequent clicks, or (b) disable the button after one click per session with "Last scan: just now."

### 3. Command Palette actions are dead
**Page:** Global (Cmd+K)  
**What happens:** "Run Scan", "Export as CSV", "Export as PDF" in the command palette call `onClose()` only — zero actual functionality.  
**Why it's P0:** Power users (AJ's audience) will try Cmd+K immediately. Dead actions in the palette look unfinished.  
**Fix:** Wire "Run Scan" to the dashboard scan function, wire exports to ExportDialog, or remove these 3 items from the palette.

### 4. "Sign Out" button in session timeout dialog does nothing
**Page:** Global (SessionTimeout component)  
**What happens:** After 25 minutes idle, the warning dialog appears with "Extend Session" and "Sign Out." Sign Out calls `setShowWarning(false)` — it closes the dialog and returns to the app. No logout, no redirect.  
**Why it's P0:** Security-conscious hospital IT will test the timeout. A non-functional Sign Out is a compliance red flag.  
**Fix:** Navigate to a `/signed-out` static page, or at minimum `router.push("/")` with a toast "Session ended."

### 5. Exceptions page: escalate without selecting a manager succeeds
**Page:** Exceptions list (`/exceptions`)  
**What happens:** The Escalate modal's confirm button has no guard on `selectedManager`. A user can click "Escalate" with the dropdown still showing "Choose a manager..." and get a success toast.  
**Why it's P0:** In a hospital AP workflow, escalation without an assignee is a broken audit trail.  
**Fix:** Add `disabled={!selectedManager}` to the Escalate confirm button.

### 6. Duplicates "$56,070 at risk" is provably wrong
**Page:** Exceptions list (`/exceptions`) — Duplicates tab  
**What happens:** The banner reads "AI scanned 1,847 invoices · 3 pairs flagged · $56,070 at risk." The actual sum of `duplicatePairs.flaggedAmount` is $68,650. With DUP-002 resolved, the open risk is $59,900. Neither matches.  
**Why it's P0:** Any analyst in the room will mental-math the three pair amounts shown on the same page and catch the discrepancy.  
**Fix:** Compute the banner values dynamically: `pairs.filter(p => p.status !== 'resolved').reduce(...)`.

### 7. `/contracts` and `/duplicates` pages are orphaned
**Page:** Sidebar, Command Palette  
**What happens:** These two pages exist and are linked from KPI cards, but have no sidebar entry and no command palette entry. A user who navigates there has no way back except browser back button — the sidebar shows no active highlight.  
**Why it's P0:** Navigating to contracts via KPI card → looking at sidebar → no "Contracts" entry → user is lost.  
**Fix:** Add both to the sidebar (Healthcare section) and to the command palette `navItems`.

---

## P1 — CREDIBILITY RISK ISSUES

### 8. Dashboard KPI values are hardcoded, not computed
**Page:** Dashboard (`/`)  
**What happens:** "Invoices Processed" (1,847), "Amount at Risk" ($396,390), "Recovered" ($12,640), "Contracts at Risk" (3) are all literal numbers in the `kpiCards` array. If the underlying data changes (e.g., after initiating recovery), these cards don't update.  
**Risk:** After a demo of the recovery flow, returning to the dashboard shows identical numbers — the system appears to not track anything.  
**Fix:** Import and compute from `allExceptions`, `recoveryQueue`, `contracts`.

### 9. Dashboard "My View" toggle provides no personalized content
**Page:** Dashboard (`/`)  
**What happens:** Clicking "My View" hides the charts and agent status bar. What remains is the same KPI cards and exceptions table — no user name, no assigned items, no "your exceptions" filter.  
**Risk:** In a demo, switching to "My View" looks like a feature that was abandoned mid-development.  
**Fix:** Either remove "My View" entirely, or add at minimum a "Welcome, [Name]" header and filter the exceptions table to show only "assigned to you" items.

### 10. Spend chart has no Y-axis labels
**Page:** Dashboard (`/`)  
**What happens:** The "Spend & Exception Trend" ComposedChart renders with no `<YAxis>` — there are no tick marks or scale labels. The chart shows relative shapes but the viewer can't determine actual dollar values without hovering each point.  
**Risk:** A CFO reviewing the dashboard will ask "what's the scale?"  
**Fix:** Add `<YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />`.

### 11. Agent status bar values are static strings
**Page:** Dashboard (`/`)  
**What happens:** "reviewing Cardinal", "$470K target", "4 high-risk" are hardcoded strings with pulse animations suggesting live activity. Nothing ever changes.  
**Risk:** The pulsing animations create an expectation of real-time updates. When nothing changes after 5 minutes of use, the deception is obvious.  
**Fix:** Either remove the pulse animation (present as a static snapshot) or derive values from data.

### 12. Reject/Override with blank notes produces success toast
**Page:** Exceptions list (`/exceptions`) — Duplicates tab  
**What happens:** Rejecting or overriding a duplicate pair with an empty justification textarea still succeeds. For "Reject" it shows a "warning" toast (not even "success"), which looks like an error.  
**Risk:** In a hospital audit context, actions without justification are compliance violations.  
**Fix:** Add `disabled={!modalNote.trim()}` to the confirm buttons in Reject and Override modals.

### 13. Manager lists are inconsistent across the app
**Page:** Exceptions list (`/exceptions`)  
**What happens:** The Escalate modal offers: David Kim, Lisa Rodriguez, Michael Chang, Jennifer Walsh. The Assign dropdown offers: Rajesh Jaluka, David Kim, Lisa Rodriguez, Michael Chang. Two different lists for similar roles.  
**Risk:** A viewer will notice that "the available managers change depending on which button I click."  
**Fix:** Use a single shared `MANAGERS` constant imported from `lib/data.ts`.

### 14. Recovery page reads data only on mount
**Page:** Recovery (`/recovery`)  
**What happens:** `useEffect(() => { setRecords([...recoveryQueue]); }, [])` runs once. If a user adds a recovery record via the exceptions detail page, then navigates to `/recovery`, the new record appears (SPA re-mounts). But if they're already on `/recovery` and another flow adds a record, the list is stale until re-navigation.  
**Risk:** In a demo walking through "initiate recovery → see it in queue", the presenter must navigate away and back. If they don't, the queue looks empty.  
**Fix:** Accept this SPA limitation (it works on navigation) or add a "Refresh" button.

### 15. Error boundary says "Our team has been notified" with no error reporting
**Page:** Global (`error.tsx`)  
**What happens:** The error page displays "Our team has been notified and is working on a fix" but no Sentry, LogRocket, or any error reporting service is wired up.  
**Risk:** A technical reviewer will check the network tab and see no outbound error report.  
**Fix:** Change copy to "Please try again or contact support" — no false claims.

---

## P2 — POLISH GAPS

### 16. No mobile responsive layout
**Page:** All pages  
**What happens:** The sidebar is always visible (52px collapsed or 216px expanded). Dashboard KPI grid is `grid-cols-5` with no breakpoints. Charts use fixed pixel widths. On mobile/tablet, content is compressed to unusable widths.  
**Risk:** If anyone opens the demo on a phone or pulls up a tablet comparison.  
**Fix:** Add responsive breakpoints: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`, mobile sidebar drawer. (Low priority for desktop-focused demo.)

### 17. Select-all checkbox lacks indeterminate state
**Page:** Exceptions list (`/exceptions`)  
**What happens:** When some (but not all) rows are selected, the header checkbox shows unchecked instead of indeterminate (dash). This is a standard table UX convention.  
**Fix:** Add `ref.indeterminate = someSelected && !allSelected` on the checkbox element.

### 18. Sort doesn't reset pagination on exceptions page
**Page:** Exceptions list (`/exceptions`)  
**What happens:** Navigating to page 3, then clicking a sort header, keeps you on page 3 — which now shows different rows. Filter and search correctly reset to page 1, but sort does not.  
**Fix:** Add `setPageIndex(0)` in `handleSort()`. (Vendor scoring page already does this correctly.)

### 19. Modal notes state leaks between different modal types
**Page:** Exceptions list (`/exceptions`)  
**What happens:** Open Reject modal → type "testing" → cancel → open Override modal → the textarea pre-populates with "testing." The `modalNote` state is shared across all three modal types and only cleared on submit, not on cancel/close.  
**Fix:** Add `setModalNote("")` to the cancel/backdrop-click handlers.

### 20. Skeleton shape mismatch on dashboard
**Page:** Dashboard (`/`)  
**What happens:** The loading skeleton shows a `w-[160px] h-[160px] rounded-full` donut placeholder, but the actual loaded content is a horizontal proportional bar chart. The shape mismatch is noticeable during the 400ms transition.  
**Fix:** Change the skeleton to a horizontal bar shape matching the actual "By Category" bar.

### 21. Notification panel has no focus trap
**Page:** Global (TopBar)  
**What happens:** Clicking the bell icon opens a notification panel. Pressing Tab cycles focus through elements behind the panel, not within it. No `role="dialog"` or `aria-modal`.  
**Fix:** Add focus trap and `role="dialog"` to the notification panel.

### 22. Exception modals lack accessibility attributes
**Page:** Exceptions list (`/exceptions`)  
**What happens:** The Reject/Override/Escalate modals have no `role="dialog"`, no `aria-modal`, no `aria-labelledby`, no focus trap, and no Escape key handler.  
**Fix:** Use the existing Radix Dialog component (already used elsewhere) instead of custom modals, or add the missing attributes.

### 23. "Review →" links are non-descriptive for screen readers
**Page:** Exceptions list (`/exceptions`)  
**What happens:** All table rows have "Review →" as link text. A screen reader listing all links announces "Review, Review, Review..." with no context.  
**Fix:** Add `aria-label={`Review exception ${ex.id}`}` to each link.

---

## PAGES WITH NO ISSUES FOUND

These pages passed the audit with no functional, UX, or accessibility issues worth calling out:

| Page | Notes |
|------|-------|
| **Extract** (`/extract`) | Upload flow simulates extraction convincingly. 35 invoice cards fill the screen. Badge colors are correct. The extraction detail panel with progressive field reveal is impressive. |
| **Pipeline** (`/pipeline`) | The 5-agent pipeline animation is well-timed (1.4s per step). Feed events are realistic. Progress bar works. Toast on completion. Only note: all agent stat values are static strings (same pattern as dashboard). |
| **Vendor Scoring** (`/vendor-scoring`) | Sort works, pagination works, flag dropdown with toast feedback, expanded detail rows. Sort correctly resets pagination. Well-implemented. |
| **Product Analysis** (`/product-analysis`) | Data is fully computed from `allExceptions`. Chart tooltips work. Sort works. Clean page. |
| **Exception Detail** (`/exceptions/[id]`) | All action buttons create real records, update statuses, show toasts, and display "View in Recovery Queue" links. The typed exception pages (EX-003, EX-006) are rich and detailed. |
| **SOM Module** (`/som/*`) | Override modal with justification capture, audit log, pharmacy scoring, order detail — all functional. Separate data model is correct for drug distributor context. |

---

## RECOMMENDED IMPLEMENTATION ORDER

### Sprint 1 (Critical — 1 day)
1. Fix date range: remove selector or make it filter data (#1)
2. Fix "Run Scan" to be one-shot or add real exceptions (#2)
3. Fix Command Palette dead actions (#3)
4. Fix "Sign Out" button (#4)
5. Add escalate modal manager validation (#5)
6. Compute duplicate banner values dynamically (#6)
7. Add `/contracts` and `/duplicates` to sidebar + palette (#7)

### Sprint 2 (Trust signals — 1 day)
8. Compute dashboard KPIs from data (#8)
9. Fix or remove "My View" toggle (#9)
10. Add Y-axis to spend chart (#10)
11. Remove agent status pulse or derive values (#11)
12. Add blank-note validation to duplicate modals (#12)
13. Unify manager lists (#13)
14. Fix error boundary copy (#15)

### Sprint 3 (Polish — if time permits)
15. Remaining accessibility fixes (#17, 21, 22, 23)
16. Sort pagination reset (#18)
17. Modal state leak (#19)
18. Skeleton shape match (#20)
19. Mobile responsive (out of scope for desktop demo)
