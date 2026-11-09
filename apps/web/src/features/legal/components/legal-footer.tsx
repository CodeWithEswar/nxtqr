import React from "react";
import Link from "next/link";
import { AppLogo } from "@nxtqr/branding";

export function LegalFooter() {
  return (
    <footer className="w-full border-t border-border-default bg-surface-00 py-8 sm:py-10 select-none">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <AppLogo variant="symbol" size={22} />
            <div className="space-y-0.5">
              <div className="font-sans text-xs font-bold tracking-tight text-foreground">
                NXTQR
              </div>
              <div className="text-[11px] text-text-muted font-sans">
                Interactive Visual Engineering Studio
              </div>
            </div>
          </div>

          {/* Navigation Links - Responsive Grid on Mobile, Flex on Tablet/Desktop */}
          <nav
            aria-label="Legal footer links"
            className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-x-6 gap-y-2.5 text-xs font-mono text-text-muted w-full md:w-auto"
          >
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors py-0.5"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors py-0.5"
            >
              Privacy Policy
            </Link>
            <Link
              href="/login"
              className="hover:text-foreground transition-colors py-0.5"
            >
              Studio Sign In
            </Link>
            <a
              href="mailto:legal@nxtqr.dev"
              className="hover:text-foreground transition-colors py-0.5"
            >
              legal@nxtqr.dev
            </a>
          </nav>
        </div>

        {/* Bottom Metadata & Ownership Notice */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 border-t border-border-subtle pt-5 sm:pt-6 text-[11px] text-text-muted font-mono leading-relaxed">
          <div className="shrink-0">© 2026 NXTQR Inc. All rights reserved.</div>
          <div className="text-text-muted max-w-xl text-left sm:text-right">
            All diagrams and visualizer assets remain the intellectual property of their respective creators.
          </div>
        </div>
      </div>
    </footer>
  );
}
