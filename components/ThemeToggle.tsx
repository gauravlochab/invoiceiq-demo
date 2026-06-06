// [Spec: rules/ui-standard.md#Design Philosophy] — dark mode native, per v2.0
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled className="max-md:min-h-11 max-md:min-w-11">
        <Sun className="size-4" />
      </Button>
    );
  }

  return (
    // [Spec: rules/ui-standard.md#Touch Targets] — extend hit area on mobile
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      className="transition-colors duration-150 max-md:min-h-11 max-md:min-w-11"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="size-4 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="size-4 transition-transform duration-200 hover:-rotate-12" />
      )}
    </Button>
  );
}
