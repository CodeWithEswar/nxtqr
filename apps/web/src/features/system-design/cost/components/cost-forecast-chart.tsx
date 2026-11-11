"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import {
  DecimalMoney,
  type CostForecastIntervalPoint,
} from "@nxtqr/architecture-intelligence";

export interface CostForecastChartProps {
  forecast: CostForecastIntervalPoint[];
  currency?: string;
  className?: string;
}

export function CostForecastChart({
  forecast,
  currency = "USD",
  className,
}: CostForecastChartProps) {
  if (forecast.length === 0) return null;

  const maxCost = Math.max(...forecast.map((p) => Number(p.totalMonthlyCost)));
  const minCost = Math.min(...forecast.map((p) => Number(p.totalMonthlyCost)));
  const costSpread = Math.max(10, maxCost - minCost);

  // SVG chart dimensions
  const width = 500;
  const height = 160;
  const paddingX = 40;
  const paddingY = 25;

  const points = forecast.map((p, idx) => {
    const x = paddingX + (idx / Math.max(1, forecast.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((Number(p.totalMonthlyCost) - minCost) / costSpread) * (height - 2 * paddingY);
    return { x, y, point: p };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height - paddingY} L ${points[0].x.toFixed(1)} ${height - paddingY} Z`;

  return (
    <div className={cn("flex flex-col gap-3 rounded-md border border-[#262626] bg-[#0A0A0A] p-4 text-white", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
            12-Month Workload Cost Trajectory
          </h3>
          <span className="text-[11px] text-[#666666]">
            Modeled demand growth correlating compute & network scaling overhead
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#858585]">
            {DecimalMoney.format(forecast[0].totalMonthlyCost, currency)} →{" "}
            <span className="font-bold text-white">
              {DecimalMoney.format(forecast[forecast.length - 1].totalMonthlyCost, currency)}/mo
            </span>
          </span>
        </div>
      </div>

      {/* SVG Trendline */}
      <div className="relative overflow-hidden rounded-md border border-[#202020] bg-[#080808] p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full overflow-visible">
          {/* Subtle Gridlines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#1A1A1A"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#202020"
          />

          {/* Area Fill */}
          <path d={areaD} fill="#FFFFFF" fillOpacity="0.05" />

          {/* Sparkline Stroke */}
          <path d={pathD} fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Anchor Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={3}
              fill="#080808"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          ))}

          {/* Min / Max Labels */}
          <text x={paddingX} y={paddingY - 8} fill="#666666" fontSize="10" fontFamily="monospace">
            {DecimalMoney.format(String(maxCost), currency)}
          </text>
          <text x={paddingX} y={height - 8} fill="#666666" fontSize="10" fontFamily="monospace">
            {DecimalMoney.format(String(minCost), currency)}
          </text>
        </svg>
      </div>

      {/* Interval Timeline Table */}
      <div className="grid grid-cols-6 gap-2 text-center text-[11px]">
        {forecast
          .filter((_, idx) => idx % Math.ceil(forecast.length / 6) === 0 || idx === forecast.length - 1)
          .slice(0, 6)
          .map((item) => (
            <div key={item.intervalIndex} className="flex flex-col rounded-md border border-[#1A1A1A] bg-[#0E0E0E] p-1.5">
              <span className="text-[#858585]">{item.intervalLabel}</span>
              <span className="font-mono text-xs font-semibold text-white">
                {DecimalMoney.format(item.totalMonthlyCost, currency)}
              </span>
              <span className="font-mono text-[9px] text-[#666666]">
                {item.projectedIngressRps.toLocaleString()} RPS
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

