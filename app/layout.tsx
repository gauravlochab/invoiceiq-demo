import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
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
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full`}>
      <body className="h-full flex" style={{ background: "var(--bg-base)" }}>
        <ToastProvider>
          <Sidebar />
          <main className="flex-1 min-h-full overflow-auto">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
