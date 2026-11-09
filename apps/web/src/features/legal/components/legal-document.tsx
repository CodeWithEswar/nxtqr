import React from "react";
import type { LegalDocumentConfig } from "../config/legal-documents";
import { LegalMobileNav } from "./legal-mobile-nav";
import { AlertCircleIcon } from "@nxtqr/icons";

interface LegalDocumentProps {
  config: LegalDocumentConfig;
  children: React.ReactNode;
}

export function LegalDocument({ config, children }: LegalDocumentProps) {
  return (
    <article className="space-y-8">
      {/* Document Header */}
      <header className="space-y-4 border-b border-border-default pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs px-2 py-0.5 rounded-md border border-border-default bg-surface-01 text-text-muted">
            {config.version}
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-md border border-border-default bg-surface-01 text-text-muted">
            Effective: {config.effectiveDate}
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-md border border-border-default bg-surface-01 text-text-muted">
            Updated: {config.lastUpdated}
          </span>
        </div>

        <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {config.title}
        </h1>

        <p className="text-base text-text-secondary leading-relaxed max-w-2xl">
          {config.description}
        </p>

        {/* Legal Review Gate Banner */}
        <div className="flex items-start gap-3 rounded-md border border-border-default bg-surface-01 p-3.5 shadow-level-1">
          <AlertCircleIcon className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
          <p className="text-xs text-text-muted leading-relaxed">
            <strong className="text-foreground font-medium">Engineering Transparency Notice: </strong>
            This legal document accurately specifies NXTQR&apos;s real data practices, Row Level Security isolation, and Google OAuth flows. Final statutory harmonization will be completed before general commercial availability.
          </p>
        </div>
      </header>

      {/* Mobile Table of Contents Quick Jump */}
      <LegalMobileNav sections={config.sections} />

      {/* Document Content */}
      <div className="prose-monochrome">{children}</div>
    </article>
  );
}
