"use client";

import { useState } from "react";
import { Eye, Edit3, Bot, Shield, ArrowUpRight, Bell, Ban, ChevronDown, ChevronUp } from "lucide-react";
import { type AuditEntry } from "@/lib/audit-trail";

const actionIcons: Record<string, typeof Eye> = {
  viewed: Eye,
  reviewed: Eye,
  extracted: Bot,
  flagged: Shield,
  updated: Bot,
  assigned: ArrowUpRight,
  escalated: ArrowUpRight,
  initiated: ArrowUpRight,
  contacted: ArrowUpRight,
  reminder: Bell,
  blocked: Ban,
};

const actorTypeColors: Record<string, string> = {
  user: "var(--primary)",
  agent: "var(--agent-validation-v2)",
  system: "var(--muted-foreground)",
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

interface Props {
  entries: AuditEntry[];
  defaultVisible?: number;
}

export default function AuditTrail({ entries, defaultVisible = 4 }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visibleEntries = showAll ? entries : entries.slice(-defaultVisible);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Audit Trail</p>
        <span className="text-[9px] text-muted-foreground">{entries.length} entries</span>
      </div>

      <div className="flex flex-col gap-0">
        {visibleEntries.map((entry, i) => {
          const Icon = actionIcons[entry.action] || Eye;
          const dotColor = actorTypeColors[entry.actorType] || "var(--muted-foreground)";

          return (
            <div key={entry.id} className="flex gap-2.5">
              <div className="flex flex-col items-center gap-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: dotColor }}
                />
                {i < visibleEntries.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="pb-3 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <Icon className="w-3 h-3 flex-shrink-0" style={{ color: dotColor }} />
                  <span className="text-[10px] font-semibold text-foreground">{entry.actor}</span>
                  <span
                    className="text-[8px] uppercase tracking-wide font-semibold px-1 py-0.5 rounded"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${dotColor} 12%, transparent)`,
                      color: dotColor,
                    }}
                  >
                    {entry.actorType}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground m-0 leading-relaxed">
                  {entry.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {entries.length > defaultVisible && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-[10px] text-primary font-medium mt-1 cursor-pointer bg-transparent border-none hover:underline p-0"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show all {entries.length} entries
            </>
          )}
        </button>
      )}
    </div>
  );
}
