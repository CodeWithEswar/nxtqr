"use client";

/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Load Balancer & Upstream Pool Health Inspector
 */

import React from "react";
import type {
  LoadBalancer,
  UpstreamPool,
  NetworkFinding,
} from "@nxtqr/architecture-intelligence";
import {
  CpuIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ActivityIcon,
} from "@nxtqr/icons";

export interface LoadBalancerInspectorProps {
  loadBalancers: LoadBalancer[];
  upstreamPools: UpstreamPool[];
  selectedPool: UpstreamPool | null;
  findings: NetworkFinding[];
  onSelectPool: (id: string) => void;
  onUpdatePool: (pool: UpstreamPool) => void;
}

export function LoadBalancerInspector({
  loadBalancers,
  upstreamPools,
  selectedPool,
  findings,
  onSelectPool,
  onUpdatePool: _onUpdatePool,
}: LoadBalancerInspectorProps) {
  if (!selectedPool && upstreamPools.length > 0) {
    selectedPool = upstreamPools[0];
  }

  const poolFindings = findings.filter(
    (f) =>
      f.id.startsWith("lb-finding-") ||
      (selectedPool && f.affectedResourceIds.includes(selectedPool.id))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <CpuIcon className="w-4 h-4 text-[#858585]" />
            Load Balancers & Upstream Health Pools
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Monitor Layer 4/Layer 7 distribution, endpoint health checks, connection pooling, and capacity degradation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {upstreamPools.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPool(p.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors border ${
                selectedPool?.id === p.id
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border-[#404040]"
                  : "bg-[#0D0D0D] text-[#858585] border-[#262626] hover:text-[#B5B5B5]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Findings */}
      {poolFindings.length > 0 && (
        <div className="space-y-2">
          {poolFindings.map((finding) => (
            <div
              key={finding.id}
              className={`p-3 rounded-md border text-xs flex items-start gap-2.5 ${
                finding.severity === "critical"
                  ? "bg-[#1A0A0A] border-[#551A1A] text-[#FF4D4D]"
                  : finding.severity === "high"
                  ? "bg-[#1A1408] border-[#553300] text-[#FFAA00]"
                  : "bg-[#141414] border-[#333333] text-[#B5B5B5]"
              }`}
            >
              <AlertTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-0.5">
                <div className="font-semibold">{finding.title}</div>
                <div className="text-[11px] opacity-90">{finding.summary}</div>
                <div className="text-[10px] font-mono mt-1 opacity-75">
                  Remediation: {finding.remediation}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load Balancers Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loadBalancers.map((lb) => (
          <div
            key={lb.id}
            className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#FFFFFF]">
                {lb.name}
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#141414] text-[#B5B5B5] border border-[#262626]">
                {lb.layer} ({lb.scheme})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#858585]">
              <div>
                <span>Algorithm: </span>
                <span className="text-[#FFFFFF]">{lb.algorithm.replace("_", " ")}</span>
              </div>
              <div>
                <span>Cross-Zone: </span>
                <span className="text-[#FFFFFF]">{lb.crossZoneLoadBalancing ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Upstream Pool Detail */}
      {selectedPool ? (
        <div className="bg-[#080808] border border-[#262626] rounded-md p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#202020]">
            <div>
              <span className="text-xs text-[#858585] uppercase tracking-wider font-mono">
                Upstream Pool
              </span>
              <div className="text-base font-bold text-[#FFFFFF] font-mono">
                {selectedPool.name}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">
                {selectedPool.endpoints.filter((e) => e.isHealthy).length} / {selectedPool.endpoints.length} Healthy Endpoints
              </span>
            </div>
          </div>

          {/* Health Check Details */}
          {selectedPool.healthCheck ? (
            <div className="p-3 bg-[#0D0D0D] border border-[#262626] rounded-md space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#B5B5B5] flex items-center gap-1.5">
                  <ActivityIcon className="w-3.5 h-3.5 text-[#858585]" />
                  Active Health Check Policy
                </span>
                <span className="text-[10px] font-mono text-[#4ADE80]">
                  Protocol: {selectedPool.healthCheck.protocol.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-[#858585]">
                <div>
                  <span>Probe Path: </span>
                  <span className="text-[#FFFFFF]">{selectedPool.healthCheck.path || "/"}</span>
                </div>
                <div>
                  <span>Interval: </span>
                  <span className="text-[#FFFFFF]">{selectedPool.healthCheck.intervalSeconds}s</span>
                </div>
                <div>
                  <span>Timeout: </span>
                  <span className="text-[#FFFFFF]">{selectedPool.healthCheck.timeoutSeconds}s</span>
                </div>
                <div>
                  <span>Thresholds: </span>
                  <span className="text-[#FFFFFF]">
                    {selectedPool.healthCheck.healthyThreshold} up / {selectedPool.healthCheck.unhealthyThreshold} down
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#1A1408] border border-[#553300] rounded-md text-xs text-[#FFAA00]">
              Warning: No active health check policy assigned to this pool. Unhealthy backends cannot be detected.
            </div>
          )}

          {/* Endpoints Table */}
          <div className="border border-[#262626] rounded-md overflow-hidden">
            <div className="bg-[#0D0D0D] px-3 py-2 border-b border-[#262626] text-xs font-semibold text-[#B5B5B5]">
              Endpoints & Health Status ({selectedPool.endpoints.length})
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#202020] bg-[#0A0A0A] text-[#858585] font-mono">
                  <th className="py-2 px-3 font-medium">Endpoint Address</th>
                  <th className="py-2 px-3 font-medium">Port</th>
                  <th className="py-2 px-3 font-medium">Weight</th>
                  <th className="py-2 px-3 font-medium">Drain State</th>
                  <th className="py-2 px-3 font-medium text-right">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {selectedPool.endpoints.map((ep) => (
                  <tr key={ep.id} className="hover:bg-[#0D0D0D] transition-colors font-mono">
                    <td className="py-2.5 px-3 text-[#FFFFFF]">
                      {ep.address}
                    </td>
                    <td className="py-2.5 px-3 text-[#B5B5B5]">
                      {ep.port}
                    </td>
                    <td className="py-2.5 px-3 text-[#B5B5B5]">
                      {ep.weight}
                    </td>
                    <td className="py-2.5 px-3 text-[#858585]">
                      {ep.isDraining ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#1A1408] text-[#FFAA00] border border-[#553300] text-[10px]">
                          Draining
                        </span>
                      ) : (
                        "Active"
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {ep.isHealthy ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#4ADE80]">
                          <CheckCircleIcon className="w-3 h-3" />
                          Healthy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#FF4D4D]">
                          <AlertTriangleIcon className="w-3 h-3" />
                          Unhealthy
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-[#262626] rounded-md bg-[#080808] text-xs text-[#858585]">
          No upstream pools configured in this topology.
        </div>
      )}
    </div>
  );
}
