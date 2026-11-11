"use client";

import React from "react";
import type { TelemetryConnection } from "@nxtqr/architecture-intelligence";
import type {
  ObservabilityOverlayMode,
  TimeRangePreset,
} from "../hooks/use-architecture-observability";
import {
  ActivityIcon,
  RefreshIcon,
  CalendarIcon,
  LayersIcon,
} from "@nxtqr/icons";

export interface TelemetrySourceSelectorProps {
  activeConnection: TelemetryConnection;
  onConnectionChange: (conn: TelemetryConnection) => void;
  selectedPreset: TimeRangePreset;
  onSelectPreset: (preset: TimeRangePreset) => void;
  activeOverlay: ObservabilityOverlayMode;
  onSelectOverlay: (mode: ObservabilityOverlayMode) => void;
  isLoading: boolean;
  onRefresh: () => void;
  lastRefreshedAt: string;
  autoRefreshIntervalSeconds: number;
  onAutoRefreshChange: (seconds: number) => void;
  className?: string;
}

export function TelemetrySourceSelector({
  activeConnection,
  onConnectionChange,
  selectedPreset,
  onSelectPreset,
  activeOverlay,
  onSelectOverlay,
  isLoading,
  onRefresh,
  lastRefreshedAt,
  autoRefreshIntervalSeconds,
  onAutoRefreshChange,
  className = "",
}: TelemetrySourceSelectorProps) {
  const timePresets: TimeRangePreset[] = ["15m", "1h", "6h", "24h", "7d"];
  const overlayModes: Array<{ mode: ObservabilityOverlayMode; label: string }> = [
    { mode: "health", label: "Health Status" },
    { mode: "rps", label: "RPS Throughput" },
    { mode: "latency", label: "Latency P95" },
    { mode: "cpu", label: "CPU Saturation" },
    { mode: "none", label: "Overlay Off" },
  ];

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#080808] border-b border-[#262626] text-white text-xs select-none ${className}`}
    >
      {/* 1. Left Group: Source Connection Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-4 h-4 text-white" />
          <span className="font-semibold tracking-tight">Observability Gateway</span>
        </div>
        <span className="text-[#666666]">/</span>

        <select
          value={activeConnection.sourceType}
          onChange={(e) => {
            const sourceType = e.target.value as TelemetryConnection["sourceType"];
            onConnectionChange({
              ...activeConnection,
              sourceType,
              name:
                sourceType === "mock"
                  ? "Synthetic Telemetry Simulator"
                  : sourceType === "prometheus"
                  ? "Prometheus Production Cluster"
                  : "OpenTelemetry Collector OTLP",
            });
          }}
          className="bg-[#0D0D0D] border border-[#262626] hover:border-[#333333] focus:border-[#404040] text-white px-2 py-1 rounded-md text-xs font-mono outline-none transition-colors"
        >
          <option value="mock">Synthetic Mock Simulator (Deterministic)</option>
          <option value="prometheus">Prometheus Metrics Endpoint (PromQL)</option>
          <option value="opentelemetry">OpenTelemetry OTLP Collector (Traces/Logs)</option>
        </select>

        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#141414] border border-[#262626] rounded-md text-[11px] font-mono text-[#858585]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {activeConnection.status.toUpperCase()}
        </span>
      </div>

      {/* 2. Middle Group: Time Window Controls */}
      <div className="flex items-center gap-1.5 bg-[#0D0D0D] p-1 border border-[#262626] rounded-md">
        <CalendarIcon className="w-3.5 h-3.5 text-[#858585] ml-1 mr-0.5" />
        {timePresets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onSelectPreset(preset)}
            className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition-all ${
              selectedPreset === preset
                ? "bg-[#262626] text-white font-semibold"
                : "text-[#858585] hover:text-white hover:bg-[#141414]"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* 3. Right Group: Canvas Overlay Mode, Auto-Refresh, Refresh Button */}
      <div className="flex items-center gap-2">
        {/* Overlay Mode Selector */}
        <div className="flex items-center gap-1 bg-[#0D0D0D] px-2 py-1 border border-[#262626] rounded-md">
          <LayersIcon className="w-3.5 h-3.5 text-[#858585]" />
          <span className="text-[#858585] text-[11px] mr-1">Overlay:</span>
          <select
            value={activeOverlay}
            onChange={(e) => onSelectOverlay(e.target.value as ObservabilityOverlayMode)}
            className="bg-transparent border-none text-white text-[11px] font-mono outline-none cursor-pointer"
          >
            {overlayModes.map((o) => (
              <option key={o.mode} value={o.mode} className="bg-[#0D0D0D] text-white">
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Auto Refresh Interval */}
        <select
          value={autoRefreshIntervalSeconds}
          onChange={(e) => onAutoRefreshChange(Number(e.target.value))}
          className="bg-[#0D0D0D] border border-[#262626] hover:border-[#333333] text-[#858585] hover:text-white text-[11px] font-mono px-2 py-1 rounded-md outline-none"
        >
          <option value={0}>Auto-refresh: Off</option>
          <option value={5}>Every 5s</option>
          <option value={15}>Every 15s</option>
          <option value={60}>Every 1m</option>
        </select>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title={`Last updated at ${new Date(lastRefreshedAt).toLocaleTimeString()}`}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] active:bg-[#202020] text-white rounded-md transition-all disabled:opacity-50"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
