"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Distribution, Sharding, Partition Pruning & Read Replica Routing Visualizer
 */

import React from "react";
import type {
  DatabaseArchitectureTopology,
  DatabaseArchitectureFinding,
} from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon, CheckIcon, LayersIcon } from "@nxtqr/icons";

export interface DistributionViewProps {
  topology: DatabaseArchitectureTopology;
  findings: DatabaseArchitectureFinding[];
}

export function DistributionView({ topology, findings }: DistributionViewProps) {
  const sharding = topology.sharding;
  const readReplicaRouting = topology.readReplicaRouting;

  const distributionFindings = findings.filter(
    (f) =>
      f.category === "cross_shard_join_bottleneck" ||
      f.title.includes("Partition") ||
      f.title.includes("Replica")
  );

  return (
    <div className="flex flex-col h-full bg-[#000000] overflow-y-auto p-6 space-y-6">
      {/* Header Summary */}
      <div className="p-4 bg-[#080808] border border-[#262626] rounded-md flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#FFFFFF]" />
            Distributed Storage, Sharding & Replication Routing
          </h2>
          <p className="text-xs text-[#858585] mt-1">
            Analyzing horizontal sharding topology, partition key pruning, and read replica synchronization lag.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Sharding Strategy
            </span>
            <span className="text-sm font-bold font-mono text-[#FFFFFF] uppercase">
              {sharding ? sharding.strategy : "Unsharded"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Read Replica Routing
            </span>
            <span className="text-sm font-bold font-mono text-[#FFFFFF]">
              {readReplicaRouting && readReplicaRouting.strategy !== "primary_only"
                ? `Active (${readReplicaRouting.strategy})`
                : "Direct Primary"}
            </span>
          </div>
        </div>
      </div>

      {/* Sharding Topology Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
          Horizontal Sharding Architecture
        </h3>

        {sharding && sharding.strategy !== "none" ? (
          <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#FFFFFF] block font-mono">
                  {sharding.totalShards}-Node Hash Sharded Cluster
                </span>
                <span className="text-xs text-[#858585]">
                  Shard Key: <strong className="text-[#FFFFFF] font-mono">{sharding.shardKeyColumnNames.join(", ")}</strong>
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-[#141414] text-[#B5B5B5] border border-[#333333]">
                Consistent Hashing
              </span>
            </div>

            {/* Scatter-Gather Risk Card */}
            {sharding.crossShardJoinRisk && (
              <div className="p-3 bg-[#141414] border border-[#404040] rounded-md flex items-start gap-3">
                <AlertTriangleIcon className="w-4 h-4 text-[#FFFFFF] mt-0.5 shrink-0" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-[#FFFFFF]">
                    Cross-Shard Scatter-Gather Hazard
                  </span>
                  <p className="text-[#858585]">
                    Queries omitting the shard key &quot;{sharding.shardKeyColumnNames.join(", ")}&quot; must be broadcast to all {sharding.totalShards} shard nodes, increasing cluster-wide CPU utilization and tail latency.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#858585]">
            Single-node primary architecture. Sharding is currently disabled.
          </div>
        )}
      </div>

      {/* Read Replica Routing & Lag */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
          Read Replica Offloading & Replication Lag
        </h3>

        {readReplicaRouting ? (
          <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-[#666666] block text-[10px] uppercase">Routing Strategy</span>
                <span className="text-[#FFFFFF] font-semibold">
                  {readReplicaRouting.strategy !== "primary_only" ? readReplicaRouting.strategy : "Primary Only"}
                </span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px] uppercase">P95 Observed Lag</span>
                <span className="text-[#FFFFFF] font-semibold">
                  {readReplicaRouting.p95ReplicaLagMsObserved !== undefined
                    ? `${(readReplicaRouting.p95ReplicaLagMsObserved / 1000).toFixed(2)}s (${readReplicaRouting.p95ReplicaLagMsObserved}ms)`
                    : "0.0s"}
                </span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px] uppercase">Max Tolerated Lag</span>
                <span className="text-[#FFFFFF] font-semibold">
                  {(readReplicaRouting.maxAllowableLagMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px] uppercase">Replicas Active</span>
                <span className="text-[#FFFFFF] font-semibold flex items-center gap-1">
                  <CheckIcon className="w-3 h-3 text-[#FFFFFF]" />
                  {readReplicaRouting.replicaCount} Nodes
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#858585]">
            No read replica routing configuration active. All read traffic reaches the primary.
          </div>
        )}
      </div>

      {/* Distribution Findings */}
      {distributionFindings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
            Distribution & Replication Findings ({distributionFindings.length})
          </h3>
          <div className="space-y-2">
            {distributionFindings.map((f) => (
              <div
                key={f.id}
                className="p-3 bg-[#080808] border border-[#262626] rounded-md space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#FFFFFF]">{f.title}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md uppercase font-mono bg-[#141414] text-[#B5B5B5] border border-[#333333]">
                    {f.severity}
                  </span>
                </div>
                <p className="text-xs text-[#858585]">{f.explanation}</p>
                <p className="text-[11px] font-mono text-[#FFFFFF] bg-[#000000] p-2 rounded-md border border-[#202020]">
                  {f.remediation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
