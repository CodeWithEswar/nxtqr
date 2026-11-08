"use client";

import * as React from "react";
import { getContrastRatio } from "@nxtqr/design-system";
import { CheckCircleIcon, CloseIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface ContrastMeterProps {
  foreground: string;
  background: string;
  sampleText?: string;
  className?: string;
}

export function ContrastMeter({ foreground, background, sampleText, className }: ContrastMeterProps) {
  const ratio = React.useMemo(() => {
    try {
      return getContrastRatio(foreground, background);
    } catch {
      return 1;
    }
  }, [foreground, background]);

  const formattedRatio = ratio.toFixed(2);

  // Criteria
  const passesNormalAA = ratio >= 4.5;
  const passesNormalAAA = ratio >= 7.0;
  const passesLargeAA = ratio >= 3.0;
  const passesLargeAAA = ratio >= 4.5;
  const passesUi = ratio >= 3.0;

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface p-4 shadow-level-1 space-y-4",
        className,
      )}
    >
      {/* Top Ratio Display */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle-border pb-3">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block whitespace-nowrap">
            WCAG 2.1 Ratio
          </span>
          <span className="text-2xl font-mono font-bold text-foreground tabular-nums">
            {formattedRatio}
            <span className="text-sm font-normal text-muted-foreground font-sans ml-1">: 1</span>
          </span>
        </div>

        {/* Live Swatch Preview */}
        <div
          className="h-8 px-3 rounded-md border border-border flex items-center justify-center font-mono text-xs font-semibold select-none shadow-level-1 text-center whitespace-nowrap shrink-0"
          style={{ backgroundColor: background, color: foreground }}
        >
          {sampleText || "Sample"}
        </div>
      </div>

      {/* Compliance Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
        {/* Normal Text AA */}
        <div className="p-2 rounded-md bg-black/40 border border-subtle-border space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-muted-foreground text-[10px] whitespace-nowrap">Normal AA (4.5:1)</span>
            {passesNormalAA ? (
              <CheckCircleIcon className="h-3.5 w-3.5 text-success shrink-0" />
            ) : (
              <CloseIcon className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
          </div>
          <span
            className={cn(
              "text-[11px] font-semibold block",
              passesNormalAA ? "text-success" : "text-destructive",
            )}
          >
            {passesNormalAA ? "PASS" : "FAIL"}
          </span>
        </div>

        {/* Normal Text AAA */}
        <div className="p-2 rounded-md bg-black/40 border border-subtle-border space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-muted-foreground text-[10px] whitespace-nowrap">Normal AAA (7:1)</span>
            {passesNormalAAA ? (
              <CheckCircleIcon className="h-3.5 w-3.5 text-success shrink-0" />
            ) : (
              <CloseIcon className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
          </div>
          <span
            className={cn(
              "text-[11px] font-semibold block",
              passesNormalAAA ? "text-success" : "text-destructive",
            )}
          >
            {passesNormalAAA ? "PASS" : "FAIL"}
          </span>
        </div>

        {/* Large Text AA */}
        <div className="p-2 rounded-md bg-black/40 border border-subtle-border space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-muted-foreground text-[10px] whitespace-nowrap">Large AA (3:1)</span>
            {passesLargeAA ? (
              <CheckCircleIcon className="h-3.5 w-3.5 text-success shrink-0" />
            ) : (
              <CloseIcon className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
          </div>
          <span
            className={cn(
              "text-[11px] font-semibold block",
              passesLargeAA ? "text-success" : "text-destructive",
            )}
          >
            {passesLargeAA ? "PASS" : "FAIL"}
          </span>
        </div>

        {/* Large Text AAA */}
        <div className="p-2 rounded-md bg-black/40 border border-subtle-border space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-muted-foreground text-[10px] whitespace-nowrap">Large AAA (4.5:1)</span>
            {passesLargeAAA ? (
              <CheckCircleIcon className="h-3.5 w-3.5 text-success shrink-0" />
            ) : (
              <CloseIcon className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
          </div>
          <span
            className={cn(
              "text-[11px] font-semibold block",
              passesLargeAAA ? "text-success" : "text-destructive",
            )}
          >
            {passesLargeAAA ? "PASS" : "FAIL"}
          </span>
        </div>

        {/* Graphical Objects & UI */}
        <div className="p-2 rounded-md bg-black/40 border border-subtle-border space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-muted-foreground text-[10px] whitespace-nowrap">UI Controls (3:1)</span>
            {passesUi ? (
              <CheckCircleIcon className="h-3.5 w-3.5 text-success shrink-0" />
            ) : (
              <CloseIcon className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
          </div>
          <span
            className={cn(
              "text-[11px] font-semibold block",
              passesUi ? "text-success" : "text-destructive",
            )}
          >
            {passesUi ? "PASS" : "FAIL"}
          </span>
        </div>
      </div>
    </div>
  );
}
