"use client";

import * as React from "react";
import Link from "next/link";
import { AppLogo } from "@nxtqr/branding";
import { Button, Badge } from "@nxtqr/ui";
import { SearchIcon, MenuIcon, ExternalLinkIcon } from "@nxtqr/icons";
import { TutorialSearchDialog } from "./tutorial-search-dialog";

export interface TutorialHeaderProps {
  onToggleMobileMenu?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
}

export function TutorialHeader({ onToggleMobileMenu, breadcrumbs }: TutorialHeaderProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <>
      <header className="h-12 w-full bg-surface-01 border-b border-border-default px-4 flex items-center justify-between shrink-0 select-none z-30">
        {/* Left: Brand + Section + Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-1.5 rounded text-text-muted hover:text-foreground hover:bg-surface-02"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
          )}

          <Link href="/tutorial/system-design" className="flex items-center gap-2 shrink-0">
            <AppLogo size={22} />
            <div className="flex items-center gap-1.5 font-sans">
              <span className="text-xs font-bold tracking-tight text-foreground">NXTQR</span>
              <span className="text-text-disabled">/</span>
              <span className="text-xs font-semibold text-text-secondary">System Design</span>
            </div>
          </Link>

          <Badge
            variant="outline"
            className="hidden sm:inline-flex font-mono text-[10px] px-1.5 py-0 border-border-default text-text-muted"
          >
            Engineering Reference
          </Badge>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-text-muted min-w-0 pl-2 border-l border-border-subtle">
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-text-disabled">/</span>}
                  {bc.href ? (
                    <Link
                      href={bc.href}
                      className="hover:text-foreground truncate transition-colors font-sans"
                    >
                      {bc.label}
                    </Link>
                  ) : (
                    <span className="text-foreground truncate font-semibold font-sans">
                      {bc.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-2">
          {/* Search Trigger Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 h-7 px-2.5 rounded-md bg-surface-02 border border-border-default hover:border-border-hover text-text-muted hover:text-text-secondary font-mono text-xs transition-colors"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Find a component...</span>
            <kbd className="hidden sm:inline px-1 rounded bg-surface-03 border border-border-default text-[9px] text-text-muted">
              ⌘K
            </kbd>
          </button>

          {/* Quick links */}
          <div className="hidden md:flex items-center gap-1 pl-2 border-l border-border-subtle">
            <Link href="/tutorial/system-design/components">
              <Button variant="ghost" size="sm" className="h-7 text-xs font-sans text-text-muted hover:text-foreground">
                All 223 Components
              </Button>
            </Link>
            <Link href="/tutorial/system-design/examples">
              <Button variant="ghost" size="sm" className="h-7 text-xs font-sans text-text-muted hover:text-foreground">
                Architectures
              </Button>
            </Link>
          </div>

          <Link href="/workspace">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-mono gap-1 text-text-secondary hover:text-foreground border-border-default"
            >
              <span>Workspace</span>
              <ExternalLinkIcon className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Global Command Search Dialog */}
      <TutorialSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
