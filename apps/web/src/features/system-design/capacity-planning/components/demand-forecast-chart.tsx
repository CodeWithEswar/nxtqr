"use client";

import * as React from "react";
import type { ForecastTimePointSeries } from "@nxtqr/architecture-intelligence";
import { Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";

export interface DemandForecastChartProps {
  timeSeries: ForecastTimePointSeries[];
  totalCapacityRps: number;
  earliestSaturationLabel?: string;
  onSelectInterval?: (intervalIndex: number) => void;
  selectedIntervalIndex?: number | null;
  className?: string;
}

export function DemandForecastChart({
  timeSeries,
  totalCapacityRps,
  earliestSaturationLabel,
  onSelectInterval,
  selectedIntervalIndex,
  className,
}: DemandForecastChartProps) {
  const [hoveredPoint, setHoveredPoint] = React.useState<ForecastTimePointSeries | null>(null);

  if (!timeSeries || timeSeries.length === 0) {
    return (
      <div className="p-6 text-center font-mono text-xs text-text-muted bg-surface-02 border border-border-default rounded-md">
        No forecast data points generated.
      </div>
    );
  }

  // Calculate scales
  const maxDemand = Math.max(...timeSeries.map((p) => p.effectivePeakRps), 100);
  const chartMaxY = Math.max(maxDemand * 1.15, totalCapacityRps * 1.1, 500);

  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = svgWidth - paddingLeft - paddingRight;
  const innerHeight = svgHeight - paddingTop - paddingBottom;

  const pointsCount = timeSeries.length;
  const getX = (index: number) => paddingLeft + (index / Math.max(1, pointsCount - 1)) * innerWidth;
  const getY = (val: number) => paddingTop + innerHeight - (Math.min(val, chartMaxY) / chartMaxY) * innerHeight;

  // Build SVG path for Peak Demand
  const peakPath = timeSeries.reduce((acc, point, idx) => {
    const x = getX(idx);
    const y = getY(point.effectivePeakRps);
    return `${acc} ${idx === 0 ? "M" : "L"} ${x} ${y}`;
  }, "");

  // Build SVG path for Base Ingress Demand
  const basePath = timeSeries.reduce((acc, point, idx) => {
    const x = getX(idx);
    const y = getY(point.projectedIngressRps);
    return `${acc} ${idx === 0 ? "M" : "L"} ${x} ${y}`;
  }, "");

  // Area under Peak Demand
  const peakAreaPath = `${peakPath} L ${getX(pointsCount - 1)} ${paddingTop + innerHeight} L ${getX(0)} ${paddingTop + innerHeight} Z`;

  // Capacity lines
  const capacityY = getY(totalCapacityRps);
  const criticalY = getY(totalCapacityRps * 0.85);
  const warningY = getY(totalCapacityRps * 0.7);

  const activePoint = hoveredPoint || (selectedIntervalIndex !== null && selectedIntervalIndex !== undefined ? timeSeries[selectedIntervalIndex] : timeSeries[timeSeries.length - 1]);

  return (
    <div className={cn("p-4 bg-surface-01 border border-border-default rounded-md select-none", className)}>
      {/* Header and Telemetry */}
      <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary font-semibold">
            Workload Forecast & Headroom Trajectory
          </span>
          {earliestSaturationLabel && (
            <Badge variant="outline" className="text-[10px] bg-surface-03 text-text-secondary border-border-default">
              Saturates: {earliestSaturationLabel}
            </Badge>
          )}
        </div>

        {activePoint && (
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-text-muted">
              Point: <span className="text-foreground font-medium">{activePoint.intervalLabel}</span>
            </span>
            <span className="text-text-muted">
              Peak: <span className="text-foreground font-semibold">{activePoint.effectivePeakRps.toLocaleString()} RPS</span>
            </span>
            <span className="text-text-muted">
              Cap: <span className="text-text-secondary font-medium">{activePoint.totalCapacityRps.toLocaleString()} RPS</span>
            </span>
            <span className="text-text-muted">
              Headroom:{" "}
              <span className={cn(
                "font-semibold",
                activePoint.totalCapacityRps - activePoint.effectivePeakRps < 0
                  ? "text-rose-400"
                  : "text-emerald-400"
              )}>
                {(activePoint.totalCapacityRps - activePoint.effectivePeakRps).toLocaleString()} RPS
              </span>
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-56"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="peakDemandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingLeft}
            y1={paddingTop + innerHeight}
            x2={svgWidth - paddingRight}
            y2={paddingTop + innerHeight}
            stroke="#262626"
            strokeWidth="1"
          />

          {/* Warning line (70% capacity) */}
          {warningY >= paddingTop && warningY <= paddingTop + innerHeight && (
            <g>
              <line
                x1={paddingLeft}
                y1={warningY}
                x2={svgWidth - paddingRight}
                y2={warningY}
                stroke="#333333"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={svgWidth - paddingRight + 4} y={warningY + 3} fill="#666666" fontSize="9" fontFamily="monospace">
                70%
              </text>
            </g>
          )}

          {/* Critical line (85% capacity) */}
          {criticalY >= paddingTop && criticalY <= paddingTop + innerHeight && (
            <g>
              <line
                x1={paddingLeft}
                y1={criticalY}
                x2={svgWidth - paddingRight}
                y2={criticalY}
                stroke="#404040"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text x={svgWidth - paddingRight + 4} y={criticalY + 3} fill="#858585" fontSize="9" fontFamily="monospace">
                85%
              </text>
            </g>
          )}

          {/* Total Capacity line (100%) */}
          {capacityY >= paddingTop && capacityY <= paddingTop + innerHeight && (
            <g>
              <line
                x1={paddingLeft}
                y1={capacityY}
                x2={svgWidth - paddingRight}
                y2={capacityY}
                stroke="#666666"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />
              <text x={svgWidth - paddingRight + 4} y={capacityY + 3} fill="#B5B5B5" fontSize="9" fontFamily="monospace">
                100%
              </text>
            </g>
          )}

          {/* Peak Demand Gradient Area */}
          <path d={peakAreaPath} fill="url(#peakDemandGradient)" />

          {/* Base Demand Path */}
          <path d={basePath} fill="none" stroke="#666666" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Peak Demand Path */}
          <path d={peakPath} fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />

          {/* Interactive Data Points */}
          {timeSeries.map((point, idx) => {
            const x = getX(idx);
            const y = getY(point.effectivePeakRps);
            const isHovered = hoveredPoint?.intervalIndex === point.intervalIndex;
            const isSelected = selectedIntervalIndex === point.intervalIndex;
            const isSaturated = point.effectivePeakRps > totalCapacityRps;

            return (
              <g
                key={point.intervalIndex}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => onSelectInterval?.(point.intervalIndex)}
              >
                {/* Invisible hover capture target */}
                <circle cx={x} cy={y} r="14" fill="transparent" />

                {/* Vertical hover guide */}
                {(isHovered || isSelected) && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + innerHeight}
                    stroke="#404040"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered || isSelected ? "4.5" : "3"}
                  fill={isSaturated ? "#F43F5E" : "#FFFFFF"}
                  stroke="#141414"
                  strokeWidth="1.5"
                />

                {/* X-Axis Interval Label */}
                <text
                  x={x}
                  y={paddingTop + innerHeight + 16}
                  fill={isHovered || isSelected ? "#FFFFFF" : "#858585"}
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {point.intervalLabel}
                </text>
              </g>
            );
          })}

          {/* Y-Axis Reference Labels */}
          <text x={paddingLeft - 8} y={paddingTop + 8} fill="#666666" fontSize="9" fontFamily="monospace" textAnchor="end">
            {Math.round(chartMaxY)}
          </text>
          <text x={paddingLeft - 8} y={paddingTop + innerHeight / 2} fill="#666666" fontSize="9" fontFamily="monospace" textAnchor="end">
            {Math.round(chartMaxY / 2)}
          </text>
          <text x={paddingLeft - 8} y={paddingTop + innerHeight} fill="#666666" fontSize="9" fontFamily="monospace" textAnchor="end">
            0
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle font-mono text-[11px] text-text-muted">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-foreground inline-block" />
            <span>Effective Peak Demand</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-text-disabled border-b border-dashed border-text-disabled inline-block" />
            <span>Projected Base Ingress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-text-muted inline-block" />
            <span>Total Declared Capacity</span>
          </div>
        </div>
        <span>Click interval point to inspect</span>
      </div>
    </div>
  );
}
