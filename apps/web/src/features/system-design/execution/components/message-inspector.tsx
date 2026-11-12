"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Badge } from "@nxtqr/ui";
import { useExecutionStore } from "../store/execution-store";
import type { ModeledMessage } from "@nxtqr/architecture-execution";

export interface MessageInspectorProps {
  className?: string;
}

export function MessageInspector({ className }: MessageInspectorProps) {
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const runtimeState = currentFrame?.runtimeState;
  const messages = runtimeState?.activeMessages || [];

  if (messages.length === 0) {
    return (
      <div className={cn("p-3 rounded bg-surface-01 border border-border-subtle text-center text-[10px] font-mono text-text-muted", className)}>
        No active modeled messages in current execution step.
      </div>
    );
  }

  return (
    <div className={cn("space-y-2 font-mono text-[10px]", className)}>
      {messages.map((msg: ModeledMessage) => {
        const statusColor =
          msg.status === "acknowledged"
            ? "text-emerald-400 border-border-default bg-emerald-950/20"
            : msg.status === "dead-lettered"
              ? "text-rose-400 border-border-default bg-rose-950/20"
              : msg.status === "retry-pending"
                ? "text-amber-400 border-border-default bg-amber-950/20"
                : "text-text-secondary border-border-default bg-surface-03";

        return (
          <div key={msg.id} className="p-2.5 rounded bg-surface-01 border border-border-subtle space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">#{msg.id.slice(-8)}</span>
              <Badge variant="outline" className={cn("text-[8px] font-mono px-1 py-0 uppercase", statusColor)}>
                {msg.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[9px] text-text-muted">
              <div>
                <span>Attempt:</span> <span className="text-foreground font-semibold">{msg.attempt}/{msg.maxAttempts}</span>
              </div>
              <div>
                <span>Correlation:</span> <span className="text-foreground truncate">#{msg.correlationId.slice(-6)}</span>
              </div>
              <div>
                <span>Target:</span> <span className="text-foreground">{msg.destinationQueueId}</span>
              </div>
              {msg.consumerNodeId && (
                <div>
                  <span>Worker:</span> <span className="text-foreground">{msg.consumerNodeId}</span>
                </div>
              )}
            </div>

            {msg.idempotencyKey && (
              <div className="text-[9px] text-text-disabled">
                Idempotency: <span className="text-text-muted font-mono">{msg.idempotencyKey}</span>
              </div>
            )}

            {/* Payload preview */}
            {msg.payload !== undefined && (
              <div className="space-y-0.5 pt-1 border-t border-border-subtle">
                <span className="text-[8px] uppercase tracking-wider text-text-disabled block">Message Payload</span>
                <pre className="p-1 rounded bg-surface-02 border border-border-subtle text-[8px] text-text-secondary overflow-x-auto max-h-20">
                  {typeof msg.payload === "object" ? JSON.stringify(msg.payload, null, 2) : String(msg.payload)}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
