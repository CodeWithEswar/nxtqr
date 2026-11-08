"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Input } from "../../ui/input";
import { SearchIcon, CloseIcon } from "@nxtqr/icons";

export interface SearchFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export function SearchField({
  value,
  onChange,
  onClear,
  className,
  placeholder = "Search...",
  ...props
}: SearchFieldProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <SearchIcon className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-7 h-8 text-xs"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-md inline-flex items-center justify-center border border-transparent hover:border-border hover:bg-surface active:bg-secondary-surface active:shadow-level-3 text-muted-foreground hover:text-foreground outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors duration-140"
          aria-label="Clear search"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
