// [Spec: rules/ui-standard.md#Layout Architecture] — shadcn Sidebar replaces components/Sidebar.tsx in v2.0
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Upload,
  LayoutDashboard,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Pill,
  ShieldCheck,
  FileCheck2,
  TrendingUp,
  Workflow,
  BarChart3,
  FileText,
  GitCompare,
  BookOpen,
  GitBranch,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  critical?: boolean;
};

const navHealthcare: NavItem[] = [
  { href: "/extract", label: "Extract", icon: Upload },
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Workflow, badge: 5 },
  { href: "/exceptions", label: "Exceptions", icon: AlertTriangle, badge: 188, critical: true },
  { href: "/vendor-scoring", label: "Vendor Scoring", icon: Shield, badge: 4, critical: true },
  { href: "/product-analysis", label: "Product Analysis", icon: BarChart3 },
  { href: "/recovery", label: "Recovery", icon: TrendingUp, badge: 7, critical: true },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/duplicates", label: "Duplicates", icon: GitCompare },
];

const navPharma: NavItem[] = [
  { href: "/som", label: "SOM Analyst", icon: ShieldAlert, badge: 15, critical: true },
  { href: "/som/exceptions", label: "Exceptions", icon: AlertTriangle, badge: 4, critical: true },
  { href: "/som/pharmacy-scoring", label: "Pharmacy Scoring", icon: ShieldCheck },
  { href: "/som/audit-log", label: "Audit Log", icon: FileCheck2 },
  { href: "/som/manufacturers", label: "Manufacturers", icon: Pill },
];

const navDocs: NavItem[] = [
  { href: "/specs-viewer", label: "Specs", icon: BookOpen },
  { href: "/specs-viewer/graph", label: "Spec Graph", icon: GitBranch },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/som") return pathname === "/som";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItems({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map(({ href, label, icon: Icon, badge, critical }) => {
        const active = isActive(pathname, href);
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              isActive={active}
              tooltip={label}
              render={
                <Link href={href} aria-current={active ? "page" : undefined}>
                  <Icon />
                  <span>{label}</span>
                </Link>
              }
            />
            {badge !== undefined && (
              <SidebarMenuBadge
                className={critical ? "bg-destructive/15 text-destructive" : ""}
              >
                {badge}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2">
          {/* Light theme: navy bulb; Dark theme: white bulb */}
          <Image
            src="/branding/acl-icon-clean.svg"
            alt="Agile C-Level"
            width={28}
            height={28}
            className="h-7 w-auto shrink-0 dark:hidden"
          />
          <Image
            src="/branding/acl-icon-white.svg"
            alt="Agile C-Level"
            width={28}
            height={28}
            className="hidden h-7 w-auto shrink-0 dark:block"
          />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block text-sm font-semibold tracking-tight">Agile C-Level</span>
            <p className="m-0 mt-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">
              InvoiceIQ Detect
            </p>
          </div>
        </div>
        <div className="mx-2 rounded bg-muted/50 px-2 py-1 text-center text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          Parkland Health
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Healthcare AP</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={navHealthcare} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Drug Distributor</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={navPharma} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Documentation</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={navDocs} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-[11px] font-medium">RJ</span>
          </div>
          <span className="truncate text-xs text-foreground group-data-[collapsible=icon]:hidden">
            Rajesh Jaluka
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
