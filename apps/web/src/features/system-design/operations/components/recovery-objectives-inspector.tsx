"use client";

/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Recovery Objectives (RTO/RPO) & Backup Inspector Component
 */

import React from "react";
import type {
  RecoveryObjective,
  BackupCapability,
  FailoverProcedure,
} from "@nxtqr/architecture-intelligence";

interface RecoveryObjectivesInspectorProps {
  objectives: RecoveryObjective[];
  backups: BackupCapability[];
  failovers: FailoverProcedure[];
}

export function RecoveryObjectivesInspector({
  objectives,
  backups,
  failovers,
}: RecoveryObjectivesInspectorProps) {
  return (
    <div className="space-y-6">
      {/* RTO / RPO Objectives Table */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-[#262626]">
          <div>
            <div className="text-xs uppercase font-mono text-[#858585]">Service Level Objectives</div>
            <h3 className="text-base font-bold text-[#FFFFFF]">Recovery Objectives (RTO & RPO)</h3>
          </div>
          <span className="text-xs text-[#858585] font-mono">
            {objectives.filter((o) => o.isRtoVerified && o.isRpoVerified).length} of {objectives.length} Drill-Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#202020] text-[#858585] font-mono">
                <th className="pb-2 font-medium">Service / Asset</th>
                <th className="pb-2 font-medium">Strategy</th>
                <th className="pb-2 font-medium">Target RTO</th>
                <th className="pb-2 font-medium">Observed RTO</th>
                <th className="pb-2 font-medium">Target RPO</th>
                <th className="pb-2 font-medium">Observed RPO</th>
                <th className="pb-2 font-medium text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A] text-[#B5B5B5]">
              {objectives.map((obj) => (
                <tr key={obj.id} className="hover:bg-[#0D0D0D]">
                  <td className="py-2.5 font-semibold text-[#FFFFFF]">{obj.serviceName}</td>
                  <td className="py-2.5 font-mono text-[#858585]">{obj.supportingStrategyType}</td>
                  <td className="py-2.5 font-mono text-[#FFFFFF]">{obj.rtoTargetSeconds}s</td>
                  <td className="py-2.5 font-mono">
                    {obj.observedRtoSeconds !== undefined ? (
                      <span className={obj.observedRtoSeconds <= obj.rtoTargetSeconds ? "text-[#22c55e]" : "text-[#ef4444]"}>
                        {obj.observedRtoSeconds}s
                      </span>
                    ) : (
                      <span className="text-[#666666] italic">Untested</span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono text-[#FFFFFF]">{obj.rpoTargetSeconds}s</td>
                  <td className="py-2.5 font-mono">
                    {obj.observedRpoSeconds !== undefined ? (
                      <span className={obj.observedRpoSeconds <= obj.rpoTargetSeconds ? "text-[#22c55e]" : "text-[#ef4444]"}>
                        {obj.observedRpoSeconds}s
                      </span>
                    ) : (
                      <span className="text-[#666666] italic">Untested</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    {obj.isRtoVerified && obj.isRpoVerified ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-[#141414] text-[#22c55e] border border-[#262626]">
                        VERIFIED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-[#1a1408] text-[#FFAA00] border border-[#423010]">
                        TARGET ONLY
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup & Restore Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div>
              <div className="text-xs uppercase font-mono text-[#858585]">Data Durability</div>
              <h4 className="text-sm font-bold text-[#FFFFFF]">Backup Capabilities & Freshness</h4>
            </div>
            <span className="text-xs font-mono text-[#858585]">{backups.length} active</span>
          </div>

          <div className="space-y-3">
            {backups.map((b) => (
              <div key={b.id} className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#FFFFFF]">{b.componentName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                      b.restoreVerified
                        ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                        : "bg-[#1f1010] text-[#ef4444] border border-[#401818]"
                    }`}
                  >
                    {b.restoreVerified ? "RESTORE VERIFIED" : "RESTORE UNTESTED"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#858585] pt-1 border-t border-[#1A1A1A]">
                  <div>Type: {b.backupType}</div>
                  <div>Retention: {b.retentionDays} days</div>
                  <div>Encrypted: {b.isEncrypted ? "AES-256" : "NO"}</div>
                  <div>Schedule: {b.scheduleExpression}</div>
                </div>

                <div className="text-[11px] font-mono text-[#666666] truncate">
                  Storage: {b.storageLocation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failover & Geographic Redundancy */}
        <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div>
              <div className="text-xs uppercase font-mono text-[#858585]">High Availability</div>
              <h4 className="text-sm font-bold text-[#FFFFFF]">Failover & Region Redundancy</h4>
            </div>
            <span className="text-xs font-mono text-[#858585]">{failovers.length} policies</span>
          </div>

          <div className="space-y-3">
            {failovers.map((fo) => (
              <div key={fo.id} className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#FFFFFF]">{fo.componentId}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#141414] text-[#22c55e] border border-[#262626]">
                    {fo.failoverType.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#858585] pt-1 border-t border-[#1A1A1A]">
                  <div>Primary: {fo.primaryRegion}</div>
                  <div>Secondary: {fo.secondaryRegion}</div>
                  <div>Sync Lag Max: {fo.dataSyncLagMaxSeconds}s</div>
                  <div>Health: {fo.healthCheckType}</div>
                </div>

                <div className="p-2 rounded-md bg-[#141414] border border-[#262626] text-[11px] text-[#B5B5B5]">
                  <span className="font-semibold text-[#858585]">Failback: </span>
                  {fo.failbackProcedure}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
