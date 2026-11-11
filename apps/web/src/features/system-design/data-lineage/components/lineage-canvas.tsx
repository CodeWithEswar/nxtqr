"use client";

/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Lineage Canvas Component
 */

import React from "react";
import type {
  DataAsset,
  DataFlow,
  LineageTraversalResult,
} from "@nxtqr/architecture-intelligence";
import {
  ChevronRightIcon,
  DatabaseIcon,
  ShieldIcon,
  LayersIcon,
  CpuIcon,
  AlertCircleIcon,
} from "@nxtqr/icons";

interface LineageCanvasProps {
  selectedAsset: DataAsset | null;
  traversalResult: LineageTraversalResult | null;
  flows: DataFlow[];
  selectedFlowId: string | null;
  onSelectFlow: (flowId: string) => void;
}

export function LineageCanvas({
  selectedAsset,
  traversalResult,
  flows,
  selectedFlowId,
  onSelectFlow,
}: LineageCanvasProps) {
  if (!selectedAsset) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-text-muted text-xs">
        Select a data asset from the catalog to trace lineage and flow propagation.
      </div>
    );
  }

  // Paths
  const downstreamPaths = traversalResult?.downstreamPaths || [];
  const upstreamPaths = traversalResult?.upstreamPaths || [];
  const stores = traversalResult?.dataStoresReached || selectedAsset.storageBindings;

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-y-auto p-4 space-y-6">
      {/* Top Banner: Asset Header & Provenance */}
      <div className="bg-surface-01 border border-border-default rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-surface-03 text-text-secondary border border-border-default">
              Tracing Asset
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              {selectedAsset.name}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-04 text-foreground font-semibold border border-border-strong uppercase">
              {selectedAsset.classification.level}
            </span>
          </div>
          <p className="text-xs text-text-muted">
            {selectedAsset.description || "No asset description documented."}
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs text-text-muted shrink-0">
          <div>
            <span className="text-[11px] block text-text-disabled">Provenance</span>
            <span className="font-mono text-text-secondary">
              {selectedAsset.provenance.source.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-[11px] block text-text-disabled">Owner</span>
            <span className="text-text-secondary">
              {selectedAsset.owner?.technicalOwner || "Unassigned"}
            </span>
          </div>
          <div>
            <span className="text-[11px] block text-text-disabled">Storage Copies</span>
            <span className="text-text-secondary font-mono">{stores.length}</span>
          </div>
        </div>
      </div>

      {/* Lineage Trace Visualization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center space-x-1.5">
            <LayersIcon className="w-4 h-4 text-text-muted" />
            <span>End-to-End Lineage Flow Paths ({downstreamPaths.length + upstreamPaths.length})</span>
          </h3>
          {traversalResult?.isCycleDetected && (
            <span className="flex items-center space-x-1 text-[11px] text-text-secondary px-2 py-0.5 bg-surface-03 border border-border-strong rounded-md">
              <AlertCircleIcon className="w-3.5 h-3.5 text-text-muted" />
              <span>Cyclic Flow Loop Detected</span>
            </span>
          )}
        </div>

        {downstreamPaths.length === 0 ? (
          <div className="bg-surface-01 border border-border-default rounded-md p-6 text-center text-xs text-text-muted">
            No downstream transit flows currently registered for this asset. Direct storage bindings only.
          </div>
        ) : (
          <div className="space-y-3">
            {downstreamPaths.map((path, idx) => (
              <div
                key={path.pathId || idx}
                className="bg-surface-01 border border-border-default rounded-md p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-text-secondary text-[11px]">
                    Path #{idx + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    {path.crossesTrustBoundary && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-03 border border-border-strong text-foreground font-medium">
                        Crosses Trust Boundary
                      </span>
                    )}
                    {path.reachesThirdParty && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-03 border border-border-default text-text-secondary">
                        Third Party Export
                      </span>
                    )}
                  </div>
                </div>

                {/* Nodes Horizontal Sequence */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {path.nodes.map((node, nodeIdx) => {
                    const isLast = nodeIdx === path.nodes.length - 1;
                    return (
                      <React.Fragment key={`${node.componentId}-${nodeIdx}`}>
                        <div className="flex items-center space-x-2 bg-surface-02 border border-border-default hover:border-border-hover rounded-md px-2.5 py-1.5 text-xs transition-colors">
                          <CpuIcon className="w-3.5 h-3.5 text-text-muted" />
                          <span className="font-medium text-foreground">
                            {node.componentName}
                          </span>
                          <span className="text-[10px] text-text-disabled uppercase">
                            {node.action}
                          </span>
                        </div>
                        {!isLast && (
                          <ChevronRightIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storage Residencies Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center space-x-1.5">
          <DatabaseIcon className="w-4 h-4 text-text-muted" />
          <span>Storage Residencies & Durable Sinks ({stores.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stores.map((store) => (
            <div
              key={store.componentId}
              className="bg-surface-01 border border-border-default hover:border-border-hover rounded-md p-3 space-y-2 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <DatabaseIcon className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {store.componentName}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-surface-03 text-text-secondary border border-border-subtle shrink-0">
                  {store.copyType.replace("_", " ")}
                </span>
              </div>

              <div className="text-[11px] text-text-muted space-y-1">
                <div className="flex justify-between">
                  <span>Store Type:</span>
                  <span className="font-mono text-text-secondary">{store.storeType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Durability:</span>
                  <span>{store.isTransient ? "Transient (In-Memory)" : "Durable (Disk)"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Residency / Region:</span>
                  <span>{store.regionId || store.jurisdictionCountry || "Unconfigured"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Flows Transport Details */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center space-x-1.5">
          <ShieldIcon className="w-4 h-4 text-text-muted" />
          <span>Associated Network Flows Carrying This Payload</span>
        </h3>

        <div className="divide-y divide-border-subtle bg-surface-01 border border-border-default rounded-md overflow-hidden">
          {flows
            .filter((f) => f.dataAssetIds.includes(selectedAsset.id))
            .map((flow) => {
              const isSelected = flow.id === selectedFlowId;
              return (
                <div
                  key={flow.id}
                  onClick={() => onSelectFlow(flow.id)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? "bg-surface-03" : "hover:bg-surface-02"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-foreground">
                        {flow.sourceComponentId} → {flow.destinationComponentId}
                      </span>
                      {flow.crossesTrustBoundary && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-04 border border-border-strong text-foreground font-medium">
                          Trust Boundary
                        </span>
                      )}
                      {flow.isThirdPartyTransfer && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-02 border border-border-subtle text-text-secondary">
                          3rd Party ({flow.recipientOrganization || "External"})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-muted flex items-center space-x-3">
                      <span>Protocol: {flow.protocol || "HTTPS"}</span>
                      <span>
                        Transport Security:{" "}
                        {flow.encryptionInTransit?.configured
                          ? flow.encryptionInTransit.tlsVersion || "TLS Encrypted"
                          : "Unencrypted"}
                      </span>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-text-muted" />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

