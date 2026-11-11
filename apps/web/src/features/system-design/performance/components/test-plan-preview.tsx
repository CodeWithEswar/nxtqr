"use client";

import * as React from "react";
import type { WorkloadProfile } from "@nxtqr/architecture-intelligence";

export interface TestPlanPreviewProps {
  profile: WorkloadProfile;
}

export function TestPlanPreview({ profile }: TestPlanPreviewProps) {
  const isClosed = profile.modelType === "closed_loop";
  const stages = profile.stages;

  // Calculate cumulative seconds and points for SVG path
  const totalDuration = React.useMemo(
    () => stages.reduce((acc, s) => acc + s.durationSeconds, 0),
    [stages]
  );

  const maxLoad = React.useMemo(() => {
    let max = 0;
    for (const s of stages) {
      const load = isClosed ? (s.targetVUs ?? profile.maxVUs) : (s.targetRps ?? profile.targetRps);
      if (load > max) max = load;
    }
    return Math.max(10, max);
  }, [isClosed, profile, stages]);

  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Generate SVG path points
  const points = React.useMemo(() => {
    let currentXSec = 0;
    let currentLoad = isClosed ? profile.initialVUs : 0;

    const coords: Array<{ x: number; y: number; stageName: string; stageType: string; duration: number; load: number }> = [];

    // Starting point
    coords.push({
      x: padding.left,
      y: padding.top + plotHeight - (currentLoad / maxLoad) * plotHeight,
      stageName: "Start",
      stageType: "warmup",
      duration: 0,
      load: currentLoad,
    });

    for (const stage of stages) {
      currentXSec += stage.durationSeconds;
      const targetLoad = isClosed
        ? stage.targetVUs ?? profile.maxVUs
        : stage.targetRps ?? profile.targetRps;

      const px = padding.left + (currentXSec / Math.max(1, totalDuration)) * plotWidth;
      const py = padding.top + plotHeight - (targetLoad / maxLoad) * plotHeight;

      coords.push({
        x: px,
        y: py,
        stageName: stage.name,
        stageType: stage.stageType,
        duration: stage.durationSeconds,
        load: targetLoad,
      });

      currentLoad = targetLoad;
    }

    return coords;
  }, [isClosed, maxLoad, padding.left, padding.top, plotHeight, plotWidth, profile, stages, totalDuration]);

  const pathD = React.useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), "");
  }, [points]);

  const areaD = React.useMemo(() => {
    if (points.length === 0) return "";
    const last = points[points.length - 1];
    const first = points[0];
    const baselineY = padding.top + plotHeight;
    return `${pathD} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [pathD, padding.top, plotHeight, points]);

  return (
    <div className="flex flex-col bg-[#080808] border border-[#262626] rounded-md p-3 select-none">
      <div className="flex items-center justify-between border-b border-[#202020] pb-2 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#858585]">
          Planned Workload Profile Curve
        </span>
        <div className="flex items-center gap-3 font-mono text-[10px] text-[#666666]">
          <span>Total Horizon: {totalDuration}s</span>
          <span>•</span>
          <span>Peak: {maxLoad} {isClosed ? "VUs" : "RPS"}</span>
        </div>
      </div>

      <div className="w-full overflow-hidden flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[190px]">
          {/* Subtle Grid Lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left + plotWidth}
            y2={padding.top}
            stroke="#1A1A1A"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight * 0.5}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight * 0.5}
            stroke="#1A1A1A"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="#262626"
          />

          {/* Fill Gradient Area */}
          <path d={areaD} fill="#141414" opacity="0.6" />

          {/* Stroke Path */}
          <path d={pathD} fill="none" stroke="#FFFFFF" strokeWidth="1.5" />

          {/* Stage Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="3" fill="#080808" stroke="#FFFFFF" strokeWidth="1.5" />
              {i > 0 && (
                <text
                  x={pt.x}
                  y={padding.top + plotHeight + 16}
                  fill="#858585"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  +{pt.duration}s
                </text>
              )}
            </g>
          ))}

          {/* Y-Axis Labels */}
          <text
            x={padding.left - 8}
            y={padding.top + 4}
            fill="#666666"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="end"
          >
            {maxLoad}
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + plotHeight * 0.5 + 3}
            fill="#666666"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="end"
          >
            {Math.round(maxLoad * 0.5)}
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + plotHeight}
            fill="#666666"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="end"
          >
            0
          </text>

          {/* Axis Title */}
          <text
            x={padding.left}
            y={padding.top - 6}
            fill="#858585"
            fontSize="9"
            fontFamily="monospace"
          >
            {isClosed ? "CONCURRENCY (VUs)" : "ARRIVAL RATE (RPS)"}
          </text>
        </svg>
      </div>
    </div>
  );
}
