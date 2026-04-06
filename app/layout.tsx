import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "InvoiceIQ — Northfield Medical Center",
  description: "AI-powered invoice intelligence for healthcare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full`}>
      <body className="h-full flex" style={{ background: "var(--bg-base)" }}>
        <Sidebar />
        <main className="flex-1 min-h-full overflow-auto">{children}</main>
      </body>
    </html>
  );
}
