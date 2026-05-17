// [Spec: rules/ui-standard.md#Layout Architecture] — v2.0: TopBar moved to SiteHeader in layout.tsx
"use client";

import { useState, useCallback, type ReactNode } from "react";
import TrustFooter from "@/components/TrustFooter";
import CommandPalette from "@/components/CommandPalette";
import KeyboardShortcutsDialog from "@/components/KeyboardShortcutsDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { SessionTimeout } from "@/components/SessionTimeout";

export default function ClientShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const onCommandPalette = useCallback(() => setPaletteOpen(true), []);
  const onShortcutsDialog = useCallback(() => setShortcutsOpen(true), []);

  useKeyboardShortcuts({ onCommandPalette, onShortcutsDialog });

  return (
    <>
      <div className="flex-1">{children}</div>
      <TrustFooter />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <SessionTimeout />
    </>
  );
}
