"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, LayoutDashboard, AlertTriangle, Shield } from "lucide-react";

const nav = [
  { href: "/extract", label: "Extract", icon: Upload },
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exceptions", label: "Exceptions", icon: AlertTriangle, badge: 10, critical: true },
  { href: "/vendor-scoring", label: "Vendor Scoring", icon: Shield, badge: 3, critical: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[216px] min-h-screen flex flex-col flex-shrink-0 bg-[#0d1821] border-r border-white/[0.06]">
      {/* ACL Logo + product name */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <img src="/branding/acl-icon-white.svg" alt="" className="h-7 w-auto shrink-0" />
          <span className="text-sm font-semibold text-white tracking-tight">Agile C-Level</span>
        </div>
        <p className="text-[11px] text-[#7a8a9a] mt-1.5 font-medium tracking-wide">
          InvoiceIQ Detect
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-1">
        {nav.map(({ href, label, icon: Icon, badge, critical }) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 mx-1.5 rounded-md transition-all duration-150 px-3 py-2 text-[13px] no-underline ${
                active
                  ? "bg-[#0065cb] text-white font-medium shadow-sm shadow-[#0065cb]/20"
                  : "text-[#7a8a9a] hover:text-[#c8d0d8] hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span
                  className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    critical
                      ? "bg-red-500/20 text-red-400"
                      : "bg-white/[0.1] text-[#7a8a9a]"
                  }`}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* User */}
      <div className="px-4 pb-5 pt-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[#0065cb]">
          <span className="text-[11px] text-white font-medium">RJ</span>
        </div>
        <span className="text-[12px] text-[#c8d0d8]">Rajesh Jaluka</span>
      </div>
    </aside>
  );
}
