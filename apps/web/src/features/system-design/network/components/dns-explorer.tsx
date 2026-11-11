"use client";

/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * DNS Architecture & Resolution Explorer
 */

import React from "react";
import type {
  DNSZone,
  NetworkFinding,
} from "@nxtqr/architecture-intelligence";
import {
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";

export interface DnsExplorerProps {
  dnsZones: DNSZone[];
  selectedZone: DNSZone | null;
  findings: NetworkFinding[];
  onSelectZone: (id: string) => void;
  onUpdateZone: (updated: DNSZone) => void;
}

export function DnsExplorer({
  dnsZones,
  selectedZone,
  findings,
  onSelectZone,
  onUpdateZone: _onUpdateZone,
}: DnsExplorerProps) {
  if (!selectedZone && dnsZones.length > 0) {
    selectedZone = dnsZones[0];
  }

  const dnsFindings = findings.filter(
    (f) =>
      f.id.startsWith("dns-finding-") ||
      (selectedZone && f.affectedResourceIds.includes(selectedZone.id))
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <ShieldIcon className="w-4 h-4 text-[#858585]" />
            DNS Zones & Authoritative Resolution
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Manage public and private DNS records, failover health checks, and recursive TTL budgets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dnsZones.map((z) => (
            <button
              key={z.id}
              onClick={() => onSelectZone(z.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors border ${
                selectedZone?.id === z.id
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border-[#404040]"
                  : "bg-[#0D0D0D] text-[#858585] border-[#262626] hover:text-[#B5B5B5]"
              }`}
            >
              {z.domainName}
            </button>
          ))}
        </div>
      </div>

      {/* DNS Findings Alerts */}
      {dnsFindings.length > 0 && (
        <div className="space-y-2">
          {dnsFindings.map((finding) => (
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

      {/* Zone Details Card */}
      {selectedZone ? (
        <div className="bg-[#080808] border border-[#262626] rounded-md p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-[#858585] uppercase tracking-wider font-mono">
                Authoritative Zone
              </span>
              <div className="text-lg font-bold text-[#FFFFFF] font-mono">
                {selectedZone.domainName}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">
                Provider: {selectedZone.providerTechnology}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md border ${
                  selectedZone.isPrivate
                    ? "bg-[#141414] text-[#B5B5B5] border-[#262626]"
                    : "bg-[#0D1A10] text-[#4ADE80] border-[#165525]"
                }`}
              >
                {selectedZone.isPrivate ? "Private VPC" : "Public Internet"}
              </span>
            </div>
          </div>

          {/* DNS Records Table */}
          <div className="border border-[#262626] rounded-md overflow-hidden">
            <div className="bg-[#0D0D0D] px-3 py-2 border-b border-[#262626] flex items-center justify-between text-xs font-semibold text-[#B5B5B5]">
              <span>Resource Records ({selectedZone.records.length})</span>
              <span className="text-[11px] font-normal text-[#666666]">
                TTL Budget Enforcement Active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#202020] bg-[#0A0A0A] text-[#858585] font-mono">
                    <th className="py-2 px-3 font-medium">Record Name</th>
                    <th className="py-2 px-3 font-medium">Type</th>
                    <th className="py-2 px-3 font-medium">TTL</th>
                    <th className="py-2 px-3 font-medium">Target / Values</th>
                    <th className="py-2 px-3 font-medium">Routing Policy</th>
                    <th className="py-2 px-3 font-medium text-right">Health Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {selectedZone.records.map((rec) => {
                    const isFailover = rec.routingPolicy?.type === "failover";
                    const hasTtlHazard = isFailover && rec.ttlSeconds > 300;

                    return (
                      <tr key={rec.id} className="hover:bg-[#0D0D0D] transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[#FFFFFF] font-medium">
                          {rec.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-[#141414] border border-[#262626] text-[#B5B5B5] text-[10px]">
                            {rec.recordType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] border ${
                              hasTtlHazard
                                ? "bg-[#1A1408] text-[#FFAA00] border-[#553300]"
                                : "text-[#858585] border-transparent"
                            }`}
                          >
                            {rec.ttlSeconds}s
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#B5B5B5] text-[11px]">
                          {rec.values.join(", ")}
                        </td>
                        <td className="py-2.5 px-3 text-[#B5B5B5]">
                          {rec.routingPolicy ? (
                            <span className="capitalize font-mono text-[11px]">
                              {rec.routingPolicy.type}
                              {rec.routingPolicy.isPrimary !== undefined && (
                                <span className="ml-1 text-[#858585]">
                                  ({rec.routingPolicy.isPrimary ? "Primary" : "Secondary"})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-[#666666] font-mono text-[11px]">Simple</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {rec.routingPolicy?.healthCheckId ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#4ADE80]">
                              <CheckCircleIcon className="w-3 h-3" />
                              Active Probe
                            </span>
                          ) : (
                            <span className="text-[#666666] font-mono text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-[#262626] rounded-md bg-[#080808] text-xs text-[#858585]">
          No DNS zones configured in this topology.
        </div>
      )}
    </div>
  );
}
