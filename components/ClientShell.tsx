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
      {/* [Spec: rules/ui-standard.md#Responsive Rules] — wide-screen content
          cap: 1536px centred so the reading column stays sane beyond ~1536px
          instead of sprawling edge-to-edge on 1920px monitors (2026-05-23
          audit P1 4.2). The shell (sidebar + sticky header) still spans the
          full viewport — only the content is capped. */}
      <div className="mx-auto w-full max-w-[1536px] flex-1">{children}</div>
      <TrustFooter />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <SessionTimeout />
    </>
  );
}
