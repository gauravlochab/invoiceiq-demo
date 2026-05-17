import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getSpecBySlug } from "../registry";
import { MarkdownRenderer } from "../components";

function parseChangelog(content: string): string[] {
  const matches = content.match(/<!--\s*(\d{4}-\d{2}-\d{2}:\s*.+?)\s*-->/g) || [];
  return matches.map((m) => m.replace(/<!--\s*/, "").replace(/\s*-->/, ""));
}

function stripChangelog(content: string): string {
  return content.replace(/<!--\s*CHANGELOG\s*-->/g, "").replace(/<!--\s*\d{4}-\d{2}-\d{2}:.*?-->/g, "");
}

export default async function SpecDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spec = getSpecBySlug(slug);

  if (!spec) notFound();

  const fullPath = path.join(process.cwd(), spec.filePath);
  let raw: string;
  try {
    raw = await fs.readFile(fullPath, "utf-8");
  } catch {
    notFound();
  }

  const changelog = parseChangelog(raw);
  const content = stripChangelog(raw).trim();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="px-6 lg:px-8 pt-6 pb-5">
        <nav className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-3">
          <Link href="/specs-viewer" className="hover:text-[var(--acl-primary)] no-underline transition-colors">
            Specs
          </Link>
          <ChevronRight size={10} />
          <span className="text-[var(--text-secondary)] font-medium capitalize">{spec.group}</span>
          <ChevronRight size={10} />
          <span className="text-[var(--text-primary)] font-medium">{spec.title}</span>
        </nav>
        <p className="text-[11px] text-[var(--text-muted)]">
          {spec.filePath}
        </p>
      </div>

      <div className="px-6 lg:px-8 pb-8">
        <div className="card p-6">
          <MarkdownRenderer content={content} changelog={changelog} />
        </div>
      </div>
    </div>
  );
}
