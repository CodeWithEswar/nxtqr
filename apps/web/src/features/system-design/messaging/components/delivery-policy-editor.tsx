"use client";

/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Delivery Semantics & Ordering Policy Editor
 */

import React, { useState } from "react";
import type {
  MessagingDestination,
  BrokerCapabilities,
  DeliverySemantics,
  OrderingScope,
} from "@nxtqr/architecture-intelligence";
import { CheckIcon, CloseIcon } from "@nxtqr/icons";

export interface DeliveryPolicyEditorProps {
  destination: MessagingDestination;
  capabilities?: BrokerCapabilities;
  onSave: (updated: MessagingDestination) => void;
}

export function DeliveryPolicyEditor({
  destination,
  capabilities,
  onSave,
}: DeliveryPolicyEditorProps) {
  const [semantics, setSemantics] = useState<DeliverySemantics>(destination.deliverySemantics);
  const [scope, setScope] = useState<OrderingScope>(destination.orderingScope);
  const [partitions, setPartitions] = useState<number>(destination.partitioning?.partitionCount ?? 1);
  const [partitionKey, setPartitionKey] = useState<string>(
    destination.partitioning?.partitionKeyField ?? ""
  );
  const [retentionHours, setRetentionHours] = useState<number>(destination.retention.retentionHours);

  const handleApply = () => {
    const updated: MessagingDestination = {
      ...destination,
      deliverySemantics: semantics,
      orderingScope: scope,
      partitioning:
        partitions > 1 || partitionKey
          ? {
              partitionCount: partitions,
              partitionKeyField: partitionKey,
              assignmentStrategy: destination.partitioning?.assignmentStrategy ?? "hash",
              rebalanceAssumption:
                destination.partitioning?.rebalanceAssumption ?? "cooperative_incremental",
            }
          : undefined,
      retention: {
        ...destination.retention,
        retentionHours,
      },
      provenance: {
        ...destination.provenance,
        source: "configured",
        timestamp: new Date().toISOString(),
      },
    };
    onSave(updated);
  };

  return (
    <div className="p-4 space-y-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#FFFFFF]">
      <div className="text-xs font-semibold uppercase font-mono tracking-wider text-[#FFFFFF]">
        Delivery & Partition Policy Configuration
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Delivery Semantics */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-[#858585] font-mono">Delivery Semantics</label>
          <select
            value={semantics}
            onChange={(e) => setSemantics(e.target.value as DeliverySemantics)}
            className="w-full bg-[#141414] text-xs text-[#FFFFFF] px-3 py-1.5 rounded-md border border-[#262626] focus:border-[#404040] focus:outline-none"
          >
            <option value="at_least_once">At-Least-Once Delivery (Standard)</option>
            <option value="at_most_once">At-Most-Once Delivery (Fire-and-forget)</option>
            <option value="provider_transactional">Provider Transactional (Atomic batch)</option>
          </select>
        </div>

        {/* Ordering Scope */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-[#858585] font-mono">Ordering Scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as OrderingScope)}
            className="w-full bg-[#141414] text-xs text-[#FFFFFF] px-3 py-1.5 rounded-md border border-[#262626] focus:border-[#404040] focus:outline-none"
          >
            <option value="partition">Partition Order (Total within partition)</option>
            <option value="key">Key Order (Hashed by partition key)</option>
            <option value="global">Global Total Order (Requires single partition)</option>
            <option value="message_group">Message Group Order</option>
            <option value="unordered">Unordered Concurrent</option>
          </select>
        </div>

        {/* Partitions Count */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-[#858585] font-mono">Partition Count</label>
          <input
            type="number"
            min={1}
            max={256}
            value={partitions}
            onChange={(e) => setPartitions(parseInt(e.target.value, 10) || 1)}
            className="w-full bg-[#141414] text-xs text-[#FFFFFF] px-3 py-1.5 rounded-md border border-[#262626] focus:border-[#404040] focus:outline-none font-mono"
          />
        </div>

        {/* Partition Key */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-[#858585] font-mono">Partition Key Field</label>
          <input
            type="text"
            placeholder="e.g. orderId, customerId"
            value={partitionKey}
            onChange={(e) => setPartitionKey(e.target.value)}
            className="w-full bg-[#141414] text-xs text-[#FFFFFF] px-3 py-1.5 rounded-md border border-[#262626] focus:border-[#404040] focus:outline-none font-mono placeholder-[#666666]"
          />
        </div>

        {/* Retention Hours */}
        <div className="space-y-1.5 col-span-2">
          <label className="text-[11px] text-[#858585] font-mono">Retention Duration (Hours)</label>
          <input
            type="number"
            min={1}
            max={8760}
            value={retentionHours}
            onChange={(e) => setRetentionHours(parseInt(e.target.value, 10) || 24)}
            className="w-full bg-[#141414] text-xs text-[#FFFFFF] px-3 py-1.5 rounded-md border border-[#262626] focus:border-[#404040] focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Broker Capabilities Checklist */}
      {capabilities && (
        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#858585]">
            Underlying Broker Physical Capability Matrix
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              {capabilities.supportsPartitioning ? (
                <CheckIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
              ) : (
                <CloseIcon className="w-3.5 h-3.5 text-[#666666]" />
              )}
              <span>Partitioning Support</span>
            </div>
            <div className="flex items-center gap-1.5">
              {capabilities.supportsOrderingKey ? (
                <CheckIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
              ) : (
                <CloseIcon className="w-3.5 h-3.5 text-[#666666]" />
              )}
              <span>Ordering Key Routing</span>
            </div>
            <div className="flex items-center gap-1.5">
              {capabilities.supportsEventReplay ? (
                <CheckIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
              ) : (
                <CloseIcon className="w-3.5 h-3.5 text-[#666666]" />
              )}
              <span>Event Replay Retention</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleApply}
          className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#202020] border border-[#333333] hover:border-[#404040] rounded-md text-xs font-medium text-[#FFFFFF] transition-colors"
        >
          Apply Policy Changes
        </button>
      </div>
    </div>
  );
}
