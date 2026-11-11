"use client";

/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Data Consistency & Replication Topology Inspector
 */

import React from "react";
import type {
  DistributedStateTopology,
  StaleReadEvaluation,
} from "@nxtqr/architecture-intelligence";
import {
  DatabaseIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";

export interface ConsistencyInspectorProps {
  topology: DistributedStateTopology;
  staleReadEvaluations: StaleReadEvaluation[];
}

export function ConsistencyInspector({
  topology,
  staleReadEvaluations,
}: ConsistencyInspectorProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-[#FFFFFF] overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4 text-[#858585]" />
            Replication Consistency & Stale-Read Boundaries
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Evaluates read-after-write session consistency, quorum overlap math (R + W &gt; N), and multi-leader clock drift.
          </p>
        </div>
        <span className="text-xs font-mono text-[#858585] px-2 py-0.5 rounded-md bg-[#080808] border border-[#262626]">
          {topology.replicaGroups.length} Replication Pools
        </span>
      </div>

      {/* Replication Groups & Quorum Math */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
          Replication Topologies & Quorum Overlap
        </h3>

        {topology.replicaGroups.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#262626] rounded-md bg-[#080808]">
            No replica groups modeled. Single-node persistence assumed.
          </div>
        ) : (
          topology.replicaGroups.map((group) => {
            const n = group.replicas.length;
            const r = group.readQuorumSize ?? 1;
            const w = group.writeQuorumSize ?? 1;
            const isQuorumMode = group.replicationMode === "quorum_based";
            const isQuorumOverlap = r + w > n;

            return (
              <div
                key={group.id}
                className={`p-4 rounded-md border bg-[#080808] space-y-3 ${
                  isQuorumMode && !isQuorumOverlap ? "border-[#404040]" : "border-[#262626]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#FFFFFF] font-mono">
                      {group.topologyType.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] text-[#858585] border border-[#262626]">
                      Mode: {group.replicationMode}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#333333]">
                      Guaranteed: {group.consistencyModel.replace(/_/g, " ")}
                    </span>
                  </div>

                  {isQuorumMode && (
                    <div
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1.5 border ${
                        isQuorumOverlap
                          ? "bg-[#0D0D0D] border-[#262626] text-[#FFFFFF]"
                          : "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF]"
                      }`}
                    >
                      {isQuorumOverlap ? (
                        <>
                          <CheckCircleIcon className="w-3 h-3 text-[#B5B5B5]" />
                          <span>Strict Quorum (R + W &gt; N)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangleIcon className="w-3 h-3 text-[#B5B5B5]" />
                          <span>Quorum Deficit (R + W ≤ N)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Quorum Equation Display */}
                {isQuorumMode && (
                  <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-[#858585] block">Replicas (N)</span>
                        <span className="text-[#FFFFFF]">{n}</span>
                      </div>
                      <span className="text-[#666666]">+</span>
                      <div>
                        <span className="text-[10px] text-[#858585] block">Read Quorum (R)</span>
                        <span className="text-[#FFFFFF]">{r}</span>
                      </div>
                      <span className="text-[#666666]">+</span>
                      <div>
                        <span className="text-[10px] text-[#858585] block">Write Quorum (W)</span>
                        <span className="text-[#FFFFFF]">{w}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#858585] block">Formula Verification</span>
                      <span className="text-[#FFFFFF]">
                        {r} + {w} = {r + w} {isQuorumOverlap ? ">" : "≤"} {n}
                      </span>
                    </div>
                  </div>
                )}

                {/* Nodes List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {group.replicas.map((node) => (
                    <div
                      key={node.id}
                      className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-xs font-mono flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[#FFFFFF] block font-medium">{node.name}</span>
                        <span className="text-[10px] text-[#858585]">{node.regionId}</span>
                      </div>
                      <div className="text-right">
                        {node.isLeader ? (
                          <span className="text-[10px] bg-[#141414] text-[#FFFFFF] px-1.5 py-0.5 rounded-md border border-[#333333]">
                            Leader / Writer
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#858585]">
                            {node.replicationLagMsObserved ?? node.replicationLagMsModeled ?? 50}ms lag
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stale Read Windows by Key Space */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
          Stale Read Evaluations ({staleReadEvaluations.length})
        </h3>

        <div className="border border-[#262626] rounded-md bg-[#080808] overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0D0D0D] border-b border-[#262626] text-[#858585] text-[11px]">
              <tr>
                <th className="py-2 px-3 font-normal">Layer / Source</th>
                <th className="py-2 px-3 font-normal">Target Domain</th>
                <th className="py-2 px-3 font-normal">Max Staleness Window</th>
                <th className="py-2 px-3 font-normal">Consistency Model</th>
                <th className="py-2 px-3 font-normal">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {staleReadEvaluations.map((evalItem, idx) => (
                <tr key={idx} className="hover:bg-[#141414] transition-colors">
                  <td className="py-2.5 px-3 text-[#FFFFFF] font-medium">
                    {evalItem.layerOrReplicaName}
                  </td>
                  <td className="py-2.5 px-3 text-[#B5B5B5]">{evalItem.targetDomain}</td>
                  <td className="py-2.5 px-3 text-[#FFFFFF]">
                    {evalItem.maximumStalenessWindowSeconds}s
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#0D0D0D] text-[#858585] border border-[#262626]">
                      {evalItem.consistencyModel.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {evalItem.isStaleReadRisk ? (
                      <span className="text-[#FFFFFF] bg-[#1A1A1A] px-1.5 py-0.5 rounded-md border border-[#404040] text-[10px]">
                        Stale Read Exposure
                      </span>
                    ) : (
                      <span className="text-[#858585] text-[10px]">Bounded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
