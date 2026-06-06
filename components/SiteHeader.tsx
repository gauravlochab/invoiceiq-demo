// [Spec: rules/ui-standard.md#Layout Architecture] — shadcn SiteHeader replaces components/TopBar.tsx in v2.0
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { notifications, getUnreadCount } from "@/lib/notifications";

const segmentLabels: Record<string, string> = {
  "": "Dashboard",
  exceptions: "Exceptions",
  recovery: "Recovery Queue",
  "vendor-scoring": "Vendor Scoring",
  pipeline: "Pipeline",
  extract: "Extract",
  contracts: "Contracts",
  som: "Drug Distributor",
  "product-analysis": "Product Analysis",
  duplicates: "Duplicates",
  "specs-viewer": "Specs",
  graph: "Spec Graph",
  "audit-log": "Audit Log",
  "pharmacy-scoring": "Pharmacy Scoring",
  manufacturers: "Manufacturers",
};

interface SiteHeaderProps {
  onSearchClick?: () => void;
}

export function SiteHeader({ onSearchClick }: SiteHeaderProps) {
  const pathname = usePathname();
  const [syncText, setSyncText] = React.useState("2 min ago");
  const [items] = React.useState(notifications);
  const unreadCount = getUnreadCount(items);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const mins = Math.floor(Math.random() * 3) + 1;
      setSyncText(`${mins} min ago`);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [{ label: "Dashboard", href: "/" }];

  if (segments.length > 0) {
    let path = "";
    for (const seg of segments) {
      path += `/${seg}`;
      const label = segmentLabels[seg] || seg.toUpperCase();
      breadcrumbs.push({ label, href: path });
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] backdrop-blur-xl transition-[width,height] ease-linear dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.2)]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 max-md:min-h-11 max-md:min-w-11" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-1 m-0 p-0 list-none">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />}
                  {isLast ? (
                    <span className="truncate text-xs font-semibold text-foreground" aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="truncate text-xs text-muted-foreground/70 no-underline transition-colors duration-150 hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* [Spec: rules/ui-standard.md#Touch Targets] — header buttons were
            ~28×28px visible (audit P1 4.4). max-md:min-h-11 max-md:min-w-11
            extends the hit area to 44×44px on viewports ≤md without bloating
            desktop density. */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground max-md:min-h-11 max-md:min-w-11"
            onClick={onSearchClick}
            aria-label="Open command palette"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-1 hidden rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">⌘K</kbd>
          </Button>

          <Separator orientation="vertical" className="mx-1 hidden data-[orientation=vertical]:h-4 md:block" />

          <div className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground md:flex">
            <span className="dot-pulse size-1.5 rounded-full bg-success" />
            <span>Synced {syncText}</span>
          </div>

          <Separator orientation="vertical" className="mx-1 hidden data-[orientation=vertical]:h-4 md:block" />

          <Button
            variant="ghost"
            size="icon"
            aria-label={`Notifications (${unreadCount} unread)`}
            className="relative transition-colors duration-150 max-md:min-h-11 max-md:min-w-11"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="dot-pulse absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
            )}
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
