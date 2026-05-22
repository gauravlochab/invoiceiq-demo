"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GraphView from "./graph-view";

export default function SpecGraphPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight leading-tight">
              Spec Dependency Graph
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Visual map of how InvoiceIQ domains connect &mdash; click any node to open its spec.
            </p>
          </div>
          <Link
            href="/specs-viewer"
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors no-underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft size={14} />
            All Specs
          </Link>
        </div>

        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
            Domain specs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-warning" />
            Cross-cutting rules
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-px bg-muted-foreground" />
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
