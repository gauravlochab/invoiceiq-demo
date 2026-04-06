"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  Copy,
  FileText,
  TrendingUp,
  Building2,
  Settings,
  Bell,
  ChevronRight,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exceptions", label: "Exception Queue", icon: AlertTriangle, badge: 7 },
  { href: "/duplicates", label: "Duplicate Detection", icon: Copy, badge: 1 },
  { href: "/contracts", label: "Contract Compliance", icon: FileText, badge: 2 },
  { href: "/analytics", label: "Spend Analytics", icon: TrendingUp },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">InvoiceIQ</p>
            <p className="text-slate-400 text-xs">Northfield Medical</p>
          </div>
        </div>
      </div>

      {/* Alert strip */}
      <div className="mx-3 mt-3 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
          <p className="text-red-300 text-xs font-medium">3 critical issues require action</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider px-3 mb-2">
          Intelligence
        </p>
        {nav.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {badge}
                </span>
              ) : (
                <ChevronRight
                  size={14}
                  className={`transition-opacity ${
                    active ? "opacity-60" : "opacity-0 group-hover:opacity-40"
                  }`}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-slate-800 pt-3">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Bell size={16} />
          <span>Notifications</span>
          <span className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
            4
          </span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Settings size={16} />
          <span>Settings</span>
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">SC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">Sarah Chen</p>
            <p className="text-slate-500 text-xs truncate">AP Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
