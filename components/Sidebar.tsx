"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Upload, LayoutDashboard, AlertTriangle, Shield, ShieldAlert,
  Pill, ShieldCheck, FileCheck2, TrendingUp, Workflow, ChevronLeft, ChevronRight,
  BarChart3, FileText, GitCompare,
} from "lucide-react";

const navHealthcare = [
  { href: "/extract",            label: "Extract",            icon: Upload },
  { href: "/",                   label: "Dashboard",          icon: LayoutDashboard },
  { href: "/pipeline",           label: "Pipeline",           icon: Workflow,       badge: 5,   critical: false },
  { href: "/exceptions",         label: "Exceptions",         icon: AlertTriangle,  badge: 188, critical: true  },
  { href: "/vendor-scoring",     label: "Vendor Scoring",     icon: Shield,         badge: 4,   critical: true  },
  { href: "/product-analysis",   label: "Product Analysis",   icon: BarChart3 },
  { href: "/recovery",           label: "Recovery",           icon: TrendingUp,     badge: 7,   critical: true  },
  { href: "/contracts",          label: "Contracts",          icon: FileText },
  { href: "/duplicates",         label: "Duplicates",         icon: GitCompare },
];

const navPharma = [
  { href: "/som",                   label: "SOM Analyst",      icon: ShieldAlert, badge: 15, critical: true },
  { href: "/som/exceptions",        label: "Exceptions",       icon: AlertTriangle, badge: 4, critical: true },
  { href: "/som/pharmacy-scoring",  label: "Pharmacy Scoring", icon: ShieldCheck },
  { href: "/som/audit-log",         label: "Audit Log",        icon: FileCheck2 },
  { href: "/som/manufacturers",     label: "Manufacturers",    icon: Pill },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  }

  const w = collapsed ? "w-[52px]" : "w-[216px]";

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={`${w} min-h-screen flex flex-col flex-shrink-0 bg-[var(--sidebar-bg)] border-r border-white/[0.06] transition-all duration-200`}
      style={{ overflow: "hidden" }}
    >
      <div className="h-[2px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, var(--sidebar-active), var(--agent-validation), var(--sidebar-active))" }} />

      <div className={`flex items-center flex-shrink-0 ${collapsed ? "justify-center px-0 pt-4 pb-3" : "px-4 pt-5 pb-4"}`}>
        <img src="/branding/acl-icon-white.svg" alt="" className="h-7 w-auto shrink-0" />
        {!collapsed && (
          <div className="ml-2.5 min-w-0">
            <span className="text-sm font-semibold text-white tracking-tight block">Agile C-Level</span>
            <p className="text-[11px] text-[var(--sidebar-text)] mt-0.5 font-medium tracking-wide m-0">InvoiceIQ Detect</p>
          </div>
        )}
      </div>
      {!collapsed && (
        <div className="mx-4 mb-2 px-2 py-1 rounded bg-white/[0.06] text-[10px] text-[var(--sidebar-text)] text-center">
          Parkland Health
        </div>
      )}

      <nav className="flex-1 py-1 overflow-hidden">
        {!collapsed && (
          <div className="px-4 pt-1 pb-1.5">
            <span className="text-[9px] uppercase tracking-[0.08em] font-semibold text-[var(--sidebar-text)]">
              Healthcare AP
            </span>
          </div>
        )}
        {collapsed && <div className="pt-2" />}

        {navHealthcare.map(({ href, label, icon: Icon, badge, critical }) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex items-center mx-1.5 rounded-md transition-all duration-150 text-[13px] no-underline relative
                ${collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2"}
                ${active
                  ? "text-white font-medium"
                  : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)] hover:bg-white/[0.04]"
                }`}
              style={active ? {
                background: "rgba(0, 101, 203, 0.15)",
                boxShadow: "inset 3px 0 0 var(--sidebar-active)",
              } : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {!collapsed && badge ? (
                <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  critical ? "bg-red-500/20 text-red-400" : "bg-white/[0.1] text-[var(--sidebar-text)]"
                }`}>
                  {badge}
                </span>
              ) : null}
              {collapsed && badge && critical && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </Link>
          );
        })}

        {!collapsed ? (
          <div className="mx-4 my-3">
            <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
          </div>
        ) : (
          <div className="mx-1.5 my-2 h-px bg-white/[0.08]" />
        )}

        {!collapsed && (
          <div className="px-4 pb-1.5">
            <span className="text-[9px] uppercase tracking-[0.08em] font-semibold text-[var(--sidebar-text)]">
              Drug Distributor
            </span>
          </div>
        )}

        {navPharma.map(({ href, label, icon: Icon, badge, critical }) => {
          const active = pathname === href
            || (href !== "/som" && pathname.startsWith(href + "/"))
            || (href === "/som" && pathname === "/som");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex items-center mx-1.5 rounded-md transition-all duration-150 text-[13px] no-underline relative
                ${collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2"}
                ${active
                  ? "text-white font-medium"
                  : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)] hover:bg-white/[0.04]"
                }`}
              style={active ? {
                background: "rgba(0, 101, 203, 0.15)",
                boxShadow: "inset 3px 0 0 var(--sidebar-active)",
              } : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {!collapsed && badge ? (
                <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  critical ? "bg-red-500/20 text-red-400" : "bg-white/[0.1] text-[var(--sidebar-text)]"
                }`}>
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06]" />

      <div className={`pb-4 pt-3 flex items-center ${collapsed ? "justify-center flex-col gap-2 px-0" : "gap-2 px-4 justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--sidebar-active)]">
              <span className="text-[11px] text-white font-medium">RJ</span>
            </div>
            <span className="text-[12px] text-[var(--sidebar-text-active)] truncate">Rajesh Jaluka</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--sidebar-active)]">
            <span className="text-[11px] text-white font-medium">RJ</span>
          </div>
        )}
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="w-6 h-6 rounded flex items-center justify-center text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)] hover:bg-white/[0.06] transition-colors cursor-pointer bg-transparent border-none flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </aside>
  );
}
