"use client";

import * as React from "react";
import Link from "next/link";
import { AppLogo } from "@nxtqr/branding";
import { ChevronRightIcon, SearchIcon, MenuIcon, ExternalLinkIcon } from "@nxtqr/icons";
import { Button, Kbd, Tooltip, TooltipContent, TooltipTrigger } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { TutorialSearchDialog } from "./tutorial-search-dialog";

const tutorialHome = "/tutorial/system-design";

export interface TutorialHeaderProps {
  onToggleMobileMenu?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
}

export function TutorialHeader({ onToggleMobileMenu, breadcrumbs }: TutorialHeaderProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const trail =
    breadcrumbs?.filter((crumb) => crumb.href !== tutorialHome && crumb.label !== "Tutorial") ?? [];
  const current = trail[trail.length - 1];

  return (
    <header className="sticky top-0 z-30 flex h-10 w-full shrink-0 items-center justify-between gap-2 border-b border-border-default bg-surface-01 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:pl-[max(0.75rem,env(safe-area-inset-left))] sm:pr-[max(0.75rem,env(safe-area-inset-right))]">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {onToggleMobileMenu && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="shrink-0 text-text-secondary lg:hidden"
                aria-label="Open tutorial navigation"
                aria-haspopup="dialog"
                onClick={onToggleMobileMenu}
              >
                <MenuIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Tutorial navigation</TooltipContent>
          </Tooltip>
        )}

        <Link
          href={tutorialHome}
          aria-label="NXTQR System Design"
          className="flex min-w-0 shrink items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <AppLogo size={20} variant="minimal" className="shrink-0" />
          <span className="hidden shrink-0 text-xs font-semibold tracking-tight text-foreground md:inline">
            NXTQR
          </span>
          <span
            aria-hidden={true}
            className="hidden h-3 w-px shrink-0 bg-border-default md:block"
          />
          <span className="truncate text-xs font-semibold text-foreground md:font-medium md:text-text-secondary">
            System Design
          </span>
        </Link>

        {current && (
          <div className="hidden min-w-0 items-center gap-2 sm:flex xl:hidden">
            <ChevronRightIcon className="size-3 shrink-0 text-text-muted" />
            <span
              aria-current="page"
              className="truncate text-xs text-text-muted"
              title={current.label}
            >
              {current.label}
            </span>
          </div>
        )}

        {trail.length > 0 && (
          <nav aria-label="Breadcrumb" className="hidden min-w-0 xl:block">
            <ol className="flex min-w-0 items-center gap-2 text-xs text-text-muted">
              {trail.map((crumb, index) => {
                const isLast = index === trail.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-2">
                    <ChevronRightIcon className="size-3 shrink-0" />
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="truncate rounded-md hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? "page" : undefined}
                        className={cn("truncate", isLast && "text-text-secondary")}
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

      <div className="flex shrink-0 items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="text-text-secondary"
              aria-label="Search tutorials"
              aria-haspopup="dialog"
              aria-keyshortcuts="Control+K Meta+K"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="flex items-center gap-2">
            Search tutorials <Kbd>Ctrl / ⌘ K</Kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="outline" size="icon-sm" className="text-text-secondary">
              <Link href="/workspace" aria-label="Open workspace">
                <ExternalLinkIcon className="size-3.5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            Open workspace
          </TooltipContent>
        </Tooltip>
      </div>

      <TutorialSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
