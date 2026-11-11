"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Storage Capacity Forecasting & IOPS Saturation Visualizer
 */

import React from "react";
import type { StorageForecast } from "@nxtqr/architecture-intelligence";
import { DatabaseIcon, ActivityIcon, AlertTriangleIcon } from "@nxtqr/icons";

export interface StorageCapacityViewProps {
  storageForecast?: StorageForecast;
}

export function StorageCapacityView({ storageForecast }: StorageCapacityViewProps) {
  if (!storageForecast) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#858585]">
        <DatabaseIcon className="w-8 h-8 mb-2 text-[#666666]" />
        <p className="text-sm">No storage capacity model available for this topology.</p>
      </div>
    );
  }

  const allocatedMb = storageForecast.allocatedDiskMb || 250000;
  const currentTotalMb = storageForecast.currentTotalMb;
  const diskUsageRatio = Math.min(1.0, currentTotalMb / allocatedMb);
  const isDiskSaturationRisk =
    storageForecast.projectedSaturationMonths !== undefined &&
    storageForecast.projectedSaturationMonths < 6;

  const isIopsSaturationRisk = storageForecast.iopsCapacitySaturationRatio > 0.8;

  return (
    <div className="flex flex-col h-full bg-[#000000] overflow-y-auto p-6 space-y-6">
      {/* Header Summary */}
      <div className="p-4 bg-[#080808] border border-[#262626] rounded-md flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4 text-[#FFFFFF]" />
            Storage Capacity Forecasting & IOPS Demand Modeling
          </h2>
          <p className="text-xs text-[#858585] mt-1">
            Projecting logical data accumulation, index bloat, WAL generation overhead, and storage controller IOPS saturation.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Headroom to Saturation
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                isDiskSaturationRisk ? "text-[#FFFFFF]" : "text-[#B5B5B5]"
              }`}
            >
              {storageForecast.projectedSaturationMonths !== undefined
                ? `${storageForecast.projectedSaturationMonths.toFixed(1)} months`
                : "> 36 months"}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Monthly Growth
            </span>
            <span className="text-sm font-bold font-mono text-[#FFFFFF]">
              +{(storageForecast.projectedMonthlyGrowthMb / 1024).toFixed(1)} GB/mo
            </span>
          </div>
        </div>
      </div>

      {/* Disk Space Allocation & Breakdown */}
      <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#FFFFFF] font-semibold">
            Allocated Disk: {(allocatedMb / 1024).toFixed(0)} GB
          </span>
          <span className="text-[#858585]">
            Used: {(currentTotalMb / 1024).toFixed(1)} GB ({(diskUsageRatio * 100).toFixed(1)}%)
          </span>
        </div>

        {/* Storage Bar Gauge */}
        <div className="w-full h-3 bg-[#0D0D0D] rounded-md border border-[#202020] overflow-hidden flex">
          <div
            className="bg-[#FFFFFF]"
            style={{
              width: `${(storageForecast.currentLogicalDataMb / allocatedMb) * 100}%`,
            }}
            title="Logical Table Heap Data"
          />
          <div
            className="bg-[#B5B5B5]"
            style={{
              width: `${(storageForecast.currentIndexDataMb / allocatedMb) * 100}%`,
            }}
            title="Index B-Trees"
          />
          <div
            className="bg-[#666666]"
            style={{
              width: `${(storageForecast.currentWalDataMb / allocatedMb) * 100}%`,
            }}
            title="WAL & Transaction Logs"
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-4 text-xs font-mono pt-2 border-t border-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#FFFFFF]" />
            <span className="text-[#858585]">
              Logical Data:{" "}
              <strong className="text-[#FFFFFF]">
                {(storageForecast.currentLogicalDataMb / 1024).toFixed(1)} GB
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#B5B5B5]" />
            <span className="text-[#858585]">
              Indexes:{" "}
              <strong className="text-[#FFFFFF]">
                {(storageForecast.currentIndexDataMb / 1024).toFixed(1)} GB
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#666666]" />
            <span className="text-[#858585]">
              WAL / Logs:{" "}
              <strong className="text-[#FFFFFF]">
                {(storageForecast.currentWalDataMb / 1024).toFixed(1)} GB
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* IOPS Demand & Controller Saturation */}
      <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-[#FFFFFF]" />
            <span className="text-[#FFFFFF] font-semibold">
              Storage IOPS Demand & Capacity
            </span>
          </div>
          <span className="text-[#858585]">
            Saturation:{" "}
            <strong className="text-[#FFFFFF]">
              {(storageForecast.iopsCapacitySaturationRatio * 100).toFixed(1)}%
            </strong>
          </span>
        </div>

        {/* IOPS Bar */}
        <div className="w-full h-3 bg-[#0D0D0D] rounded-md border border-[#202020] overflow-hidden">
          <div
            className={`h-full transition-all ${
              isIopsSaturationRisk ? "bg-[#FFFFFF]" : "bg-[#B5B5B5]"
            }`}
            style={{
              width: `${Math.min(100, storageForecast.iopsCapacitySaturationRatio * 100)}%`,
            }}
          />
        </div>

        {/* IOPS Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono pt-2 border-t border-[#1A1A1A]">
          <div>
            <span className="text-[#666666] block text-[10px] uppercase">Read IOPS</span>
            <span className="text-[#FFFFFF] font-semibold">
              {storageForecast.readIopsModeled.toFixed(0)} IOPS
            </span>
          </div>
          <div>
            <span className="text-[#666666] block text-[10px] uppercase">Write IOPS</span>
            <span className="text-[#FFFFFF] font-semibold">
              {storageForecast.writeIopsModeled.toFixed(0)} IOPS
            </span>
          </div>
          <div>
            <span className="text-[#666666] block text-[10px] uppercase">Total Demand</span>
            <span className="text-[#FFFFFF] font-semibold">
              {storageForecast.totalIopsModeled.toFixed(0)} IOPS
            </span>
          </div>
          <div>
            <span className="text-[#666666] block text-[10px] uppercase">Provisioned</span>
            <span className="text-[#FFFFFF] font-semibold">
              {storageForecast.provisionedIops || 3000} IOPS
            </span>
          </div>
        </div>

        {isIopsSaturationRisk && (
          <div className="p-3 bg-[#141414] border border-[#404040] rounded-md flex items-start gap-3 mt-2">
            <AlertTriangleIcon className="w-4 h-4 text-[#FFFFFF] mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-[#FFFFFF]">
                IOPS Controller Saturation Hazard
              </span>
              <p className="text-[#858585]">
                Modeled IOPS demand reaches {(storageForecast.iopsCapacitySaturationRatio * 100).toFixed(0)}% of provisioned storage controller capacity. High I/O queuing and query latency spikes will occur under peak bursts. Consider provisioning additional IOPS or offloading reads to replicas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
