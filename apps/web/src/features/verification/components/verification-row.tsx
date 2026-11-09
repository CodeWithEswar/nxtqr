"use client";

import * as React from "react";
import type { VerificationCheck } from "../schemas/verification.schema";
import { formatDuration, formatStatusLabel } from "../lib/verification-summary";
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  SpinnerIcon,
  ChevronRightIcon,
} from "@nxtqr/icons";
import { Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";

export interface VerificationRowProps {
  check: VerificationCheck;
  isSelected: boolean;
  onSelect: () => void;
}

export function VerificationRow({
  check,
  isSelected,
  onSelect,
}: VerificationRowProps) {
  const getStatusIcon = () => {
    switch (check.status) {
      case "running":
        return <SpinnerIcon className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />;
      case "passed":
        return <CheckCircleIcon className="h-4 w-4 text-emerald-400 shrink-0" />;
      case "warning":
        return <AlertTriangleIcon className="h-4 w-4 text-amber-400 shrink-0" />;
      case "failed":
        return <AlertCircleIcon className="h-4 w-4 text-red-400 shrink-0" />;
      default:
        return (
          <span className="w-4 h-4 rounded-md border border-border-default inline-block shrink-0 bg-surface-00" />
        );
    }
  };

  const getStatusBadge = () => {
    switch (check.status) {
      case "running":
        return (
          <Badge variant="outline" className="text-[10px] font-mono rounded-md border-border-default text-foreground bg-surface-02">
            Running
          </Badge>
        );
      case "passed":
        return (
          <Badge variant="outline" className="text-[10px] font-mono rounded-md border-border-strong text-emerald-400 bg-surface-02">
            Verified
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="outline" className="text-[10px] font-mono rounded-md border-border-strong text-amber-400 bg-surface-02">
            Warning
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="text-[10px] font-mono rounded-md border-border-strong text-red-400 bg-surface-02">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-mono rounded-md border-border-default text-muted-foreground bg-surface-02">
            {formatStatusLabel(check.status)}
          </Badge>
        );
    }
  };

  const formatVerificationType = (type: string) => {
    switch (type) {
      case "runtime_test":
        return "Runtime Test";
      case "client_state":
        return "Client State";
      case "config_audit":
        return "Config Audit";
      case "contract_check":
        return "Contract Check";
      default:
        return type;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "p-3 sm:p-3.5 rounded-md border transition-all duration-150 cursor-pointer select-none",
        "flex items-center justify-between gap-3 text-xs",
        isSelected
          ? "border-border-strong bg-surface-04 ring-1 ring-border-strong shadow-level-3"
          : "border-border-default bg-surface hover:bg-surface-02 hover:border-border-hover shadow-level-1"
      )}
    >
      {/* Left: Status Icon, Title, and Description */}
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="mt-0.5">{getStatusIcon()}</div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground font-sans truncate">
              {check.title}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground uppercase border border-border-subtle px-1.5 py-0.5 rounded-md bg-surface-00">
              {formatVerificationType(check.verificationType)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
            {check.description}
          </p>
        </div>
      </div>

      {/* Right: Duration, Status Badge, and Arrow */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {check.durationMs !== undefined && (
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums hidden sm:inline">
            {formatDuration(check.durationMs)}
          </span>
        )}
        {getStatusBadge()}
        <ChevronRightIcon
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-150 shrink-0",
            isSelected ? "text-foreground translate-x-0.5" : "text-muted-foreground opacity-50"
          )}
        />
      </div>
    </div>
  );
}
