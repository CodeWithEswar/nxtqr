"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";

export interface SettingsFieldProps {
  label: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function SettingsField({
  label,
  description,
  badge,
  children,
  className,
  htmlFor,
}: SettingsFieldProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-subtle-border last:border-b-0",
        className,
      )}
    >
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <label htmlFor={htmlFor} className="text-xs font-medium text-foreground cursor-pointer">
            {label}
          </label>
          {badge}
        </div>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
