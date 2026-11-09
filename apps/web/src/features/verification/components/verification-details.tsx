"use client";

import * as React from "react";
import type { VerificationCheck } from "../schemas/verification.schema";
import { formatDuration, formatStatusLabel, formatRelativeTime } from "../lib/verification-summary";
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  SpinnerIcon,
  RefreshIcon,
  CopyIcon,
  CheckIcon,
  TerminalIcon,
  CloseIcon,
} from "@nxtqr/icons";
import { Button, Badge } from "@nxtqr/ui";
import { useCanvasUIStore, useWorkspaceUIStore, useGraphEditorStore } from "@nxtqr/state";

export interface VerificationDetailsProps {
  check: VerificationCheck | null;
  onRecheck: (id: string) => void;
  isRechecking?: boolean;
  onClose?: () => void;
}

export function VerificationDetails({
  check,
  onRecheck,
  isRechecking,
  onClose,
}: VerificationDetailsProps) {
  const [copied, setCopied] = React.useState(false);

  // Live state subscriptions for interactive validation inspection
  const canvasTool = useCanvasUIStore((s) => s.toolMode);
  const canvasZoom = useCanvasUIStore((s) => s.zoomLevel);
  const sidebarCollapsed = useWorkspaceUIStore((s) => s.sidebarCollapsed);
  const studioNodesCount = useGraphEditorStore((s) => s.nodes.length);
  const studioEdgesCount = useGraphEditorStore((s) => s.edges.length);

  if (!check) {
    return (
      <div className="rounded-md border border-border-default bg-surface p-8 text-center text-muted-foreground shadow-level-1">
        <TerminalIcon className="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
        <p className="text-xs font-mono">Select a verification check to view diagnostic telemetry.</p>
      </div>
    );
  }

  const handleCopyEvidence = async () => {
    if (!check.evidence) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(check.evidence, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const getStatusIcon = () => {
    switch (check.status) {
      case "running":
        return <SpinnerIcon className="h-4 w-4 text-muted-foreground animate-spin" />;
      case "passed":
        return <CheckCircleIcon className="h-4 w-4 text-emerald-400" />;
      case "warning":
        return <AlertTriangleIcon className="h-4 w-4 text-amber-400" />;
      case "failed":
        return <AlertCircleIcon className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-md border border-border-default bg-surface shadow-level-1 flex flex-col h-full overflow-hidden">
      {/* Detail Header */}
      <div className="p-4 sm:p-5 border-b border-border-subtle bg-surface-02 space-y-3 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-semibold">
                {check.category}
              </span>
              <span className="text-border-subtle">·</span>
              <span className="text-[10px] font-mono text-text-muted break-all">
                ID: {check.id}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-sans text-foreground leading-snug break-words">
              {check.title}
            </h3>
          </div>

          {/* Action cluster: Verify + optional Close (side-by-side, never overlapping) */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRecheck(check.id)}
              disabled={isRechecking || check.status === "running"}
              className="h-8 px-2.5 text-xs font-mono gap-1.5 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 hover:border-border-hover shadow-level-1 active:shadow-level-3 text-foreground"
              title="Re-run this verification check"
            >
              <RefreshIcon
                className={`h-3.5 w-3.5 text-foreground ${isRechecking || check.status === "running" ? "animate-spin" : ""}`}
              />
              <span className="hidden xs:inline sm:inline">Verify</span>
            </Button>

            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-md border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-03 shadow-level-1 active:shadow-level-3 text-text-muted hover:text-foreground"
                aria-label="Close diagnostic details"
                title="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge
              variant="outline"
              className={`text-[10px] uppercase font-bold rounded-md ${
                check.status === "passed"
                  ? "border-emerald-500/30 text-emerald-400 bg-surface-01"
                  : check.status === "warning"
                    ? "border-amber-500/30 text-amber-400 bg-surface-01"
                    : check.status === "failed"
                      ? "border-red-500/30 text-red-400 bg-surface-01"
                      : "border-border-default text-text-muted bg-surface-01"
              }`}
            >
              {formatStatusLabel(check.status)}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-text-muted">
            {check.durationMs !== undefined && (
              <span>Latency: <strong className="text-foreground">{formatDuration(check.durationMs)}</strong></span>
            )}
            {check.checkedAt && (
              <span>Checked: <strong className="text-foreground">{formatRelativeTime(check.checkedAt)}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Detail Content Body */}
      <div className="p-4 sm:p-5 space-y-4 text-xs font-mono overflow-y-auto flex-1 min-h-0 scrollbar-dense">
        {/* Description */}
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Verification Objective
          </div>
          <p className="text-xs text-foreground/90 font-sans leading-relaxed">
            {check.description}
          </p>
        </div>

        {/* Diagnostics Output */}
        {check.diagnostics && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Diagnostic Telemetry Output
            </div>
            <div className="p-3 rounded-md bg-surface-00 border border-border-default text-[11px] text-foreground leading-relaxed font-mono">
              {check.diagnostics}
            </div>
          </div>
        )}

        {/* Warning / Error Remediation guidance */}
        {(check.status === "warning" || check.status === "failed") && check.remediation && (
          <div className="p-3.5 rounded-md border border-amber-500/30 bg-surface-01 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px]">
              <AlertTriangleIcon className="h-3.5 w-3.5" />
              Remediation Guidance
            </div>
            <p className="text-foreground/90 font-sans text-xs leading-relaxed">
              {check.remediation}
            </p>
          </div>
        )}

        {/* Live Reactive State Box (for zustand store check) */}
        {check.id === "fe_zustand_stores" && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Live Reactively Subscribed Values
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-md bg-surface-00 border border-border-default">
                <span className="text-muted-foreground text-[10px] block">Canvas Tool:</span>
                <span className="text-foreground font-bold">{canvasTool}</span>
              </div>
              <div className="p-2.5 rounded-md bg-surface-00 border border-border-default">
                <span className="text-muted-foreground text-[10px] block">Canvas Zoom:</span>
                <span className="text-foreground font-bold">{(canvasZoom * 100).toFixed(0)}%</span>
              </div>
              <div className="p-2.5 rounded-md bg-surface-00 border border-border-default">
                <span className="text-muted-foreground text-[10px] block">Sidebar:</span>
                <span className="text-foreground font-bold">{sidebarCollapsed ? "Collapsed" : "Expanded"}</span>
              </div>
              <div className="p-2.5 rounded-md bg-surface-00 border border-border-default">
                <span className="text-muted-foreground text-[10px] block">Studio Elements:</span>
                <span className="text-foreground font-bold">{studioNodesCount} nodes · {studioEdgesCount} edges</span>
              </div>
            </div>
          </div>
        )}

        {/* Technical Evidence */}
        {check.evidence && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Technical Evidence
              </span>
              <button
                onClick={handleCopyEvidence}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Copy JSON evidence"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-3 w-3" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-md bg-surface-00 border border-border-default text-[11px] text-muted-foreground overflow-x-auto leading-relaxed">
              {JSON.stringify(check.evidence, null, 2)}
            </pre>
          </div>
        )}

        {/* Contract Dependencies */}
        {check.dependencies && check.dependencies.length > 0 && (
          <div className="space-y-1.5 border-t border-border-subtle pt-3.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
              Audited Dependencies
            </span>
            <div className="flex flex-wrap gap-1.5">
              {check.dependencies.map((dep, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-00 border border-border-default text-foreground"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
