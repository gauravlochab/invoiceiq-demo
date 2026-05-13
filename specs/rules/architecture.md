# InvoiceIQ Detect — Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.2 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS v4 | 4.x |
| Charts | Recharts | 3.8.1 |
| Icons | Lucide React | 1.7.0 |
| Primitives | Radix UI (Dialog, Tabs, Dropdown, Avatar, Progress) | latest |
| Table | TanStack React Table | 8.x |
| Animation | Framer Motion | 12.x |
| Command Palette | cmdk | 1.x |
| Testing | Vitest + Testing Library + Playwright | 4.x / 16.x / 1.60 |

## Application Structure

```
app/
├── page.tsx              → Dashboard (KPI cards, agent strip, charts)
├── layout.tsx            → Root layout (sidebar, topbar, toast provider)
├── globals.css           → Design tokens + utility classes
├── pipeline/page.tsx     → AI agent pipeline view
├── exceptions/
│   ├── page.tsx          → Exception list (filterable, sortable)
│   └── [id]/page.tsx     → Exception detail (10+ templates by type)
├── recovery/page.tsx     → Recovery tracking + trend charts
├── extract/page.tsx      → Invoice extraction + field mapping
├── contracts/page.tsx    → GPO contract comparison
├── vendor-scoring/       → Vendor risk scorecards
├── product-analysis/     → Category analysis + standardization
├── duplicates/           → Duplicate invoice management
├── som/                  → Suspicious Order Monitoring
│   ├── page.tsx          → SOM dashboard
│   ├── order/[id]/       → Order detail
│   ├── exceptions/       → SOM-specific exceptions
│   ├── pharmacy-scoring/ → Pharmacy risk scores
│   ├── manufacturers/    → Manufacturer directory
│   └── audit-log/        → DEA audit trail
├── agents/page.tsx       → Agent management
└── api/
    ├── extract/          → Invoice extraction API
    └── som/npi/          → NPI lookup API
```

## Data Layer (Current State)

**No backend yet.** All data is mock, defined in:
- `lib/data.ts` — Exceptions, line items, contracts, duplicates, categories
- `lib/vendors.ts` — Vendor profiles, risk scores, brand colors
- `lib/audit-trail.ts` — Audit trail entries, workflow steps

Key interfaces: `Exception`, `InvoiceLineItem`, `DuplicatePair`, `Contract`, `Vendor`

## Component Library

Shared components in `components/`:
- `Sidebar.tsx` — Navigation with section grouping and badge counts
- `TopBar.tsx` — Breadcrumb, search (cmdk), sync status, notifications
- `CommandPalette.tsx` — Global search (Cmd+K)
- `Toast.tsx` — Toast notification system
- `LegalDisclaimerDialog.tsx` — Legal confirmation before actions
- `CategoryBadge.tsx` — Color-coded product category badges
- `VendorBadge.tsx` — Vendor avatar + name
- `EscalationBanner.tsx` — Manager approval required banner
- `WorkflowStepper.tsx` — Multi-step workflow progress
- `AuditTrail.tsx` — Agent/user activity timeline
- `GPOComparisonSection.tsx` — Contract price comparison table
- `DiscrepancyBarChart.tsx` — Recharts bar chart for discrepancies
- `ExportDialog.tsx` — CSV/PDF export modal
- `magicui/` — Animated UI primitives (border beam, shimmer)

## Exception Templates

The `exceptions/[id]/page.tsx` file uses template routing based on exception type:

| Exception Type | Template Function | Used By |
|---------------|-------------------|---------|
| `match_exception` (EX-006) | `Ex006Page` | Full three-way match with Agree/Disagree |
| `match_exception` (EX-007, EX-010) | `MatchExceptionDetail` | Read-only three-way match |
| `duplicate` | `DuplicateDetail` | Side-by-side invoice comparison |
| `contract_overage` | `ContractOverageDetail` | Contract cap analysis |
| `suspicious_invoice` | `SuspiciousInvoiceDetail` | Fraud indicators |
| `missing_rebate` | `MissingRebateDetail` | Rebate shortfall analysis |
| `tier_pricing` | `TierPricingDetail` | Volume discount analysis |
| SOM types | `SOMExceptionDetail` | Suspicious order analysis |

## Future Architecture (Planned)

- Backend: FastAPI or Node.js API layer
- Database: PostgreSQL with vector extensions for similarity search
- AI: Anthropic Claude API for document extraction and analysis
- Queue: Celery/Redis for async invoice processing
- Storage: S3 for document storage
- Auth: SSO (SAML/OIDC) for enterprise customers
