"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Database Explorer (Assets, Tables, Queries & Transactions Sidebar)
 */

import React, { useState } from "react";
import type {
  DatabaseAsset,
  DatabaseTable,
  QueryWorkload,
  TransactionModel,
} from "@nxtqr/architecture-intelligence";
import {
  DatabaseIcon,
  SearchIcon,
  LockIcon,
} from "@nxtqr/icons";

export interface DatabaseExplorerProps {
  assets: DatabaseAsset[];
  tables: DatabaseTable[];
  workloads: QueryWorkload[];
  transactions: TransactionModel[];
  selectedAssetId: string | null;
  selectedTableId: string | null;
  selectedQueryId: string | null;
  selectedTransactionId: string | null;
  onSelectAsset: (id: string) => void;
  onSelectTable: (id: string) => void;
  onSelectQuery: (id: string) => void;
  onSelectTransaction: (id: string) => void;
}

export function DatabaseExplorer(props: DatabaseExplorerProps) {
  const {
    assets,
    tables,
    workloads,
    transactions,
    selectedAssetId,
    selectedTableId,
    selectedQueryId,
    selectedTransactionId,
    onSelectAsset,
    onSelectTable,
    onSelectQuery,
    onSelectTransaction,
  } = props;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"tables" | "assets" | "queries" | "transactions">("tables");

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkloads = workloads.filter((w) =>
    w.queryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#080808] border-r border-[#262626] w-72 select-none">
      {/* Sidebar Header & Search */}
      <div className="p-3 border-b border-[#262626] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4 text-[#FFFFFF]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
              Database Catalog
            </span>
          </div>
          <span className="text-[10px] text-[#858585] font-mono">
            {tables.length} tables
          </span>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#666666]" />
          <input
            type="text"
            placeholder="Search tables, queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D0D0D] text-xs text-[#FFFFFF] placeholder-[#666666] pl-8 pr-3 py-1.5 rounded-md border border-[#262626] hover:border-[#333333] focus:border-[#404040] focus:outline-none transition-colors"
          />
        </div>

        {/* Section Segmented Switcher */}
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#0D0D0D] rounded-md border border-[#202020]">
          <button
            type="button"
            onClick={() => setActiveSection("tables")}
            className={`text-[10px] font-medium py-1 rounded-md transition-colors ${
              activeSection === "tables"
                ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                : "text-[#858585] hover:text-[#FFFFFF]"
            }`}
          >
            Tables
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("queries")}
            className={`text-[10px] font-medium py-1 rounded-md transition-colors ${
              activeSection === "queries"
                ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                : "text-[#858585] hover:text-[#FFFFFF]"
            }`}
          >
            Queries
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("transactions")}
            className={`text-[10px] font-medium py-1 rounded-md transition-colors ${
              activeSection === "transactions"
                ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                : "text-[#858585] hover:text-[#FFFFFF]"
            }`}
          >
            Txns
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("assets")}
            className={`text-[10px] font-medium py-1 rounded-md transition-colors ${
              activeSection === "assets"
                ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                : "text-[#858585] hover:text-[#FFFFFF]"
            }`}
          >
            Assets
          </button>
        </div>
      </div>

      {/* Explorer Content List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeSection === "tables" && (
          <>
            <div className="px-2 py-1 text-[10px] font-medium text-[#666666] uppercase tracking-wider">
              Schemas & Tables
            </div>
            {filteredTables.map((table) => {
              const isSelected = selectedTableId === table.id;
              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => onSelectTable(table.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-md transition-all flex flex-col gap-1 border ${
                    isSelected
                      ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] shadow-level-3"
                      : "bg-transparent border-transparent hover:bg-[#0D0D0D] hover:border-[#262626] text-[#B5B5B5]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate font-mono">
                      {table.name}
                    </span>
                    {table.isJunctionTable && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#141414] text-[#858585] border border-[#262626]">
                        M:N
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#666666]">
                    <span>{table.columns.length} cols</span>
                    <span>•</span>
                    <span>{table.indexes.length} idxs</span>
                    <span>•</span>
                    <span className="font-mono">
                      {(table.estimatedRowCount / 1000000).toFixed(1)}M rows
                    </span>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {activeSection === "queries" && (
          <>
            <div className="px-2 py-1 text-[10px] font-medium text-[#666666] uppercase tracking-wider">
              Workload Queries
            </div>
            {filteredWorkloads.map((query) => {
              const isSelected = selectedQueryId === query.id;
              return (
                <button
                  key={query.id}
                  type="button"
                  onClick={() => onSelectQuery(query.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-md transition-all flex flex-col gap-1 border ${
                    isSelected
                      ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] shadow-level-3"
                      : "bg-transparent border-transparent hover:bg-[#0D0D0D] hover:border-[#262626] text-[#B5B5B5]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">
                      {query.queryName}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md uppercase font-mono bg-[#141414] text-[#858585] border border-[#262626]">
                      {query.queryType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#666666]">
                    <span>{query.frequencyPerMinute} rpm</span>
                    <span>•</span>
                    <span className="font-mono">
                      {query.p95LatencyMsModeled ? `${query.p95LatencyMsModeled}ms` : "N/A"}
                    </span>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {activeSection === "transactions" && (
          <>
            <div className="px-2 py-1 text-[10px] font-medium text-[#666666] uppercase tracking-wider">
              Transactions & Concurrency
            </div>
            {transactions.map((tx) => {
              const isSelected = selectedTransactionId === tx.id;
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => onSelectTransaction(tx.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-md transition-all flex flex-col gap-1 border ${
                    isSelected
                      ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] shadow-level-3"
                      : "bg-transparent border-transparent hover:bg-[#0D0D0D] hover:border-[#262626] text-[#B5B5B5]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">
                      {tx.name}
                    </span>
                    <LockIcon className="w-3 h-3 text-[#858585]" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#666666]">
                    <span className="font-mono">{tx.isolationLevel}</span>
                    <span>•</span>
                    <span>{tx.operations.length} ops</span>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {activeSection === "assets" && (
          <>
            <div className="px-2 py-1 text-[10px] font-medium text-[#666666] uppercase tracking-wider">
              Database Instances & Clusters
            </div>
            {assets.map((asset) => {
              const isSelected = selectedAssetId === asset.id;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelectAsset(asset.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-md transition-all flex flex-col gap-1 border ${
                    isSelected
                      ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] shadow-level-3"
                      : "bg-transparent border-transparent hover:bg-[#0D0D0D] hover:border-[#262626] text-[#B5B5B5]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">
                      {asset.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#141414] text-[#858585] border border-[#262626] uppercase">
                      {asset.environment}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#666666]">
                    <span>{asset.providerTechnology}</span>
                    <span>•</span>
                    <span className="font-mono">{asset.engineVersion || "default"}</span>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
