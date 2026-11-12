"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Button, Badge } from "@nxtqr/ui";
import { CloseIcon, ActivityIcon } from "@nxtqr/icons";
import { useExecutionStore } from "../store/execution-store";

export interface ExecutionTimelineProps {
  className?: string;
  onClose?: () => void;
}

const EVENT_TYPE_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  "run.started": { label: "START", className: "text-text-secondary border-border-default bg-surface-03" },
  "node.entered": { label: "IN", className: "text-foreground border-border-default bg-surface-04" },
  "route.selected": { label: "BRANCH", className: "text-text-secondary border-border-strong bg-surface-03" },
  "node.exited": { label: "OUT", className: "text-text-muted border-border-subtle bg-surface-01" },
  "edge.traversed": { label: "TRANSIT", className: "text-text-secondary border-border-default bg-surface-03" },
  "run.completed": { label: "DONE", className: "text-emerald-400 border-border-strong bg-surface-04" },
};

export function ExecutionTimeline({ className, onClose }: ExecutionTimelineProps) {
  const trace = useExecutionStore((s) => s.trace);
  const activeIndex = useExecutionStore((s) => s.playbackState.currentStepIndex);
  const seekToStep = useExecutionStore((s) => s.seekToStep);
  const toggleTimeline = useExecutionStore((s) => s.toggleTimeline);
  const selectedEventId = useExecutionStore((s) => s.selectedEventId);

  const listRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to active event row
  React.useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-step-index="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIndex]);

  if (!trace || trace.events.length === 0) {
    return (
      <div
        className={cn(
          "w-full h-48 bg-surface-02 border border-border-default rounded-md p-4 flex flex-col items-center justify-center text-center shadow-level-2",
          className
        )}
      >
        <ActivityIcon className="w-6 h-6 text-text-disabled mb-2" />
        <h4 className="text-xs font-semibold text-foreground">No Active Execution Trace</h4>
        <p className="text-[11px] text-text-muted mt-1 max-w-xs">
          Click "Run Flow" on the execution toolbar to start modeled request propagation.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-surface-02 border border-border-default rounded-md shadow-level-2 overflow-hidden select-none",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-01 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-3.5 h-3.5 text-text-secondary" />
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-foreground">
            Execution Timeline
          </span>
          <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 h-4 border-border-default text-text-muted">
            {trace.events.length} Events · {trace.totalDurationMs}ms
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleTimeline(false))}
            className="h-6 w-6 p-0 text-text-muted hover:text-foreground rounded"
            title="Close Timeline"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div
        ref={listRef}
        role="feed"
        aria-label="Ordered Execution Events"
        className="flex-1 overflow-y-auto min-h-0 divide-y divide-border-subtle/60 p-1"
      >
        {trace.events.map((evt, idx) => {
          const isActive = idx === activeIndex;
          const isSelected = selectedEventId === evt.id;
          const badge = EVENT_TYPE_BADGES[evt.type] || { label: evt.type, className: "text-text-muted" };

          return (
            <div
              key={evt.id}
              data-step-index={idx}
              onClick={() => seekToStep(idx)}
              role="article"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  seekToStep(idx);
                }
              }}
              className={cn(
                "group flex items-start gap-2.5 px-2.5 py-1.5 rounded transition-colors cursor-pointer text-left text-xs",
                isActive
                  ? "bg-surface-04 border border-border-strong shadow-level-3"
                  : isSelected
                    ? "bg-surface-03 border border-border-default"
                    : "hover:bg-surface-03/70 border border-transparent"
              )}
            >
              {/* Sequence badge & indicator */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                <span className="font-mono text-[10px] text-text-disabled w-5 text-right">
                  #{evt.sequence}
                </span>
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    isActive ? "bg-foreground" : "bg-transparent group-hover:bg-border-strong"
                  )}
                  aria-hidden="true"
                />
              </div>

              {/* Event Type & Target Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={cn("text-[8px] font-mono uppercase px-1 py-0.2 rounded border", badge.className)}>
                    {badge.label}
                  </span>

                  <span className="font-mono text-[11px] font-semibold text-foreground truncate">
                    {"nodeLabel" in evt
                      ? evt.nodeLabel
                      : "edgeLabel" in evt
                        ? evt.edgeLabel
                        : "entryNodeId" in evt
                          ? evt.entryNodeId
                          : "Execution Finished"}
                  </span>
                </div>

                <p className="font-sans text-[11px] text-text-secondary line-clamp-2 mt-0.5 leading-relaxed">
                  {evt.explanation}
                </p>
              </div>

              {/* Virtual Timestamp */}
              <div className="text-right shrink-0 pt-0.5">
                <span className="font-mono text-[10px] text-text-muted">
                  +{evt.atMs}ms
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
