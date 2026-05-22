import fs from "fs";
import path from "path";
import Link from "next/link";
import { specRegistry } from "./registry";
import { SpecCardGrid } from "./components";

function getSpecMeta(filePath: string) {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.split("\n");
    const lineCount = lines.length;

    const changelogMatches = content.match(/<!--\s*(\d{4}-\d{2}-\d{2}:\s*.+?)\s*-->/g) || [];
    const lastChange = changelogMatches.length > 0
      ? changelogMatches[changelogMatches.length - 1]
          .replace(/<!--\s*/, "")
          .replace(/\s*-->/, "")
      : undefined;

    return { lineCount, lastChange };
  } catch {
    return { lineCount: 0, lastChange: undefined };
  }
}

export default function SpecsViewerPage() {
  const specs = specRegistry.map((spec) => {
    const meta = getSpecMeta(spec.filePath);
    return { ...spec, ...meta };
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground tracking-tight leading-tight">
            Specifications
          </h1>
          <Link
            href="/specs-viewer/graph"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground bg-card border border-border rounded-lg hover:border-primary hover:text-foreground transition-colors no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            View Graph
          </Link>
        </div>
        <p className="text-[13px] text-muted-foreground mt-3">
          Source of truth for InvoiceIQ Detect &mdash; cross-cutting rules and per-module domain specs.
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {specs.length} specs &middot; {specs.reduce((s, sp) => s + sp.lineCount, 0).toLocaleString()} total lines
        </p>
      </div>

      <div className="px-6 lg:px-8 pb-8">
        <SpecCardGrid specs={specs} />
      </div>
    </div>
  );
}
