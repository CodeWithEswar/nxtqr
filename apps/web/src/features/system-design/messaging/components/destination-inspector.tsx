"use client";

/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Destination Inspector (Center / Details Pane)
 */

import React from "react";
import type {
  MessagingDestination,
  MessagingProducer,
  MessagingConsumer,
  QueueBacklogProjection,
  RetryStormEvaluation,
} from "@nxtqr/architecture-intelligence";
import { CpuIcon, ShieldIcon, ActivityIcon } from "@nxtqr/icons";

export interface DestinationInspectorProps {
  destination: MessagingDestination;
  producers: MessagingProducer[];
  consumers: MessagingConsumer[];
  backlogProjection?: QueueBacklogProjection;
  stormEvaluation?: RetryStormEvaluation;
  onUpdateDestination?: (updated: MessagingDestination) => void;
}

export function DestinationInspector({
  destination,
  producers,
  consumers,
  backlogProjection,
  stormEvaluation: _stormEvaluation,
  onUpdateDestination: _onUpdateDestination,
}: DestinationInspectorProps) {
  const connectedProducers = producers.filter((p) => p.destinationId === destination.id);
  const connectedConsumers = consumers.filter((c) => c.destinationId === destination.id);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#000000] text-[#FFFFFF]">
      {/* Header Card */}
      <div className="p-4 rounded-md border border-[#262626] bg-[#080808] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CpuIcon className="w-4 h-4 text-[#858585]" />
            <h1 className="text-sm font-semibold text-[#FFFFFF] font-mono tracking-tight">
              {destination.name}
            </h1>
          </div>
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#B5B5B5]">
            {destination.type}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2 text-xs">
          <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] text-[#858585] uppercase font-mono">Delivery Semantics</div>
            <div className="font-mono text-[#FFFFFF] mt-0.5">
              {destination.deliverySemantics.replace("_", " ")}
            </div>
          </div>
          <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] text-[#858585] uppercase font-mono">Ordering Scope</div>
            <div className="font-mono text-[#FFFFFF] mt-0.5">{destination.orderingScope}</div>
          </div>
          <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] text-[#858585] uppercase font-mono">Partitions</div>
            <div className="font-mono text-[#FFFFFF] mt-0.5">
              {destination.partitioning?.partitionCount ?? 1}
            </div>
          </div>
          <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] text-[#858585] uppercase font-mono">Retention</div>
            <div className="font-mono text-[#FFFFFF] mt-0.5">
              {destination.retention.retentionHours}h ({destination.retention.cleanupPolicy})
            </div>
          </div>
        </div>
      </div>

      {/* Backlog & Throughput Projection */}
      {backlogProjection && (
        <div className="p-4 rounded-md border border-[#262626] bg-[#080808] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase font-mono tracking-wider text-[#FFFFFF]">
              <ActivityIcon className="w-3.5 h-3.5 text-[#858585]" />
              Throughput & Backlog Dynamic Rate
            </div>
            {backlogProjection.isUnboundedGrowth ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1A1A1A] border border-[#404040] text-[#FFFFFF]">
                Accumulating Backlog
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#B5B5B5]">
                Stable Equilibrium
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
              <div className="text-[10px] text-[#858585] uppercase font-mono">Producer Arrival Rate</div>
              <div className="text-base font-semibold font-mono text-[#FFFFFF] mt-1">
                {backlogProjection.arrivalRateRps} <span className="text-[10px] text-[#858585]">RPS</span>
              </div>
            </div>
            <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
              <div className="text-[10px] text-[#858585] uppercase font-mono">Effective Processing Capacity</div>
              <div className="text-base font-semibold font-mono text-[#FFFFFF] mt-1">
                {backlogProjection.effectiveProcessingRateRps} <span className="text-[10px] text-[#858585]">RPS</span>
              </div>
            </div>
            <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
              <div className="text-[10px] text-[#858585] uppercase font-mono">Net Backlog Accumulation</div>
              <div
                className={`text-base font-semibold font-mono mt-1 ${
                  backlogProjection.netBacklogChangePerSecond > 0 ? "text-[#FFFFFF]" : "text-[#B5B5B5]"
                }`}
              >
                {backlogProjection.netBacklogChangePerSecond > 0
                  ? `+${backlogProjection.netBacklogChangePerSecond}`
                  : backlogProjection.netBacklogChangePerSecond}{" "}
                <span className="text-[10px] text-[#858585]">msg/s</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-[#858585] leading-relaxed">{backlogProjection.explanation}</p>
        </div>
      )}

      {/* Dead-Letter Queue Configuration */}
      <div className="p-4 rounded-md border border-[#262626] bg-[#080808] space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase font-mono tracking-wider text-[#FFFFFF]">
          <ShieldIcon className="w-3.5 h-3.5 text-[#858585]" />
          Dead-Letter Queue Routing (DLQ)
        </div>
        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#858585]">Dead Letter Destination:</span>
            <span className="font-mono text-[#FFFFFF]">
              {destination.deadLetterDestinationId || "None configured (Poison message hazard)"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#858585]">Max Delivery Attempts Before DLQ:</span>
            <span className="font-mono text-[#FFFFFF]">
              {destination.maxDeliveryAttemptsBeforeDeadLetter ?? "Unlimited"}
            </span>
          </div>
        </div>
      </div>

      {/* Connected Services (Producers & Consumers) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Producers */}
        <div className="p-3 rounded-md border border-[#262626] bg-[#080808] space-y-2">
          <div className="text-xs font-semibold uppercase font-mono tracking-wider text-[#FFFFFF]">
            Producers ({connectedProducers.length})
          </div>
          {connectedProducers.length === 0 ? (
            <div className="text-xs text-[#666666] py-3 text-center">No registered producers</div>
          ) : (
            <div className="space-y-1.5">
              {connectedProducers.map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded-md bg-[#0D0D0D] border border-[#202020] text-xs space-y-1"
                >
                  <div className="font-medium text-[#FFFFFF]">{p.serviceId}</div>
                  <div className="text-[11px] text-[#858585] font-mono flex items-center justify-between">
                    <span>Rate: {p.publicationRateRps ?? 50} RPS</span>
                    <span>Outbox: {p.usesTransactionalOutbox ? "Configured" : "None"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consumers */}
        <div className="p-3 rounded-md border border-[#262626] bg-[#080808] space-y-2">
          <div className="text-xs font-semibold uppercase font-mono tracking-wider text-[#FFFFFF]">
            Consumers ({connectedConsumers.length})
          </div>
          {connectedConsumers.length === 0 ? (
            <div className="text-xs text-[#666666] py-3 text-center">No registered consumers</div>
          ) : (
            <div className="space-y-1.5">
              {connectedConsumers.map((c) => (
                <div
                  key={c.id}
                  className="p-2 rounded-md bg-[#0D0D0D] border border-[#202020] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#FFFFFF]">{c.serviceId}</span>
                    <span className="text-[10px] font-mono text-[#858585]">
                      ack: {c.ackMode}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#858585] font-mono flex items-center justify-between">
                    <span>Concurrency: {c.workerConcurrency}</span>
                    <span>Idempotency: {c.idempotency.deduplicationStore}</span>
                  </div>
                  {c.hasSideEffects && (
                    <div className="text-[10px] text-[#B5B5B5] font-mono">
                      Side effects: {c.sideEffectTypes?.join(", ") || "External mutations"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
