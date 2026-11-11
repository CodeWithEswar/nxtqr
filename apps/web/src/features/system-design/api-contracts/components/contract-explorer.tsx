"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Contract Explorer Component
 */

import React from "react";
import type {
  APIContract,
  ContractProtocol,
  ContractLifecycleStatus,
} from "@nxtqr/architecture-intelligence";
import {
  SearchIcon,
  PlusIcon,
  LayersIcon,
} from "@nxtqr/icons";

interface ContractExplorerProps {
  contracts: APIContract[];
  selectedContractId: string;
  protocolFilter: string;
  lifecycleFilter: string;
  searchQuery: string;
  onSelectContract: (id: string) => void;
  onProtocolFilterChange: (protocol: any) => void;
  onLifecycleFilterChange: (lifecycle: any) => void;
  onSearchChange: (query: string) => void;
  onOpenImportModal: () => void;
}

const PROTOCOLS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rest", label: "REST" },
  { id: "graphql", label: "GraphQL" },
  { id: "grpc", label: "gRPC" },
  { id: "asyncapi", label: "Event" },
];

export function ContractExplorer({
  contracts,
  selectedContractId,
  protocolFilter,
  lifecycleFilter: _lifecycleFilter,
  searchQuery,
  onSelectContract,
  onProtocolFilterChange,
  onLifecycleFilterChange: _onLifecycleFilterChange,
  onSearchChange,
  onOpenImportModal,
}: ContractExplorerProps) {
  const getProtocolBadge = (protocol: ContractProtocol) => {
    switch (protocol) {
      case "rest":
        return <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">REST</span>;
      case "graphql":
        return <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">GQL</span>;
      case "grpc":
        return <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">gRPC</span>;
      case "async_event":
      case "asyncapi" as any:
        return <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">EVENT</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">{protocol}</span>;
    }
  };

  const getLifecycleBadge = (status: ContractLifecycleStatus) => {
    const isBreakingWarning = status === "retired" || status === "archived";
    return (
      <span
        className={`px-1.5 py-0.5 text-[10px] font-medium rounded-md uppercase tracking-wider ${
          status === "active"
            ? "bg-[#141414] text-[#FFFFFF] border border-[#333333]"
            : isBreakingWarning
            ? "bg-[#1A1A1A] text-[#858585] border border-[#333333]"
            : "bg-[#0D0D0D] text-[#858585] border border-[#202020]"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <aside className="w-80 h-full flex flex-col bg-[#080808] border-r border-[#262626] select-none">
      {/* Header & Actions */}
      <div className="p-3 border-b border-[#262626] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#FFFFFF]" />
            <span className="text-xs font-semibold tracking-wide uppercase text-[#FFFFFF]">API Contracts</span>
          </div>
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#FFFFFF] bg-[#1A1A1A] hover:bg-[#262626] active:bg-[#0D0D0D] border border-[#333333] hover:border-[#404040] rounded-md transition-colors"
            title="Import API Specification"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666666]" />
          <input
            type="text"
            placeholder="Search contracts, services..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0D0D0D] text-[#FFFFFF] placeholder-[#666666] border border-[#262626] focus:border-[#404040] focus:outline-none rounded-md transition-colors"
          />
        </div>

        {/* Protocol Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
          {PROTOCOLS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onProtocolFilterChange(tab.id)}
              className={`px-2 py-1 text-[11px] rounded-md transition-colors whitespace-nowrap font-medium ${
                protocolFilter === tab.id
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                  : "bg-transparent text-[#858585] hover:text-[#FFFFFF] border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contract List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {contracts.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#858585]">
            No API contracts found matching your filters.
          </div>
        ) : (
          contracts.map((contract) => {
            const isSelected = contract.id === selectedContractId;
            const activeRev =
              contract.revisions.find((r) => r.id === contract.currentRevisionId) ||
              contract.revisions[0];
            const opsCount = activeRev?.operations?.length ?? 0;

            return (
              <div
                key={contract.id}
                onClick={() => onSelectContract(contract.id)}
                className={`p-2.5 rounded-md cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-[#141414] border-[#404040] shadow-sm"
                    : "bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#333333] hover:bg-[#111111]"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <h4 className="text-xs font-medium text-[#FFFFFF] truncate leading-tight">
                    {contract.name}
                  </h4>
                  {getProtocolBadge(contract.protocol)}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#858585] font-mono mb-2">
                  <span className="truncate">{contract.providerServiceId}</span>
                  <span>•</span>
                  <span>v{activeRev?.versionLabel || "1.0"}</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#858585]">
                    {opsCount} {contract.protocol === "async_event" ? "channels" : "operations"}
                  </span>
                  {getLifecycleBadge(contract.lifecycleStatus)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#262626] bg-[#050505] text-[10px] text-[#666666] flex justify-between items-center">
        <span>{contracts.length} Contracts Registered</span>
        <span className="text-[#858585]">Declared & Implemented</span>
      </div>
    </aside>
  );
}

