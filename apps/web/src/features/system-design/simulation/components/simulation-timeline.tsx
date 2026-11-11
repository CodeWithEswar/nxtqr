"use client";

import React, { useRef, useCallback } from "react";
import type {
  SimulationEvent,
  FailureInjection,
} from "@nxtqr/architecture-intelligence";

export interface SimulationTimelineProps {
  currentMs: number;
  totalMs: number;
  injections: FailureInjection[];
  events: SimulationEvent[];
  onSeek: (timestampMs: number) => void;
  className?: string;
}

export function SimulationTimeline({
  currentMs,
  totalMs,
  injections,
  events,
  onSeek,
  className = "",
}: SimulationTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const ratio = clickX / rect.width;
      const targetTime = Math.round(ratio * totalMs);
      onSeek(targetTime);
    },
    [totalMs, onSeek]
  );

  const currentRatio = Math.max(0, Math.min(1, currentMs / Math.max(1, totalMs)));

  // Major tick marks (e.g., every 10s or 15s)
  const tickIntervalMs = totalMs <= 60000 ? 10000 : 30000;
  const tickCount = Math.floor(totalMs / tickIntervalMs);
  const ticks = Array.from({ length: tickCount + 1 }).map((_, i) => i * tickIntervalMs);

  return (
    <div className={`flex flex-col gap-1.5 px-4 py-3 bg-surface-01 border border-border-default rounded-md select-none ${className}`}>
      {/* Top: Event and Injection markers */}
      <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
        <span>Timeline Overview</span>
        <span>{events.length} modeled events</span>
      </div>

      {/* Main Track Bar */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative h-7 w-full bg-surface-02 border border-border-subtle rounded-md cursor-pointer overflow-hidden"
      >
        {/* Render Injection Highlight Zones */}
        {injections.map((inj) => {
          const leftPct = (inj.startMs / totalMs) * 100;
          const widthPct = (inj.durationMs / totalMs) * 100;
          return (
            <div
              key={inj.id}
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              title={`Injection: ${inj.name} (${inj.startMs / 1000}s - ${(inj.startMs + inj.durationMs) / 1000}s)`}
              className="absolute top-1 bottom-1 bg-red-950/40 border border-red-800/60 rounded-md pointer-events-none"
            >
              <span className="absolute left-1 top-0.5 text-[9px] font-mono text-red-300 font-semibold truncate max-w-[100px]">
                {inj.type.replace(/_/g, " ")}
              </span>
            </div>
          );
        })}

        {/* Discrete Event Tick Dots */}
        {events.map((evt) => {
          const leftPct = (evt.timestampMs / totalMs) * 100;
          const isFailure = evt.type === "failure_injected" || evt.type === "failure_propagated";
          const isRecovery = evt.type === "recovery_completed" || evt.type === "failover_completed";

          return (
            <div
              key={evt.id}
              style={{ left: `${leftPct}%` }}
              title={`[${evt.timestampMs / 1000}s] ${evt.description}`}
              className={`absolute top-2 w-1.5 h-3 rounded-md -translate-x-1/2 pointer-events-none ${
                isFailure
                  ? "bg-red-500/80"
                  : isRecovery
                  ? "bg-blue-500/80"
                  : "bg-surface-04 border border-border-default"
              }`}
            />
          );
        })}

        {/* Scrubber Progress Fill */}
        <div
          style={{ width: `${currentRatio * 100}%` }}
          className="absolute top-0 bottom-0 left-0 bg-surface-04/50 border-r-2 border-border-strong pointer-events-none"
        />

        {/* Current Scrubber Head */}
        <div
          style={{ left: `${currentRatio * 100}%` }}
          className="absolute top-0 bottom-0 w-1 bg-white -translate-x-1/2 shadow-level-2 pointer-events-none"
        />
      </div>

      {/* Bottom: Axis Labels */}
      <div className="relative h-4 w-full">
        {ticks.map((t) => {
          const leftPct = (t / totalMs) * 100;
          return (
            <div
              key={t}
              style={{ left: `${leftPct}%` }}
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
            >
              <div className="w-[1px] h-1 bg-border-default" />
              <span className="text-[10px] font-mono text-text-muted mt-0.5">
                {t / 1000}s
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
