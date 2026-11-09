import React from "react";
import type { LegalDocumentConfig } from "../config/legal-documents";

interface LegalLayoutProps {
  config: LegalDocumentConfig;
  children: React.ReactNode;
}

export function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <main className="min-w-0 w-full">
        {children}
      </main>
    </div>
  );
}

