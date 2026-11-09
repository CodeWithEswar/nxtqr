"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@nxtqr/branding";
import { Button } from "@nxtqr/ui";
import { ChevronLeftIcon, ExternalLinkIcon } from "@nxtqr/icons";

export function LegalHeader() {
  const pathname = usePathname();
  const isTerms = pathname?.startsWith("/terms");
  const isPrivacy = pathname?.startsWith("/privacy");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-default bg-surface-01 shadow-level-1 select-none">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity & Back link */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-text-muted hover:text-foreground active:shadow-level-3 shadow-level-1"
          >
            <Link href="/login" aria-label="Back to Studio">
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          </Button>

          <Link href="/login" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <AppLogo variant="symbol" size={22} />
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-bold tracking-tight text-foreground">
                NXTQR
              </span>
              <span className="hidden sm:inline font-mono text-[10px] text-text-muted px-1.5 py-0.5 rounded-md border border-border-subtle bg-surface-00">
                Legal
              </span>
            </div>
          </Link>
        </div>

        {/* Center/Right: Document switcher tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <nav className="flex items-center gap-1 rounded-md border border-border-subtle bg-surface-00 p-0.5" aria-label="Legal documents">
            <Link
              href="/terms"
              className={`rounded-md px-2.5 sm:px-3 py-1 font-mono text-xs transition-colors ${
                isTerms
                  ? "bg-surface-03 font-semibold text-foreground shadow-level-1 border border-border-default"
                  : "text-text-muted hover:text-foreground hover:bg-surface-02 border border-transparent"
              }`}
            >
              <span className="sm:hidden">Terms</span>
              <span className="hidden sm:inline">Terms of Service</span>
            </Link>
            <Link
              href="/privacy"
              className={`rounded-md px-2.5 sm:px-3 py-1 font-mono text-xs transition-colors ${
                isPrivacy
                  ? "bg-surface-03 font-semibold text-foreground shadow-level-1 border border-border-default"
                  : "text-text-muted hover:text-foreground hover:bg-surface-02 border border-transparent"
              }`}
            >
              <span className="sm:hidden">Privacy</span>
              <span className="hidden sm:inline">Privacy Policy</span>
            </Link>
          </nav>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden md:inline-flex h-8 px-2.5 font-mono text-xs gap-1.5 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-text-secondary hover:text-foreground transition-all shadow-level-1 ml-2"
          >
            <Link href="/login">
              <span>Studio</span>
              <ExternalLinkIcon className="h-3 w-3 text-text-muted" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

