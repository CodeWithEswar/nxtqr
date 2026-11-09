"use client";

import * as React from "react";
import { useGraphEditorStore } from "@nxtqr/state";
import { filterTraceEvents, formatRelativeTimestamp } from "@nxtqr/execution-trace";
import type { SimulationEvent } from "@nxtqr/simulation-core";
import { Badge } from "@nxtqr/ui";
import {
  SearchIcon,
  RefreshIcon,
  TerminalIcon,
} from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export function ExecutionTraceViewer({ className }: { className?: string }) {
  const traceEvents = useGraphEditorStore((state) => state.traceEvents);
  const selectedTraceEventId = useGraphEditorStore((state) => state.selectedTraceEventId);
  const selectTraceEvent = useGraphEditorStore((state) => state.selectTraceEvent);
  const selectNode = useGraphEditorStore((state) => state.selectNode);
  const clearTraceEvents = useGraphEditorStore((state) => state.clearTraceEvents);

  const [search, setSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "success" | "failure">("all");

  const filteredEvents = React.useMemo(() => {
    return filterTraceEvents(traceEvents, {
      searchQuery: search,
      status: statusFilter,
    });
  }, [traceEvents, search, statusFilter]);

  const selectedEvent = traceEvents.find((e) => e.id === selectedTraceEventId) ?? filteredEvents[0];

  const handleSelectEvent = (event: SimulationEvent) => {
    selectTraceEvent(event.id);
    if (event.targetNodeId) {
      selectNode(event.targetNodeId);
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface shadow-level-1 overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Header & Filter Bar */}
      <div className="p-2.5 sm:p-3 border-b border-subtle-border bg-elevated-surface flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <TerminalIcon className="h-4 w-4 text-foreground shrink-0" />
          <span className="text-xs font-mono font-semibold text-foreground">
            <span className="hidden sm:inline">Execution Trace Stream</span>
            <span className="sm:hidden">Trace Stream</span>
          </span>
          <Badge variant="outline" className="text-[10px] font-mono border-subtle-border">
            {filteredEvents.length} <span className="hidden sm:inline">Events</span>
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter trace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs font-mono pl-7 pr-2.5 py-1 rounded-md border border-subtle-border bg-black text-foreground placeholder:text-muted-foreground w-28 sm:w-44 focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-0.5 p-0.5 bg-black border border-subtle-border rounded-md">
            {(["all", "success", "failure"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-1.5 sm:px-2 py-0.5 text-[10px] font-mono rounded capitalize transition-colors",
                  statusFilter === s
                    ? "border-border-strong bg-surface-04 text-foreground font-semibold shadow-level-3"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Clear button */}
          <button
            onClick={clearTraceEvents}
            disabled={traceEvents.length === 0}
            className="p-1 rounded border border-subtle-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            title="Clear Trace Stream"
          >
            <RefreshIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Main Body: Event Timeline & Event Detail Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border min-h-[220px] max-h-[300px]">
        {/* Left: Scrollable Event Stream */}
        <div className="overflow-y-auto p-2 space-y-1 bg-black/50 scrollbar-dense">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <TerminalIcon className="h-6 w-6 mb-2 opacity-50" />
              <p className="text-xs font-mono">
                {traceEvents.length === 0
                  ? "No simulation traces recorded yet. Click 'Start' or 'Step' above."
                  : "No events match current filter."}
              </p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isSelected = evt.id === selectedTraceEventId;
              const payload = evt.payload as any;
              return (
                <div
                  key={evt.id}
                  onClick={() => handleSelectEvent(evt)}
                  className={cn(
                    "p-2 rounded border transition-all cursor-pointer flex items-center justify-between text-xs font-mono select-none",
                    isSelected
                      ? "border-border-strong bg-surface-04 text-foreground ring-1 ring-border-default shadow-level-2"
                      : "border-border/60 bg-elevated-surface text-muted-foreground hover:border-border-hover hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="text-[10px] font-bold text-foreground tabular-nums shrink-0">
                      #{evt.step.toString().padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {formatRelativeTimestamp(evt.timestamp)}
                    </span>
                    <span className="text-foreground font-semibold truncate">
                      {evt.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                      ({payload?.label ?? evt.targetNodeId})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      {payload?.durationMs}ms
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold uppercase">
                      OK
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Event Detail Panel */}
        <div className="p-3 bg-surface overflow-y-auto space-y-3 font-mono text-xs">
          {selectedEvent ? (
            <>
              <div className="flex items-center justify-between border-b border-subtle-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">STEP #{selectedEvent.step}</span>
                  <span className="text-muted-foreground">EVENT_DETAILS</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                  SUCCESS
                </Badge>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Node:</span>
                  <span className="text-foreground font-semibold">{selectedEvent.targetNodeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Type:</span>
                  <span className="text-foreground">{selectedEvent.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Relative Time:</span>
                  <span className="text-foreground">{formatRelativeTimestamp(selectedEvent.timestamp)}</span>
                </div>
              </div>

              {/* JSON Payload viewer */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Telemetry Payload</span>
                <pre className="p-2.5 rounded bg-black border border-border text-[11px] text-muted-foreground overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground text-xs italic">
              Select an event from the stream to view structured telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
