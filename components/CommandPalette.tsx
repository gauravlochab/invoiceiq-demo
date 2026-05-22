"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard, AlertTriangle, TrendingUp, Shield, Workflow,
  Upload, Search, FileText, Pill, ShieldAlert, ShieldCheck, FileCheck2,
  BarChart3, GitCompare,
} from "lucide-react";
import { allExceptions, typeConfig, formatCurrency } from "@/lib/data";

interface Props {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, group: "Healthcare AP" },
  { label: "Extract", href: "/extract", icon: Upload, group: "Healthcare AP" },
  { label: "Pipeline", href: "/pipeline", icon: Workflow, group: "Healthcare AP" },
  { label: "Exceptions", href: "/exceptions", icon: AlertTriangle, group: "Healthcare AP" },
  { label: "Vendor Scoring", href: "/vendor-scoring", icon: Shield, group: "Healthcare AP" },
  { label: "Product Analysis", href: "/product-analysis", icon: BarChart3, group: "Healthcare AP" },
  { label: "Recovery Queue", href: "/recovery", icon: TrendingUp, group: "Healthcare AP" },
  { label: "Contracts", href: "/contracts", icon: FileText, group: "Healthcare AP" },
  { label: "Duplicates", href: "/duplicates", icon: GitCompare, group: "Healthcare AP" },
  { label: "SOM Analyst", href: "/som", icon: ShieldAlert, group: "Drug Distributor" },
  { label: "SOM Exceptions", href: "/som/exceptions", icon: AlertTriangle, group: "Drug Distributor" },
  { label: "Pharmacy Scoring", href: "/som/pharmacy-scoring", icon: ShieldCheck, group: "Drug Distributor" },
  { label: "Audit Log", href: "/som/audit-log", icon: FileCheck2, group: "Drug Distributor" },
  { label: "Manufacturers", href: "/som/manufacturers", icon: Pill, group: "Drug Distributor" },
];

const exceptionResults = allExceptions.slice(0, 50).map((ex) => ({
  id: ex.id,
  vendor: ex.vendor,
  type: typeConfig[ex.type]?.label ?? ex.type,
  amount: ex.flaggedAmount,
  href: `/exceptions/${ex.id}`,
}));

export default function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const navigate = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  // Clear the search box each time the palette re-opens — done during render
  // via the "adjusting state on prop change" pattern instead of an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSearch("");
  }

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[560px] z-[201]" onClick={(e) => e.stopPropagation()}>
        <Command
          className="bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border overflow-hidden"
          label="Command palette"
        >
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search invoices, exceptions, vendors..."
              className="flex-1 h-12 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none bg-transparent"
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[360px] overflow-y-auto py-2">
            <Command.Empty className="py-8 text-center text-xs text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.href}
                    value={`${item.label} ${item.group}`}
                    onSelect={() => navigate(item.href)}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-muted-foreground data-[selected=true]:bg-accent data-[selected=true]:text-foreground rounded-md mx-1"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.group}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Group heading="Exceptions" className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
              {exceptionResults.map((ex) => (
                <Command.Item
                  key={ex.id}
                  value={`${ex.id} ${ex.vendor} ${ex.type}`}
                  onSelect={() => navigate(ex.href)}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-muted-foreground data-[selected=true]:bg-accent data-[selected=true]:text-foreground rounded-md mx-1"
                >
                  <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-mono text-xs text-muted-foreground w-[52px] flex-shrink-0">{ex.id}</span>
                  <span className="flex-1 truncate">{ex.vendor}</span>
                  <span className="text-[10px] text-muted-foreground mr-2">{ex.type}</span>
                  <span className="text-xs font-medium text-destructive tabular-nums">{formatCurrency(ex.amount)}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
