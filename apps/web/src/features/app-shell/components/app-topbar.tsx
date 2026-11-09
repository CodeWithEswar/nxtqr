"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "@nxtqr/ui";
import {
  MenuIcon,
  PanelLeftIcon,
  SearchIcon,
  BookOpenIcon,
  RefreshIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";
import { useShellStore } from "../store/shell-store";
import { WorkspaceBreadcrumbs } from "./workspace-breadcrumbs";
import { AccountTrigger } from "@/features/account";
import { cn } from "@nxtqr/utils";

export interface AppTopbarProps {
  children?: React.ReactNode;
  className?: string;
}

export function AppTopbar({ children, className }: AppTopbarProps) {
  const sidebarCollapsed = useShellStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useShellStore((s) => s.toggleSidebar);
  const setMobileNavOpen = useShellStore((s) => s.setMobileNavOpen);
  const setCommandPaletteOpen = useShellStore((s) => s.setCommandPaletteOpen);
  const resetWorkspaceLayout = useShellStore((s) => s.resetWorkspaceLayout);

  return (
    <header
      className={cn(
        "h-12 w-full border-b border-border-default bg-surface-01 select-none shrink-0 flex items-center justify-between px-3 sm:px-4 gap-2 sm:gap-3 z-30",
        className
      )}
      aria-label="Application Topbar"
    >
      {/* Left: Mobile Menu, Sidebar Toggle, Workspace Context & Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        {/* Mobile menu trigger */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden h-7 w-7 rounded-md border border-border-default bg-surface-02 hover:bg-surface-03 text-text-muted hover:text-foreground shrink-0 shadow-level-1"
          aria-label="Open mobile navigation"
        >
          <MenuIcon className="h-4 w-4" />
        </Button>

        {/* Desktop sidebar expand toggle (when sidebar is collapsed) */}
        {sidebarCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={toggleSidebar}
                className="hidden md:flex h-7 w-7 rounded-md border border-border-default bg-surface-02 hover:bg-surface-03 text-text-muted hover:text-foreground shadow-level-1 shrink-0"
                aria-label="Expand sidebar (Ctrl+B)"
              >
                <PanelLeftIcon className="h-3.5 w-3.5 rotate-180" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-mono text-xs">
              Expand sidebar <kbd className="text-[10px] text-text-muted">Ctrl+B</kbd>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Integrated Workspace Switcher & Breadcrumbs */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <WorkspaceBreadcrumbs />
        </div>
      </div>

      {/* Right: Command Palette Trigger & Contextual Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
        {/* Command trigger: Mobile icon button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCommandPaletteOpen(true)}
              className="sm:hidden h-7 w-7 rounded-md border border-border-default bg-surface-02 hover:bg-surface-03 text-text-muted hover:text-foreground shadow-level-1 shrink-0"
              aria-label="Search or jump to (Ctrl+K)"
            >
              <SearchIcon className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-mono text-xs">
            Search <kbd className="text-[10px] text-text-muted">Ctrl+K</kbd>
          </TooltipContent>
        </Tooltip>

        {/* Command trigger: Desktop / Tablet Search field */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex h-7 items-center justify-between gap-2.5 rounded-md border border-border-default bg-surface-02 hover:bg-surface-03 hover:border-border-hover px-2.5 text-xs text-text-muted hover:text-foreground transition-all shadow-level-1 w-44 md:w-56 lg:w-64 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
          aria-label="Open command palette (Ctrl+K)"
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <SearchIcon className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <span className="font-sans truncate text-text-muted text-[11px]">
              Search or jump to...
            </span>
          </div>
          <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-border-subtle bg-surface-03 px-1 font-mono text-[9px] text-text-muted shrink-0">
            <span>Ctrl</span> K
          </kbd>
        </button>

        {/* Studio Status Pill (Large desktop) */}
        <Link
          href="/verify"
          className="hidden xl:flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border-default bg-surface-02 hover:bg-surface-03 text-[11px] font-mono text-text-muted hover:text-text-secondary transition-colors shadow-level-1 shrink-0"
          title="Engine Status: Active · Phase 04 Ready"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Engine Active</span>
        </Link>

        {/* Review Gates / Verification link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="outline"
              size="icon-sm"
              className="hidden sm:flex h-7 w-7 rounded-md border border-border-default bg-surface-02 hover:bg-surface-03 text-text-muted hover:text-foreground shadow-level-1 shrink-0"
            >
              <Link href="/verify" aria-label="Review Gates">
                <CheckCircleIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-mono text-xs">
            Review Gates
          </TooltipContent>
        </Tooltip>

        {/* Layout reset button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                resetWorkspaceLayout();
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("nxtqr:reset-layout"));
                }
              }}
              className="hidden md:flex h-7 w-7 rounded-md border border-border-default bg-surface-02 hover:bg-surface-03 text-text-muted hover:text-foreground shadow-level-1 shrink-0"
              aria-label="Reset workspace panel layout"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-mono text-xs">
            Reset panel layout
          </TooltipContent>
        </Tooltip>

        {/* Documentation link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="outline"
              size="icon-sm"
              className="hidden sm:flex h-7 w-7 rounded-md border border-border-default bg-surface-02 hover:bg-surface-03 text-text-muted hover:text-foreground shadow-level-1 shrink-0"
            >
              <Link href="/docs" aria-label="Documentation">
                <BookOpenIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-mono text-xs">
            Documentation
          </TooltipContent>
        </Tooltip>

        {/* Mobile-only Account Avatar Trigger */}
        <div className="md:hidden shrink-0">
          <AccountTrigger collapsed={true} side="bottom" align="end" className="h-7 w-7" />
        </div>

        {children}
      </div>
    </header>
  );
}

