"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Clock, AlertTriangle, TrendingUp, Shield, Monitor, Search } from "lucide-react";
import { notifications, getUnreadCount, type Notification } from "@/lib/notifications";

const segmentLabels: Record<string, string> = {
  "": "Dashboard",
  exceptions: "Exceptions",
  recovery: "Recovery Queue",
  "vendor-scoring": "Vendor Scoring",
  pipeline: "Pipeline",
  extract: "Extract",
  contracts: "Contracts",
  som: "Drug Distributor",
};

const typeIcons: Record<string, typeof AlertTriangle> = {
  exception: AlertTriangle,
  recovery: TrendingUp,
  compliance: Shield,
  system: Monitor,
};

const typeColors: Record<string, string> = {
  exception: "var(--critical)",
  recovery: "var(--success)",
  compliance: "var(--warning)",
  system: "var(--acl-primary)",
};

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface TopBarProps {
  onSearchClick?: () => void;
}

export default function TopBar({ onSearchClick }: TopBarProps) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<"all" | "unread">("all");
  const [items, setItems] = useState(notifications);
  const notifRef = useRef<HTMLDivElement>(null);
  const [syncText, setSyncText] = useState("2 min ago");

  const unreadCount = getUnreadCount(items);

  useEffect(() => {
    const interval = setInterval(() => {
      const mins = Math.floor(Math.random() * 3) + 1;
      setSyncText(`${mins} min ago`);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [
    { label: "Dashboard", href: "/" },
  ];

  if (segments.length > 0) {
    let path = "";
    for (const seg of segments) {
      path += `/${seg}`;
      const label = segmentLabels[seg] || seg.toUpperCase();
      breadcrumbs.push({ label, href: path });
    }
  }

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const displayedNotifs = notifTab === "unread" ? items.filter((n) => !n.read) : items;

  return (
    <div className="flex items-center justify-between px-8 py-2.5 border-b border-[var(--border)] bg-white/80 backdrop-blur-sm sticky top-0 z-30" style={{ minHeight: 44 }}>
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 list-none m-0 p-0">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />}
                {isLast ? (
                  <span
                    className="text-xs font-medium text-[var(--text-primary)]"
                    aria-current="page"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--acl-primary)] no-underline transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search hint */}
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-base)] hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] transition-colors cursor-pointer min-w-[200px]"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs flex-1 text-left">Search...</span>
            <kbd className="text-[10px] font-mono bg-white border border-[var(--border-strong)] rounded px-1.5 py-0.5 text-[var(--text-muted)] shadow-sm">
              Cmd+K
            </kbd>
          </button>
        )}

        {/* Data freshness */}
        <div className="flex items-center gap-1.5" role="status" aria-live="polite">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] flex-shrink-0" />
          <Clock className="w-3 h-3 text-[var(--text-muted)]" />
          <span className="text-[11px] text-[var(--text-tertiary)]">
            Last synced: {syncText}
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-[var(--border)]" />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer bg-transparent border-none"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--critical)] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div role="dialog" aria-label="Notifications" className="absolute right-0 top-full mt-2 w-[380px] bg-white border border-[var(--border)] rounded-lg shadow-lg z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-[var(--acl-primary)] font-medium hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[var(--border)]">
                {(["all", "unread"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setNotifTab(tab)}
                    className={`flex-1 py-2 text-xs font-medium cursor-pointer bg-transparent border-none transition-colors ${
                      notifTab === tab
                        ? "text-[var(--acl-primary)] border-b-2 border-[var(--acl-primary)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab === "all" ? "All" : `Unread (${unreadCount})`}
                  </button>
                ))}
              </div>

              {/* Notification list */}
              <div className="max-h-[320px] overflow-y-auto">
                {displayedNotifs.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-[var(--border-strong)] mx-auto mb-2" />
                    <p className="text-xs text-[var(--text-tertiary)]">No notifications</p>
                  </div>
                ) : (
                  displayedNotifs.map((notif) => (
                    <NotificationItem key={notif.id} notif={notif} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-[var(--border)]" />

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--acl-primary)]">
            <span className="text-[11px] text-white font-medium">RJ</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-[var(--text-primary)] leading-tight">Rajesh Jaluka</span>
            <span className="text-[10px] text-[var(--text-tertiary)] leading-tight">AP Analyst</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notif }: { notif: Notification }) {
  const Icon = typeIcons[notif.type] || Monitor;
  const color = typeColors[notif.type] || "var(--text-tertiary)";

  const content = (
    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-base)] transition-colors ${!notif.read ? "bg-[var(--info-subtle)]" : ""}`}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${color}10` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{notif.title}</p>
          {!notif.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--acl-primary)] flex-shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 line-clamp-2">{notif.description}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-1">{formatRelativeTime(notif.timestamp)}</p>
      </div>
    </div>
  );

  if (notif.link) {
    return (
      <Link href={notif.link} className="block no-underline" onClick={() => {}}>
        {content}
      </Link>
    );
  }

  return content;
}
