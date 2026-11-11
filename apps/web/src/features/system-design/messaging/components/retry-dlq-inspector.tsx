"use client";

/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Retry Amplification Storm & Dead-Letter Queue Inspector
 */

import React, { useState, useMemo } from "react";
import type {
  MessagingDestination,
  MessagingConsumer,
  RetryStormEvaluation,
} from "@nxtqr/architecture-intelligence";
import { RetryAmplificationAnalyzer } from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon, ActivityIcon, ShieldIcon } from "@nxtqr/icons";

export interface RetryDlqInspectorProps {
  destination: MessagingDestination;
  consumers: MessagingConsumer[];
  evaluations: RetryStormEvaluation[];
}

export function RetryDlqInspector({
  destination,
  consumers,
  evaluations: _evaluations,
}: RetryDlqInspectorProps) {
  const [hypotheticalFailurePct, setHypotheticalFailurePct] = useState<number>(25);

  const consumer = consumers.find((c) => c.destinationId === destination.id) || consumers[0];

  // Dynamically recompute retry storm curve if user tweaks failure rate slider
  const liveEvaluation = useMemo(() => {
    if (!consumer) return null;
    return RetryAmplificationAnalyzer.evaluateRetryStorm(
      destination,
      consumer,
      100, // modeled base arrival RPS
      hypotheticalFailurePct
    );
  }, [destination, consumer, hypotheticalFailurePct]);

  return (
    <div className="p-4 space-y-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#FFFFFF]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase font-mono tracking-wider text-[#FFFFFF]">
          <ActivityIcon className="w-3.5 h-3.5 text-[#858585]" />
          Retry Amplification & Cascading Storm Simulator
        </div>
        {liveEvaluation?.isStormRisk ? (
          <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1A1A1A] border border-[#404040] text-[#FFFFFF]">
            <AlertTriangleIcon className="w-3 h-3 text-[#B5B5B5]" />
            Amplification Storm Risk Detected
          </span>
        ) : (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#B5B5B5]">
            Jitter Protected
          </span>
        )}
      </div>

      {/* Failure Rate Slider */}
      <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#858585]">
          <span>Hypothetical Downstream Transient Failure Rate:</span>
          <span className="text-[#FFFFFF] font-semibold">{hypotheticalFailurePct}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={90}
          value={hypotheticalFailurePct}
          onChange={(e) => setHypotheticalFailurePct(parseInt(e.target.value, 10))}
          className="w-full accent-[#FFFFFF] cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-[#666666] font-mono">
          <span>1% (Nominal)</span>
          <span>25% (Spike)</span>
          <span>50% (Severe)</span>
          <span>90% (Outage)</span>
        </div>
      </div>

      {/* Evaluation Metrics */}
      {liveEvaluation && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Retry Multiplier</div>
            <div className="text-xl font-bold font-mono text-[#FFFFFF] mt-1">
              {liveEvaluation.estimatedRetryMultiplier}x
            </div>
            <div className="text-[10px] text-[#666666] mt-0.5 font-mono">
              Geometric: 1 + Σ(p_fail)^k
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Peak Traffic Under Failure</div>
            <div className="text-xl font-bold font-mono text-[#FFFFFF] mt-1">
              {liveEvaluation.peakRpsUnderFailure} <span className="text-xs text-[#858585]">RPS</span>
            </div>
            <div className="text-[10px] text-[#666666] mt-0.5 font-mono">
              Amplified from {liveEvaluation.producerArrivalRps} RPS
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Saturation Ratio</div>
            <div
              className={`text-xl font-bold font-mono mt-1 ${
                liveEvaluation.downstreamSaturationRatio > 1.2 ? "text-[#FFFFFF]" : "text-[#B5B5B5]"
              }`}
            >
              {liveEvaluation.downstreamSaturationRatio}x
            </div>
            <div className="text-[10px] text-[#666666] mt-0.5 font-mono">
              {liveEvaluation.downstreamSaturationRatio > 1.0 ? "Exceeds Capacity" : "Within Capacity"}
            </div>
          </div>
        </div>
      )}

      {/* Explanation Banner */}
      {liveEvaluation && (
        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] text-xs text-[#B5B5B5] leading-relaxed">
          {liveEvaluation.explanation}
        </div>
      )}

      {/* Active Retry Policy for Consumer */}
      {consumer && (
        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#858585]">
            Active Consumer Policy Configuration ({consumer.serviceId})
          </div>
          <div className="grid grid-cols-4 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-[#858585]">Strategy:</span>{" "}
              <span className="text-[#FFFFFF]">{consumer.retryPolicy.backoffStrategy}</span>
            </div>
            <div>
              <span className="text-[#858585]">Max Retries:</span>{" "}
              <span className="text-[#FFFFFF]">{consumer.retryPolicy.maxAttempts}</span>
            </div>
            <div>
              <span className="text-[#858585]">Initial Delay:</span>{" "}
              <span className="text-[#FFFFFF]">{consumer.retryPolicy.initialDelayMs}ms</span>
            </div>
            <div>
              <span className="text-[#858585]">Jitter:</span>{" "}
              <span className="text-[#FFFFFF]">{consumer.retryPolicy.jitterPct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Dead-Letter Queue Routing Details */}
      <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-[#858585]">
          <ShieldIcon className="w-3 h-3 text-[#858585]" />
          Dead-Letter Queue Safeguard
        </div>
        <div className="text-xs text-[#858585]">
          {destination.deadLetterDestinationId ? (
            <span>
              Poison messages failing {destination.maxDeliveryAttemptsBeforeDeadLetter ?? 3} times are
              safely diverted to <strong className="text-[#FFFFFF] font-mono">{destination.deadLetterDestinationId}</strong>,
              preventing head-of-line blocking.
            </span>
          ) : (
            <span className="text-[#FFFFFF]">
              Warning: No dead-letter destination configured. Poison messages will continuously fail,
              exhausting worker compute and causing unbounded consumer lag.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
