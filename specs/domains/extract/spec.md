# Invoice Extraction -- Specification

## Overview
The Extract page is the entry point for AI-powered invoice data extraction. It lets analysts upload a PDF invoice or select from a library of 35 recent invoices, then runs the document through the Invoice Agent to extract structured fields (vendor, bill-to, invoice metadata, line items, flags). The page uses a three-stage flow: upload/select, processing animation, and side-by-side results view with the PDF on the left and extracted data on the right. For select invoices, extraction results are cached client-side to provide instant responses.

## Acceptance Criteria

EARS notation.

**App shell**
- [ ] THE SYSTEM SHALL render the Extract page inside `SidebarProvider` + `SidebarInset` with `AppSidebar` and `SiteHeader`
- [ ] THE SYSTEM SHALL support both light and dark mode via shadcn theme tokens

**Stage 1: Upload / Select**
- [ ] THE SYSTEM SHALL render the upload zone as a shadcn `Card` with `border-dashed border-border` (200px min-height) accepting PDF files up to 10MB
- [ ] WHEN a file is selected THE SYSTEM SHALL show the file name + size and an "Upload & Extract" shadcn `Button variant="default"`
- [ ] WHILE the file is uploading THE SYSTEM SHALL render an upload progress bar using shadcn `Progress`
- [ ] WHEN extraction fails THE SYSTEM SHALL render the error in a shadcn `Alert variant="destructive"` below the upload zone
- [ ] THE SYSTEM SHALL render the document library as a container-query card grid (`grid-cols-1 @md/main:grid-cols-2 @lg/main:grid-cols-3 @xl/main:grid-cols-4`), each card a shadcn `Card`
- [ ] THE SYSTEM SHALL render document badges using shadcn `Badge`: `bg-warning/10 text-warning border-warning` for "Mismatch", `variant="destructive"` for "Duplicate" and "Suspicious", no badge otherwise

**Stage 2: Processing**
- [ ] WHEN extraction starts THE SYSTEM SHALL render a centered full-screen animation using MagicUI `AnimatedBeam` with 4 pipeline nodes (Invoice PDF → AI Extraction → Structured Data → Exception Queue)
- [ ] THE SYSTEM SHALL light up each node by switching to `bg-primary text-primary-foreground` as processing advances through the 5 steps
- [ ] THE SYSTEM SHALL render the step label and document name below the animation in `text-sm text-muted-foreground`

**Stage 3: Results**
- [ ] THE SYSTEM SHALL render a split-pane layout (left 60%, right 40%) at full viewport height
- [ ] THE SYSTEM SHALL render the left pane header bar with shadcn `Button variant="ghost"` "Back to Upload", document name, and a `Badge` if applicable
- [ ] THE SYSTEM SHALL render the PDF iframe in a shadcn `Card` with `MagicUI BorderBeam` during loading
- [ ] THE SYSTEM SHALL reveal extracted fields one-by-one with a 120ms interval until `allRevealed` is true
- [ ] WHEN `allRevealed` becomes true THE SYSTEM SHALL render the bottom action bar with "Match Against PO" (or "Search for PO Match" if `no_po_reference` flag is present) shadcn `Button variant="default"` and a "View in Exception Queue" link

**Preview overlay**
- [ ] WHEN a user clicks "Preview" THE SYSTEM SHALL open a shadcn `Dialog` (800px wide, 85vh height) showing the PDF iframe, document name, "Extract this invoice" `Button variant="default"` (for invoices), and a close button

**Loading and safety**
- [ ] WHEN the page mounts THE SYSTEM SHALL display shadcn `Skeleton` placeholders for 4 document cards for 300ms before the real library
- [ ] IF `prefers-reduced-motion` is set THEN THE SYSTEM SHALL disable the BorderBeam, AnimatedBeam, and sequential field reveal animations (fields appear all at once)
- [ ] THE SYSTEM SHALL render focus rings using `var(--ring)` on all interactive elements
- [ ] IF an extraction fails 3 times consecutively THEN THE SYSTEM SHALL stop retrying and surface a non-recoverable error in shadcn `Alert variant="destructive"`

