"use client";

import { Skeleton } from "../ui/skeleton";
import { cn } from "@nxtqr/utils";
import { LayersIcon } from "@nxtqr/icons";

export interface CanvasShellPlaceholderProps {
  title?: string;
  className?: string;
}

export function CanvasShellPlaceholder({
  title = "Visualizer Canvas Boundary",
  className,
}: CanvasShellPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full min-h-[400px] flex-col items-center justify-center rounded-md border border-border bg-black p-6 select-none",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-subtle-border bg-elevated-surface text-muted-foreground">
          <LayersIcon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-foreground">{title}</h4>
          <p className="text-[11px] text-muted-foreground max-w-sm">
            Canvas runtime boundary initialized. Graph editor module is deferred to Phase 02.
          </p>
        </div>
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
    </div>
  );
}

export function CanvasLoadingSkeleton() {
  return (
    <div className="h-full w-full min-h-[400px] rounded-md border border-border bg-black p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}
