"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GraphView from "./graph-view";

export default function SpecGraphPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight leading-tight">
              Spec Dependency Graph
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">
              Visual map of how InvoiceIQ domains connect &mdash; click any node to open its spec.
            </p>
          </div>
          <Link
            href="/specs-viewer"
            className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--acl-primary)] transition-colors no-underline"
          >
            <ArrowLeft size={14} />
            All Specs
          </Link>
        </div>

        <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--acl-primary)" }} />
            Domain specs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--warning)" }} />
            Cross-cutting rules
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-px" style={{ background: "var(--text-muted)" }} />
            Data flow
          </span>
        </div>
      </div>

      <div className="px-6 lg:px-8 pb-8">
        <GraphView />
      </div>
    </div>
  );
}
