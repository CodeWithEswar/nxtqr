"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { ResizeGrip } from "@nxtqr/ui";

export interface PanelResizeHandleProps {
  side: "left" | "right";
  currentWidth: number;
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  onResize: (width: number) => void;
  ariaLabel?: string;
  className?: string;
}

export function PanelResizeHandle({
  side,
  currentWidth,
  minWidth,
  maxWidth,
  defaultWidth,
  onResize,
  ariaLabel = "Resize panel",
  className,
}: PanelResizeHandleProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Fallback for environments without pointer capture
      }

      setIsDragging(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const startX = e.clientX;
      const startWidth = currentWidth;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth =
          side === "right"
            ? Math.max(minWidth, Math.min(maxWidth, startWidth + delta))
            : Math.max(minWidth, Math.min(maxWidth, startWidth - delta));
        onResize(newWidth);
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        try {
          (e.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
        } catch {
          // Ignore
        }

        setIsDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [side, currentWidth, minWidth, maxWidth, onResize]
  );

  const handleDoubleClick = React.useCallback(() => {
    onResize(defaultWidth);
  }, [defaultWidth, onResize]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const step = 8;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const next = side === "right" ? currentWidth - step : currentWidth + step;
        onResize(Math.max(minWidth, Math.min(maxWidth, next)));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = side === "right" ? currentWidth + step : currentWidth - step;
        onResize(Math.max(minWidth, Math.min(maxWidth, next)));
      } else if (e.key === "Home") {
        e.preventDefault();
        onResize(minWidth);
      } else if (e.key === "End") {
        e.preventDefault();
        onResize(maxWidth);
      }
    },
    [side, currentWidth, minWidth, maxWidth, onResize]
  );

  const positionClass = side === "right" ? "-right-2.5" : "-left-2.5";

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-valuenow={currentWidth}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-label={`${ariaLabel}. Use arrow keys to adjust, double click to reset.`}
      data-dragging={isDragging}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group/resize absolute inset-y-0 z-40 flex w-5 cursor-col-resize touch-none select-none items-center justify-center focus-visible:outline-none",
        positionClass,
        className
      )}
      title="Drag to resize panel (double-click to reset)"
    >
      <ResizeGrip />
    </div>
  );
}

