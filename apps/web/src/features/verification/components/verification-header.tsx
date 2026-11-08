"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@nxtqr/ui";
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  PlayIcon,
  SpinnerIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
} from "@nxtqr/icons";
import type { VerificationSummary } from "../schemas/verification.schema";

export interface VerificationHeaderProps {
  summary: VerificationSummary;
  isRunning: boolean;
  onRunDiagnostics: () => void;
}

export function VerificationHeader({
  summary,
  isRunning,
  onRunDiagnostics,
}: VerificationHeaderProps) {
  const hasWarnings = summary.warning > 0;
  const hasFailures = summary.failed > 0;

  return (
    <header className="rounded-md border border-border bg-surface p-4 sm:p-5 shadow-level-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Navigation & Identity */}
        <div className="flex items-start gap-3">
          <Link href="/docs">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Back to Documentation"
              className="mt-0.5"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground font-sans">
                Architecture & Infrastructure Diagnostics
              </h1>
              <Badge
                variant="outline"
                className="font-mono text-[10px] hidden sm:inline-flex border-subtle-border bg-black text-muted-foreground"
              >
                v0.1.0-alpha
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-2xl">
              Production verification console for workspace packages, design system tokens, database contracts, and live runtime systems.
            </p>
          </div>
        </div>

        {/* Right Side: Actions & Gates */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          {/* Status Badge */}
          {isRunning ? (
            <Badge
              variant="outline"
              className="h-8 px-2.5 font-mono text-xs gap-1.5 border-accent/40 bg-accent/10 text-accent animate-pulse"
            >
              <SpinnerIcon className="h-3 w-3 animate-spin" />
              Running Checks...
            </Badge>
          ) : hasFailures ? (
            <Badge
              variant="outline"
              className="h-8 px-2.5 font-mono text-xs gap-1.5 border-red-500/40 bg-red-500/10 text-red-400"
            >
              <AlertTriangleIcon className="h-3.5 w-3.5" />
              {summary.failed} Failed · {summary.passed} Passed
            </Badge>
          ) : hasWarnings ? (
            <Badge
              variant="outline"
              className="h-8 px-2.5 font-mono text-xs gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-400"
            >
              <AlertTriangleIcon className="h-3.5 w-3.5" />
              {summary.passed} Verified · {summary.warning} Warning
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="h-8 px-2.5 font-mono text-xs gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            >
              <CheckCircleIcon className="h-3.5 w-3.5" />
              {summary.passed} / {summary.total} Verified
            </Badge>
          )}

          {/* Review Gates Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-mono gap-1.5"
              >
                <span>Review Gates</span>
                <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Verification Gates
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  href="/verify/scrollbar"
                  className="flex items-center justify-between cursor-pointer text-xs"
                >
                  <span>Scrollbar Review Gate</span>
                  <ExternalLinkIcon className="h-3 w-3 opacity-60" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/verify/brand"
                  className="flex items-center justify-between cursor-pointer text-xs"
                >
                  <span>Brand Review Gate</span>
                  <ExternalLinkIcon className="h-3 w-3 opacity-60" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/docs"
                  className="flex items-center justify-between cursor-pointer text-xs text-muted-foreground"
                >
                  <span>Documentation Overview</span>
                  <ExternalLinkIcon className="h-3 w-3 opacity-60" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Action: Run Diagnostics */}
          <Button
            size="sm"
            onClick={onRunDiagnostics}
            disabled={isRunning}
            className="h-8 text-xs font-mono gap-1.5 font-medium shadow-level-1"
          >
            {isRunning ? (
              <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PlayIcon className="h-3 w-3 fill-current" />
            )}
            <span>Run Diagnostics</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

