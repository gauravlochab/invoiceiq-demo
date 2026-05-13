"use client";

import { type LucideIcon, Search } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon = Search, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[var(--text-muted)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)] m-0">{title}</p>
      {description && (
        <p className="text-xs text-[var(--text-muted)] mt-1 m-0 text-center max-w-[280px]">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-xs font-medium rounded-md bg-[var(--acl-primary)] text-white border-none cursor-pointer hover:bg-[var(--acl-primary-hover)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
