"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { section: "General", items: [
    { keys: ["Cmd", "K"], label: "Open command palette" },
    { keys: ["?"], label: "Show keyboard shortcuts" },
    { keys: ["Esc"], label: "Close dialog / palette" },
  ]},
  { section: "Navigation", items: [
    { keys: ["g", "d"], label: "Go to Dashboard" },
    { keys: ["g", "e"], label: "Go to Exceptions" },
    { keys: ["g", "r"], label: "Go to Recovery Queue" },
    { keys: ["g", "v"], label: "Go to Vendor Scoring" },
    { keys: ["g", "p"], label: "Go to Pipeline" },
    { keys: ["g", "a"], label: "Go to Product Analysis" },
    { keys: ["g", "s"], label: "Go to SOM" },
  ]},
];

export default function KeyboardShortcutsDialog({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

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
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[200] bg-transparent p-0 m-0 max-w-none max-h-none w-full h-full"
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
    >
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-[420px] max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer bg-transparent border-none"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Shortcuts list */}
          <div className="px-5 py-4 space-y-5 overflow-y-auto max-h-[60vh]">
            {shortcuts.map((group) => (
              <div key={group.section}>
                <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--text-tertiary)] mb-2">
                  {group.section}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1">
                      <span className="text-xs text-[var(--text-secondary)]">{item.label}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, i) => (
                          <span key={i}>
                            <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-[11px] font-mono font-medium text-[var(--text-secondary)] shadow-sm">
                              {key}
                            </kbd>
                            {i < item.keys.length - 1 && (
                              <span className="text-[10px] text-[var(--text-muted)] mx-0.5">then</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
}
