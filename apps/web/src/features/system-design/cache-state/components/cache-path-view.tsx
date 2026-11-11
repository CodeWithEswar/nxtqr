"use client";

/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Multi-Tier Cache Path & Read Traffic Cascade Inspector
 */

import React, { useMemo } from "react";
import type {
  DistributedStateTopology,
} from "@nxtqr/architecture-intelligence";
import { CachePathTracer } from "@nxtqr/architecture-intelligence";
import {
  LayersIcon,
  ChevronRightIcon,
  DatabaseIcon,
} from "@nxtqr/icons";

export interface CachePathViewProps {
  topology: DistributedStateTopology;
  clientRps: number;
}

export function CachePathView({ topology, clientRps }: CachePathViewProps) {
  const traces = useMemo(() => {
    return CachePathTracer.traceHierarchy(topology, clientRps);
  }, [topology, clientRps]);

  const trace = traces[0];

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-[#FFFFFF] overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#858585]" />
            Multi-Layer Cache Read Path & Database Offload
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Traces cascading read lookups from client requests down through every cache tier to the terminal backing database.
          </p>
        </div>

        {trace && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#858585]">Net Database Offload:</span>
            <span className="text-sm font-bold font-mono px-2 py-0.5 rounded-md bg-[#141414] text-[#FFFFFF] border border-[#262626]">
              {trace.netOffloadPercentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Traffic Summary Metrics */}
      {trace && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-md bg-[#080808] border border-[#262626]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#858585] block">
              Incoming Client RPS
            </span>
            <span className="text-xl font-bold font-mono text-[#FFFFFF] mt-1 block">
              {trace.incomingClientRps.toLocaleString()} RPS
            </span>
            <span className="text-[11px] text-[#858585] font-mono mt-1 block">
              Gross read traffic from all user endpoints
            </span>
          </div>

          <div className="p-3 rounded-md bg-[#080808] border border-[#262626]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#858585] block">
              Terminal Database Load
            </span>
            <span className="text-xl font-bold font-mono text-[#FFFFFF] mt-1 block">
              {trace.terminalBackendReadRps.toLocaleString()} RPS
            </span>
            <span className="text-[11px] text-[#858585] font-mono mt-1 block">
              Uncached queries reaching primary data store
            </span>
          </div>

          <div className="p-3 rounded-md bg-[#080808] border border-[#262626]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#858585] block">
              Active Cache Tiers
            </span>
            <span className="text-xl font-bold font-mono text-[#FFFFFF] mt-1 block">
              {trace.hops.length} Tiers
            </span>
            <span className="text-[11px] text-[#858585] font-mono mt-1 block">
              In-line hierarchical lookup sequence
            </span>
          </div>
        </div>
      )}

      {/* Step-by-Step Cascading Flow */}
      {trace && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
            Cascading Lookup Path
          </h3>

          <div className="space-y-2">
            {trace.hops.map((hop, index) => {
              const absorbedRps = hop.effectiveIncomingRps - hop.effectiveOutgoingMissRps;

              return (
                <div
                  key={hop.layerId}
                  className="p-3 rounded-md bg-[#080808] border border-[#262626] flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center text-xs text-[#858585]">
                      {index + 1}
                    </span>
                    <div>
                      <span className="text-[#FFFFFF] font-semibold block">{hop.layerName}</span>
                      <span className="text-[10px] text-[#858585]">
                        Tier {hop.tierOrder} • {hop.cacheType.replace(/_/g, " ")} • Hit Ratio:{" "}
                        {(hop.hitRatioModeled * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-[#858585] block">Incoming</span>
                      <span className="text-[#FFFFFF]">{hop.effectiveIncomingRps.toLocaleString()} RPS</span>
                    </div>

                    <ChevronRightIcon className="w-4 h-4 text-[#404040]" />

                    <div>
                      <span className="text-[10px] text-[#858585] block">Absorbed (Hits)</span>
                      <span className="text-[#FFFFFF]">
                        {absorbedRps.toFixed(0)} RPS
                      </span>
                    </div>

                    <ChevronRightIcon className="w-4 h-4 text-[#404040]" />

                    <div>
                      <span className="text-[10px] text-[#858585] block">Misses to Next Tier</span>
                      <span className="text-[#B5B5B5]">
                        {hop.effectiveOutgoingMissRps.toLocaleString()} RPS
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Terminal Backing Store Hop */}
            <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#333333] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-[#1A1A1A] border border-[#404040] flex items-center justify-center text-xs text-[#FFFFFF]">
                  <DatabaseIcon className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="text-[#FFFFFF] font-semibold block">
                    {topology.sourcesOfTruth[0]?.name || "Backing Storage Engine"}
                  </span>
                  <span className="text-[10px] text-[#858585]">
                    Primary Source of Truth • Terminal Query Destination
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#858585] block">Terminal Query Rate</span>
                <span className="text-sm font-bold text-[#FFFFFF]">
                  {trace.terminalBackendReadRps.toLocaleString()} RPS
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
