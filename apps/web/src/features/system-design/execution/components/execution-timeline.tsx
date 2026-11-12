"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Button, Badge } from "@nxtqr/ui";
import { CloseIcon, ActivityIcon, SearchIcon } from "@nxtqr/icons";
import { useExecutionStore } from "../store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export interface ExecutionTimelineProps {
  className?: string;
  onClose?: () => void;
}

type TimelineFilter =
  | "all"
  | "request"
  | "response"
  | "cache"
  | "database"
  | "routing"
  | "security"
  | "faults";

const EVENT_TYPE_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  // Phase 05.4.1 base events
  "run.started": { label: "START", className: "text-text-secondary border-border-default bg-surface-03" },
  "node.entered": { label: "IN", className: "text-foreground border-border-default bg-surface-04" },
  "route.selected": { label: "BRANCH", className: "text-text-secondary border-border-strong bg-surface-03" },
  "node.exited": { label: "OUT", className: "text-text-muted border-border-subtle bg-surface-01" },
  "edge.traversed": { label: "TRANSIT", className: "text-text-secondary border-border-default bg-surface-03" },
  "run.completed": { label: "DONE", className: "text-emerald-400 border-border-strong bg-surface-04" },

  // Phase 05.4.2 lifecycle events
  "request.created": { label: "REQ INIT", className: "text-blue-400 border-border-default bg-blue-950/20" },
  "request.dispatched": { label: "REQ SEND", className: "text-blue-400 border-border-default bg-blue-950/20" },
  "request.received": { label: "REQ IN", className: "text-cyan-400 border-border-default bg-cyan-950/20" },
  "request.forwarded": { label: "REQ FWD", className: "text-text-secondary border-border-default bg-surface-03" },
  "response.created": { label: "RES GEN", className: "text-emerald-400 border-border-default bg-emerald-950/20" },
  "response.dispatched": { label: "RES SEND", className: "text-emerald-400 border-border-default bg-emerald-950/20" },
  "response.received": { label: "RES RECV", className: "text-emerald-400 border-border-default bg-emerald-950/20" },
  "route.match.selected": { label: "ROUTE MATCH", className: "text-purple-400 border-border-default bg-purple-950/20" },
  "route.match.failed": { label: "404 NOT FOUND", className: "text-rose-400 border-border-default bg-rose-950/20" },
  "route.upstream.selected": { label: "LB ROUTE", className: "text-purple-400 border-border-default bg-purple-950/20" },
  "cache.lookup.started": { label: "CACHE QUERY", className: "text-amber-400 border-border-default bg-amber-950/20" },
  "cache.hit": { label: "CACHE HIT", className: "text-emerald-400 border-border-default bg-emerald-950/20" },
  "cache.miss": { label: "CACHE MISS", className: "text-amber-400 border-border-default bg-amber-950/20" },
  "cache.write": { label: "CACHE SET", className: "text-amber-400 border-border-default bg-amber-950/20" },
  "database.read.started": { label: "DB READ", className: "text-blue-400 border-border-default bg-blue-950/20" },
  "database.read.completed": { label: "DB OK", className: "text-emerald-400 border-border-default bg-emerald-950/20" },
  "database.write.completed": { label: "DB WRITE", className: "text-emerald-400 border-border-default bg-emerald-950/20" },
  "database.operation.failed": { label: "DB FAIL", className: "text-rose-400 border-border-default bg-rose-950/20" },
  "component.processing.started": { label: "PROC START", className: "text-text-secondary border-border-default bg-surface-03" },
  "component.processing.completed": { label: "PROC OK", className: "text-text-secondary border-border-default bg-surface-03" },
};

