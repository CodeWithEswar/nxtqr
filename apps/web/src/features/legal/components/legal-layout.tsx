import React from "react";
import type { LegalDocumentConfig } from "../config/legal-documents";
import { LegalToc } from "./legal-toc";

interface LegalLayoutProps {
  config: LegalDocumentConfig;
  children: React.ReactNode;
}

export function LegalLayout({ config, children }: LegalLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
        {/* Main reading column */}
        <main className="min-w-0 flex-1 max-w-3xl">
          {children}
        </main>

        {/* Desktop Sticky Table of Contents */}
        <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
          <LegalToc sections={config.sections} />
        </aside>
      </div>
    </div>
  );
}
