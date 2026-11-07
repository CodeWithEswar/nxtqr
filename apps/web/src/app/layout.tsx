import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeScript } from "@/components/theme/theme-script";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "NXTQR — Engineering Platform",
  description: "Interactive visual engineering studio and multi-visualizer runtime foundation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-muted-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
