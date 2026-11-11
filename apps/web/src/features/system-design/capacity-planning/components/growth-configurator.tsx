"use client";

import * as React from "react";
import type {
  CapacityForecastScenario,
  GrowthModelKind,
  ForecastIntervalUnit,
} from "@nxtqr/architecture-intelligence";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  Badge,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { SlidersIcon, AlertCircleIcon } from "@nxtqr/icons";

export interface GrowthConfiguratorProps {
  presetScenarios: CapacityForecastScenario[];
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  horizonIntervals: number;
  onChangeHorizon: (intervals: number) => void;
  intervalUnit: ForecastIntervalUnit;
  onChangeUnit: (unit: ForecastIntervalUnit) => void;
  growthModel: GrowthModelKind;
  onChangeGrowthModel: (model: GrowthModelKind) => void;
  growthRatePercent: number;
  onChangeGrowthRate: (percent: number) => void;
  peakMultiplier: number;
  onChangePeakMultiplier: (mult: number) => void;
  className?: string;
}

export function GrowthConfigurator({
  presetScenarios,
  selectedScenarioId,
  onSelectScenario,
  horizonIntervals,
  onChangeHorizon,
  intervalUnit,
  onChangeUnit,
  growthModel,
  onChangeGrowthModel,
  growthRatePercent,
  onChangeGrowthRate,
  peakMultiplier,
  onChangePeakMultiplier,
  className,
}: GrowthConfiguratorProps) {
  const isCustom = selectedScenarioId === "custom";

  return (
    <div className={cn("p-4 bg-surface-02 border border-border-default rounded-md space-y-4 select-none", className)}>
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="flex items-center gap-2">
          <SlidersIcon size={14} className="text-text-secondary" />
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary font-semibold">
            Workload Growth & Demand Model
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono bg-surface-03 text-text-muted border-border-default">
          {growthModel.toUpperCase()} MODEL
        </Badge>
      </div>

      {/* Scenario Preset Selector */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs text-text-muted">Preset Growth Scenario</label>
        <Select value={selectedScenarioId} onValueChange={onSelectScenario}>
          <SelectTrigger className="w-full h-8 font-mono text-xs bg-surface-03 border-border-default rounded-md text-foreground">
            <SelectValue placeholder="Select Growth Scenario" />
          </SelectTrigger>
          <SelectContent className="bg-surface-03 border-border-default rounded-md text-foreground">
            {presetScenarios.map((scen) => (
              <SelectItem key={scen.id} value={scen.id} className="font-mono text-xs">
                {scen.name}
              </SelectItem>
            ))}
            <SelectItem value="custom" className="font-mono text-xs text-text-secondary">
              Custom Scenario (Manual Parameters)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Horizon Intervals */}
        <div className="space-y-1">
          <label className="font-mono text-[11px] text-text-muted">Horizon Intervals</label>
          <Input
            type="number"
            min={1}
            max={60}
            value={horizonIntervals}
            onChange={(e) => onChangeHorizon(Math.max(1, Number(e.target.value) || 1))}
            className="h-8 font-mono text-xs bg-surface-03 border-border-default rounded-md text-foreground"
          />
        </div>

        {/* Interval Unit */}
        <div className="space-y-1">
          <label className="font-mono text-[11px] text-text-muted">Interval Unit</label>
          <Select value={intervalUnit} onValueChange={(val) => onChangeUnit(val as ForecastIntervalUnit)}>
            <SelectTrigger className="w-full h-8 font-mono text-xs bg-surface-03 border-border-default rounded-md text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-03 border-border-default rounded-md text-foreground">
              <SelectItem value="month" className="font-mono text-xs">Months</SelectItem>
              <SelectItem value="week" className="font-mono text-xs">Weeks</SelectItem>
              <SelectItem value="day" className="font-mono text-xs">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Growth Rate / Intensity */}
        <div className="space-y-1">
          <label className="font-mono text-[11px] text-text-muted">Growth Rate (%)</label>
          <Input
            type="number"
            min={0}
            max={500}
            value={growthRatePercent}
            onChange={(e) => onChangeGrowthRate(Math.max(0, Number(e.target.value) || 0))}
            disabled={!isCustom && growthModel !== "compound" && growthModel !== "linear"}
            className="h-8 font-mono text-xs bg-surface-03 border-border-default rounded-md text-foreground disabled:opacity-40"
          />
        </div>

        {/* Peak Multiplier */}
        <div className="space-y-1">
          <label className="font-mono text-[11px] text-text-muted">Peak Surge (x)</label>
          <Input
            type="number"
            min={1.0}
            max={10.0}
            step={0.1}
            value={peakMultiplier}
            onChange={(e) => onChangePeakMultiplier(Math.max(1.0, Number(e.target.value) || 1.0))}
            className="h-8 font-mono text-xs bg-surface-03 border-border-default rounded-md text-foreground"
          />
        </div>
      </div>

      {/* Model Selection for Custom */}
      {isCustom && (
        <div className="space-y-1.5 pt-2 border-t border-border-subtle">
          <label className="font-mono text-[11px] text-text-muted">Underlying Trajectory Model</label>
          <Select value={growthModel} onValueChange={(val) => onChangeGrowthModel(val as GrowthModelKind)}>
            <SelectTrigger className="w-full h-8 font-mono text-xs bg-surface-03 border-border-default rounded-md text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-03 border-border-default rounded-md text-foreground">
              <SelectItem value="compound" className="font-mono text-xs">Compound Exponential (Saas Growth)</SelectItem>
              <SelectItem value="linear" className="font-mono text-xs">Linear Expansion (+Constant RPS)</SelectItem>
              <SelectItem value="seasonal" className="font-mono text-xs">Seasonal Sinusoidal (Annual Cycle)</SelectItem>
              <SelectItem value="constant" className="font-mono text-xs">Constant Baseline (Zero Growth)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Mandatory Non-Production Transparency Alert */}
      <div className="p-2.5 bg-surface-01 border border-border-default rounded-md flex items-start gap-2">
        <AlertCircleIcon size={14} className="text-text-muted shrink-0 mt-0.5" />
        <span className="text-[11px] text-text-muted leading-relaxed">
          Capacity projections represent mathematical models derived from declared component parameters and growth assumptions. They do not constitute production telemetry or runtime telemetry guarantees.
        </span>
      </div>
    </div>
  );
}
