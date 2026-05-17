import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

export interface SpecNodeData {
  slug: string;
  title: string;
  group: "rules" | "domains";
  description: string;
  [key: string]: unknown;
}

const DOMAIN_W = 210;
const DOMAIN_H = 100;
const RULE_W = 170;
const RULE_H = 55;

const domainNodes: Node<SpecNodeData>[] = [
  { id: "extract",          type: "domainNode", position: { x: 0, y: 0 }, data: { slug: "extract",          title: "Extract",          group: "domains", description: "Invoice upload, AI extraction, field mapping" } },
  { id: "pipeline",         type: "domainNode", position: { x: 0, y: 0 }, data: { slug: "pipeline",         title: "Pipeline",         group: "domains", description: "5-agent pipeline visualization" } },
  { id: "exceptions",       type: "domainNode", position: { x: 0, y: 0 }, data: { slug: "exceptions",       title: "Exceptions",       group: "domains", description: "Exception list with filtering, sorting" } },
  { id: "contracts",        type: "domainNode", position: { x: 0, y: 0 }, data: { slug: "contracts",        title: "Contracts",        group: "domains", description: "GPO contract compliance, spend-vs-cap" } },
  { id: "som",              type: "domainNode", position: { x: 0, y: 0 }, data: { slug: "som",              title: "SOM",              group: "domains", description: "Suspicious order monitoring, DEA compliance" } },
  { id: "product-analysis", type: "domainNode", position: { x: 0, y: 0 }, data: { slug: "product-analysis", title: "Product Analysis", group: "domains", description: "Category analysis, product matching" } },
  { id: "invoice-detail",   type: "domainNode", position: { x: 0, y: 0 }, data: { slug: "invoice-detail",   title: "Invoice Detail",   group: "domains", description: "Three-way match, agree/disagree workflow" } },
  { id: "recovery",         type: "domainNode", position: { x: 0, y: 0 }, data: { slug: "recovery",         title: "Recovery",         group: "domains", description: "Recovery tracking, vendor outreach" } },
  { id: "vendor-scoring",   type: "domainNode", position: { x: 0, y: 0 }, data: { slug: "vendor-scoring",   title: "Vendor Scoring",   group: "domains", description: "Composite risk scores, trend analysis" } },
  { id: "dashboard",        type: "domainNode", position: { x: 0, y: 0 }, data: { slug: "dashboard",        title: "Dashboard",        group: "domains", description: "KPI cards, agent status, tabbed charts" } },
];

const ruleNodes: Node<SpecNodeData>[] = [
  { id: "mission",      type: "ruleNode", position: { x: 0, y: 0 },   data: { slug: "mission",      title: "Mission",      group: "rules", description: "Product vision, target market, value proposition" } },
  { id: "architecture", type: "ruleNode", position: { x: 0, y: 0 },   data: { slug: "architecture", title: "Architecture", group: "rules", description: "Tech stack, app structure, component library" } },
  { id: "ui-standard",  type: "ruleNode", position: { x: 0, y: 0 },   data: { slug: "ui-standard",  title: "UI Standard",  group: "rules", description: "Design tokens, responsive rules, accessibility" } },
  { id: "memory",       type: "ruleNode", position: { x: 0, y: 0 },   data: { slug: "memory",       title: "AI Context",   group: "rules", description: "Spec-driven workflow, AI agent guidelines" } },
  { id: "audit-trail",  type: "ruleNode", position: { x: 0, y: 0 },   data: { slug: "audit-trail",  title: "Audit Trail",  group: "rules", description: "Append-only logging, entry schema, retention" } },
  { id: "events",       type: "ruleNode", position: { x: 0, y: 0 },   data: { slug: "events",       title: "Events",       group: "rules", description: "Domain event contracts, naming conventions" } },
];

const edges: Edge[] = [
  { id: "e-extract-pipeline",            source: "extract",        target: "pipeline",       data: { label: "invoices enter pipeline" } },
  { id: "e-pipeline-exceptions",         source: "pipeline",       target: "exceptions",     data: { label: "agents create exceptions" } },
  { id: "e-pipeline-recovery",           source: "pipeline",       target: "recovery",       data: { label: "recovery cases" } },
  { id: "e-exceptions-invoicedetail",    source: "exceptions",     target: "invoice-detail", data: { label: "detail view" } },
  { id: "e-exceptions-recovery",         source: "exceptions",     target: "recovery",       data: { label: "overcharges" } },
  { id: "e-invoicedetail-recovery",      source: "invoice-detail", target: "recovery",       data: { label: "rejected invoices" } },
  { id: "e-invoicedetail-vendorscoring", source: "invoice-detail", target: "vendor-scoring",  data: { label: "outcomes to risk" } },
  { id: "e-recovery-vendorscoring",      source: "recovery",       target: "vendor-scoring",  data: { label: "recovery rates" } },
  { id: "e-contracts-exceptions",        source: "contracts",      target: "exceptions",     data: { label: "breach exceptions" } },
  { id: "e-contracts-vendorscoring",     source: "contracts",      target: "vendor-scoring",  data: { label: "compliance history" } },
  { id: "e-vendorscoring-dashboard",     source: "vendor-scoring", target: "dashboard",       data: { label: "high-risk count" } },
  { id: "e-productanalysis-dashboard",   source: "product-analysis", target: "dashboard",     data: { label: "category stats" } },
  { id: "e-som-exceptions",             source: "som",            target: "exceptions",     data: { label: "SOM exceptions" } },
  { id: "e-som-vendorscoring",          source: "som",            target: "vendor-scoring",  data: { label: "controlled substance risk" } },
];

export function getLayoutedElements(): { nodes: Node<SpecNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 220, marginx: 40, marginy: 40 });

  for (const node of domainNodes) {
    g.setNode(node.id, { width: DOMAIN_W, height: DOMAIN_H });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const layoutedDomainNodes = domainNodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - DOMAIN_W / 2, y: pos.y - DOMAIN_H / 2 },
    };
  });

  const minX = Math.min(...layoutedDomainNodes.map((n) => n.position.x));
  const ruleSpacing = 180;
  const ruleStartX = minX;
  const domainMinY = Math.min(...layoutedDomainNodes.map((n) => n.position.y));
  const ruleY = domainMinY - 120;

  const layoutedRuleNodes = ruleNodes.map((node, i) => ({
    ...node,
    position: { x: ruleStartX + i * ruleSpacing, y: ruleY },
  }));

  return {
    nodes: [...layoutedRuleNodes, ...layoutedDomainNodes],
    edges,
  };
}
