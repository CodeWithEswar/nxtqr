"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Badge } from "@nxtqr/ui";
import { LayersIcon } from "@nxtqr/icons";
import { useExecutionStore } from "../store/execution-store";

export interface QueueInspectorProps {
  className?: string;
}

export function QueueInspector({ className }: QueueInspectorProps) {
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const runtimeState = currentFrame?.runtimeState;

  const queues = runtimeState?.queues || {};
  const queueEntries = Object.entries(queues);

  if (queueEntries.length === 0) {
    return (
      <div className={cn("p-3 rounded bg-surface-01 border border-border-subtle text-center text-[10px] font-mono text-text-muted", className)}>
        No active message queues modeled in current execution step.
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5 font-mono text-[10px]", className)}>
      {queueEntries.map(([qNodeId, qState]) => (
        <div key={qNodeId} className="p-2.5 rounded bg-surface-01 border border-border-subtle space-y-2">
          {/* Queue Header */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-1.5">
            <div className="flex items-center gap-1.5 truncate">
              <LayersIcon className="w-3.5 h-3.5 text-text-secondary shrink-0" />
              <span className="font-semibold text-foreground truncate">{qState.name || qNodeId}</span>
            </div>
            <Badge variant="outline" className="text-[9px] font-mono border-border-default text-text-muted">
              Capacity: {qState.capacity}
            </Badge>
          </div>

          {/* Queue Depth Metric Cards */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-[9px]">
            <div className="p-1 rounded bg-surface-02 border border-border-subtle">
              <span className="text-text-muted block uppercase text-[8px]">Ready</span>
              <span className="text-foreground font-bold">{qState.readyMessageIds.length}</span>
            </div>
            <div className="p-1 rounded bg-surface-02 border border-border-subtle">
              <span className="text-text-muted block uppercase text-[8px]">In-Flight</span>
              <span className="text-amber-400 font-bold">{qState.inFlightMessageIds.length}</span>
            </div>
            <div className="p-1 rounded bg-surface-02 border border-border-subtle">
              <span className="text-text-muted block uppercase text-[8px]">ACKed</span>
              <span className="text-emerald-400 font-bold">{qState.acknowledgedMessageIds.length}</span>
            </div>
            <div className="p-1 rounded bg-surface-02 border border-border-subtle">
              <span className="text-text-muted block uppercase text-[8px]">DLQ</span>
              <span className="text-rose-400 font-bold">{qState.deadLetteredMessageIds.length}</span>
            </div>
          </div>

          {/* Dead-Letter Target if configured */}
          {qState.deadLetterQueueId && (
            <div className="text-[9px] text-text-disabled flex items-center justify-between pt-0.5">
              <span>Dead-Letter Routing:</span>
              <span className="text-text-muted font-semibold">➔ {qState.deadLetterQueueId}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
