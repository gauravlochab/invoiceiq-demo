"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { Search, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search specs..."
          aria-label="Search specs"
          className="w-full max-w-sm pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>

      {filteredRules.length > 0 && (
        <>
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Rules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {filteredRules.map((spec) => (
              <SpecCard key={spec.slug} spec={spec} />
            ))}
          </div>
        </>
      )}

      {filteredDomains.length > 0 && (
        <>
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Domain Specs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDomains.map((spec) => (
              <SpecCard key={spec.slug} spec={spec} />
            ))}
          </div>
        </>
      )}

      {filteredRules.length === 0 && filteredDomains.length === 0 && (
        <p className="text-sm text-muted-foreground mt-8 text-center">
          No specs match &ldquo;{query}&rdquo;
        </p>
      )}
    </>
  );
}

function SpecCard({ spec }: { spec: SpecEntry & { lineCount: number; lastChange?: string } }) {
  return (
    <Link
      href={`/specs-viewer/${spec.slug}`}
      className="no-underline group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card
        size="sm"
        className="px-4 py-3.5 transition-colors group-hover:bg-accent"
      >
        <div>
          <div className="flex items-start justify-between mb-1.5">
            <h3 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
              {spec.title}
            </h3>
            <ChevronRight
              size={14}
              className="text-muted-foreground mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
            {spec.description}
          </p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>{spec.lineCount} lines</span>
            <Badge variant="secondary" className="text-[9px]">
              {spec.group}
            </Badge>
          </div>
          {spec.lastChange && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
              <Clock size={10} className="flex-shrink-0" />
              <span className="truncate">{spec.lastChange}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

// ── Markdown Renderer ─────────────────────────────────────────────────────

interface MarkdownRendererProps {
  content: string;
  changelog: string[];
}

// v2.0 token-styled markdown — every color routes through a shadcn theme
// token so the rendered spec works in light and dark mode. Replaces the v1
// `.prose-spec` utility class, which was bound to removed v1 tokens.
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
        <div className="text-[13px] text-muted-foreground leading-[1.75]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children, ...props }) => (
                <h1
                  className="text-[1.375rem] font-semibold text-foreground leading-tight mb-3"
                  {...props}
                >
                  {children}
                </h1>
              ),
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
                    className={
                      isFeedback
                        ? "text-base font-semibold text-foreground mt-7 mb-2 border-l-[3px] border-l-warning pl-3 rounded-sm"
                        : "text-base font-semibold text-foreground mt-7 mb-2 pb-1.5 border-b border-border"
                    }
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
                    className={
                      isFeedback
                        ? "text-sm font-semibold text-muted-foreground mt-5 mb-1.5 border-l-[3px] border-l-warning pl-3 rounded-sm"
                        : "text-sm font-semibold text-muted-foreground mt-5 mb-1.5"
                    }
                    {...props}
                  >
                    {children}
                  </h3>
                );
              },
              h4: ({ children, ...props }) => (
                <h4
                  className="text-[0.8125rem] font-semibold text-muted-foreground mt-4 mb-1"
                  {...props}
                >
                  {children}
                </h4>
              ),
              p: ({ children, ...props }) => (
                <p className="mb-3" {...props}>
                  {children}
                </p>
              ),
              a: ({ children, ...props }) => (
                <a
                  className="text-primary no-underline hover:underline"
                  {...props}
                >
                  {children}
                </a>
              ),
              strong: ({ children, ...props }) => (
                <strong className="text-foreground font-semibold" {...props}>
                  {children}
                </strong>
              ),
              code: ({ children, ...props }) => (
                <code
                  className="font-mono text-[11px] bg-muted border border-border rounded px-1.5 py-px"
                  {...props}
                >
                  {children}
                </code>
              ),
              pre: ({ children, ...props }) => (
                <pre
                  className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-3 text-[11px] [&_code]:bg-transparent [&_code]:border-0 [&_code]:p-0"
                  {...props}
                >
                  {children}
                </pre>
              ),
              ul: ({ children, ...props }) => (
                <ul className="list-disc my-2 ml-5 pl-4" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="list-decimal my-2 ml-5 pl-4" {...props}>
                  {children}
                </ol>
              ),
              li: ({ children, ...props }) => (
                <li className="mb-1" {...props}>
                  {children}
                </li>
              ),
              blockquote: ({ children, ...props }) => (
                <blockquote
                  className="my-3 py-3 px-4 border-l-[3px] border-l-warning bg-warning/10 rounded-r-md italic"
                  {...props}
                >
                  {children}
                </blockquote>
              ),
              hr: (props) => (
                <hr className="border-0 border-t border-border my-6" {...props} />
              ),
              table: ({ children, ...props }) => (
                <div className="overflow-x-auto my-3">
                  <table className="w-full border-collapse text-xs" {...props}>
                    {children}
                  </table>
                </div>
              ),
              th: ({ children, ...props }) => (
                <th
                  className="text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2 border-b border-border"
                  {...props}
                >
                  {children}
                </th>
              ),
              td: ({ children, ...props }) => (
                <td
                  className="px-3 py-2.5 border-b border-border text-foreground align-top"
                  {...props}
                >
                  {children}
                </td>
              ),
              img: ({ alt, ...props }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={alt ?? ""} className="max-w-full rounded-lg" {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {changelog.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Changelog
            </h2>
            <div className="flex flex-col gap-2">
              {changelog.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-[11px] text-muted-foreground"
                >
                  <Clock size={11} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
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
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              On this page
            </h2>
            <nav className="flex flex-col gap-1">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`text-[11px] no-underline transition-colors hover:text-primary rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    h.level === 3
                      ? "pl-3 text-muted-foreground"
                      : "text-foreground font-medium"
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
