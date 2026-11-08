"use client";

import * as React from "react";
import { FilterIcon, RefreshIcon } from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";

export interface VerificationEmptyStateProps {
  onResetFilters: () => void;
  message?: string;
}

export function VerificationEmptyState({
  onResetFilters,
  message = "No diagnostics match the selected status filter or search query.",
}: VerificationEmptyStateProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-12 text-center space-y-3 shadow-level-1">
      <div className="w-10 h-10 rounded-full bg-elevated-surface border border-border flex items-center justify-center mx-auto text-muted-foreground">
        <FilterIcon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold font-sans text-foreground">
          No Verification Checks Found
        </h3>
        <p className="text-xs text-muted-foreground font-mono max-w-sm mx-auto">
          {message}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onResetFilters}
        className="text-xs font-mono gap-1.5"
      >
        <RefreshIcon className="h-3 w-3" />
        Reset Filter
      </Button>
    </div>
  );
}

