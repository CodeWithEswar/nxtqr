"use client";

/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Broker & Destination Explorer (Left Pane)
 */

import React from "react";
import type {
  MessagingBroker,
  MessagingDestination,
} from "@nxtqr/architecture-intelligence";
import { CpuIcon, SearchIcon, FilterIcon, LayersIcon } from "@nxtqr/icons";

export interface BrokerExplorerProps {
  brokers: MessagingBroker[];
  destinations: MessagingDestination[];
  selectedBrokerId?: string;
  selectedDestinationId?: string;
  onSelectBroker: (id: string) => void;
  onSelectDestination: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  destinationTypeFilter: string;
  onDestinationTypeFilterChange: (type: string) => void;
}

export function BrokerExplorer({
  brokers,
  destinations,
  selectedBrokerId,
  selectedDestinationId,
  onSelectBroker,
  onSelectDestination,
  searchQuery,
  onSearchChange,
  destinationTypeFilter,
  onDestinationTypeFilterChange,
}: BrokerExplorerProps) {
  return (
    <aside className="w-80 flex flex-col border-r border-[#262626] bg-[#080808] text-[#FFFFFF] h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayersIcon className="w-4 h-4 text-[#858585]" />
          <h2 className="text-xs font-semibold tracking-wider text-[#FFFFFF] uppercase">
            Messaging Topology
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[#858585] px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626]">
          {destinations.length} dest
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-2 border-b border-[#262626] space-y-2 bg-[#0D0D0D]">
        <div className="relative">
          <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#858585]" />
          <input
            type="text"
            placeholder="Search topics & queues..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#141414] text-xs text-[#FFFFFF] pl-8 pr-3 py-1.5 rounded-md border border-[#262626] focus:border-[#404040] focus:outline-none placeholder-[#666666]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <FilterIcon className="w-3 h-3 text-[#858585] shrink-0" />
          <select
            value={destinationTypeFilter}
            onChange={(e) => onDestinationTypeFilterChange(e.target.value)}
            className="w-full bg-[#141414] text-xs text-[#B5B5B5] px-2 py-1 rounded-md border border-[#262626] focus:border-[#404040] focus:outline-none"
          >
            <option value="all">All Destination Types</option>
            <option value="topic">Topic (Pub/Sub)</option>
            <option value="queue">Queue (Point-to-Point)</option>
            <option value="stream">Stream (Log Stream)</option>
            <option value="exchange">Exchange (Router)</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Brokers Section */}
        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#858585] px-2 mb-1">
            Message Brokers ({brokers.length})
          </div>
          <div className="space-y-1">
            {brokers.map((broker) => {
              const isSelected = broker.id === selectedBrokerId;
              return (
                <button
                  key={broker.id}
                  onClick={() => onSelectBroker(broker.id)}
                  className={`w-full text-left p-2 rounded-md transition-colors flex items-start gap-2 border ${
                    isSelected
                      ? "bg-[#1A1A1A] border-[#404040] shadow-sm"
                      : "bg-[#0D0D0D] border-[#202020] hover:bg-[#141414] hover:border-[#333333]"
                  }`}
                >
                  <CpuIcon className="w-3.5 h-3.5 text-[#858585] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#FFFFFF] truncate">
                      {broker.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#858585]">
                      <span className="font-mono">{broker.technology.replace("_", " ")}</span>
                      <span>•</span>
                      <span>{broker.clusterMode}</span>
                      {broker.isMultiRegion && (
                        <>
                          <span>•</span>
                          <span className="text-[#B5B5B5]">Multi-Region</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Destinations Section */}
        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#858585] px-2 mb-1">
            Destinations ({destinations.length})
          </div>
          <div className="space-y-1">
            {destinations.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#666666] border border-[#202020] rounded-md bg-[#0D0D0D]">
                No destinations matching filter
              </div>
            ) : (
              destinations.map((dest) => {
                const isSelected = dest.id === selectedDestinationId;
                return (
                  <button
                    key={dest.id}
                    onClick={() => onSelectDestination(dest.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors flex flex-col gap-1 border ${
                      isSelected
                        ? "bg-[#1A1A1A] border-[#404040] shadow-sm"
                        : "bg-[#0D0D0D] border-[#202020] hover:bg-[#141414] hover:border-[#333333]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-[#FFFFFF] truncate">
                        {dest.name}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#B5B5B5]">
                        {dest.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[#858585] font-mono">
                      <span>{dest.deliverySemantics.replace("_", " ")}</span>
                      <span>•</span>
                      <span>order: {dest.orderingScope}</span>
                      {dest.partitioning && (
                        <>
                          <span>•</span>
                          <span>{dest.partitioning.partitionCount} partitions</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
