"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, AlertTriangle, Copy, FileText } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exceptions", label: "Exceptions", icon: AlertTriangle, badge: 7, critical: true },
  { href: "/duplicates", label: "Duplicates", icon: Copy, badge: 1 },
  { href: "/contracts", label: "Contracts", icon: FileText, badge: 2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ width: 216, backgroundColor: "#0C0A09", borderRight: "1px solid #292524" }}
      className="min-h-screen flex flex-col flex-shrink-0"
    >
      {/* App name */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div style={{ width: 6, height: 6, backgroundColor: "#DC2626", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#FAFAF9" }}>InvoiceIQ</span>
        </div>
        <p style={{ fontSize: 11, color: "#57534E", marginTop: 3 }}>Northfield Medical</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-1">
        {nav.map(({ href, label, icon: Icon, badge, critical }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 mx-1 rounded-md transition-colors duration-150"
              style={{
                padding: "8px 12px",
                fontSize: 13,
                color: active ? "#FAFAF9" : "#57534E",
                backgroundColor: active ? "#1C1917" : "transparent",
                textDecoration: "none",
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#D6D3D1";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#57534E";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }
              }}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge ? (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    padding: "2px 4px",
                    borderRadius: 4,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: critical ? "#DC2626" : "#A8A29E",
                    marginLeft: "auto",
                  }}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #292524", margin: "0 0" }} />

      {/* User */}
      <div className="px-4 pb-5 pt-3 flex items-center gap-2">
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 20, height: 20, backgroundColor: "#292524" }}
        >
          <span style={{ fontSize: 9, color: "#A8A29E", fontWeight: 500 }}>SC</span>
        </div>
        <span style={{ fontSize: 12, color: "#57534E" }}>Sarah Chen</span>
      </div>
    </aside>
  );
}
