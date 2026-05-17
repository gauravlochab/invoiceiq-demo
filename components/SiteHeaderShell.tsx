// [Spec: rules/ui-standard.md#Layout Architecture] — server-component-safe wrapper around the client SiteHeader
"use client";

import { SiteHeader } from "@/components/SiteHeader";

export function SiteHeaderShell() {
  return <SiteHeader />;
}
