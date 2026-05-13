"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ShortcutHandlers {
  onCommandPalette: () => void;
  onShortcutsDialog: () => void;
}

export function useKeyboardShortcuts({ onCommandPalette, onShortcutsDialog }: ShortcutHandlers) {
  const router = useRouter();
  const pendingKey = useRef<string | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Cmd/Ctrl+K — command palette (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onCommandPalette();
        return;
      }

      if (isInput) return;

      // ? — shortcuts dialog
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onShortcutsDialog();
        return;
      }

      // Two-key sequences: g+d, g+e, g+r, g+v, g+p
      if (pendingKey.current === "g") {
        pendingKey.current = null;
        if (pendingTimer.current) clearTimeout(pendingTimer.current);
        switch (e.key) {
          case "d":
            e.preventDefault();
            router.push("/");
            return;
          case "e":
            e.preventDefault();
            router.push("/exceptions");
            return;
          case "r":
            e.preventDefault();
            router.push("/recovery");
            return;
          case "v":
            e.preventDefault();
            router.push("/vendor-scoring");
            return;
          case "p":
            e.preventDefault();
            router.push("/pipeline");
            return;
          case "a":
            e.preventDefault();
            router.push("/product-analysis");
            return;
          case "s":
            e.preventDefault();
            router.push("/som");
            return;
        }
      }

      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        pendingKey.current = "g";
        if (pendingTimer.current) clearTimeout(pendingTimer.current);
        pendingTimer.current = setTimeout(() => {
          pendingKey.current = null;
        }, 500);
      }
    },
    [onCommandPalette, onShortcutsDialog, router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
