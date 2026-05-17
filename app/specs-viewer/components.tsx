"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { Search, Clock, ChevronRight } from "lucide-react";
import type { SpecEntry } from "./registry";

// ── Search + Card Grid ────────────────────────────────────────────────────

interface SpecCardGridProps {
  specs: (SpecEntry & { lineCount: number; lastChange?: string })[];
}

export function SpecCardGrid({ specs }: SpecCardGridProps) {
  const [query, setQuery] = useState("");

  const rules = useMemo(() => specs.filter((s) => s.group === "rules"), [specs]);
  const domains = useMemo(() => specs.filter((s) => s.group === "domains"), [specs]);

  const filter = (list: typeof specs) =>
    query.trim()
      ? list.filter(
          (s) =>
            s.title.toLowerCase().includes(query.toLowerCase()) ||
            s.description.toLowerCase().includes(query.toLowerCase()) ||
            (s.lastChange && s.lastChange.toLowerCase().includes(query.toLowerCase()))
        )
      : list;

  const filteredRules = filter(rules);
  const filteredDomains = filter(domains);

  return (
    <>
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search specs..."
          className="w-full max-w-sm pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--acl-primary)] transition-colors"
        />
      </div>

      {filteredRules.length > 0 && (
        <>
          <p className="section-label mb-3">Rules</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {filteredRules.map((spec) => (
              <SpecCard key={spec.slug} spec={spec} />
            ))}
          </div>
        </>
      )}

      {filteredDomains.length > 0 && (
        <>
          <p className="section-label mb-3">Domain Specs</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDomains.map((spec) => (
              <SpecCard key={spec.slug} spec={spec} />
            ))}
          </div>
        </>
      )}

      {filteredRules.length === 0 && filteredDomains.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] mt-8 text-center">No specs match "{query}"</p>
      )}
    </>
  );
}

function SpecCard({ spec }: { spec: SpecEntry & { lineCount: number; lastChange?: string } }) {
  return (
    <Link
      href={`/specs-viewer/${spec.slug}`}
      className="card card-interactive px-4 py-3.5 no-underline group block"
    >
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[13px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--acl-primary)] transition-colors">
          {spec.title}
        </p>
        <ChevronRight size={14} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-2">
        {spec.description}
      </p>
      <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
        <span>{spec.lineCount} lines</span>
        <span className="badge neutral text-[9px]">{spec.group}</span>
      </div>
      {spec.lastChange && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--text-muted)]">
          <Clock size={10} className="flex-shrink-0" />
          <span className="truncate">{spec.lastChange}</span>
        </div>
      )}
    </Link>
  );
}

// ── Markdown Renderer ─────────────────────────────────────────────────────

interface MarkdownRendererProps {
  content: string;
  changelog: string[];
}

export function MarkdownRenderer({ content, changelog }: MarkdownRendererProps) {
  const headings = useMemo(() => {
    const matches = content.match(/^#{2,3}\s+.+$/gm) || [];
    return matches.map((h) => {
      const level = h.startsWith("### ") ? 3 : 2;
      const text = h.replace(/^#{2,3}\s+/, "");
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
      return { level, text, id };
    });
  }, [content]);

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0">
        <div className="prose-spec">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children, ...props }) => {
                const text = String(children);
                const id = text
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, "")
                  .replace(/\s+/g, "-");
                const isFeedback = text.toLowerCase().includes("feedback");
                return (
                  <h2
                    id={id}
                    className={isFeedback ? "!border-b-0 !border-l-3 !border-l-[var(--warning)] !pl-3 !rounded-sm" : undefined}
                    {...props}
                  >
                    {children}
                  </h2>
                );
              },
              h3: ({ children, ...props }) => {
                const text = String(children);
                const id = text
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, "")
                  .replace(/\s+/g, "-");
                const isFeedback = text.toLowerCase().includes("feedback");
                return (
                  <h3
                    id={id}
                    className={isFeedback ? "!border-l-3 !border-l-[var(--warning)] !pl-3 !rounded-sm" : undefined}
                    {...props}
                  >
                    {children}
                  </h3>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {changelog.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <p className="section-label mb-3">Changelog</p>
            <div className="flex flex-col gap-2">
              {changelog.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-[var(--text-muted)]">
                  <Clock size={11} className="mt-0.5 flex-shrink-0 text-[var(--text-muted)]" />
                  <span>{entry}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {headings.length > 3 && (
        <aside className="hidden lg:block w-48 flex-shrink-0">
          <div className="sticky top-6">
            <p className="section-label mb-2">On this page</p>
            <nav className="flex flex-col gap-1">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`text-[11px] no-underline transition-colors hover:text-[var(--acl-primary)] ${
                    h.level === 3
                      ? "pl-3 text-[var(--text-muted)]"
                      : "text-[var(--text-secondary)] font-medium"
                  }`}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
