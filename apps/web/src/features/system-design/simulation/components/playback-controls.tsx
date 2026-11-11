"use client";

import React from "react";
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshIcon,
} from "@nxtqr/icons";

export interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentMs: number;
  totalMs: number;
  className?: string;
}

export function PlaybackControls({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
  speed,
  onSpeedChange,
  currentMs,
  totalMs,
  className = "",
}: PlaybackControlsProps) {
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const speedOptions = [0.5, 1.0, 2.0, 5.0];

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 bg-surface-02 border border-border-default rounded-md select-none ${className}`}
    >
      {/* Left: Step and playback buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onReset}
          title="Reset to T=0s"
          className="p-1.5 text-text-secondary hover:text-white hover:bg-surface-03 border border-border-subtle rounded-md transition-colors"
        >
          <RefreshIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onStepBackward}
          title="Step Backward (Previous Event)"
          className="p-1.5 text-text-secondary hover:text-white hover:bg-surface-03 border border-border-subtle rounded-md transition-colors"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          title={isPlaying ? "Pause Simulation" : "Play Simulation"}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-03 hover:bg-surface-04 border border-border-default hover:border-border-hover text-white text-xs font-medium rounded-md transition-all shadow-level-1"
        >
          {isPlaying ? (
            <>
              <PauseIcon className="w-3.5 h-3.5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-3.5 h-3.5" />
              <span>Simulate</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onStepForward}
          title="Step Forward (Next Event)"
          className="p-1.5 text-text-secondary hover:text-white hover:bg-surface-03 border border-border-subtle rounded-md transition-colors"
        >
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle: Virtual Time Readout */}
      <div className="flex items-center gap-2 font-mono text-xs text-text-secondary">
        <span className="text-white font-semibold">{formatTime(currentMs)}</span>
        <span className="text-text-muted">/</span>
        <span>{formatTime(totalMs)}</span>
        <span className="text-text-muted text-[10px]">({currentMs}ms virtual)</span>
      </div>

      {/* Right: Playback Speed selector */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-text-muted mr-1">Speed:</span>
        {speedOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSpeedChange(opt)}
            className={`px-2 py-0.5 text-[11px] font-mono rounded-md border transition-all ${
              speed === opt
                ? "bg-surface-04 border-border-strong text-white font-semibold shadow-level-3"
                : "bg-surface-01 border-border-subtle text-text-secondary hover:bg-surface-03 hover:border-border-default"
            }`}
          >
            {opt}x
          </button>
        ))}
      </div>
    </div>
  );
}
