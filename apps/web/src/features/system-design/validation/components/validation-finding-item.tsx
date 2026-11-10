"use client";

import * as React from "react";
import Link from "next/link";
import type { ValidationFinding } from "@nxtqr/architecture-validation";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  HelpCircleIcon,
  CloseIcon,
  SlidersIcon,
  BookOpenIcon,
} from "@nxtqr/icons";
import { Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";

export interface ValidationFindingItemProps {
  finding: ValidationFinding;
  isSelected?: boolean;
  onSelect?: (finding: ValidationFinding) => void;
  onDismiss?: (findingId: string) => void;
  onOpenInspectorField?: (fieldPath: string) => void;
}

export function ValidationFindingItem({
  finding,
  isSelected = false,
  onSelect,
  onDismiss,
  onOpenInspectorField,
}: ValidationFindingItemProps) {
  const isError = finding.severity === "error";
  const isWarning = finding.severity === "warning";

  return (
    <div
      onClick={() => onSelect?.(finding)}
      className={cn(
        "group relative p-2.5 rounded-md border text-left transition-all duration-150 cursor-pointer select-none",
        isSelected
          ? "bg-surface-03 border-border-strong shadow-level-2"
          : "bg-surface-02 border-border-default hover:border-border-hover hover:bg-surface-03",
      )}
    >
      {/* Top Header: Severity + Category + Title */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {isError ? (
            <AlertCircleIcon className="w-3.5 h-3.5 text-rose-500 shrink-0" strokeWidth={1.5} />
          ) : isWarning ? (
            <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={1.5} />
          ) : (
            <HelpCircleIcon className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.5} />
          )}

          <span className="font-sans text-xs font-semibold text-foreground truncate">
            {finding.title}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant="outline"
            className="text-[9px] font-mono rounded h-4 px-1 border-border-subtle text-text-disabled uppercase"
          >
            {finding.category}
          </Badge>

          {finding.severity !== "error" && onDismiss && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(finding.id);
              }}
              title="Dismiss finding"
              className="p-0.5 rounded text-text-disabled hover:text-text-muted transition-colors"
            >
              <CloseIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Message Body */}
      <p className="font-sans text-xs text-text-secondary leading-relaxed mb-2">
        {finding.message}
      </p>

      {/* Explanation */}
      {finding.explanation && (
        <p className="font-sans text-[11px] text-text-muted leading-relaxed mb-2 border-l border-border-subtle pl-2">
          {finding.explanation}
        </p>
      )}

      {/* Actionable Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border-subtle font-mono text-[10px]">
        <span className="text-text-disabled">Rule: {finding.ruleId}</span>

        <div className="flex items-center gap-1.5">
          {finding.documentationPath && (
            <Link
              href={finding.documentationPath}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-text-muted hover:text-foreground transition-colors"
            >
              <BookOpenIcon className="w-3 h-3" />
              <span>Docs</span>
            </Link>
          )}

          {finding.suggestedActions?.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (action.fieldPath && onOpenInspectorField) {
                  onOpenInspectorField(action.fieldPath);
                }
              }}
              className="inline-flex items-center gap-1 text-text-muted hover:text-foreground transition-colors"
            >
              <SlidersIcon className="w-3 h-3" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
