"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted-surface", className)} {...props} />;
}

export { Skeleton };
