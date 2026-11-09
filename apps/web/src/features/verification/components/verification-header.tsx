"use client";

import * as React from "react";
import Link from "next/link";
import {
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
  /** Pin the header to the top of the page. Defaults to true. */
  sticky?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const controlBase =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border text-xs font-mono font-medium outline-none transition-all duration-150 focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";

const secondaryControl = cn(
  controlBase,
  "border-border-default bg-surface-01 text-text-secondary hover:border-border-hover hover:bg-surface-03 hover:text-foreground active:bg-surface-04 shadow-level-1 active:shadow-level-3",
);

const primaryControl = cn(
  controlBase,
  "border-border-strong bg-foreground text-background font-semibold hover:bg-surface-04 hover:text-foreground active:shadow-level-3 shadow-level-1",
);

const menuItem =
  "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 font-mono text-xs text-text-secondary outline-none transition-colors duration-150 hover:bg-surface-04 hover:text-foreground focus:bg-surface-04 focus:text-foreground data-[highlighted]:bg-surface-04 data-[highlighted]:text-foreground";

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

  if (isRunning) {
    tone = "running";
    label = "Running diagnostics...";
  } else if (summary.failed > 0) {
    tone = "failed";
    label = `${summary.failed} failed · ${summary.passed} passed`;
  } else if (summary.warning > 0) {
    tone = "warning";
    label = `${summary.passed} verified · ${summary.warning} warning`;
  }

  const dot: Record<Exclude<StatusTone, "running">, string> = {
    failed: "bg-red-400",
    warning: "bg-amber-400",
    ok: "bg-emerald-400",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border-default bg-surface-01 px-3 font-mono text-xs text-text-secondary shadow-level-1 sm:flex-none"
    >
      {tone === "running" ? (
        <SpinnerIcon className="h-3.5 w-3.5 shrink-0 animate-spin text-text-muted" />
      ) : (
        <span
          aria-hidden="true"
          className={cn("size-2 shrink-0 rounded-full", dot[tone])}
        />
      )}
      <span className="truncate tabular-nums">{label}</span>
    </div>
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
  // Collapse the subtitle once the page scrolls so the pinned bar stays compact
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  return (
    <header
      className={cn(
        "z-40 w-full border border-border-default bg-surface p-4 sm:p-5 rounded-md shadow-level-1 transition-all duration-200",
        sticky && "sticky top-4",
        scrolled
          ? "border-border-strong bg-surface-02 shadow-level-2 py-3 sm:py-3.5"
          : "border-border-default",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        {/* Left: back, logo, title hierarchy */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel}
              title={backLabel}
              className={cn(secondaryControl, "w-9 shrink-0 px-0")}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          )}

          {logo && <div className="shrink-0">{logo}</div>}

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2.5">
              <h1 className="min-w-0 truncate font-sans text-sm font-semibold tracking-tight text-foreground sm:text-base">
                {title}
              </h1>
              {version && (
                <span className="hidden shrink-0 rounded-md border border-border-subtle bg-surface-00 px-1.5 py-0.5 font-mono text-[10px] leading-none text-text-muted sm:inline-block">
                  {version}
                </span>
              )}
            </div>

            {subtitle && (
              <div
                className={cn(
                  "hidden grid transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none md:grid",
                  scrolled
                    ? "mt-0 grid-rows-[0fr] opacity-0"
                    : "mt-1 grid-rows-[1fr] opacity-100",
                )}
              >
                <p className="min-h-0 max-w-3xl overflow-hidden font-sans text-xs leading-relaxed text-text-muted">
                  {subtitle}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: status, gates, primary action */}
        <div className="flex min-w-0 items-center gap-2 lg:shrink-0 lg:justify-end">
          {summary && <StatusChip summary={summary} isRunning={isRunning} />}

          {showReviewGates && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(secondaryControl, "shrink-0 px-3 font-mono")}
                >
                  <span className="sm:hidden">Gates</span>
                  <span className="hidden sm:inline">Review Gates</span>
                  <ChevronDownIcon className="h-3 w-3 text-text-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-60 rounded-md border border-border-strong bg-surface-02 p-1.5 shadow-level-2"
              >
                <DropdownMenuLabel className="px-2.5 py-1.5 font-mono text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  Verification Gates
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className={menuItem}>
                  <Link href="/verify/scrollbar">
                    <span>Scrollbar Review Gate</span>
                    <ExternalLinkIcon className="h-3.5 w-3.5 text-text-muted" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={menuItem}>
                  <Link href="/verify/brand">
                    <span>Brand Review Gate</span>
                    <ExternalLinkIcon className="h-3.5 w-3.5 text-text-muted" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1.5 bg-border-subtle" />
                <DropdownMenuItem asChild className={menuItem}>
                  <Link href="/docs">
                    <span>Documentation Overview</span>
                    <ExternalLinkIcon className="h-3.5 w-3.5 text-text-muted" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {onRunDiagnostics && (
            <button
              type="button"
              onClick={onRunDiagnostics}
              disabled={isRunning}
              aria-busy={isRunning}
              className={cn(
                primaryControl,
                "shrink-0 px-3.5 font-mono font-semibold sm:px-4 active:scale-[0.98] motion-reduce:active:scale-100",
              )}
            >
              {isRunning ? (
                <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayIcon className="h-3 w-3 fill-current" />
              )}
              <span className="sm:hidden">Run</span>
              <span className="hidden sm:inline">Run Diagnostics</span>
            </button>
          )}

          {/* Extensibility slot */}
          {children}
        </div>
      </div>
    </header>
  );
}