## Layout

Renders inside `SidebarProvider` + `SidebarInset` (per v2.0 app shell).

### Stage 1: Upload / Select (v2.0)
- Full-page scrollable layout with `max-w-5xl` centered content.
- **Header**: Title `text-2xl font-semibold` "Extract Invoice" and subtitle `text-sm text-muted-foreground`.
- **Upload area**: Shadcn `Card` with `border-dashed border-border bg-muted/30`, 200px min-height. Shadcn `Progress` for upload progress.
- **Error display**: Shadcn `Alert variant="destructive"` below the upload zone on failure.
- **Recent Invoices grid**: container-query `grid-cols-1 @md/main:grid-cols-2 @lg/main:grid-cols-3 @xl/main:grid-cols-4`. Each card is a shadcn `Card` with `CardHeader` (FileText icon + vendor + date) + `CardAction` (`Badge` if any) + `CardFooter` (`Button variant="outline" size="sm"` "Preview" + `Button variant="default" size="sm"` "Extract"). Shadcn `Skeleton` shows 4-card loading for 300ms.
- **Supporting Documents**: Separate section below invoices for POs and packing slips. Cards have only "Preview" `Button variant="outline" size="sm"` (no Extract).

### Stage 2: Processing (v2.0)
- Centered full-screen animation using MagicUI AnimatedBeam.
- Four pipeline nodes in a horizontal flex row: Invoice PDF → AI Extraction → Structured Data → Exception Queue. Each node is a 48x48 rounded square with an icon. Nodes light up via `bg-primary text-primary-foreground` as processing progresses through 5 steps.
- Three AnimatedBeam connectors between nodes with staggered delays (0s, 0.7s, 1.4s).
- Progress indicator below: Loader2 spinner + step label `text-sm text-muted-foreground` + document name `text-foreground`. Shadcn `Progress` shown during file uploads.

### Stage 3: Results (v2.0)
- Split-pane layout: Left 60%, Right 40%, full viewport height.
- **Left pane**: Header bar with shadcn `Button variant="ghost"` "Back to Upload", document name `text-base font-semibold`, `Badge`. PDF iframe in a shadcn `Card` with `bg-muted/30`. MagicUI BorderBeam on the iframe during loading.
- **Right pane**: Scrollable extracted fields panel. Fields appear one-by-one via sequential reveal (120ms per field). Organized into field groups using shadcn `Card`s: Vendor, Bill To, Invoice, Line Items (shadcn `Table`), Flags Detected (shadcn `Badge` per flag, variant per severity).
- **Bottom action bar** (right pane): Shadcn `Button variant="default"` "Match Against PO" or "Search for PO Match" + `Button variant="link"` "View in Exception Queue". Appears after `allRevealed`.

### Preview Overlay (v2.0)
- Shadcn `Dialog` (800px wide, 85vh height) with backdrop blur. `DialogHeader` (document name), `DialogContent` (PDF iframe in `bg-muted/30` container), `DialogFooter` with shadcn `Button variant="default"` "Extract this invoice" (for invoices) + `Button variant="ghost"` close.

## Business Rules

### Document Library
- **35 invoices** from 18 vendors (Steris, MedSupply, MedTech, Cardinal Health, BioMed, Medline, Henry Schein, Owens & Minor, Becton Dickinson, Stryker, Baxter, J&J MedTech, Abbott, GE Healthcare, McKesson, Philips, Zimmer Biomet, Teleflex).
- **2 supporting documents**: 1 Purchase Order (Northfield Medical), 1 Packing Slip (Steris).
- **Badge types**: `match_exception` ("Mismatch", warning style), `duplicate` ("Duplicate", critical style), `suspicious` ("Suspicious", critical style), `null` (no badge).
- 8 invoices have badges; 27 invoices and 2 supporting docs have no badge.

