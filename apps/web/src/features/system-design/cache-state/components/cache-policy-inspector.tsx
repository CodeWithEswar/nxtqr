"use client";

/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Cache Policy & Layer Inspector (Middle / Detail Pane)
 */

import React from "react";
import type { CacheLayer } from "@nxtqr/architecture-intelligence";
import {
  ActivityIcon,
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";

export interface CachePolicyInspectorProps {
  layer: CacheLayer | null;
  onUpdateLayer?: (layerId: string, patch: Partial<CacheLayer>) => void;
}

export function CachePolicyInspector({
  layer,
  onUpdateLayer,
}: CachePolicyInspectorProps) {
  if (!layer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#000000] text-[#858585]">
        <ActivityIcon className="w-8 h-8 mb-3 text-[#666666]" />
        <h3 className="text-sm font-semibold text-[#FFFFFF] mb-1">
          No Cache Layer Selected
        </h3>
        <p className="text-xs text-[#858585] max-w-sm">
          Select a cache layer from the hierarchy explorer on the left to inspect TTL policies, key spaces, eviction parameters, and stampede defenses.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-[#FFFFFF] overflow-y-auto">
      {/* Layer Header */}
      <div className="p-4 border-b border-[#262626] bg-[#080808] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-[#FFFFFF]">{layer.name}</h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">
              Tier {layer.tierOrder} • {layer.cacheType.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-[#858585] mt-0.5 font-mono">
            {layer.technology.toUpperCase()} • Strategy: {layer.strategy.replace(/_/g, " ")} • Allocated: {layer.allocatedMemoryMb} MB
          </p>
        </div>

        <div className="flex items-center gap-2">
          {layer.requestCoalescingEnabled ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0D0D0D] border border-[#262626] text-[11px] font-mono text-[#FFFFFF]">
              <CheckCircleIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
              <span>Single-Flight Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#141414] border border-[#404040] text-[11px] font-mono text-[#FFFFFF]">
              <AlertTriangleIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
              <span>Stampede Risk</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Policy Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* TTL Configuration Card */}
          <div className="p-3 rounded-md bg-[#080808] border border-[#262626] flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#858585]">
              TTL Policy & Duration
            </span>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-[#FFFFFF]">
                {layer.ttlConfig.defaultTtlSeconds}s
              </span>
              <span className="text-xs text-[#858585] font-mono ml-1.5">
                ({layer.ttlConfig.type.replace(/_/g, " ")})
              </span>
            </div>
            <div className="mt-2 text-[11px] font-mono text-[#B5B5B5] flex items-center justify-between border-t border-[#1A1A1A] pt-2">
              <span>Jitter Percentage:</span>
              <span className="text-[#FFFFFF]">{layer.ttlConfig.jitterPercentage}%</span>
            </div>
          </div>

          {/* Eviction Card */}
          <div className="p-3 rounded-md bg-[#080808] border border-[#262626] flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#858585]">
              Eviction Policy
            </span>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-[#FFFFFF] uppercase">
                {layer.evictionPolicy}
              </span>
            </div>
            <div className="mt-2 text-[11px] font-mono text-[#B5B5B5] flex items-center justify-between border-t border-[#1A1A1A] pt-2">
              <span>Allocated RAM:</span>
              <span className="text-[#FFFFFF]">{layer.allocatedMemoryMb} MB</span>
            </div>
          </div>

          {/* Defenses Card */}
          <div className="p-3 rounded-md bg-[#080808] border border-[#262626] flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#858585]">
              Active Defenses
            </span>
            <div className="mt-2 space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#858585]">Negative Caching:</span>
                <span className={layer.negativeCachingEnabled ? "text-[#FFFFFF]" : "text-[#666666]"}>
                  {layer.negativeCachingEnabled ? `${layer.negativeCacheTtlSeconds ?? 60}s TTL` : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#858585]">Single-Flight Coalesce:</span>
                <span className={layer.requestCoalescingEnabled ? "text-[#FFFFFF]" : "text-[#666666]"}>
                  {layer.requestCoalescingEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
            <div className="mt-2 text-[11px] font-mono text-[#B5B5B5] flex items-center justify-between border-t border-[#1A1A1A] pt-2">
              <span>Fallback:</span>
              <span className="text-[#FFFFFF]">{layer.fallbackBehavior.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>

        {/* Key Spaces Table */}
        <div className="border border-[#262626] rounded-md bg-[#080808] overflow-hidden">
          <div className="p-3 border-b border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-[#858585]" />
              <h3 className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wider">
                Key Spaces & Isolation ({layer.keySpaces.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0D0D0D] border-b border-[#262626] text-[#858585] text-[11px]">
                <tr>
                  <th className="py-2 px-3 font-normal">Key Space Name</th>
                  <th className="py-2 px-3 font-normal">Namespace Pattern</th>
                  <th className="py-2 px-3 font-normal">Tenant Isolated</th>
                  <th className="py-2 px-3 font-normal">Classification</th>
                  <th className="py-2 px-3 font-normal text-right">Est. Count</th>
                  <th className="py-2 px-3 font-normal text-right">Entry Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {layer.keySpaces.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-[#666666]">
                      No key spaces registered for this layer
                    </td>
                  </tr>
                ) : (
                  layer.keySpaces.map((ks) => (
                    <tr key={ks.id} className="hover:bg-[#141414] transition-colors">
                      <td className="py-2.5 px-3 text-[#FFFFFF] font-medium">{ks.name}</td>
                      <td className="py-2.5 px-3 text-[#B5B5B5]">{ks.namespacePattern}</td>
                      <td className="py-2.5 px-3">
                        {ks.includesTenantScope ? (
                          <span className="text-[#FFFFFF] bg-[#141414] px-1.5 py-0.5 rounded-md border border-[#262626] text-[10px]">
                            Isolated
                          </span>
                        ) : (
                          <span className="text-[#FFFFFF] bg-[#1A1A1A] px-1.5 py-0.5 rounded-md border border-[#404040] text-[10px]">
                            Shared / Collision Risk
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] text-[#B5B5B5] px-1.5 py-0.5 rounded-md bg-[#0D0D0D] border border-[#262626] uppercase">
                          {ks.dataClassification}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#FFFFFF]">
                        {ks.estimatedKeyCount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#858585]">
                        {ks.estimatedEntrySizeBytes} B
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Defense Controls */}
        <div className="p-3 border border-[#262626] rounded-md bg-[#080808] flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-[#FFFFFF]">
              Request Coalescing / Single-Flight Mutex
            </h4>
            <p className="text-[11px] text-[#858585] mt-0.5 font-mono">
              Coalesces concurrent misses on identical keys to prevent cache stampedes on the backing store.
            </p>
          </div>
          <button
            onClick={() =>
              onUpdateLayer?.(layer.id, {
                requestCoalescingEnabled: !layer.requestCoalescingEnabled,
              })
            }
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium border transition-colors ${
              layer.requestCoalescingEnabled
                ? "bg-[#1A1A1A] text-[#FFFFFF] border-[#404040] hover:bg-[#202020]"
                : "bg-[#0D0D0D] text-[#858585] border-[#262626] hover:bg-[#141414] hover:text-[#FFFFFF]"
            }`}
          >
            {layer.requestCoalescingEnabled ? "Active (Enabled)" : "Disabled (Stampede Risk)"}
          </button>
        </div>
      </div>
    </div>
  );
}
