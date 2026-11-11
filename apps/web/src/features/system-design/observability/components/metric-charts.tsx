"use client";

import React, { useState } from "react";
import type { ServiceHealthIndicator } from "@nxtqr/architecture-intelligence";
import { ActivityIcon, CalendarIcon, AlertCircleIcon, CpuIcon } from "@nxtqr/icons";

export interface MetricChartsProps {
  health?: ServiceHealthIndicator;
  componentLabel: string;
  className?: string;
}

interface SparklinePoint {
  x: number;
  y: number;
  val: number;
  label: string;
}

function renderSvgLineChart(
  data: number[],
  labels: string[],
  _unit: string,
  color: string,
  targetLine?: { value: number; label: string }
) {
  if (data.length === 0) {
    return (
      <div className="h-28 flex items-center justify-center text-[#858585] text-xs font-mono">
        No metric data points in active time window
      </div>
    );
  }

  const width = 320;
  const height = 100;
  const padTop = 15;
  const padBottom = 20;
  const padLeft = 10;
  const padRight = 10;

  const minVal = 0;
  const maxVal = Math.max(...data, targetLine ? targetLine.value * 1.1 : 1, 10);

  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const points: SparklinePoint[] = data.map((val, idx) => {
    const x = padLeft + (idx / Math.max(1, data.length - 1)) * innerWidth;
    const y = padTop + innerHeight - ((val - minVal) / (maxVal - minVal)) * innerHeight;
    return { x, y, val, label: labels[idx] || "" };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + innerHeight} L ${
    points[0].x
  } ${padTop + innerHeight} Z`;

  let targetY: number | null = null;
  if (targetLine && targetLine.value <= maxVal) {
    targetY = padTop + innerHeight - ((targetLine.value - minVal) / (maxVal - minVal)) * innerHeight;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible select-none">
      {/* Background horizontal grid lines */}
      <line
        x1={padLeft}
        y1={padTop}
        x2={padLeft + innerWidth}
        y2={padTop}
        stroke="#1A1A1A"
        strokeWidth="1"
      />
      <line
        x1={padLeft}
        y1={padTop + innerHeight / 2}
        x2={padLeft + innerWidth}
        y2={padTop + innerHeight / 2}
        stroke="#1A1A1A"
        strokeWidth="1"
      />
      <line
        x1={padLeft}
        y1={padTop + innerHeight}
        x2={padLeft + innerWidth}
        y2={padTop + innerHeight}
        stroke="#262626"
        strokeWidth="1"
      />

      {/* Target Threshold Line (e.g. SLO limit) */}
      {targetY !== null && (
        <g>
          <line
            x1={padLeft}
            y1={targetY}
            x2={padLeft + innerWidth}
            y2={targetY}
            stroke="#FFAA00"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <text
            x={padLeft + innerWidth - 2}
            y={targetY - 3}
            fill="#FFAA00"
            fontSize="9"
            fontFamily="Geist Mono, monospace"
            textAnchor="end"
          >
            {targetLine?.label}
          </text>
        </g>
      )}

      {/* Area gradient */}
      <path d={areaD} fill={color} fillOpacity="0.08" />

      {/* Metric Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" />

      {/* Latest value dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill="#000000"
          stroke={color}
          strokeWidth="2"
        />
      )}

      {/* Axis value labels */}
      <text
        x={padLeft}
        y={height - 4}
        fill="#666666"
        fontSize="9"
        fontFamily="Geist Mono, monospace"
      >
        {labels[0] || "Start"}
      </text>
      <text
        x={padLeft + innerWidth}
        y={height - 4}
        fill="#666666"
        fontSize="9"
        fontFamily="Geist Mono, monospace"
        textAnchor="end"
      >
        {labels[labels.length - 1] || "Now"}
      </text>
    </svg>
  );
}

export function MetricCharts({ health, componentLabel, className = "" }: MetricChartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<"throughput" | "latency" | "errors" | "saturation">("throughput");

  const rps = health?.metrics.rps ?? 0;
  const p50 = health?.metrics.p50LatencyMs ?? 0;
  const p95 = health?.metrics.p95LatencyMs ?? 0;
  const p99 = health?.metrics.p99LatencyMs ?? 0;
  const errorRate = health?.metrics.errorRatePct ?? 0;
  const cpu = health?.metrics.cpuSaturationPct ?? 0;

  // Generate synthetic sample points based on current value for visual realism
  const sampleLabels = ["-15m", "-12m", "-9m", "-6m", "-3m", "Now"];

  const rpsSeries = [
    Math.round(rps * 0.85),
    Math.round(rps * 0.92),
    Math.round(rps * 1.05),
    Math.round(rps * 0.98),
    Math.round(rps * 1.02),
    rps,
  ];

  const p95Series = [
    Math.round(p95 * 0.9),
    Math.round(p95 * 0.95),
    Math.round(p95 * 1.1),
    Math.round(p95 * 1.04),
    Math.round(p95 * 0.98),
    p95,
  ];

  const errorSeries = [
    Number((errorRate * 0.8).toFixed(2)),
    Number((errorRate * 1.2).toFixed(2)),
    Number((errorRate * 0.9).toFixed(2)),
    Number((errorRate * 1.1).toFixed(2)),
    Number((errorRate * 0.95).toFixed(2)),
    errorRate,
  ];

  const cpuSeries = [
    Math.round(cpu * 0.9),
    Math.round(cpu * 0.94),
    Math.round(cpu * 1.03),
    Math.round(cpu * 0.98),
    Math.round(cpu * 1.01),
    cpu,
  ];

  return (
    <div className={`flex flex-col bg-[#080808] border border-[#262626] rounded-md p-3 select-none ${className}`}>
      {/* Metric Selector Tabs */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-2 mb-3">
        <span className="font-semibold text-xs text-white truncate max-w-[150px]">
          {componentLabel}
        </span>
        <div className="flex items-center gap-1 bg-[#0D0D0D] p-0.5 border border-[#262626] rounded-md font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setSelectedMetric("throughput")}
            className={`px-1.5 py-0.5 rounded-md transition-colors ${
              selectedMetric === "throughput" ? "bg-[#262626] text-white" : "text-[#858585] hover:text-white"
            }`}
          >
            RPS
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("latency")}
            className={`px-1.5 py-0.5 rounded-md transition-colors ${
              selectedMetric === "latency" ? "bg-[#262626] text-white" : "text-[#858585] hover:text-white"
            }`}
          >
            Latency
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("errors")}
            className={`px-1.5 py-0.5 rounded-md transition-colors ${
              selectedMetric === "errors" ? "bg-[#262626] text-white" : "text-[#858585] hover:text-white"
            }`}
          >
            Errors
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric("saturation")}
            className={`px-1.5 py-0.5 rounded-md transition-colors ${
              selectedMetric === "saturation" ? "bg-[#262626] text-white" : "text-[#858585] hover:text-white"
            }`}
          >
            CPU
          </button>
        </div>
      </div>

      {/* Selected Chart Card */}
      {selectedMetric === "throughput" && (
        <div>
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-[#858585] flex items-center gap-1.5">
              <ActivityIcon className="w-3.5 h-3.5 text-white" />
              Throughput (RPS)
            </span>
            <span className="font-mono font-bold text-white text-sm">{rps} req/s</span>
          </div>
          {renderSvgLineChart(rpsSeries, sampleLabels, "req/s", "#FFFFFF")}
        </div>
      )}

      {selectedMetric === "latency" && (
        <div>
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-[#858585] flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
              P95 Latency (SLO &lt; 200ms)
            </span>
            <span className="font-mono font-bold text-white text-sm">{p95} ms</span>
          </div>
          {renderSvgLineChart(p95Series, sampleLabels, "ms", "#E5A93C", {
            value: 200,
            label: "SLO: 200ms",
          })}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#858585] mt-1 pt-1 border-t border-[#1A1A1A]">
            <span>P50: {p50}ms</span>
            <span>P95: {p95}ms</span>
            <span>P99: {p99}ms</span>
          </div>
        </div>
      )}

      {selectedMetric === "errors" && (
        <div>
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-[#858585] flex items-center gap-1.5">
              <AlertCircleIcon className="w-3.5 h-3.5 text-red-400" />
              Error Rate (%)
            </span>
            <span className={`font-mono font-bold text-sm ${errorRate >= 5 ? "text-red-400" : "text-white"}`}>
              {errorRate.toFixed(2)}%
            </span>
          </div>
          {renderSvgLineChart(errorSeries, sampleLabels, "%", "#FF4D4D", {
            value: 1.0,
            label: "Max SLO: 1.0%",
          })}
        </div>
      )}

      {selectedMetric === "saturation" && (
        <div>
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-[#858585] flex items-center gap-1.5">
              <CpuIcon className="w-3.5 h-3.5 text-blue-400" />
              CPU Utilization
            </span>
            <span className={`font-mono font-bold text-sm ${cpu >= 80 ? "text-amber-400" : "text-white"}`}>
              {cpu}%
            </span>
          </div>
          {renderSvgLineChart(cpuSeries, sampleLabels, "%", "#60A5FA", {
            value: 80,
            label: "Warning: 80%",
          })}
        </div>
      )}
    </div>
  );
}