### Cached Extractions
Four invoices have pre-cached extraction results that bypass the API:
1. **STC-2026-19847** (Steris): 6 line items, 2 flags (price_mismatch critical, quantity_mismatch warning), total $27,750.
2. **MS-2026-0923** (MedSupply): 10 line items, 1 flag (duplicate_invoice critical), total $47,320.
3. **MS-2026-0847** (MedSupply): 10 line items, no flags, total $47,120.
4. **MTS-INV-00291** (MedTech): 6 line items, 4 flags (no_po_reference, vendor_not_standard, non_standard_payment_terms, mixed_product_and_services), total $45,200.

### Processing Steps (cached documents)
Sequential animation with labeled steps:
| Step | Duration | Label                      |
|------|----------|----------------------------|
| 0    | --       | Preparing extraction...    |
| 1    | 800ms    | Reading invoice PDF...     |
| 2    | 1000ms   | Extracting with AI...      |
| 3    | 800ms    | Structuring data...        |
| 4    | 400ms    | Checking for exceptions... |

Total cached extraction animation: ~3,000ms.

### Flag Types and Severity
| Flag Code                    | Display Label              | Severity |
|------------------------------|----------------------------|----------|
| no_po_reference              | No PO Reference            | critical |
| non_standard_payment_terms   | Net 15 (non-standard)      | warning  |
| vendor_not_standard          | Vendor not in master       | critical |
| mixed_product_and_services   | Mixed product + services   | warning  |
| duplicate_invoice            | Duplicate Invoice          | critical |
| price_mismatch               | Price Mismatch             | critical |
| quantity_mismatch            | Quantity Mismatch          | warning  |

### Sequential Field Reveal
When extraction completes, fields appear one at a time with a 120ms interval. A counter (`revealIndex`) increments and each field checks whether its position has been reached. The bottom action bar only appears after `allRevealed` is true.

### Exception Deep-Linking
A mapping (`DOC_TO_EXCEPTION`) connects 10 invoice IDs to their corresponding exception IDs (e.g., `invoice-STC-2026-19847` -> `EX-006`). The "Match Against PO" button navigates to `/exceptions/{exId}`. If no mapping exists, it navigates to `/exceptions`.

### Special Case: No PO Reference
If extracted flags include `no_po_reference`, the bottom action button changes from "Match Against PO" to "Search for PO Match" and navigates directly to `/exceptions/EX-003`.

## Data Model

### Interfaces
- **`Document`**: `{ id: string, label: string, sub: string, type: "invoice" | "po" | "packing_slip", badge: "match_exception" | "duplicate" | "suspicious" | null }`
- **`ExtractedData`**: `{ vendor?: { name, address, email, phone }, billTo?: { name, address }, invoiceNumber?, invoiceDate?, poReference?, paymentTerms?, dueDate?, totalAmount?, lineItems?: Record<string, unknown>[], flags?: ExtractedFlag[] | string[] }`
- **`ExtractedFlag`**: `{ code: string, severity?: string }`
- **`LineItem`**: `{ code, description, qty, unit_price, total }`

### Data Sources
- **`initialDocuments`** (inline): Static array of 37 Document objects defined in `app/extract/page.tsx`.
- **`CACHED_EXTRACTIONS`** (inline): Record of 4 pre-computed extraction results keyed by document ID.
- **`DOC_TO_EXCEPTION`** (inline): Record mapping 10 invoice IDs to exception IDs.
- **API endpoint**: `POST /api/extract` -- called for non-cached documents. Accepts JSON `{ document: docId }` or multipart FormData with a file field.

### Data Relationships
- Document IDs follow the pattern `invoice-{VENDOR_PREFIX}-{NUMBER}` or `po-{...}` / `packingslip-{...}`.
- The document list is mutable -- uploaded files are prepended as new entries with `id: "uploaded-{timestamp}"`.
- Exception IDs in `DOC_TO_EXCEPTION` link to the exceptions module at `/exceptions/{exId}`.

