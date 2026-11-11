"use client";

/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Cache Hierarchy & Source-of-Truth Explorer (Left Pane)
 */

import React, { useMemo } from "react";
import type {
  CacheLayer,
  SourceOfTruth,
  ReplicaGroup,
} from "@nxtqr/architecture-intelligence";
import {
  LayersIcon,
  DatabaseIcon,
  SearchIcon,
  ActivityIcon,
  AlertTriangleIcon,
} from "@nxtqr/icons";

export interface CacheLayerExplorerProps {
  cacheLayers: CacheLayer[];
  sourcesOfTruth: SourceOfTruth[];
  replicaGroups: ReplicaGroup[];
  selectedLayerId: string | null;
  selectedSourceId: string | null;
  onSelectLayer: (id: string) => void;
  onSelectSource: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function CacheLayerExplorer({
  cacheLayers,
  sourcesOfTruth,
  replicaGroups,
  selectedLayerId,
  selectedSourceId,
  onSelectLayer,
  onSelectSource,
  searchQuery,
  onSearchChange,
}: CacheLayerExplorerProps) {
  // Sort cache layers by tier order
  const filteredLayers = useMemo(() => {
    return [...cacheLayers]
      .sort((a, b) => a.tierOrder - b.tierOrder)
      .filter((l) =>
        searchQuery
          ? l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.technology.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      );
  }, [cacheLayers, searchQuery]);

  const filteredSources = useMemo(() => {
    return sourcesOfTruth.filter((s) =>
      searchQuery
        ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.type.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );
  }, [sourcesOfTruth, searchQuery]);

  return (
    <aside className="w-80 flex flex-col border-r border-[#262626] bg-[#080808] text-[#FFFFFF] h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayersIcon className="w-4 h-4 text-[#858585]" />
          <h2 className="text-xs font-semibold tracking-wider text-[#FFFFFF] uppercase">
            State & Cache Hierarchy
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[#858585] px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626]">
          {cacheLayers.length} Layers
        </span>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-[#262626]">
        <div className="relative">
          <SearchIcon className="w-3.5 h-3.5 text-[#858585] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter layers, technologies..."
            className="w-full bg-[#0D0D0D] border border-[#262626] rounded-md text-xs text-[#FFFFFF] pl-8 pr-2.5 py-1.5 placeholder-[#666666] focus:outline-none focus:border-[#404040]"
          />
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Tier-by-Tier Cache Layers */}
        <div>
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#858585] flex items-center justify-between">
            <span>Cache Tiers (Client → Backend)</span>
            <span>Order</span>
          </div>

          <div className="space-y-1 mt-1">
            {filteredLayers.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#666666] border border-dashed border-[#262626] rounded-md">
                No matching cache layers
              </div>
            ) : (
              filteredLayers.map((layer) => {
                const isSelected = selectedLayerId === layer.id;
                return (
                  <button
                    key={layer.id}
                    onClick={() => onSelectLayer(layer.id)}
                    className={`w-full text-left p-2.5 rounded-md border transition-colors flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-[#1A1A1A] border-[#404040] shadow-sm"
                        : "bg-[#0D0D0D] border-[#1A1A1A] hover:bg-[#141414] hover:border-[#333333]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ActivityIcon className="w-3.5 h-3.5 text-[#858585] shrink-0" />
                        <span className="text-xs font-semibold text-[#FFFFFF] truncate">
                          {layer.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626] shrink-0">
                        Tier {layer.tierOrder}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#858585]">
                      <span>{layer.technology}</span>
                      <span>•</span>
                      <span>{layer.strategy.replace(/_/g, " ")}</span>
                      <span>•</span>
                      <span>{layer.allocatedMemoryMb}MB</span>
                    </div>

                    {!layer.requestCoalescingEnabled && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-[#B5B5B5]">
                        <AlertTriangleIcon className="w-3 h-3 text-[#B5B5B5]" />
                        <span>Stampede unprotected</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Sources of Truth */}
        <div>
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#858585] flex items-center justify-between">
            <span>Sources of Truth</span>
            <span>{sourcesOfTruth.length} Stores</span>
          </div>

          <div className="space-y-1 mt-1">
            {filteredSources.map((sot) => {
              const isSelected = selectedSourceId === sot.id && !selectedLayerId;
              return (
                <button
                  key={sot.id}
                  onClick={() => onSelectSource(sot.id)}
                  className={`w-full text-left p-2.5 rounded-md border transition-colors flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-[#1A1A1A] border-[#404040]"
                      : "bg-[#0D0D0D] border-[#1A1A1A] hover:bg-[#141414] hover:border-[#333333]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <DatabaseIcon className="w-3.5 h-3.5 text-[#858585] shrink-0" />
                      <span className="text-xs font-semibold text-[#FFFFFF] truncate">
                        {sot.name}
                      </span>
                    </div>
                    {sot.isAuthoritativeMaster && (
                      <span className="text-[10px] font-mono px-1 py-0.5 rounded-md bg-[#141414] text-[#FFFFFF] border border-[#333333]">
                        Master
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-[#858585]">
                    {sot.type.replace(/_/g, " ")} • {sot.storageEngine || "Relational"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Replica Groups Summary */}
        {replicaGroups.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#858585]">
              Active Replication Pools ({replicaGroups.length})
            </div>
            <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-xs space-y-1">
              {replicaGroups.map((rg) => (
                <div key={rg.id} className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#FFFFFF]">{rg.topologyType.replace(/_/g, " ")}</span>
                  <span className="text-[#858585]">{rg.replicas.length} nodes ({rg.replicationMode})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
