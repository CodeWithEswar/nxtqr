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
  sticky?: boolean;
  children?: React.ReactNode;
  className?: string;
}

type StatusTone = "running" | "failed" | "warning" | "ok";

function StatusChip({
  summary,
  isRunning,
}: {
  summary: VerificationSummary;
  isRunning: boolean;
}) {
  let tone: StatusTone = "ok";
  let label = `${summary.passed} / ${summary.total} verified`;
  let shortLabel = `${summary.passed}/${summary.total} ver`;

  if (isRunning) {
    tone = "running";
    label = "Running diagnostics...";
    shortLabel = "Running...";
  } else if (summary.failed > 0) {
    tone = "failed";
    label = `${summary.failed} failed · ${summary.passed} passed`;
    shortLabel = `${summary.failed} fail`;
  } else if (summary.warning > 0) {
    tone = "warning";
    label = `${summary.passed} verified · ${summary.warning} warning`;
    shortLabel = `${summary.warning} warn`;
  }

  const dotColor: Record<Exclude<StatusTone, "running">, string> = {
    failed: "bg-red-400",
    warning: "bg-amber-400",
    ok: "bg-emerald-400",
  };

  return (
    <Badge
      variant="outline"
      className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-mono rounded-md border-border-default bg-surface-01 text-text-secondary shadow-level-1 flex items-center gap-2 shrink-0 font-normal select-none"
    >
      {tone === "running" ? (
        <SpinnerIcon className="h-3.5 w-3.5 shrink-0 animate-spin text-text-muted" />
      ) : (
        <span
          aria-hidden="true"
          className={cn("size-2 shrink-0 rounded-full", dotColor[tone])}
        />
      )}
      <span className="truncate tabular-nums">
        <span className="xs:hidden">{shortLabel}</span>
        <span className="hidden xs:inline">{label}</span>
      </span>
    </Badge>
  );
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
  sticky = true,
  children,
  className,
}: VerificationHeaderProps) {
  return (
    <header
      className={cn(
        "w-full border-b border-border-default bg-surface-01 shadow-level-1 select-none",
        sticky && "sticky top-0 z-40",
        className,
      )}
    >
      <div className="w-full max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 sm:py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          {/* Left / Top Row: Back Button, Logo, Title, Version Badge, and Subtitle */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {backHref && (
              <Link href={backHref} aria-label={backLabel} className="shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-text-muted hover:text-foreground active:shadow-level-3 shadow-level-1 shrink-0"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {logo && <div className="shrink-0">{logo}</div>}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-sans text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                  {title}
                </h1>
                {version && (
                  <Badge
                    variant="outline"
                    className="hidden sm:inline-flex shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded-md border-border-subtle bg-surface-00 text-text-muted font-normal"
                  >
                    {version}
                  </Badge>
                )}
              </div>

              {subtitle && (
                <p className="hidden md:block text-xs text-text-muted leading-relaxed font-sans truncate mt-0.5 max-w-3xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right / Bottom Row: Status Badge, Review Gates Dropdown, and Run Action */}
          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end min-w-0">
            {summary && <StatusChip summary={summary} isRunning={isRunning} />}

            <div className="flex items-center gap-2 shrink-0">
              {showReviewGates && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-mono font-medium gap-1.5 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-foreground shadow-level-1 active:shadow-level-3 shrink-0"
                    >
                      <span className="sm:hidden">Gates</span>
                      <span className="hidden sm:inline">Review Gates</span>
                      <ChevronDownIcon className="h-3 w-3 text-text-muted" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-56 rounded-md border border-border-strong bg-surface-02 p-1.5 shadow-level-2"
                  >
                    <DropdownMenuLabel className="px-2.5 py-1.5 font-mono text-[10px] font-medium text-text-muted uppercase tracking-wider">
                      Verification Gates
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/verify/scrollbar"
                        className="flex items-center justify-between cursor-pointer text-xs font-mono rounded-md px-2.5 py-1.5 hover:bg-surface-04 text-foreground transition-colors"
                      >
                        <span>Scrollbar Review Gate</span>
                        <ExternalLinkIcon className="h-3.5 w-3.5 text-text-muted" />
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/verify/brand"
                        className="flex items-center justify-between cursor-pointer text-xs font-mono rounded-md px-2.5 py-1.5 hover:bg-surface-04 text-foreground transition-colors"
                      >
                        <span>Brand Review Gate</span>
                        <ExternalLinkIcon className="h-3.5 w-3.5 text-text-muted" />
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 bg-border-subtle" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/docs"
                        className="flex items-center justify-between cursor-pointer text-xs font-mono rounded-md px-2.5 py-1.5 hover:bg-surface-04 text-text-muted hover:text-foreground transition-colors"
                      >
                        <span>Documentation Overview</span>
                        <ExternalLinkIcon className="h-3.5 w-3.5 text-text-muted" />
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {onRunDiagnostics && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onRunDiagnostics}
                  disabled={isRunning}
                  aria-busy={isRunning}
                  className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-mono font-semibold gap-1.5 sm:gap-2 rounded-md bg-foreground text-background hover:bg-surface-04 hover:text-foreground border border-border-strong transition-all shadow-level-1 active:shadow-level-3 shrink-0 disabled:opacity-50"
                >
                  {isRunning ? (
                    <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <PlayIcon className="h-3 w-3 fill-current" />
                  )}
                  <span className="sm:hidden">Run</span>
                  <span className="hidden sm:inline">Run Diagnostics</span>
                </Button>
              )}

              {children}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
