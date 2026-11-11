"use client";

/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Cache Invalidation Flow & Propagation Gap Inspector
 */

import React from "react";
import type {
  DistributedStateTopology,
} from "@nxtqr/architecture-intelligence";
import {
  RefreshIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from "@nxtqr/icons";

export interface InvalidationFlowViewProps {
  topology: DistributedStateTopology;
  uncoveredLayersByRule?: Record<string, string[]>;
}

export function InvalidationFlowView({
  topology,
  uncoveredLayersByRule = {},
}: InvalidationFlowViewProps) {
  const layerMap = new Map(topology.cacheLayers.map((l) => [l.id, l]));

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-[#FFFFFF] overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <RefreshIcon className="w-4 h-4 text-[#858585]" />
            Cache Invalidation & Multi-Tier Propagation Rules
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Traces purge propagation from mutation sources to edge and distributed tiers to identify stale read propagation gaps.
          </p>
        </div>
        <span className="text-xs font-mono text-[#858585] px-2 py-0.5 rounded-md bg-[#080808] border border-[#262626]">
          {topology.invalidationRules.length} Registered Rules
        </span>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {topology.invalidationRules.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#262626] rounded-md bg-[#080808]">
            No invalidation rules registered. Caching relies entirely on passive TTL expiration.
          </div>
        ) : (
          topology.invalidationRules.map((rule) => {
            const omittedLayers = uncoveredLayersByRule[rule.id] || [];
            const hasGap = omittedLayers.length > 0;
            const targetLayers = rule.targetCacheLayerIds
              .map((id) => layerMap.get(id))
              .filter(Boolean);

            return (
              <div
                key={rule.id}
                className={`p-4 rounded-md border bg-[#080808] transition-colors ${
                  hasGap ? "border-[#404040]" : "border-[#262626]"
                }`}
              >
                {/* Rule Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#FFFFFF] font-mono">
                      {rule.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] text-[#858585] border border-[#262626]">
                      {rule.mechanism.replace(/_/g, " ")}
                    </span>
                    {rule.isAsynchronous && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#333333]">
                        Async Delivery
                      </span>
                    )}
                  </div>

                  {hasGap ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1A1A1A] border border-[#404040] text-[10px] font-mono text-[#FFFFFF]">
                      <AlertTriangleIcon className="w-3 h-3 text-[#B5B5B5]" />
                      <span>Upstream Gap Detected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0D0D0D] border border-[#262626] text-[10px] font-mono text-[#858585]">
                      <CheckCircleIcon className="w-3 h-3 text-[#858585]" />
                      <span>Full Hierarchy Covered</span>
                    </div>
                  )}
                </div>

                {/* Propagation Path Visualizer */}
                <div className="mt-4 p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center gap-2 overflow-x-auto text-xs font-mono">
                  {/* Source Trigger */}
                  <div className="px-2.5 py-1.5 rounded-md bg-[#141414] border border-[#262626] shrink-0">
                    <span className="text-[10px] text-[#858585] block">Trigger Event</span>
                    <span className="text-[#FFFFFF]">{rule.triggerEventOrTable}</span>
                  </div>

                  <ChevronRightIcon className="w-4 h-4 text-[#666666] shrink-0" />

                  {/* Target Cache Layers */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {targetLayers.map((tl) => (
                      <div
                        key={tl!.id}
                        className="px-2.5 py-1.5 rounded-md bg-[#141414] border border-[#262626]"
                      >
                        <span className="text-[10px] text-[#858585] block">
                          Tier {tl!.tierOrder} Target
                        </span>
                        <span className="text-[#FFFFFF]">{tl!.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Omitted Layers Warning */}
                  {hasGap && (
                    <>
                      <ChevronRightIcon className="w-4 h-4 text-[#B5B5B5] shrink-0" />
                      <div className="px-2.5 py-1.5 rounded-md bg-[#1A1A1A] border border-[#404040] shrink-0">
                        <span className="text-[10px] text-[#B5B5B5] block">
                          Omitted Upstream Tiers
                        </span>
                        <span className="text-[#FFFFFF]">{omittedLayers.join(", ")}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Details Footer */}
                <div className="mt-3 pt-3 border-t border-[#1A1A1A] flex items-center justify-between text-[11px] font-mono text-[#858585]">
                  <div>
                    <span>Key Pattern: </span>
                    <code className="text-[#FFFFFF] bg-[#0D0D0D] px-1 py-0.5 rounded-md border border-[#262626]">
                      {rule.invalidationKeyPattern}
                    </code>
                  </div>
                  <div>
                    <span>Refill Policy: </span>
                    <span className="text-[#B5B5B5]">{rule.reRefillPolicy.replace(/_/g, " ")}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
