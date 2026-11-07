"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@nxtqr/utils";

export type ScrollAreaVariant = "default" | "compact" | "canvas" | "dense";
export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

export interface ScrollAreaProps extends React.ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.Root
> {
  variant?: ScrollAreaVariant;
  orientation?: ScrollAreaOrientation;
  scrollBarClassName?: string;
  viewportClassName?: string;
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(
  (
    {
      className,
      children,
      variant = "default",
      orientation = "vertical",
      scrollBarClassName,
      viewportClassName,
      ...props
    },
    ref,
  ) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      data-scrollbar={variant}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        className={cn(
          "h-full w-full rounded-[inherit]",
          variant === "canvas" && "overscroll-contain",
          viewportClassName,
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      {(orientation === "vertical" || orientation === "both") && (
        <ScrollBar orientation="vertical" variant={variant} className={scrollBarClassName} />
      )}

      {(orientation === "horizontal" || orientation === "both") && (
        <ScrollBar orientation="horizontal" variant={variant} className={scrollBarClassName} />
      )}

      <ScrollAreaPrimitive.Corner className="bg-[var(--scrollbar-track)]" />
    </ScrollAreaPrimitive.Root>
  ),
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export interface ScrollBarProps extends React.ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.ScrollAreaScrollbar
> {
  variant?: ScrollAreaVariant;
}

const variantSizeMap = {
  default: { vertical: "w-[10px]", horizontal: "h-[10px]", thumbRadius: "rounded-md" },
  compact: { vertical: "w-[7px]", horizontal: "h-[7px]", thumbRadius: "rounded-[4px]" },
  canvas: { vertical: "w-[7px]", horizontal: "h-[7px]", thumbRadius: "rounded-[4px]" },
  dense: { vertical: "w-[6px]", horizontal: "h-[6px]", thumbRadius: "rounded-[3px]" },
} as const;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(({ className, orientation = "vertical", variant = "default", ...props }, ref) => {
  const config = variantSizeMap[variant] ?? variantSizeMap.default;

  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors nxtqr-scroll-track",
        orientation === "vertical" && cn("h-full border-l p-[1px]", config.vertical),
        orientation === "horizontal" && cn("w-full flex-col border-t p-[1px]", config.horizontal),
        variant === "canvas" && "overscroll-contain",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        className={cn("relative flex-1 nxtqr-scroll-thumb cursor-pointer", config.thumbRadius)}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
});
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
