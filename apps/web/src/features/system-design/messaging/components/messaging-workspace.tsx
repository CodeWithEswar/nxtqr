"use client";

/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Master Studio Messaging Workspace Shell
 */

import React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { MessagingTopology } from "@nxtqr/architecture-intelligence";
import { useArchitectureMessaging, MessagingTab } from "../hooks/use-architecture-messaging";
import { BrokerExplorer } from "./broker-explorer";
import { DestinationInspector } from "./destination-inspector";
import { DeliveryPolicyEditor } from "./delivery-policy-editor";
import { RetryDlqInspector } from "./retry-dlq-inspector";
import { EventFlowExplorer } from "./event-flow-explorer";
import { SagaWorkflowView } from "./saga-workflow-view";
import { MessagingFindings } from "./messaging-findings";
import { LayersIcon, AlertTriangleIcon } from "@nxtqr/icons";

export interface MessagingWorkspaceProps {
  projectId?: string;
  architectureId?: string;
  graphRevision?: string;
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialTopology?: MessagingTopology;
}

export function MessagingWorkspace(props: MessagingWorkspaceProps) {
  const {
    topology,
    analysisOutput,
    activeTab,
    setActiveTab,
    selectedBrokerId,
    setSelectedBrokerId,
    selectedBroker,
    selectedDestinationId,
    setSelectedDestinationId,
    selectedDestination,
    selectedTraceId,
    setSelectedTraceId,
    selectedSagaId,
    setSelectedSagaId,
    selectedFindingId,
    setSelectedFindingId,
    searchQuery,
    setSearchQuery,
    destinationTypeFilter,
    setDestinationTypeFilter,
    severityFilter,
    setSeverityFilter,
    filteredDestinations,
    filteredFindings,
    updateDestination,
  } = useArchitectureMessaging(props);

  const summary = analysisOutput?.summary;

  return (
    <div className="flex flex-col h-full w-full bg-[#000000] text-[#FFFFFF] select-none overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-12 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <LayersIcon className="w-5 h-5 text-[#858585]" />
          <div>
            <h1 className="text-xs font-bold tracking-wider uppercase text-[#FFFFFF]">
              Distributed Messaging & Event Systems
            </h1>
            <div className="text-[10px] text-[#858585] font-mono">
              Phase 05.3.21 • Pure Black Monochrome
            </div>
          </div>
        </div>

        {/* Telemetry Summary Counters */}
        {summary && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#202020]">
              <span className="text-[#858585]">Brokers:</span>
              <span className="font-semibold text-[#FFFFFF]">{summary.brokerCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#202020]">
              <span className="text-[#858585]">Destinations:</span>
              <span className="font-semibold text-[#FFFFFF]">{summary.destinationCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#202020]">
              <span className="text-[#858585]">Producers / Consumers:</span>
              <span className="font-semibold text-[#FFFFFF]">
                {summary.producerCount} / {summary.consumerCount}
              </span>
            </div>
            {summary.findingsCount.critical > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1A1A1A] border border-[#404040] text-[#FFFFFF]">
                <AlertTriangleIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
                <span>{summary.findingsCount.critical} Critical</span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* View Tabs Sub-header */}
      <nav className="h-9 border-b border-[#262626] bg-[#0D0D0D] px-4 flex items-center gap-1 shrink-0">
        {[
          { id: "overview" as MessagingTab, label: "Overview & Topologies" },
          { id: "destinations" as MessagingTab, label: "Destinations & Policies" },
          { id: "retry_storm" as MessagingTab, label: "Retry Storm & DLQ" },
          { id: "flows" as MessagingTab, label: "Event Flows (Multi-Hop)" },
          { id: "sagas" as MessagingTab, label: "Distributed Sagas" },
          {
            id: "findings" as MessagingTab,
            label: `Findings (${summary?.findingsCount.total ?? 0})`,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors border ${
                isActive
                  ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] font-semibold"
                  : "bg-transparent border-transparent text-[#858585] hover:text-[#FFFFFF] hover:bg-[#141414]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Studio Body (3-Pane Workspace) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Explorer Pane */}
        <BrokerExplorer
          brokers={topology.brokers}
          destinations={filteredDestinations}
          selectedBrokerId={selectedBrokerId}
          selectedDestinationId={selectedDestinationId}
          onSelectBroker={setSelectedBrokerId}
          onSelectDestination={setSelectedDestinationId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          destinationTypeFilter={destinationTypeFilter}
          onDestinationTypeFilterChange={setDestinationTypeFilter}
        />

        {/* Center Main Tab View */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#000000]">
          {activeTab === "overview" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Architecture Topology Overview */}
              <div className="p-4 rounded-md border border-[#262626] bg-[#080808] space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-[#FFFFFF]">
                    Event Architecture Intelligence Summary
                  </h2>
                  <span className="text-[10px] font-mono text-[#858585]">
                    Revision: {topology.graphRevision}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
                    <div className="text-[10px] text-[#858585] uppercase">Retry Storm Risks</div>
                    <div className="text-xl font-bold text-[#FFFFFF] mt-1">
                      {summary?.stormRiskDestinationsCount ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
                    <div className="text-[10px] text-[#858585] uppercase">Unbounded Queues</div>
                    <div className="text-xl font-bold text-[#FFFFFF] mt-1">
                      {summary?.unboundedGrowthDestinationsCount ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
                    <div className="text-[10px] text-[#858585] uppercase">Uncompensated Sagas</div>
                    <div className="text-xl font-bold text-[#FFFFFF] mt-1">
                      {summary?.uncompensatedSagasCount ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
                    <div className="text-[10px] text-[#858585] uppercase">Replay Hazards</div>
                    <div className="text-xl font-bold text-[#FFFFFF] mt-1">
                      {summary?.replayHazardCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Destination Details Preview */}
              {selectedDestination && (
                <DestinationInspector
                  destination={selectedDestination}
                  producers={topology.producers}
                  consumers={topology.consumers}
                  backlogProjection={analysisOutput?.queueBacklogProjections.find(
                    (p) => p.destinationId === selectedDestination.id
                  )}
                  onUpdateDestination={updateDestination}
                />
              )}
            </div>
          )}

          {activeTab === "destinations" && selectedDestination && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <DestinationInspector
                destination={selectedDestination}
                producers={topology.producers}
                consumers={topology.consumers}
                backlogProjection={analysisOutput?.queueBacklogProjections.find(
                  (p) => p.destinationId === selectedDestination.id
                )}
                onUpdateDestination={updateDestination}
              />
              <DeliveryPolicyEditor
                destination={selectedDestination}
                capabilities={selectedBroker?.capabilities}
                onSave={updateDestination}
              />
            </div>
          )}

          {activeTab === "retry_storm" && selectedDestination && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <RetryDlqInspector
                destination={selectedDestination}
                consumers={topology.consumers}
                evaluations={analysisOutput?.retryStormEvaluations || []}
              />
            </div>
          )}

          {activeTab === "flows" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <EventFlowExplorer
                traces={analysisOutput?.eventFlowTraces || []}
                selectedTraceId={selectedTraceId}
                onSelectTrace={setSelectedTraceId}
              />
            </div>
          )}

          {activeTab === "sagas" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <SagaWorkflowView
                sagas={analysisOutput?.sagas || []}
                selectedSagaId={selectedSagaId}
                onSelectSaga={setSelectedSagaId}
              />
            </div>
          )}

          {activeTab === "findings" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <MessagingFindings
                findings={filteredFindings}
                severityFilter={severityFilter}
                onSeverityFilterChange={setSeverityFilter}
                selectedFindingId={selectedFindingId}
                onSelectFinding={setSelectedFindingId}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
