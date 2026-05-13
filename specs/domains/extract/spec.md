# Invoice Extraction -- Specification

## Overview
The Extract page is the entry point for AI-powered invoice data extraction. It lets analysts upload a PDF invoice or select from a library of 35 recent invoices, then runs the document through the Invoice Agent to extract structured fields (vendor, bill-to, invoice metadata, line items, flags). The page uses a three-stage flow: upload/select, processing animation, and side-by-side results view with the PDF on the left and extracted data on the right. For select invoices, extraction results are cached client-side to provide instant demo responses.

## Layout

### Stage 1: Upload / Select
- **Full-page scrollable layout** with `max-w-5xl` centered content.
- **Header**: Title "Extract Invoice" and subtitle.
- **Upload area**: A large drag-and-drop zone (dashed border, 200px min-height). Accepts PDF files up to 10MB. Shows file name, size, and "Upload & Extract" button when a file is selected. Shows upload progress bar during upload.
- **Error display**: Red `alert-bar critical` below the upload zone if extraction fails.
- **Recent Invoices grid**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` card grid. Each card shows a FileText icon, vendor name, date subtitle, optional badge (Mismatch/Duplicate/Suspicious), and two action buttons: "Preview" and "Extract". Shows 4-card skeleton loading for 300ms on mount.
- **Supporting Documents**: Separate section below invoices for POs and packing slips. Cards have only a "Preview" button (no extract).

### Stage 2: Processing
- **Centered full-screen animation** using MagicUI AnimatedBeam.
- **Four pipeline nodes** in a horizontal flex row: Invoice PDF -> AI Extraction -> Structured Data -> Exception Queue. Each node is a 48x48px rounded square with an icon. Nodes light up (turn `--acl-primary` background with white icon) as processing progresses through 5 steps.
- **Three AnimatedBeam connectors** between nodes with staggered delays (0s, 0.7s, 1.4s).
- **Progress indicator** below: Spinner + step label ("Reading invoice PDF...", "Extracting with AI...", etc.) + document name. Upload progress bar shown during file uploads.

### Stage 3: Results
- **Split-pane layout**: Left 60%, Right 40%, full viewport height.
- **Left pane**: Header bar with "Back to Upload" button, document name, badge. Below: PDF iframe in a subtle-bg container with rounded corners. BorderBeam animation on the iframe during loading.
- **Right pane**: Scrollable extracted fields panel. Fields appear one-by-one via a sequential reveal animation (120ms per field). Organized into field groups: Vendor, Bill To, Invoice, Line Items (table), Flags Detected.
- **Bottom action bar** (right pane): Appears after all fields are revealed. Shows "Match Against PO" or "Search for PO Match" (if no PO reference) button, plus "View in Exception Queue" link.

### Preview Overlay
- Modal dialog (800px wide, 85vh height) with backdrop blur. Shows PDF iframe, document name, "Extract this invoice" button (for invoices), and close button.

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

## AJ Feedback (Parkland Demo)
- Note: Pending -- no specific feedback for this module yet.

<!-- CHANGELOG -->
<!-- 2026-05-14: Initial spec created from current codebase -->
