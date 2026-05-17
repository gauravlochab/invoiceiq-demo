export interface SpecEntry {
  slug: string;
  title: string;
  group: "rules" | "domains";
  filePath: string;
  description: string;
}

export const specRegistry: SpecEntry[] = [
  { slug: "mission", title: "Mission", group: "rules", filePath: "specs/rules/mission.md", description: "Product vision, target market, value proposition, and success metrics" },
  { slug: "architecture", title: "Architecture", group: "rules", filePath: "specs/rules/architecture.md", description: "Tech stack, application structure, component library, and data layer" },
  { slug: "ui-standard", title: "UI Standard", group: "rules", filePath: "specs/rules/ui-standard.md", description: "Design tokens, component patterns, responsive rules, and accessibility" },
  { slug: "memory", title: "AI Context", group: "rules", filePath: "specs/rules/memory.md", description: "Spec-driven workflow, decision log conventions, and AI agent guidelines" },
  { slug: "audit-trail", title: "Audit Trail", group: "rules", filePath: "specs/rules/audit-trail.md", description: "Append-only audit logging standard, entry schema, and retention policy" },
  { slug: "events", title: "Events", group: "rules", filePath: "specs/rules/events.md", description: "Domain event contracts, naming conventions, and cross-domain registry" },
  { slug: "dashboard", title: "Dashboard", group: "domains", filePath: "specs/domains/dashboard/spec.md", description: "KPI cards, agent status strip, tabbed charts and exceptions" },
  { slug: "exceptions", title: "Exceptions", group: "domains", filePath: "specs/domains/exceptions/spec.md", description: "Exception list with filtering, sorting, and bulk actions" },
  { slug: "invoice-detail", title: "Invoice Detail", group: "domains", filePath: "specs/domains/invoice-detail/spec.md", description: "Three-way match, discrepancy view, agree/disagree workflow" },
  { slug: "pipeline", title: "Pipeline", group: "domains", filePath: "specs/domains/pipeline/spec.md", description: "5-agent pipeline visualization with real-time run simulation" },
  { slug: "recovery", title: "Recovery", group: "domains", filePath: "specs/domains/recovery/spec.md", description: "Recovery tracking, vendor outreach, and credit memo management" },
  { slug: "extract", title: "Extract", group: "domains", filePath: "specs/domains/extract/spec.md", description: "Invoice upload, AI extraction, and field mapping" },
  { slug: "contracts", title: "Contracts", group: "domains", filePath: "specs/domains/contracts/spec.md", description: "GPO contract compliance, spend-vs-cap, and renewal tracking" },
  { slug: "vendor-scoring", title: "Vendor Scoring", group: "domains", filePath: "specs/domains/vendor-scoring/spec.md", description: "Composite risk scores, trend analysis, and vendor actions" },
  { slug: "product-analysis", title: "Product Analysis", group: "domains", filePath: "specs/domains/product-analysis/spec.md", description: "Category analysis, standardization, and product matching" },
  { slug: "som", title: "SOM", group: "domains", filePath: "specs/domains/som/spec.md", description: "Suspicious order monitoring, pharmacy scoring, DEA compliance" },
];

export function getSpecBySlug(slug: string): SpecEntry | undefined {
  return specRegistry.find((s) => s.slug === slug);
}