export function ExecutionTimeline({ className, onClose }: ExecutionTimelineProps) {
  const trace = useExecutionStore((s) => s.trace);
  const activeIndex = useExecutionStore((s) => s.playbackState.currentStepIndex);
  const seekToStep = useExecutionStore((s) => s.seekToStep);
  const toggleTimeline = useExecutionStore((s) => s.toggleTimeline);
  const selectedEventId = useExecutionStore((s) => s.selectedEventId);
  const searchQuery = useExecutionStore((s) => s.timelineSearchQuery);
  const setSearchQuery = useExecutionStore((s) => s.setTimelineSearchQuery);
  const selectNode = useGraphEditorStore((s) => s.selectNode);

  const [filter, setFilter] = React.useState<TimelineFilter>("all");
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
          Click &quot;Run Flow&quot; on the execution toolbar to start modeled request propagation.
        </p>
      </div>
    );
  }

  // Filter events by domain category
  const filteredEvents = trace.events
    .map((evt, originalIdx) => ({ evt, originalIdx }))
    .filter(({ evt }) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      if (normalizedQuery) {
        const rec = evt as unknown as Record<string, unknown>;
        const hay = `${evt.type} ${evt.explanation} ${String(rec.nodeId || "")} ${String(rec.nodeLabel || "")} ${String(rec.correlationId || "")}`.toLowerCase();
        if (!hay.includes(normalizedQuery)) return false;
      }
      if (filter === "all") return true;
      if (filter === "request") return evt.type.startsWith("request.") || evt.type === "node.entered";
      if (filter === "response") return evt.type.startsWith("response.");
      if (filter === "cache") return evt.type.startsWith("cache.");
      if (filter === "database") return evt.type.startsWith("database.");
      if (filter === "routing") return evt.type.startsWith("route.");
      if (filter === "security")
        return evt.type.includes("zero_trust") || evt.type.includes("security") || evt.type.includes("waf") || evt.type.includes("auth");
      if (filter === "faults")
        return evt.type.includes("failed") || evt.type.includes("outage") || evt.type.includes("rejected") || evt.type.includes("circuit");
      return true;
    });

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

      {/* Filter Bar + Component / Correlation Search */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 bg-surface-01/60 border-b border-border-subtle font-mono text-[9px] shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: "all", label: "All" },
              { id: "request", label: "Requests" },
              { id: "response", label: "Responses" },
              { id: "cache", label: "Cache" },
              { id: "database", label: "Database" },
              { id: "routing", label: "Routing" },
              { id: "security", label: "Security" },
              { id: "faults", label: "Faults" },
            ] as const
          ).map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-2 py-0.5 rounded-md transition-colors uppercase border",
                  isSelected
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                    : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="relative min-w-[140px]">
          <SearchIcon className="w-3 h-3 text-text-disabled absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter node / trace..."
            aria-label="Filter timeline events by component or explanation"
            className="w-full pl-6 pr-2 py-0.5 rounded-md bg-surface-02 border border-border-subtle text-[10px] font-mono text-foreground placeholder:text-text-disabled focus:outline-none focus:border-border-strong"
          />
        </div>
      </div>

      {/* Events List */}
      <div
        ref={listRef}
        role="feed"
        aria-label="Ordered Execution Events"
        className="flex-1 overflow-y-auto min-h-0 divide-y divide-border-subtle/60 p-1"
      >
        {filteredEvents.map(({ evt, originalIdx }) => {
          const isActive = originalIdx === activeIndex;
          const isSelected = selectedEventId === evt.id;
          const badge = EVENT_TYPE_BADGES[evt.type] || { label: evt.type, className: "text-text-muted" };

          return (
            <div
              key={evt.id}
              data-step-index={originalIdx}
              onClick={() => {
                seekToStep(originalIdx);
                const rec = evt as unknown as Record<string, unknown>;
                const nid =
                  typeof rec.nodeId === "string"
                    ? rec.nodeId
                    : typeof rec.entryNodeId === "string"
                      ? rec.entryNodeId
                      : undefined;
                if (nid) selectNode(nid);
              }}
              role="article"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  seekToStep(originalIdx);
                  const rec = evt as unknown as Record<string, unknown>;
                  const nid =
                    typeof rec.nodeId === "string"
                      ? rec.nodeId
                      : typeof rec.entryNodeId === "string"
                        ? rec.entryNodeId
                        : undefined;
                  if (nid) selectNode(nid);
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
                      ? (evt as any).nodeLabel
                      : "edgeLabel" in evt
                        ? (evt as any).edgeLabel
                        : "entryNodeId" in evt
                          ? (evt as any).entryNodeId
                          : "Execution Event"}
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
