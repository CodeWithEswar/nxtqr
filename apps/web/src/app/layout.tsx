import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeScript } from "@/components/theme/theme-script";
import { Providers } from "./providers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nxtqr.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NXTQR — Interactive Visual Engineering Studio",
    template: "%s | NXTQR",
  },
  description:
    "A professional workspace for designing, visualizing, simulating, and understanding complex engineering systems.",
  applicationName: "NXTQR",
  authors: [{ name: "NXTQR Engineering Team" }],
  keywords: [
    "visual engineering",
    "systems simulation",
    "architecture studio",
    "interactive graph visualizer",
    "distributed systems",
    "runtime telemetry",
  ],
  icons: {
    icon: [
      { url: "/branding/icons/favicon.ico", sizes: "32x32" },
      { url: "/branding/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/branding/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/branding/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/branding/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "NXTQR",
    title: "NXTQR — Interactive Visual Engineering Studio",
    description: "Design. Visualize. Simulate. Understand.",
    images: [
      {
        url: "/branding/social/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "NXTQR — Interactive Visual Engineering Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NXTQR — Interactive Visual Engineering Studio",
    description: "Design. Visualize. Simulate. Understand.",
    images: ["/branding/social/twitter-image.png"],
  },
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
