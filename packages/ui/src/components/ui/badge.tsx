"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@nxtqr/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-accent-foreground shadow-level-1",
        secondary: "border-border bg-surface text-foreground shadow-level-1",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-level-1",
        outline: "border-border text-foreground bg-transparent",
        muted: "border-subtle-border bg-secondary-surface text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
