/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Retry Amplification & Storm Analyzer
 */

import type {
  MessagingDestination,
  MessagingConsumer,
  MessagingProducer,
  MessagingFinding,
  RetryStormEvaluation,
} from "../contracts/messaging.types";

export class RetryAmplificationAnalyzer {
  /**
   * Deterministically calculates retry multiplier and downstream saturation.
   */
  public static evaluateRetryStorm(
    destination: MessagingDestination,
    consumer: MessagingConsumer,
    producerArrivalRps: number = 100,
    hypotheticalFailureRatePct: number = 25
  ): RetryStormEvaluation {
    const failureProb = Math.min(Math.max(hypotheticalFailureRatePct / 100, 0), 1);
    const maxAttempts = consumer.retryPolicy.maxAttempts;

    // Geometric series: 1 + p + p^2 + ... + p^maxAttempts
    let multiplier = 1;
    let currentPower = 1;
    for (let i = 1; i <= maxAttempts; i++) {
      currentPower *= failureProb;
      multiplier += currentPower;
    }

    const peakRps = producerArrivalRps * multiplier;
    // Consumer max capacity: workers * (1000 / avgProcessingTimeMs)
    const singleWorkerCapacity = consumer.avgProcessingTimeMs > 0 ? 1000 / consumer.avgProcessingTimeMs : 10;
    const totalConsumerCapacity = consumer.workerConcurrency * singleWorkerCapacity;
    const downstreamSaturationRatio = totalConsumerCapacity > 0 ? peakRps / totalConsumerCapacity : 2.0;

    const isStormRisk =
      downstreamSaturationRatio > 1.2 ||
      (maxAttempts >= 5 && consumer.retryPolicy.jitterPct === 0) ||
      (multiplier > 2.0 && consumer.retryPolicy.backoffStrategy === "constant");

    const explanation = isStormRisk
      ? `Under a ${hypotheticalFailureRatePct}% transient failure rate, retries amplify load by ${multiplier.toFixed(2)}x (from ${producerArrivalRps} RPS to ${peakRps.toFixed(1)} peak RPS), resulting in a downstream saturation ratio of ${downstreamSaturationRatio.toFixed(2)}x capacity.`
      : `Retry policy with ${consumer.retryPolicy.backoffStrategy} backoff and ${consumer.retryPolicy.jitterPct}% jitter absorbs transient failures safely with an amplification factor of ${multiplier.toFixed(2)}x.`;

    return {
      destinationId: destination.id,
      producerArrivalRps,
      consumerFailureRatePct: hypotheticalFailureRatePct,
      maxRetryAttempts: maxAttempts,
      estimatedRetryMultiplier: Number(multiplier.toFixed(2)),
      peakRpsUnderFailure: Number(peakRps.toFixed(1)),
      downstreamSaturationRatio: Number(downstreamSaturationRatio.toFixed(2)),
      isStormRisk,
      explanation,
    };
  }

  public static analyze(
    destinations: MessagingDestination[],
    consumers: MessagingConsumer[],
    producers: MessagingProducer[]
  ): { findings: MessagingFinding[]; evaluations: RetryStormEvaluation[] } {
    const findings: MessagingFinding[] = [];
    const evaluations: RetryStormEvaluation[] = [];

    const destProducerMap = new Map<string, number>();
    for (const p of producers) {
      const current = destProducerMap.get(p.destinationId) || 0;
      destProducerMap.set(p.destinationId, current + (p.publicationRateRps || 50));
    }

    for (const consumer of consumers) {
      const dest = destinations.find((d) => d.id === consumer.destinationId);
      if (!dest) continue;

      const arrivalRps = destProducerMap.get(dest.id) || 100;
      const evaluation = this.evaluateRetryStorm(dest, consumer, arrivalRps, 30);
      evaluations.push(evaluation);

      // Rule 1: High retry amplification storm
      if (evaluation.isStormRisk && evaluation.downstreamSaturationRatio > 1.3) {
        findings.push({
          id: `finding-retry-storm-${consumer.id}`,
          category: "retry_amplification_storm",
          severity: evaluation.downstreamSaturationRatio > 2.0 ? "critical" : "high",
          affectedConsumerId: consumer.id,
          affectedDestinationId: dest.id,
          title: `Retry Amplification Storm on ${consumer.serviceId}`,
          explanation: `When consumer "${consumer.serviceId}" experiences transient errors, configured retries amplify arrival traffic by ${evaluation.estimatedRetryMultiplier}x (peak ${evaluation.peakRpsUnderFailure} RPS), saturating processing capacity by ${(evaluation.downstreamSaturationRatio * 100).toFixed(0)}%.`,
          evidence: [
            `Consumer Concurrency: ${consumer.workerConcurrency} workers`,
            `Avg Processing Time: ${consumer.avgProcessingTimeMs}ms`,
            `Max Attempts: ${consumer.retryPolicy.maxAttempts}`,
            `Backoff Strategy: ${consumer.retryPolicy.backoffStrategy}`,
            `Jitter: ${consumer.retryPolicy.jitterPct}%`,
            `Formula: 1 + sum(p^k)`,
          ],
          riskAnalysis: `Synchronized retries create thundering herd waves, cascading failure to upstream databases or downstream dependencies and causing systemic cascade failure.`,
          remediation: `Implement exponential backoff with full randomized jitter (>= 30%), cap maximum attempts to <= 3, and route persistent failures to a Dead-Letter Queue.`,
          deterministicCalculation: {
            metricName: "Downstream Saturation Ratio",
            value: evaluation.downstreamSaturationRatio,
            threshold: 1.2,
            formula: "Peak RPS / Consumer Processing Capacity RPS",
          },
        });
      }

      // Rule 2: Constant backoff without jitter
      if (consumer.retryPolicy.backoffStrategy === "constant" && consumer.retryPolicy.jitterPct === 0) {
        findings.push({
          id: `finding-constant-backoff-${consumer.id}`,
          category: "retry_amplification_storm",
          severity: "medium",
          affectedConsumerId: consumer.id,
          affectedDestinationId: dest.id,
          title: `Synchronized Constant Backoff Thundering Herd on ${consumer.serviceId}`,
          explanation: `Consumer "${consumer.serviceId}" uses constant backoff with 0% jitter. In an outage, all failed messages will retry at the exact same millisecond interval.`,
          evidence: [
            `Backoff: constant`,
            `Jitter: 0%`,
            `Initial Delay: ${consumer.retryPolicy.initialDelayMs}ms`,
          ],
          riskAnalysis: `Causes synchronized thundering-herd waves hitting downstream APIs simultaneously as soon as the backoff window elapses.`,
          remediation: `Switch backoff strategy to 'exponential_jitter' with randomized variance between 25% and 50%.`,
        });
      }
    }

    return { findings, evaluations };
  }
}
