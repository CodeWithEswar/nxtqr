"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLinkIcon, SettingsIcon } from "@nxtqr/icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@nxtqr/ui";

export interface SidebarFooterProps {
  collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  if (collapsed) {
    return (
      <div className="p-2 border-t border-border-default bg-surface-01 shrink-0 flex items-center justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/settings/theme"
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:text-foreground hover:bg-surface-02 border border-transparent transition-colors"
              aria-label="Studio Settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            Studio Settings
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="p-2.5 border-t border-border-default bg-surface-01 select-none shrink-0 space-y-2">
      <div className="flex items-center justify-between px-1.5 py-1 rounded-md bg-surface-02 border border-border-subtle text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
          <span className="font-mono text-[11px] text-foreground font-medium truncate">
            Local Studio
          </span>
        </div>
        <span className="font-mono text-[9px] text-text-muted uppercase">
          v0.2.0-alpha
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] px-1 text-text-muted">
        <span className="font-mono">Engine: Standalone</span>
        <Link
          href="/docs"
          className="hover:text-foreground transition-colors flex items-center gap-1 font-mono text-[10px]"
          title="Open Documentation"
        >
          <span>Docs</span>
          <ExternalLinkIcon className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
