"use client";

import * as React from "react";
import type { VerificationSummary } from "../schemas/verification.schema";
import { formatDuration, formatRelativeTime } from "../lib/verification-summary";
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  ActivityIcon,
} from "@nxtqr/icons";

export interface VerificationSummaryBarProps {
  summary: VerificationSummary;
}

export function VerificationSummaryBar({ summary }: VerificationSummaryBarProps) {
  const total = summary.total || 1;
  const passedPct = (summary.passed / total) * 100;
  const warningPct = (summary.warning / total) * 100;
  const failedPct = (summary.failed / total) * 100;

  return (
    <div className="rounded-md border border-border-default bg-surface p-4 sm:p-5 shadow-level-1 space-y-3.5">
      {/* Metrics Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Total */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider">Total Checks:</span>
            <span className="text-foreground font-bold">{summary.total}</span>
          </div>

          <span className="text-border-subtle hidden sm:inline">|</span>

          {/* Passed */}
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            <span className="font-bold">{summary.passed}</span>
            <span className="text-muted-foreground text-[11px]">Verified</span>
          </div>

          {/* Warnings */}
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertTriangleIcon className="h-3.5 w-3.5" />
            <span className="font-bold">{summary.warning}</span>
            <span className="text-muted-foreground text-[11px]">Warnings</span>
          </div>

          {/* Failed */}
          <div className="flex items-center gap-1.5 text-red-400">
            <AlertCircleIcon className="h-3.5 w-3.5" />
            <span className="font-bold">{summary.failed}</span>
            <span className="text-muted-foreground text-[11px]">Failed</span>
          </div>
        </div>

        {/* Right side: Execution Duration & Timestamp */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Duration:</span>
            <span className="text-foreground font-semibold">{formatDuration(summary.durationMs)}</span>
          </div>
          <span className="text-border-subtle">·</span>
          <div>
            <span>Checked:</span>{" "}
            <span className="text-foreground font-semibold">
              {formatRelativeTime(summary.lastCheckedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Real Progress Bar (Rounded-md standard) */}
      <div className="w-full h-2 bg-surface-00 rounded-md overflow-hidden flex border border-border-default">
        {passedPct > 0 && (
          <div
            style={{ width: `${passedPct}%` }}
            className="h-full bg-emerald-500 transition-all duration-300"
            title={`${summary.passed} Verified`}
          />
        )}
        {warningPct > 0 && (
          <div
            style={{ width: `${warningPct}%` }}
            className="h-full bg-amber-500 transition-all duration-300"
            title={`${summary.warning} Warnings`}
          />
        )}
        {failedPct > 0 && (
          <div
            style={{ width: `${failedPct}%` }}
            className="h-full bg-red-500 transition-all duration-300"
            title={`${summary.failed} Failed`}
          />
        )}
      </div>
    </div>
  );
}
