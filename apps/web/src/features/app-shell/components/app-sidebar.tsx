"use client";

import * as React from "react";
import { useShellStore } from "../store/shell-store";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNavigation } from "./sidebar-navigation";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarResizeHandle } from "./sidebar-resize-handle";
import { cn } from "@nxtqr/utils";

export interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const sidebarCollapsed = useShellStore((s) => s.sidebarCollapsed);
  const sidebarWidth = useShellStore((s) => s.sidebarWidth);
  const isDragging = useShellStore((s) => s.isDraggingSidebar);

  const effectiveWidth = sidebarCollapsed ? 56 : sidebarWidth;

  return (
    <aside
      style={{ width: `${effectiveWidth}px` }}
      className={cn(
        "relative hidden md:flex flex-col h-full bg-surface-01 border-r border-border-default select-none shrink-0",
        !isDragging && "transition-[width] duration-200 ease-out",
        className
      )}
      aria-label="Application Sidebar"
    >
      {/* 1. Header with branding & collapse trigger */}
      <SidebarHeader collapsed={sidebarCollapsed} />

      {/* 2. Primary Navigation groups */}
      <SidebarNavigation collapsed={sidebarCollapsed} />

      {/* 3. Footer with workspace status */}
      <SidebarFooter collapsed={sidebarCollapsed} />

      {/* 4. Drag resize separator with keyboard support */}
      <SidebarResizeHandle />
    </aside>
  );
}

