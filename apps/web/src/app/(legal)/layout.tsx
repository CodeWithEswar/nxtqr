import React from "react";
import type { Metadata } from "next";
import { LegalHeader, LegalFooter } from "@/features/legal";

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased selection:bg-surface-03 selection:text-foreground">
      <LegalHeader />
      <div className="flex-1">{children}</div>
      <LegalFooter />
    </div>
  );
}
