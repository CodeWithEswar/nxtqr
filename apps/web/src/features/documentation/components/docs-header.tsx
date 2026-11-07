"use client";

import * as React from "react";
import Link from "next/link";
import { AppLogo } from "@nxtqr/branding";
import { Button, Sheet, SheetContent, SheetTrigger } from "@nxtqr/ui";
import { SearchIcon, LayersIcon } from "@nxtqr/icons";
import { DocsSidebar } from "./docs-sidebar";

export interface DocsHeaderProps {
  onSearchClick?: () => void;
}

export function DocsHeader({ onSearchClick }: DocsHeaderProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="h-14 border-b border-border bg-black/90 px-6 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-6">
        {/* Mobile Sidebar Sheet Trigger */}
        <div className="md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Open documentation navigation">
                <LayersIcon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-black border-border">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <AppLogo variant="symbol" size={24} />
                <span className="font-semibold text-xs tracking-tight text-foreground">
                  NXTQR Documentation
                </span>
              </div>
              <DocsSidebar
                onSearchClick={() => {
                  setMobileOpen(false);
                  onSearchClick?.();
                }}
                className="w-full border-r-0"
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Brand Link */}
        <Link
          href="/docs"
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <AppLogo variant="symbol" size={26} />
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm tracking-tight text-foreground font-sans">
              NXTQR
            </span>
            <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
              / Design System
            </span>
          </div>
        </Link>
      </div>

      {/* Right Header Navigation & Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onSearchClick}
          className="hidden sm:flex items-center gap-2 h-8 px-3 text-xs text-muted-foreground bg-surface/50 border-border"
        >
          <SearchIcon className="h-3.5 w-3.5" />
          <span>Quick search</span>
          <kbd className="font-mono text-[10px] bg-black/60 border border-subtle-border px-1.5 py-0.5 rounded text-neutral-400">
            ⌘K
          </kbd>
        </Button>

        <Link href="/verify">
          <Button variant="outline" size="sm" className="h-8 px-2.5 font-mono text-xs">
            Diagnostics
          </Button>
        </Link>

        <Link href="/settings/theme">
          <Button variant="outline" size="sm" className="h-8 px-2.5 font-mono text-xs">
            Theme
          </Button>
        </Link>
      </div>
    </header>
  );
}
