import React from "react";
import type { LegalDocumentConfig } from "../config/legal-documents";
import { AlertCircleIcon } from "@nxtqr/icons";

interface LegalDocumentProps {
  config: LegalDocumentConfig;
  children: React.ReactNode;
}

export function LegalDocument({ config, children }: LegalDocumentProps) {
  return (
    <article className="space-y-8">
      {/* Document Header */}
      <header className="space-y-3 border-b border-border-default pb-6">
        <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {config.title}
        </h1>

        <div className="font-mono text-xs text-text-muted">
          Effective: {config.effectiveDate} · {config.version}
        </div>

        <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-3xl pt-1">
          {config.description}
        </p>

        {/* Legal Review Gate Banner */}
        <div className="flex items-start gap-3 rounded-md border border-border-default bg-surface-01 p-3.5 shadow-level-1 mt-4">
          <AlertCircleIcon className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
          <p className="text-xs text-text-muted leading-relaxed">
            <strong className="text-foreground font-medium">Engineering Transparency Notice: </strong>
            This legal document accurately specifies NXTQR&apos;s real data practices, Row Level Security isolation, and Google OAuth flows. Final statutory harmonization will be completed before general commercial availability.
          </p>
        </div>
      </header>

      {/* Document Content */}
      <div className="prose-monochrome">{children}</div>
    </article>
  );
}

