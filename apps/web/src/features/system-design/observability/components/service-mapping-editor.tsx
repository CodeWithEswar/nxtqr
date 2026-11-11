"use client";

import React from "react";
import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  DiscoveredService,
  TelemetryServiceMapping,
} from "@nxtqr/architecture-intelligence";
import {
  CheckIcon,
  CloseIcon,
  CheckCircleIcon,
  CpuIcon,
  AlertTriangleIcon,
} from "@nxtqr/icons";

export interface ServiceMappingEditorProps {
  nodes: BaseNode[];
  mappings: TelemetryServiceMapping[];
  discoveredServices: DiscoveredService[];
  onConfirmMapping: (mappingId: string) => void;
  onUnlinkMapping: (componentId: string) => void;
  onApplyAutoSuggestions: () => void;
  className?: string;
}

export function ServiceMappingEditor({
  nodes,
  mappings,
  discoveredServices,
  onConfirmMapping,
  onUnlinkMapping,
  onApplyAutoSuggestions,
  className = "",
}: ServiceMappingEditorProps) {
  const mappedComponentIds = new Set(mappings.map((m) => m.componentId));

  const getConfidenceBadge = (confidence: TelemetryServiceMapping["confidence"]) => {
    switch (confidence) {
      case "confirmed":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#141414] text-emerald-400 border border-[#262626]">
            Confirmed
          </span>
        );
      case "suggested":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#141414] text-amber-400 border border-[#262626]">
            Suggested
          </span>
        );
      case "ambiguous":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#141414] text-orange-400 border border-[#262626]">
            Ambiguous
          </span>
        );
      case "stale":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#141414] text-red-400 border border-[#262626]">
            Stale
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#141414] text-[#858585] border border-[#262626]">
            Unmapped
          </span>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#080808] text-white text-xs select-none ${className}`}>
      {/* Header with Auto-Map Button */}
      <div className="flex items-center justify-between p-3 border-b border-[#262626] bg-[#0D0D0D]">
        <div>
          <h3 className="font-semibold text-sm">Service Identity Mappings</h3>
          <p className="text-[11px] text-[#858585]">
            Correlate architecture components with monitored runtime services
          </p>
        </div>
        <button
          type="button"
          onClick={onApplyAutoSuggestions}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] text-white rounded-md text-xs font-medium transition-all"
        >
          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Auto-Map Services</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Active Mappings List */}
        <div>
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#858585] mb-2">
            Active Node Mappings ({mappings.length})
          </h4>
          <div className="space-y-2">
            {mappings.map((mapping) => {
              const node = nodes.find((n) => n.id === mapping.componentId);
              const nodeLabel = (node?.data?.label as string) || mapping.componentId;

              return (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-2.5 bg-[#0D0D0D] border border-[#262626] hover:border-[#333333] rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CpuIcon className="w-4 h-4 text-[#858585] flex-shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-white truncate">{nodeLabel}</div>
                      <div className="text-[11px] font-mono text-[#858585] truncate">
                        service:{" "}
                        <span className="text-white">
                          {mapping.serviceIdentity.serviceName}
                        </span>
                        {mapping.serviceIdentity.namespace && (
                          <span className="text-[#666666]">
                            {" "}
                            ({mapping.serviceIdentity.namespace})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {getConfidenceBadge(mapping.confidence)}

                    {mapping.confidence === "suggested" && (
                      <button
                        type="button"
                        onClick={() => onConfirmMapping(mapping.id)}
                        title="Confirm suggested mapping"
                        className="p-1 bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-emerald-700 text-emerald-400 rounded-md transition-colors"
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onUnlinkMapping(mapping.componentId)}
                      title="Unlink telemetry mapping"
                      className="p-1 bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-red-700 text-[#858585] hover:text-red-400 rounded-md transition-colors"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {mappings.length === 0 && (
              <div className="p-4 text-center border border-dashed border-[#262626] rounded-md text-[#858585] text-xs">
                No active service identity mappings configured. Click &quot;Auto-Map
                Services&quot; to discover matches.
              </div>
            )}
          </div>
        </div>

        {/* Unmapped Nodes Notice */}
        {nodes.some((n) => !mappedComponentIds.has(n.id)) && (
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5">
              <AlertTriangleIcon className="w-3.5 h-3.5" />
              Unmonitored Architecture Nodes (Missing Telemetry)
            </h4>
            <div className="space-y-1.5">
              {nodes
                .filter((n) => !mappedComponentIds.has(n.id))
                .map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-2 bg-[#0D0D0D] border border-amber-900/30 rounded-md text-[11px]"
                  >
                    <span className="text-white font-medium">
                      {(node.data?.label as string) || node.id}
                    </span>
                    <span className="font-mono text-[10px] text-amber-400">
                      No Telemetry Coverage
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Discovered Runtime Services */}
        {discoveredServices.length > 0 && (
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#858585] mb-2">
              Discovered Services from Monitoring Gateway ({discoveredServices.length})
            </h4>
            <div className="space-y-1.5">
              {discoveredServices.map((svc) => (
                <div
                  key={svc.serviceIdentity.serviceName}
                  className="flex items-center justify-between p-2 bg-[#0D0D0D] border border-[#262626] rounded-md text-[11px] font-mono"
                >
                  <span className="text-white truncate">
                    {svc.serviceIdentity.serviceName}
                  </span>
                  <span className="text-[#858585] text-[10px]">
                    protocols: {svc.detectedProtocols.join(", ") || "http"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
