"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Master Studio Database Workspace Shell
 */

import React from "react";
import {
  useArchitectureDatabase,
  type UseArchitectureDatabaseProps,
  type DatabaseTab,
} from "../hooks/use-architecture-database";
import { DatabaseExplorer } from "./database-explorer";
import { SchemaDesigner } from "./schema-designer";
import { ERDiagramView } from "./er-diagram-view";
import { QueryPlanInspector } from "./query-plan-inspector";
import { IndexAdvisorView } from "./index-advisor-view";
import { TransactionLockView } from "./transaction-lock-view";
import { DistributionView } from "./distribution-view";
import { StorageCapacityView } from "./storage-capacity-view";
import { MigrationPlannerView } from "./migration-planner-view";
import { DatabaseFindingsView } from "./database-findings-view";
import {
  DatabaseIcon,
  LayersIcon,
  ActivityIcon,
  LockIcon,
  ShieldIcon,
  AlertTriangleIcon,
} from "@nxtqr/icons";

export interface DatabaseWorkspaceProps extends UseArchitectureDatabaseProps {
  className?: string;
}

export function DatabaseWorkspace(props: DatabaseWorkspaceProps) {
  const { className = "" } = props;

  const {
    topology,
    analysis,
    activeTab,
    setActiveTab,
    selectedAsset,
    selectedTable,
    selectedQuery,
    selectedTransaction,
    selectAsset,
    selectTable,
    selectQuery,
    selectTransaction,
  } = useArchitectureDatabase(props);

  const allTables = topology.schemas.flatMap((s) => s.tables);
  const summary = analysis.summary;

  const tabs: Array<{ id: DatabaseTab; label: string; count?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "schema", label: "Schema Designer" },
    { id: "er_diagram", label: "ER Diagram" },
    { id: "queries", label: "Query Plans", count: topology.executionPlans.length },
    { id: "indexes", label: "Index Advisor", count: summary.redundantIndexCount > 0 ? summary.redundantIndexCount : undefined },
    { id: "transactions", label: "Transactions & Locks", count: summary.deadlockRiskCount > 0 ? summary.deadlockRiskCount : undefined },
    { id: "distribution", label: "Distribution & Sharding" },
    { id: "storage", label: "Storage Capacity" },
    { id: "migrations", label: "Migration Planner", count: summary.breakingMigrationCount > 0 ? summary.breakingMigrationCount : undefined },
    { id: "findings", label: "Findings", count: summary.findingsCount.total },
  ];

  return (
    <div className={`flex flex-col h-full w-full bg-[#000000] text-[#FFFFFF] select-none ${className}`}>
      {/* Top Studio KPI Summary Metrics Bar */}
      <div className="h-12 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <DatabaseIcon className="w-4 h-4 text-[#FFFFFF]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
            Database Architecture Studio
          </span>
          <span className="text-[10px] text-[#858585] font-mono px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626]">
            {selectedAsset ? selectedAsset.name : "PostgreSQL Engine"}
          </span>
        </div>

        {/* Top KPIs */}
        <div className="flex items-center gap-5 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[#666666]">Tables:</span>
            <strong className="text-[#FFFFFF]">{summary.tableCount}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#666666]">Indexes:</span>
            <strong className="text-[#FFFFFF]">{summary.indexCount}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#666666]">Unindexed FKs:</span>
            <strong className={summary.unindexedForeignKeysCount > 0 ? "text-[#FFFFFF]" : "text-[#858585]"}>
              {summary.unindexedForeignKeysCount}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#666666]">Deadlock Cycles:</span>
            <strong className={summary.deadlockRiskCount > 0 ? "text-[#FFFFFF]" : "text-[#858585]"}>
              {summary.deadlockRiskCount}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#666666]">Findings:</span>
            <span className="px-1.5 py-0.5 rounded-md font-bold bg-[#141414] text-[#FFFFFF] border border-[#333333]">
              {summary.findingsCount.total}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Explorer Sidebar */}
        <DatabaseExplorer
          assets={topology.assets}
          tables={allTables}
          workloads={topology.workloads}
          transactions={topology.transactions}
          selectedAssetId={selectedAsset ? selectedAsset.id : null}
          selectedTableId={selectedTable ? selectedTable.id : null}
          selectedQueryId={selectedQuery ? selectedQuery.id : null}
          selectedTransactionId={selectedTransaction ? selectedTransaction.id : null}
          onSelectAsset={selectAsset}
          onSelectTable={(id) => {
            selectTable(id);
            if (activeTab === "overview") setActiveTab("schema");
          }}
          onSelectQuery={(id) => {
            selectQuery(id);
            if (activeTab === "overview") setActiveTab("queries");
          }}
          onSelectTransaction={(id) => {
            selectTransaction(id);
            if (activeTab === "overview") setActiveTab("transactions");
          }}
        />

        {/* Center Panel: Navigation Tabs & Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#000000]">
          {/* Tab Navigation Strip */}
          <div className="h-10 border-b border-[#262626] bg-[#080808] px-4 flex items-center gap-1 overflow-x-auto shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 border whitespace-nowrap ${
                    isActive
                      ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] shadow-level-3 font-semibold"
                      : "bg-transparent border-transparent hover:bg-[#0D0D0D] hover:border-[#262626] text-[#858585] hover:text-[#FFFFFF]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#141414] text-[#858585] border border-[#262626] font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Viewport */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "overview" && (
              <div className="p-6 space-y-6 overflow-y-auto h-full bg-[#000000]">
                {/* Overview Header */}
                <div className="p-4 bg-[#080808] border border-[#262626] rounded-md flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
                      <DatabaseIcon className="w-4 h-4 text-[#FFFFFF]" />
                      Database Intelligence Topology Overview
                    </h2>
                    <p className="text-xs text-[#858585] mt-1">
                      Evidence-backed data modeling, query execution plan trees, index redundancy checks, deadlock cycles, and storage growth.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#858585]">
                    Graph Revision: <strong className="text-[#FFFFFF]">{topology.graphRevision}</strong>
                  </span>
                </div>

                {/* 4 Feature Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    onClick={() => setActiveTab("schema")}
                    className="p-4 bg-[#080808] border border-[#262626] hover:border-[#404040] hover:bg-[#0D0D0D] rounded-md cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-[#858585]">
                      <span className="font-semibold text-[#FFFFFF]">Relational Schemas</span>
                      <LayersIcon className="w-4 h-4 text-[#B5B5B5]" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[#FFFFFF]">
                      {summary.tableCount} Tables
                    </div>
                    <p className="text-[11px] text-[#666666]">
                      {summary.unindexedForeignKeysCount} unindexed FKs requiring indexes
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab("indexes")}
                    className="p-4 bg-[#080808] border border-[#262626] hover:border-[#404040] hover:bg-[#0D0D0D] rounded-md cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-[#858585]">
                      <span className="font-semibold text-[#FFFFFF]">Index Efficiency</span>
                      <ShieldIcon className="w-4 h-4 text-[#B5B5B5]" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[#FFFFFF]">
                      {summary.indexCount} Total Idxs
                    </div>
                    <p className="text-[11px] text-[#666666]">
                      {summary.redundantIndexCount} redundant left-prefix duplicates
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab("transactions")}
                    className="p-4 bg-[#080808] border border-[#262626] hover:border-[#404040] hover:bg-[#0D0D0D] rounded-md cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-[#858585]">
                      <span className="font-semibold text-[#FFFFFF]">Concurrency & Locks</span>
                      <LockIcon className="w-4 h-4 text-[#B5B5B5]" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[#FFFFFF]">
                      {summary.deadlockRiskCount} Deadlocks
                    </div>
                    <p className="text-[11px] text-[#666666]">
                      {topology.transactions.length} modeled ACID transactions
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab("storage")}
                    className="p-4 bg-[#080808] border border-[#262626] hover:border-[#404040] hover:bg-[#0D0D0D] rounded-md cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-[#858585]">
                      <span className="font-semibold text-[#FFFFFF]">Storage Forecast</span>
                      <ActivityIcon className="w-4 h-4 text-[#B5B5B5]" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[#FFFFFF]">
                      {topology.storageForecast
                        ? `${(topology.storageForecast.currentTotalMb / 1024).toFixed(1)} GB`
                        : "N/A"}
                    </div>
                    <p className="text-[11px] text-[#666666]">
                      {topology.storageForecast?.projectedSaturationMonths
                        ? `${topology.storageForecast.projectedSaturationMonths.toFixed(0)} mos headroom`
                        : "Headroom available"}
                    </p>
                  </div>
                </div>

                {/* Top Critical Findings in Overview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
                      <AlertTriangleIcon className="w-3.5 h-3.5 text-[#FFFFFF]" />
                      Top Architectural Findings ({summary.findingsCount.total})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("findings")}
                      className="text-xs text-[#858585] hover:text-[#FFFFFF] transition-colors"
                    >
                      View all findings &rarr;
                    </button>
                  </div>

                  <div className="space-y-2">
                    {analysis.findings.slice(0, 4).map((f) => (
                      <div
                        key={f.id}
                        className="p-3 bg-[#080808] border border-[#262626] rounded-md flex items-center justify-between hover:border-[#333333] transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono uppercase font-bold bg-[#141414] text-[#FFFFFF] border border-[#333333]">
                              {f.severity}
                            </span>
                            <span className="text-xs font-semibold text-[#FFFFFF]">
                              {f.title}
                            </span>
                          </div>
                          <p className="text-xs text-[#858585] line-clamp-1">
                            {f.explanation}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-[#666666] shrink-0 ml-4">
                          {f.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "schema" && <SchemaDesigner table={selectedTable} />}

            {activeTab === "er_diagram" && (
              <ERDiagramView
                schemas={topology.schemas}
                selectedTableId={selectedTable ? selectedTable.id : null}
                onSelectTable={(id) => {
                  selectTable(id);
                }}
              />
            )}

            {activeTab === "queries" && (
              <QueryPlanInspector
                workload={selectedQuery}
                executionPlans={topology.executionPlans}
              />
            )}

            {activeTab === "indexes" && (
              <IndexAdvisorView table={selectedTable} findings={analysis.findings} />
            )}

            {activeTab === "transactions" && (
              <TransactionLockView
                transactions={topology.transactions}
                selectedTransaction={selectedTransaction}
                deadlockScenarios={analysis.deadlockScenarios}
                findings={analysis.findings}
              />
            )}

            {activeTab === "distribution" && (
              <DistributionView topology={topology} findings={analysis.findings} />
            )}

            {activeTab === "storage" && (
              <StorageCapacityView storageForecast={analysis.storageForecast} />
            )}

            {activeTab === "migrations" && (
              <MigrationPlannerView
                migrationPlan={analysis.migrationPlan}
                findings={analysis.findings}
              />
            )}

            {activeTab === "findings" && (
              <DatabaseFindingsView findings={analysis.findings} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
