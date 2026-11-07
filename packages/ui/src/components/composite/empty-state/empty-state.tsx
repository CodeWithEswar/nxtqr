"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-border p-8 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-subtle-border bg-elevated-surface text-muted-foreground mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-xs font-medium text-foreground">{title}</h4>
      {description && (
        <p className="mt-1 text-[11px] text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
