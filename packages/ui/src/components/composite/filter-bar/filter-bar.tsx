"use client";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { CloseIcon, FilterIcon } from "@nxtqr/icons";

export interface ActiveFilter {
  id: string;
  label: string;
  value: string;
}

export interface FilterBarProps {
  filters: ActiveFilter[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  children?: React.ReactNode;
}

export function FilterBar({ filters, onRemove, onClearAll, children }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center text-xs text-muted-foreground mr-1">
        <FilterIcon className="h-3.5 w-3.5 mr-1" />
        <span>Filters:</span>
      </div>
      {children}
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="flex items-center gap-1.5 pl-2 pr-1 py-0.5"
        >
          <span className="text-muted-foreground">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            type="button"
            onClick={() => onRemove(filter.id)}
            className="ml-1 h-4 w-4 rounded-md inline-flex items-center justify-center border border-transparent hover:border-border hover:bg-black/40 text-muted-foreground hover:text-foreground outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors duration-140"
            aria-label={`Remove filter ${filter.label}`}
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
