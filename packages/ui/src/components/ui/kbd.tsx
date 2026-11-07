"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(({ className, ...props }, ref) => {
  return (
    <kbd
      ref={ref}
      className={cn(
        "inline-flex h-5 select-none items-center gap-1 rounded-md border border-border bg-elevated-surface px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-xs",
        className,
      )}
      {...props}
    />
  );
});
Kbd.displayName = "Kbd";

export { Kbd };
