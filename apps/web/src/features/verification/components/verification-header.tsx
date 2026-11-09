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
  AlertCircleIcon,
  ExternalLinkIcon,
} from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import type { VerificationSummary } from "../schemas/verification.schema";

export interface VerificationHeaderProps {
  title?: string;
  subtitle?: string;
  version?: string;
  logo?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  summary?: VerificationSummary;
  isRunning?: boolean;
  onRunDiagnostics?: () => void;
  showReviewGates?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function VerificationHeader({
  title = "Architecture & Infrastructure Diagnostics",
  subtitle = "Production verification console for workspace packages, design system tokens, database contracts, and live runtime systems.",
  version = "v0.1.0-alpha",
  logo,
  backHref = "/docs",
  backLabel = "Back to Documentation",
  summary,
  isRunning = false,
  onRunDiagnostics,
  showReviewGates = true,
  children,
  className,
}: VerificationHeaderProps) {
  const hasWarnings = summary ? summary.warning > 0 : false;
  const hasFailures = summary ? summary.failed > 0 : false;

  return (
    <header
      className={cn(
        "rounded-md border border-border-default bg-surface p-4 sm:p-5 shadow-level-1 w-full",
        className
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        {/* Left Side: Navigation Back & Title Hierarchy */}
        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
          {backHref && (
            <Link href={backHref} aria-label={backLabel} className="shrink-0 mt-0.5">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 rounded-md border border-border-default bg-surface-01 hover:bg-surface-03 text-muted-foreground hover:text-foreground transition-all shadow-level-1 active:shadow-level-3"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {logo && <div className="shrink-0 mt-0.5">{logo}</div>}

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground font-sans truncate">
                {title}
              </h1>
              {version && (
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-2 py-0.5 rounded-md border-border-subtle bg-surface-02 text-muted-foreground font-normal shrink-0"
                >
                  {version}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-relaxed font-sans max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Actions, Telemetry Badge & Review Gates */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-start sm:justify-end border-t lg:border-t-0 border-border-subtle pt-3 lg:pt-0">
          {/* Status Badge */}
          {summary && (
            isRunning ? (
              <Badge
                variant="outline"
                className="h-9 px-3 font-mono text-xs gap-1.5 rounded-md border-border-default bg-surface-02 text-foreground animate-pulse shadow-level-1 shrink-0"
              >
                <SpinnerIcon className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span>Running Diagnostics...</span>
              </Badge>
            ) : hasFailures ? (
              <Badge
                variant="outline"
                className="h-9 px-3 font-mono text-xs gap-1.5 rounded-md border-border-strong bg-surface-02 text-red-400 shadow-level-1 shrink-0"
              >
                <AlertCircleIcon className="h-3.5 w-3.5 text-red-400" />
                <span>{summary.failed} Failed · {summary.passed} Passed</span>
              </Badge>
            ) : hasWarnings ? (
              <Badge
                variant="outline"
                className="h-9 px-3 font-mono text-xs gap-1.5 rounded-md border-border-strong bg-surface-02 text-amber-400 shadow-level-1 shrink-0"
              >
                <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-400" />
                <span>{summary.passed} Verified · {summary.warning} Warning</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="h-9 px-3 font-mono text-xs gap-1.5 rounded-md border-border-strong bg-surface-02 text-emerald-400 shadow-level-1 shrink-0"
              >
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400" />
                <span>{summary.passed} / {summary.total} Verified</span>
              </Badge>
            )
          )}

          {/* Review Gates Dropdown */}
          {showReviewGates && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs font-mono font-medium gap-1.5 rounded-md border border-border-default bg-surface-01 hover:bg-surface-03 text-foreground transition-colors shadow-level-1 active:shadow-level-3 shrink-0"
                >
                  <span>Review Gates</span>
                  <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-1 bg-surface-02 border border-border-strong rounded-md shadow-level-2"
              >
                <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                  Verification Gates
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href="/verify/scrollbar"
                    className="flex items-center justify-between cursor-pointer text-xs font-mono rounded-md px-2.5 py-1.5 hover:bg-surface-04 text-foreground transition-colors"
                  >
                    <span>Scrollbar Review Gate</span>
                    <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/verify/brand"
                    className="flex items-center justify-between cursor-pointer text-xs font-mono rounded-md px-2.5 py-1.5 hover:bg-surface-04 text-foreground transition-colors"
                  >
                    <span>Brand Review Gate</span>
                    <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border-subtle my-1" />
                <DropdownMenuItem asChild>
                  <Link
                    href="/docs"
                    className="flex items-center justify-between cursor-pointer text-xs font-mono rounded-md px-2.5 py-1.5 hover:bg-surface-04 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>Documentation Overview</span>
                    <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Primary Action: Run Diagnostics */}
          {onRunDiagnostics && (
            <Button
              size="sm"
              onClick={onRunDiagnostics}
              disabled={isRunning}
              className="h-9 px-4 text-xs font-mono font-semibold gap-2 rounded-md bg-foreground text-background hover:bg-surface-04 hover:text-foreground border border-border-strong transition-all shadow-level-1 active:shadow-level-3 shrink-0 disabled:opacity-50"
            >
              {isRunning ? (
                <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayIcon className="h-3 w-3 fill-current" />
              )}
              <span>Run Diagnostics</span>
            </Button>
          )}

          {/* Extensibility Slot */}
          {children}
        </div>
      </div>
    </header>
  );
}
