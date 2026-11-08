"use client";

import * as React from "react";
import type { FilterStatus } from "../hooks/use-verification";
import type { VerificationSummary } from "../schemas/verification.schema";
import { SearchIcon, CloseIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface VerificationFiltersProps {
  filter: FilterStatus;
  setFilter: (f: FilterStatus) => void;
  search: string;
  setSearch: (s: string) => void;
  summary: VerificationSummary;
}

export function VerificationFilters({
  filter,
  setFilter,
  search,
  setSearch,
  summary,
}: VerificationFiltersProps) {
  const filterOptions: { id: FilterStatus; label: string; count: number }[] = [
    { id: "all", label: "All Checks", count: summary.total },
    { id: "passed", label: "Verified", count: summary.passed },
    { id: "warning", label: "Warnings", count: summary.warning },
    { id: "failed", label: "Failed", count: summary.failed },
    { id: "not_run", label: "Pending", count: summary.notRun },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Segmented Filter Pills */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-surface border border-border rounded-md shadow-level-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1.5",
              filter === opt.id
                ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary-surface"
            )}
          >
            <span>{opt.label}</span>
            <span
              className={cn(
                "text-[10px] px-1 py-0.2 rounded",
                filter === opt.id
                  ? "bg-black/30 text-current"
                  : "bg-black text-muted-foreground"
              )}
            >
              {opt.count}
            </span>
          </button>
        ))}
      </div>

      {/* Quick Search */}
      <div className="relative min-w-[220px] sm:w-64">
        <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter checks or groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-7 py-1.5 text-xs font-mono rounded-md border border-border bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-0.5 rounded"
            title="Clear search"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

