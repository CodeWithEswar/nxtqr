import React from "react";
import Link from "next/link";
import { AppLogo } from "@nxtqr/branding";

export function LegalFooter() {
  return (
    <footer className="w-full border-t border-border-default bg-surface-00 py-10 select-none">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AppLogo variant="symbol" size={20} />
            <div className="space-y-0.5">
              <div className="font-sans text-xs font-bold tracking-tight text-foreground">
                NXTQR
              </div>
              <div className="text-[11px] text-text-muted">
                Interactive Visual Engineering Studio
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-xs font-mono text-text-muted">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Studio Sign In
            </Link>
            <a
              href="mailto:legal@nxtqr.dev"
              className="hover:text-foreground transition-colors"
            >
              legal@nxtqr.dev
            </a>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-border-subtle pt-6 text-[11px] text-text-muted font-mono">
          <div>© 2026 NXTQR Inc. All rights reserved.</div>
          <div>All diagrams and visualizer assets remain the intellectual property of their respective creators.</div>
        </div>
      </div>
    </footer>
  );
}

