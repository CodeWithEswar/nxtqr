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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Segmented Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-01 border border-border-default rounded-md shadow-level-1">
        {filterOptions.map((opt) => {
          const isActive = filter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-2 select-none",
                isActive
                  ? "bg-surface-04 text-foreground font-semibold border border-border-strong shadow-level-3"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-02 border border-transparent"
              )}
            >
              <span>{opt.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-md font-mono",
                  isActive
                    ? "bg-surface-02 text-foreground font-bold"
                    : "bg-surface-00 text-muted-foreground"
                )}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Search */}
      <div className="relative w-full md:w-72 lg:w-80">
        <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Filter checks or groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-8 py-2 text-xs font-mono rounded-md border border-border-default bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-all shadow-level-1"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded-md"
            title="Clear search"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
