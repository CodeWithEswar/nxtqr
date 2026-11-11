"use client";

/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Traffic Policies, Timeouts, Rate Limits & Circuit Breakers Inspector
 */

import React from "react";
import type {
  ApiGateway,
  NetworkFinding,
} from "@nxtqr/architecture-intelligence";
import {
  SlidersIcon,
  AlertTriangleIcon,
} from "@nxtqr/icons";

export interface NetworkPolicyInspectorProps {
  gateways: ApiGateway[];
  selectedGateway: ApiGateway | null;
  findings: NetworkFinding[];
}

export function NetworkPolicyInspector({
  gateways,
  selectedGateway,
  findings,
}: NetworkPolicyInspectorProps) {
  if (!selectedGateway && gateways.length > 0) {
    selectedGateway = gateways[0];
  }

  const policyFindings = findings.filter(
    (f) =>
      f.category === "timeout_budget_inversion" ||
      f.category === "retry_amplification_hazard" ||
      f.category === "rate_limit_scope_omission"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <SlidersIcon className="w-4 h-4 text-[#858585]" />
            Traffic Policies, Timeout Budgets & Resilience
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Audit timeout inversions, retry storm hazards, token-bucket rate limiters, and circuit breakers.
          </p>
        </div>
      </div>

      {/* Policy Findings */}
      {policyFindings.length > 0 && (
        <div className="space-y-2">
          {policyFindings.map((finding) => (
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

      {selectedGateway ? (
        <div className="space-y-6">
          {/* Routes Policy Matrix */}
          <div className="bg-[#080808] border border-[#262626] rounded-md overflow-hidden">
            <div className="bg-[#0D0D0D] px-4 py-3 border-b border-[#262626] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#B5B5B5]">
                Route Traffic Policy Matrix ({selectedGateway.routes.length} Routes)
              </span>
              <span className="text-xs font-mono text-[#858585]">
                Gateway: {selectedGateway.name}
              </span>
            </div>

            <div className="divide-y divide-[#1A1A1A]">
              {selectedGateway.routes.map((route) => {
                const timeout = route.policies.timeout;
                const hasTimeoutInversion =
                  timeout && timeout.gatewayTimeoutMs <= timeout.upstreamTimeoutMs;

                const retry = route.policies.retry;
                const rateLimit = route.policies.rateLimit;
                const cb = route.policies.circuitBreaker;

                return (
                  <div key={route.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#FFFFFF]">
                          {route.name}
                        </span>
                        <span className="font-mono text-[11px] text-[#858585]">
                          {route.match.pathPrefix || route.match.pathExact || "/"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#141414] text-[#B5B5B5] border border-[#262626]">
                        Upstream: {route.targetUpstreamPoolId}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                      {/* Timeout Budget */}
                      <div
                        className={`p-3 rounded-md border space-y-1 ${
                          hasTimeoutInversion
                            ? "bg-[#1A0A0A] border-[#551A1A]"
                            : "bg-[#0D0D0D] border-[#202020]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#858585]">TIMEOUT BUDGET</span>
                          {hasTimeoutInversion && (
                            <span className="text-[10px] text-[#FF4D4D] font-bold">
                              INVERSION
                            </span>
                          )}
                        </div>
                        {timeout ? (
                          <div className="space-y-0.5">
                            <div className="text-[#FFFFFF]">
                              GW: {timeout.gatewayTimeoutMs}ms
                            </div>
                            <div className="text-[#858585] text-[11px]">
                              Upstream: {timeout.upstreamTimeoutMs}ms
                            </div>
                          </div>
                        ) : (
                          <div className="text-[#666666]">Default (3000ms)</div>
                        )}
                      </div>

                      {/* Rate Limiting */}
                      <div className="p-3 bg-[#0D0D0D] border border-[#202020] rounded-md space-y-1">
                        <span className="text-[10px] text-[#858585]">RATE LIMIT</span>
                        {rateLimit ? (
                          <div className="space-y-0.5">
                            <div className="text-[#FFFFFF]">
                              {rateLimit.limit} req / {rateLimit.windowSeconds}s
                            </div>
                            <div className="text-[#858585] text-[11px]">
                              Scope: {rateLimit.scope}
                              {rateLimit.burstCapacity && ` (Burst: ${rateLimit.burstCapacity})`}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[#666666]">No Rate Limit</div>
                        )}
                      </div>

                      {/* Retries */}
                      <div className="p-3 bg-[#0D0D0D] border border-[#202020] rounded-md space-y-1">
                        <span className="text-[10px] text-[#858585]">RETRY POLICY</span>
                        {retry ? (
                          <div className="space-y-0.5">
                            <div className="text-[#FFFFFF]">
                              Max {retry.maxRetries} Retries
                            </div>
                            <div className="text-[#858585] text-[11px]">
                              Jitter: {retry.jitter ? "Enabled" : "Disabled"}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[#666666]">No Retries</div>
                        )}
                      </div>

                      {/* Circuit Breaker */}
                      <div className="p-3 bg-[#0D0D0D] border border-[#202020] rounded-md space-y-1">
                        <span className="text-[10px] text-[#858585]">CIRCUIT BREAKER</span>
                        {cb ? (
                          <div className="space-y-0.5">
                            <div className="text-[#FFFFFF]">
                              {cb.consecutiveErrorsThreshold} Consecutive Errors
                            </div>
                            <div className="text-[#858585] text-[11px]">
                              Timeout: {cb.openTimeoutMs}ms
                            </div>
                          </div>
                        ) : (
                          <div className="text-[#666666]">Disabled</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-[#262626] rounded-md bg-[#080808] text-xs text-[#858585]">
          No gateways available to inspect policies.
        </div>
      )}
    </div>
  );
}
