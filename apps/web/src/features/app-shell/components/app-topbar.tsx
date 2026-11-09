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
} from "@nxtqr/icons";
import { useShellStore } from "../store/shell-store";
import { WorkspaceBreadcrumbs } from "./workspace-breadcrumbs";
import { WorkspaceSwitcher } from "./workspace-switcher";
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
        "h-13 w-full border-b border-border-default bg-surface-01 select-none shrink-0 flex items-center justify-between px-3 sm:px-4 gap-3 z-30",
        className
      )}
      aria-label="Application Topbar"
    >
      {/* Left: Mobile Menu, Sidebar Toggle, Workspace Context & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile menu trigger */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden h-8 w-8 rounded-md border-border-default bg-surface-01 text-text-muted hover:text-foreground shrink-0"
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
                className="hidden md:flex h-8 w-8 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-text-muted hover:text-foreground shadow-level-1 shrink-0"
                aria-label="Expand sidebar (Ctrl+B)"
              >
                <PanelLeftIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-mono text-xs">
              Expand sidebar <kbd className="text-[10px] text-text-muted">Ctrl+B</kbd>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="hidden lg:block shrink-0">
          <WorkspaceSwitcher />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <WorkspaceBreadcrumbs />
        </div>
      </div>

      {/* Right: Command Palette Trigger & Contextual Actions */}
      <div className="flex items-center gap-2 shrink-0 justify-end">
        {/* Command trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCommandPaletteOpen(true)}
          className="h-8 px-2 sm:px-3 font-mono text-xs gap-2 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-text-muted hover:text-foreground shadow-level-1 active:shadow-level-3 shrink-0"
          aria-label="Open command palette (Ctrl+K)"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Search or jump to...</span>
          <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-border-subtle bg-surface-02 px-1 text-[10px] text-text-muted">
            <span className="text-[9px]">Ctrl</span> K
          </kbd>
        </Button>

        {/* Layout reset button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={resetWorkspaceLayout}
              className="h-8 w-8 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-text-muted hover:text-foreground shadow-level-1 shrink-0"
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
              className="hidden sm:flex h-8 w-8 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-text-muted hover:text-foreground shadow-level-1 shrink-0"
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

        {children}
      </div>
    </header>
  );
}