## Workflow
1. **Page load**: Stage 1 renders. Document list shows skeleton for 300ms then populates a 4-column card grid of 35 invoices + 2 supporting docs.
2. **Upload flow**: Analyst drags or clicks to select a PDF. File name and size appear. Clicking "Upload & Extract" posts to `/api/extract` as FormData. Stage transitions to Processing, then Results.
3. **Select-and-extract flow**: Analyst clicks "Extract" on an invoice card. If cached, the 3-second processing animation plays. If not cached, a real API call is made to `/api/extract`.
4. **Preview flow**: Analyst clicks "Preview" to open a modal with the PDF iframe. From the modal, they can click "Extract this invoice" to start extraction.
5. **Results view**: PDF displays on the left. Extracted fields reveal sequentially on the right. After all fields are shown, action buttons appear at the bottom.
6. **Navigation from results**: "Match Against PO" goes to the exceptions page. "Back to Upload" returns to Stage 1.

## State Machine

```
idle ──→ uploading ──→ processing ──→ results
                          │
                          └──→ error
```

| From | To | Trigger | Actor |
|------|----|---------|-------|
| idle | uploading | User selects or drops a document | User |
| uploading | processing | Document upload completes, AI extraction begins | System |
| processing | results | AI extraction succeeds, fields populated | System |
| processing | error | AI extraction fails (corrupt file, unsupported format) | System |
| results | idle | User starts a new extraction | User |
| error | idle | User dismisses error and starts over | User |

## Dependencies

| Domain | Relationship | Detail |
|--------|-------------|--------|
| Pipeline | feeds into | Extracted invoice data enters the 5-agent pipeline for processing |
| Exceptions | feeds into | Extraction flags (missing PO, suspicious amounts) create exceptions |
| Invoice Detail | feeds into | Extracted fields populate the three-way match comparison view |
| Dashboard | feeds into | Processing counts and extraction stats on dashboard |

## Forbidden Patterns

Use affirmative phrasing per SpecLayer v1.1.

- **Scrub PII before transmitting any invoice content to external APIs** — Reason: invoices may contain patient names, SSNs, or other PHI; HIPAA requires sanitization.
- **Require explicit user review of AI-extracted field values before they enter the pipeline** — Reason: OCR and AI extraction have error rates; critical fields (amounts, PO numbers, vendor IDs) need verification.
- **Store original documents in object storage (S3/MinIO); store only metadata and extracted fields in the database** — Reason: documents are large binary blobs; databases store structured data.
- **Cap retries at 3; surface the error after the third failure** — Reason: repeated failures indicate a structural issue (corrupt file, unsupported format); retries waste compute and delay the user.
- **Use shadcn `Card`, `Button`, `Badge`, `Alert`, `Progress`, `Dialog`, `Table` primitives for the upload zone, document cards, action buttons, error display, upload progress, preview modal, and line items table** — Reason: deprecates `.card`, `.alert-bar`, `.badge.*` utility classes and custom modal implementations from v1.
- **Use theme tokens (`bg-card`, `bg-muted/30`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-destructive`) for all surfaces, text, and node-lit states** — Reason: hex tokens (`--acl-primary`, `--critical`, `--warning`) removed in v2.0.
- **Use container queries (`@md/main`, `@lg/main`, `@xl/main`) for the document library grid responsive layout** — Reason: shadcn dashboard-01 standard; better than media queries for component-level responsiveness.

## AJ Feedback (Parkland Demo)
- Note: Pending -- no specific feedback for this module yet.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
<!-- 2026-05-18 v2.0: Adopted shadcn/ui design system per ui-standard.md v2.0. App shell wraps in SidebarProvider+SidebarInset. Upload zone, document cards, results panes → shadcn `Card`. Document library grid uses container queries (@md/main, @lg/main, @xl/main). Action buttons → shadcn `Button` variants. Document badges → shadcn `Badge` (variant="destructive" for Duplicate/Suspicious, bg-warning/10 for Mismatch). Error display → shadcn `Alert variant="destructive"`. Upload progress → shadcn `Progress`. Preview overlay → shadcn `Dialog`. Line items table → shadcn `Table`. Loading → `Skeleton`. Pipeline nodes lit via bg-primary instead of --acl-primary. MagicUI AnimatedBeam + BorderBeam retained. Added 16 EARS Acceptance Criteria. Forbidden Patterns rewritten in affirmative form per SpecLayer v1.1. -->
