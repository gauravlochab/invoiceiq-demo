"use client";

import { useState, useCallback, type ReactNode } from "react";
import TopBar from "@/components/TopBar";
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
      <TopBar onSearchClick={onCommandPalette} />
      <div className="flex-1">{children}</div>
      <TrustFooter />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <SessionTimeout />
    </>
  );
}
