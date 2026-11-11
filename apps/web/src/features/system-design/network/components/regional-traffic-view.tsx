"use client";

/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Regional Traffic Distribution & Multi-Region Failover View
 */

import React from "react";
import type {
  NetworkArchitectureTopology,
  NetworkFinding,
} from "@nxtqr/architecture-intelligence";
import {
  ActivityIcon,
  AlertTriangleIcon,
} from "@nxtqr/icons";

export interface RegionalTrafficViewProps {
  topology: NetworkArchitectureTopology;
  findings: NetworkFinding[];
}

export function RegionalTrafficView({
  topology,
  findings,
}: RegionalTrafficViewProps) {
  const regionalFindings = findings.filter(
    (f) => f.category === "cross_region_latency_bottleneck"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-[#858585]" />
            Regional Traffic Distribution & Multi-Region Topology
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Evaluate geographic traffic distribution, cross-region transit penalties, and disaster recovery posture.
          </p>
        </div>
      </div>

      {/* Regional Findings */}
      {regionalFindings.length > 0 && (
        <div className="space-y-2">
          {regionalFindings.map((finding) => (
            <div
              key={finding.id}
              className="p-3 rounded-md border text-xs flex items-start gap-2.5 bg-[#1A1408] border-[#553300] text-[#FFAA00]"
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

      {/* Regions Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* US-East Region Card */}
        <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-[#858585] uppercase tracking-wider font-mono">
                Primary Ingress Region
              </span>
              <div className="text-sm font-bold text-[#FFFFFF] font-mono">
                us-east-1 (N. Virginia)
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#0D1A10] text-[#4ADE80] border border-[#165525] text-xs font-mono">
              Active / Healthy
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center justify-between">
              <span className="text-[#858585]">DNS Failover Posture:</span>
              <span className="text-[#FFFFFF]">Primary (Weight 100)</span>
            </div>
            <div className="p-2.5 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center justify-between">
              <span className="text-[#858585]">Hosted Gateways:</span>
              <span className="text-[#FFFFFF]">{topology.gateways.length} Gateway Instances</span>
            </div>
            <div className="p-2.5 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center justify-between">
              <span className="text-[#858585]">Local Transit Latency:</span>
              <span className="text-[#4ADE80] font-bold">~4.5ms (Low Delay)</span>
            </div>
          </div>
        </div>

        {/* EU-West Region Card */}
        <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-[#858585] uppercase tracking-wider font-mono">
                Secondary / Edge Region
              </span>
              <div className="text-sm font-bold text-[#FFFFFF] font-mono">
                eu-west-1 (Ireland)
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626] text-xs font-mono">
              Secondary / Standby
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center justify-between">
              <span className="text-[#858585]">DNS Failover Posture:</span>
              <span className="text-[#FFFFFF]">Passive Failover Target</span>
            </div>
            <div className="p-2.5 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center justify-between">
              <span className="text-[#858585]">Cross-Region Transit:</span>
              <span className="text-[#FFAA00] font-bold">+65.0ms (Inter-DC)</span>
            </div>
            <div className="p-2.5 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center justify-between">
              <span className="text-[#858585]">Failover TTL Readiness:</span>
              <span className="text-[#4ADE80]">60s Propagation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
