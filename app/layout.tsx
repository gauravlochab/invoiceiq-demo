// [Spec: rules/ui-standard.md#Layout Architecture] — v2.0 shell: ThemeProvider + SidebarProvider + AppSidebar + SidebarInset
import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar";
import { SiteHeaderShell } from "@/components/SiteHeaderShell";
import ClientShell from "@/components/ClientShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Agile C-Level · InvoiceIQ Detect",
  description: "AI-powered invoice intelligence for healthcare",
  icons: { icon: "/branding/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ToastProvider>
              <SidebarProvider
                style={
                  {
                    "--sidebar-width": "calc(var(--spacing) * 56)",
                    "--header-height": "calc(var(--spacing) * 12)",
                  } as React.CSSProperties
                }
              >
                <AppSidebar />
                <SidebarInset>
                  <SiteHeaderShell />
                  <ClientShell>{children}</ClientShell>
                </SidebarInset>
              </SidebarProvider>
            </ToastProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
