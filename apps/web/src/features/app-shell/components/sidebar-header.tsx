"use client";

import * as React from "react";
import Link from "next/link";
import { AppLogo } from "@nxtqr/branding";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "@nxtqr/ui";
import { PanelLeftIcon } from "@nxtqr/icons";
import { useShellStore } from "../store/shell-store";

export interface SidebarHeaderProps {
  collapsed?: boolean;
}

export function SidebarHeader({ collapsed }: SidebarHeaderProps = {}) {
  const storeCollapsed = useShellStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useShellStore((s) => s.toggleSidebar);
  const isCollapsed = collapsed !== undefined ? collapsed : storeCollapsed;

  if (isCollapsed) {
    return (
      <div
        key="sidebar-header-collapsed"
        className="flex h-12 w-full items-center justify-center border-b border-border-default bg-surface-01 select-none shrink-0 overflow-hidden"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/workspace"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-02 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong shrink-0"
              title="NXTQR Studio Workspace"
            >
              <AppLogo variant="minimal" size={22} animated animationMode="interactive" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            NXTQR Studio Workspace
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      key="sidebar-header-expanded"
      className="flex h-12 items-center justify-between px-3 border-b border-border-default bg-surface-01 select-none shrink-0 overflow-hidden"
    >
      <Link
        href="/workspace"
        className="flex items-center gap-2.5 min-w-0 rounded-md py-1 px-1 -ml-1 hover:bg-surface-02 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong overflow-hidden"
        title="NXTQR Studio Workspace"
      >
        <div className="shrink-0">
          <AppLogo variant="minimal" size={22} animated animationMode="interactive" />
        </div>
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <span className="font-sans text-xs font-bold tracking-tight text-foreground truncate">
            NXTQR
          </span>
          <span className="font-mono text-[9px] font-semibold text-text-muted px-1.5 py-0.5 rounded-md border border-border-subtle bg-surface-02 uppercase tracking-wider shrink-0">
            STUDIO
          </span>
        </div>
      </Link>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            className="h-7 w-7 rounded-md text-text-muted hover:text-foreground hover:bg-surface-02 active:shadow-level-3 shrink-0"
            aria-label="Collapse sidebar (Ctrl+B)"
          >
            <PanelLeftIcon className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-mono text-xs">
          Collapse sidebar <kbd className="text-[10px] text-text-muted">Ctrl+B</kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
