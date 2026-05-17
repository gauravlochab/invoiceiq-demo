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
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight leading-tight">
            Specifications
          </h1>
          <Link
            href="/specs-viewer/graph"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg hover:border-[var(--acl-primary)] hover:text-[var(--acl-primary)] transition-colors no-underline"
          >
            View Graph
          </Link>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] mt-3">
          Source of truth for InvoiceIQ Detect &mdash; cross-cutting rules and per-module domain specs.
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          {specs.length} specs &middot; {specs.reduce((s, sp) => s + sp.lineCount, 0).toLocaleString()} total lines
        </p>
      </div>

      <div className="px-6 lg:px-8 pb-8">
        <SpecCardGrid specs={specs} />
      </div>
    </div>
  );
}
