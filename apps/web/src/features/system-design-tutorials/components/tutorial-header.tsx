"use client";

import * as React from "react";
import Link from "next/link";
import { AppLogo } from "@nxtqr/branding";
import { ChevronRightIcon, SearchIcon, MenuIcon, ExternalLinkIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { TutorialSearchDialog } from "./tutorial-search-dialog";

const tutorialHome = "/tutorial/system-design";

export interface TutorialHeaderProps {
  onToggleMobileMenu?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
}

const control =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-medium outline-none transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-white/40 lg:h-8";

const secondaryControl = cn(
  control,
  "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:bg-white/[0.07] hover:text-white active:bg-white/[0.1]",
);

export function TutorialHeader({ onToggleMobileMenu, breadcrumbs }: TutorialHeaderProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);

  const trail =
    breadcrumbs?.filter((crumb) => crumb.href !== tutorialHome && crumb.label !== "Tutorial") ?? [];

  // Short heading for small screens: the current page (last crumb)
  const current = trail[trail.length - 1];

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/90 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] backdrop-blur-md supports-[backdrop-filter]:bg-black/75 sm:gap-4 sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))] lg:h-12">
      {/* Left: menu, brand, adaptive heading */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            className={cn(secondaryControl, "w-10 shrink-0 px-0 lg:hidden")}
            aria-label="Open tutorial navigation"
            aria-haspopup="dialog"
            onClick={onToggleMobileMenu}
          >
            <MenuIcon className="size-4" />
          </button>
        )}

        <Link
          href={tutorialHome}
          aria-label="NXTQR System Design"
          className="flex min-w-0 shrink items-center gap-2.5 rounded-md outline-none transition-opacity duration-200 hover:opacity-85 focus-visible:ring-1 focus-visible:ring-white/40"
        >
          <AppLogo size={24} variant="minimal" className="shrink-0" />
          <span className="flex min-w-0 items-center gap-2.5 whitespace-nowrap">
            <span className="hidden font-sans text-sm font-semibold tracking-tight text-white md:inline">
              NXTQR
            </span>
            <span
              aria-hidden="true"
              className="hidden h-4 w-px bg-white/15 md:block"
            />
            {/* Heading scales down and truncates as space shrinks */}
            <span className="truncate font-sans text-[13px] font-semibold tracking-tight text-white md:font-normal md:text-white/60 sm:text-sm">
              System Design
            </span>
          </span>
        </Link>

        {/* sm to xl: short heading, just the current page */}
        {current && (
          <div className="hidden min-w-0 items-center gap-2 sm:flex xl:hidden">
            <ChevronRightIcon className="size-3 shrink-0 text-white/30" />
            <span
              aria-current="page"
              className="truncate font-sans text-xs text-white/60"
              title={current.label}
            >
              {current.label}
            </span>
          </div>
        )}

        {/* xl and up: full breadcrumb */}
        {trail.length > 0 && (
          <nav aria-label="Breadcrumb" className="hidden min-w-0 xl:block">
            <ol className="flex min-w-0 items-center gap-2 font-sans text-xs text-white/40">
              {trail.map((crumb, i) => {
                const isLast = i === trail.length - 1;
                return (
                  <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-2">
                    <ChevronRightIcon className="size-3 shrink-0 text-white/25" />
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="truncate rounded-md outline-none transition-colors duration-200 hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? "page" : undefined}
                        className={cn("truncate", isLast && "text-white/80")}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>

      {/* Right: search and workspace */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          aria-label="Search tutorials"
          aria-haspopup="dialog"
          aria-keyshortcuts="Control+K Meta+K"
          onClick={() => setSearchOpen(true)}
          className={cn(
            secondaryControl,
            "w-10 px-0 font-sans sm:w-auto sm:px-3 lg:min-w-[10.5rem] lg:justify-between",
          )}
        >
          <span className="flex items-center gap-2">
            <SearchIcon className="size-4 text-white/45 lg:size-3.5" />
            <span className="hidden sm:inline">Search</span>
          </span>
          <kbd className="hidden rounded border border-white/10 bg-black px-1.5 py-0.5 font-sans text-[10px] leading-none text-white/40 lg:inline-block">
            ⌘K
          </kbd>
        </button>

        <Link
          href="/workspace"
          aria-label="Open workspace"
          className={cn(
            control,
            "w-10 border-transparent px-0 font-sans text-white/60 hover:bg-white/[0.06] hover:text-white md:w-auto md:px-3",
          )}
        >
          <ExternalLinkIcon className="size-4 lg:size-3.5" />
          <span className="hidden md:inline">Workspace</span>
        </Link>
      </div>

      <TutorialSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}