"use client";

import * as React from "react";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "@nxtqr/ui";
import { CloseIcon, ChevronDownIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface WorkspacePanelHeaderProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  collapsed?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function WorkspacePanelHeader({
  title,
  icon,
  badge,
  onClose,
  onToggleCollapse,
  collapsed,
  actions,
  className,
}: WorkspacePanelHeaderProps) {
  return (
    <div
      className={cn(
        "h-9 px-3 border-b border-border-default bg-surface-01 select-none shrink-0 flex items-center justify-between gap-2",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {icon && <span className="text-text-muted shrink-0">{icon}</span>}
        <span className="font-mono text-xs font-semibold text-foreground truncate uppercase tracking-wider">
          {title}
        </span>
        {badge}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {actions}

        {onToggleCollapse && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleCollapse}
                className="h-6 w-6 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
                aria-label={collapsed ? "Expand panel" : "Collapse panel"}
              >
                <ChevronDownIcon
                  className={cn("h-3 w-3 transition-transform", collapsed && "-rotate-90")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-mono text-[10px]">
              {collapsed ? "Expand" : "Collapse"}
            </TooltipContent>
          </Tooltip>
        )}

        {onClose && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="h-6 w-6 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
                aria-label="Close panel"
              >
                <CloseIcon className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-mono text-[10px]">
              Close panel
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
