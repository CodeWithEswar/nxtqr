"use client";

import * as React from "react";
import Link from "next/link";
import { AppLogo } from "@nxtqr/branding";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "@nxtqr/ui";
import { PanelLeftIcon } from "@nxtqr/icons";
import { useShellStore } from "../store/shell-store";

export interface SidebarHeaderProps {
  collapsed: boolean;
}

export function SidebarHeader({ collapsed }: SidebarHeaderProps) {
  const toggleSidebar = useShellStore((s) => s.toggleSidebar);

  return (
    <div className="flex h-13 items-center justify-between px-3 border-b border-border-default bg-surface-01 select-none shrink-0">
      <Link
        href="/workspace"
        className="flex items-center gap-2.5 min-w-0 rounded-md py-1 px-1 -ml-1 hover:bg-surface-02 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
        title="NXTQR Studio Workspace"
      >
        <div className="shrink-0">
          <AppLogo variant="symbol" size={24} />
        </div>
        {!collapsed && (
          <div className="flex items-baseline gap-1.5 min-w-0 overflow-hidden">
            <span className="font-sans text-xs font-bold tracking-tight text-foreground uppercase">
              NXTQR
            </span>
            <span className="font-mono text-[10px] text-text-muted tracking-wider uppercase">
              STUDIO
            </span>
          </div>
        )}
      </Link>

      {!collapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              className="h-7 w-7 rounded-md text-text-muted hover:text-foreground hover:bg-surface-02 active:shadow-level-3 shrink-0"
              aria-label="Collapse sidebar (Ctrl+B)"
            >
              <PanelLeftIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-[11px]">
            Collapse sidebar <kbd className="text-[9px] text-text-muted">Ctrl+B</kbd>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
