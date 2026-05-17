// [Spec: rules/ui-standard.md#Layout Architecture] — shadcn SiteHeader replaces components/TopBar.tsx in v2.0
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Clock, Search } from "lucide-react";

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
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-sm transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-1 m-0 p-0 list-none">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="size-3 shrink-0 text-muted-foreground" />}
                  {isLast ? (
                    <span className="truncate text-xs font-medium text-foreground" aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="truncate text-xs text-muted-foreground no-underline transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={onSearchClick}
            aria-label="Open command palette"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-1 hidden rounded border bg-muted px-1 text-[10px] sm:inline">⌘K</kbd>
          </Button>

          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            <Clock className="size-3.5" />
            <span>Synced {syncText}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label={`Notifications (${unreadCount} unread)`}
            className="relative"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive" />
            )}
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
