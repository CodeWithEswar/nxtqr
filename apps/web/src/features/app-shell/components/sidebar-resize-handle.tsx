"use client";

import * as React from "react";
import { useShellStore } from "../store/shell-store";
import { cn } from "@nxtqr/utils";

export interface SidebarResizeHandleProps {
  className?: string;
}

export function SidebarResizeHandle({ className }: SidebarResizeHandleProps) {
  const sidebarCollapsed = useShellStore((s) => s.sidebarCollapsed);
  const sidebarWidth = useShellStore((s) => s.sidebarWidth);
  const setSidebarWidth = useShellStore((s) => s.setSidebarWidth);
  const setIsDragging = useShellStore((s) => s.setIsDraggingSidebar);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (sidebarCollapsed) return;

      e.preventDefault();
      setIsDragging(true);

      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(208, Math.min(360, startWidth + delta));
        setSidebarWidth(newWidth);
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [sidebarCollapsed, sidebarWidth, setSidebarWidth, setIsDragging]
  );

  const handleDoubleClick = React.useCallback(() => {
    if (!sidebarCollapsed) {
      setSidebarWidth(248); // Reset to default width
    }
  }, [sidebarCollapsed, setSidebarWidth]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (sidebarCollapsed) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSidebarWidth(sidebarWidth - 8);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSidebarWidth(sidebarWidth + 8);
      } else if (e.key === "Home") {
        e.preventDefault();
        setSidebarWidth(208);
      } else if (e.key === "End") {
        e.preventDefault();
        setSidebarWidth(360);
      }
    },
    [sidebarCollapsed, sidebarWidth, setSidebarWidth]
  );

  if (sidebarCollapsed) {
    return null;
  }

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-valuenow={sidebarWidth}
      aria-valuemin={208}
      aria-valuemax={360}
      aria-label="Resize sidebar. Use arrow keys to adjust, double click to reset."
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative w-1 cursor-col-resize select-none bg-border-default hover:bg-border-hover active:bg-border-strong transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong",
        "after:absolute after:inset-y-0 after:-left-1 after:w-3 after:content-['']",
        className
      )}
    />
  );
}

