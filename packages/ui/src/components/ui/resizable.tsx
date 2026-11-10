"use client";

import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@nxtqr/utils";

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className,
    )}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

export function ResizeGrip({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative z-10 flex h-6 w-3 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-border-default bg-surface-02 text-text-muted shadow-level-1 motion-safe:transition-colors",
        "before:h-px before:w-1.5 before:bg-current after:h-px after:w-1.5 after:bg-current",
        "group-hover/resize:border-border-hover group-hover/resize:bg-surface-04 group-hover/resize:text-text-secondary",
        "group-focus-visible/resize:ring-1 group-focus-visible/resize:ring-border-strong",
        "group-data-[dragging=true]/resize:border-border-strong group-data-[dragging=true]/resize:bg-surface-04 group-data-[dragging=true]/resize:text-text-secondary group-data-[dragging=true]/resize:shadow-level-3",
        "group-data-[resize-handle-active=pointer]/resize:border-border-strong group-data-[resize-handle-active=pointer]/resize:bg-surface-04 group-data-[resize-handle-active=pointer]/resize:text-text-secondary group-data-[resize-handle-active=pointer]/resize:shadow-level-3",
        className,
      )}
    />
  );
}

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "group/resize relative flex w-px cursor-col-resize items-center justify-center bg-border transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-2 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 hover:bg-border-hover active:bg-border-strong",
      className,
    )}
    {...props}
  >
    {withHandle && <ResizeGrip className="group-data-[panel-group-direction=vertical]/resize:rotate-90" />}
  </ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };

