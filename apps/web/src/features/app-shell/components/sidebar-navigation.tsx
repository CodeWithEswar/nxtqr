"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import {
  SHELL_NAVIGATION_GROUPS,
} from "../config/navigation";

export interface SidebarNavigationProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

export function SidebarNavigation({ collapsed, onItemClick }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin select-none"
      aria-label="Sidebar Navigation"
    >
      {SHELL_NAVIGATION_GROUPS.map((group) => (
        <div key={group.id} className="space-y-1">
          {!collapsed && (
            <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
              {group.label}
            </div>
          )}

          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive =
                item.href === "/workspace"
                  ? pathname === "/workspace"
                  : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              const Icon = item.icon;

              if (collapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={onItemClick}
                        className={cn(
                          "flex h-8 w-8 mx-auto items-center justify-center rounded-md text-xs transition-colors",
                          isActive
                            ? "bg-surface-03 text-foreground font-semibold border border-border-strong shadow-level-1"
                            : "text-text-secondary hover:text-foreground hover:bg-surface-02 border border-transparent"
                        )}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-mono text-xs">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-sans transition-colors group relative",
                    isActive
                      ? "bg-surface-03 text-foreground font-semibold border border-border-strong shadow-level-1"
                      : "text-text-secondary hover:text-foreground hover:bg-surface-02 border border-transparent"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-foreground" : "text-text-muted group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-md border border-border-subtle bg-surface-02 text-text-muted">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
