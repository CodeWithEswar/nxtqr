"use client";

/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Gateway Route & Ingress Policy Inspector
 */

import React from "react";
import type {
  ApiGateway,
  GatewayRoute,
  UpstreamPool,
  NetworkFinding,
} from "@nxtqr/architecture-intelligence";
import {
  LayersIcon,
  AlertTriangleIcon,
  LockIcon,
  SlidersIcon,
  ActivityIcon,
} from "@nxtqr/icons";

export interface GatewayRouteInspectorProps {
  gateway: ApiGateway | null;
  selectedRoute: GatewayRoute | null;
  upstreamPools: UpstreamPool[];
  findings: NetworkFinding[];
  onSelectRoute: (routeId: string) => void;
  onUpdateRoute: (route: GatewayRoute) => void;
}

export function GatewayRouteInspector({
  gateway,
  selectedRoute,
  upstreamPools,
  findings,
  onSelectRoute,
  onUpdateRoute: _onUpdateRoute,
}: GatewayRouteInspectorProps) {
  if (!gateway) {
    return (
      <div className="p-8 text-center border border-[#262626] rounded-md bg-[#080808] text-xs text-[#858585]">
        No API Gateway selected.
      </div>
    );
  }

  const gatewayFindings = findings.filter(
    (f) =>
      f.affectedResourceIds.includes(gateway.id) ||
      (selectedRoute && f.affectedResourceIds.includes(selectedRoute.id))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#858585]" />
            Gateway Routes & Traffic Splitting
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Configure ingress matching rules, traffic weights (canary/blue-green), and backend upstream targeting.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-1 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">
            Gateway: {gateway.name}
          </span>
          <span className="px-2 py-1 rounded-md bg-[#141414] text-[#858585] border border-[#262626]">
            Tech: {gateway.providerTechnology}
          </span>
        </div>
      </div>

      {/* Gateway Findings */}
      {gatewayFindings.length > 0 && (
        <div className="space-y-2">
          {gatewayFindings.map((finding) => (
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

      {/* Listeners Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {gateway.listeners.map((listener, idx) => (
          <div
            key={idx}
            className="p-3 bg-[#080808] border border-[#262626] rounded-md space-y-1"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#858585] font-mono">Listener {listener.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-[#141414] text-[#B5B5B5] text-[10px] font-mono border border-[#262626]">
                Port {listener.port} ({listener.protocol.toUpperCase()})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#B5B5B5] mt-1">
              <LockIcon className="w-3.5 h-3.5 text-[#858585]" />
              <span className="font-mono text-[11px]">
                TLS: {listener.tlsMode.replace("_", " ")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Routes Grid / Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Route Selector List */}
        <div className="lg:col-span-5 border border-[#262626] rounded-md overflow-hidden bg-[#080808]">
          <div className="p-3 bg-[#0D0D0D] border-b border-[#262626] flex items-center justify-between text-xs font-semibold text-[#B5B5B5]">
            <span>Configured Routes ({gateway.routes.length})</span>
            <span className="text-[10px] text-[#666666] font-mono">Precedence Sorted</span>
          </div>
          <div className="divide-y divide-[#1A1A1A] max-h-96 overflow-y-auto">
            {gateway.routes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              const hasSplit = !!(route.trafficSplit && route.trafficSplit.length > 0);

              return (
                <button
                  key={route.id}
                  onClick={() => onSelectRoute(route.id)}
                  className={`w-full text-left p-3 transition-colors ${
                    isSelected
                      ? "bg-[#141414] border-l-2 border-[#404040]"
                      : "hover:bg-[#0D0D0D]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-[#FFFFFF]">
                      {route.name}
                    </span>
                    <span className="text-[10px] font-mono px-1 rounded bg-[#1A1A1A] text-[#858585] border border-[#262626]">
                      #{route.precedenceOrder}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 font-mono text-[11px]">
                    <span className="text-[#858585]">
                      {route.match.methods?.join(", ") || "ANY"}
                    </span>
                    <span className="text-[#B5B5B5]">
                      {route.match.pathPrefix || route.match.pathExact || "/"}
                    </span>
                  </div>
                  {hasSplit && (
                    <div className="mt-2 text-[10px] font-mono text-[#858585] flex items-center gap-1">
                      <SlidersIcon className="w-3 h-3 text-[#B5B5B5]" />
                      <span>Traffic Split: {route.trafficSplit?.map((s) => `${s.weight}%`).join(" / ")}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Route Detail Pane */}
        <div className="lg:col-span-7 bg-[#080808] border border-[#262626] rounded-md p-4 space-y-4">
          {selectedRoute ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-[#202020]">
                <div>
                  <h3 className="text-sm font-semibold text-[#FFFFFF]">
                    {selectedRoute.name}
                  </h3>
                  <div className="text-xs text-[#858585] font-mono mt-0.5">
                    Match Path: {selectedRoute.match.pathPrefix || selectedRoute.match.pathExact || "/"}
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">
                  Precedence: {selectedRoute.precedenceOrder}
                </span>
              </div>

              {/* Target Upstream Pool */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#858585] font-medium uppercase tracking-wider font-mono">
                  Target Upstream Pool
                </label>
                <div className="p-2.5 bg-[#0D0D0D] border border-[#262626] rounded-md flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ActivityIcon className="w-3.5 h-3.5 text-[#858585]" />
                    <span className="font-mono text-[#FFFFFF]">
                      {selectedRoute.targetUpstreamPoolId}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#858585]">
                    {upstreamPools.find((p) => p.id === selectedRoute.targetUpstreamPoolId)?.endpoints.length || 0} active endpoints
                  </span>
                </div>
              </div>

              {/* Traffic Splitting Weights (Canary / Blue-Green) */}
              <div className="space-y-2">
                <label className="text-xs text-[#858585] font-medium uppercase tracking-wider font-mono">
                  Traffic Shifting & Canary Split
                </label>
                {selectedRoute.trafficSplit && selectedRoute.trafficSplit.length > 0 ? (
                  <div className="space-y-2">
                    {/* Visual Split Bar */}
                    <div className="h-3 w-full bg-[#1A1A1A] rounded-md overflow-hidden flex border border-[#262626]">
                      {selectedRoute.trafficSplit.map((split, i) => (
                        <div
                          key={i}
                          style={{ width: `${split.weight}%` }}
                          className={`h-full ${i === 0 ? "bg-[#333333]" : "bg-[#555555]"}`}
                          title={`${split.targetUpstreamPoolId}: ${split.weight}%`}
                        />
                      ))}
                    </div>
                    {/* Split Breakdown */}
                    <div className="space-y-1.5">
                      {selectedRoute.trafficSplit.map((split, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-md bg-[#0D0D0D] border border-[#202020] text-xs font-mono"
                        >
                          <span className="text-[#B5B5B5] truncate">
                            {split.targetUpstreamPoolId}
                          </span>
                          <span className="text-[#FFFFFF] font-bold">
                            {split.weight}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#0D0D0D] border border-[#262626] rounded-md text-xs text-[#858585]">
                    100% of traffic routes directly to primary upstream pool without canary division.
                  </div>
                )}
              </div>

              {/* Associated Route Policies */}
              <div className="space-y-2 pt-2 border-t border-[#202020]">
                <label className="text-xs text-[#858585] font-medium uppercase tracking-wider font-mono">
                  Active Traffic Policies
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 bg-[#0D0D0D] border border-[#202020] rounded-md space-y-1">
                    <span className="text-[#858585] block text-[10px]">TIMEOUT POLICY</span>
                    <span className="text-[#FFFFFF]">
                      GW: {selectedRoute.policies.timeout?.gatewayTimeoutMs || 3000}ms / UP: {selectedRoute.policies.timeout?.upstreamTimeoutMs || 2000}ms
                    </span>
                  </div>
                  <div className="p-2 bg-[#0D0D0D] border border-[#202020] rounded-md space-y-1">
                    <span className="text-[#858585] block text-[10px]">RATE LIMIT</span>
                    <span className="text-[#FFFFFF]">
                      {selectedRoute.policies.rateLimit?.limit || "Unlimited"} req / {selectedRoute.policies.rateLimit?.windowSeconds || 60}s
                    </span>
                  </div>
                  <div className="p-2 bg-[#0D0D0D] border border-[#202020] rounded-md space-y-1">
                    <span className="text-[#858585] block text-[10px]">RETRY POLICY</span>
                    <span className="text-[#FFFFFF]">
                      {selectedRoute.policies.retry ? `${selectedRoute.policies.retry.maxRetries} Retries (${selectedRoute.policies.retry.jitter ? "Jitter" : "Fixed"})` : "Disabled"}
                    </span>
                  </div>
                  <div className="p-2 bg-[#0D0D0D] border border-[#202020] rounded-md space-y-1">
                    <span className="text-[#858585] block text-[10px]">CIRCUIT BREAKER</span>
                    <span className="text-[#FFFFFF]">
                      {selectedRoute.policies.circuitBreaker ? `${selectedRoute.policies.circuitBreaker.consecutiveErrorsThreshold} Consecutive Errors` : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[#858585]">
              Select a route to inspect matching predicates and policies.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
