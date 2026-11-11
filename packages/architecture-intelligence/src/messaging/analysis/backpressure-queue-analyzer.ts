/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Backpressure & Queue Backlog Growth Analyzer
 */

import type {
  MessagingDestination,
  MessagingConsumer,
  MessagingProducer,
  ConsumerGroup,
  MessagingFinding,
  QueueBacklogProjection,
} from "../contracts/messaging.types";

export class BackpressureQueueAnalyzer {
  public static projectQueueBacklog(
    destination: MessagingDestination,
    producers: MessagingProducer[],
    consumers: MessagingConsumer[]
  ): QueueBacklogProjection {
    const destProducers = producers.filter((p) => p.destinationId === destination.id);
    const destConsumers = consumers.filter((c) => c.destinationId === destination.id);

    const arrivalRateRps = destProducers.reduce(
      (sum, p) => sum + (p.publicationRateRps !== undefined ? p.publicationRateRps : 50),
      0
    );

    let effectiveProcessingRateRps = 0;
    for (const c of destConsumers) {
      const singleWorkerRate = c.avgProcessingTimeMs > 0 ? 1000 / c.avgProcessingTimeMs : 10;
      effectiveProcessingRateRps += c.workerConcurrency * singleWorkerRate;
    }

    const netBacklogChangePerSecond = arrivalRateRps - effectiveProcessingRateRps;
    const isUnboundedGrowth = netBacklogChangePerSecond > 0;

    let explanation: string;
    if (isUnboundedGrowth) {
      explanation = `Arrival rate (${arrivalRateRps.toFixed(1)} RPS) exceeds total consumer processing capacity (${effectiveProcessingRateRps.toFixed(1)} RPS). Backlog accumulates at +${netBacklogChangePerSecond.toFixed(1)} msgs/sec.`;
    } else {
      const margin = (effectiveProcessingRateRps - arrivalRateRps).toFixed(1);
      explanation = `Consumer capacity (${effectiveProcessingRateRps.toFixed(1)} RPS) adequately covers arrival demand (${arrivalRateRps.toFixed(1)} RPS) with a safety margin of +${margin} RPS.`;
    }

    return {
      destinationId: destination.id,
      arrivalRateRps: Number(arrivalRateRps.toFixed(1)),
      effectiveProcessingRateRps: Number(effectiveProcessingRateRps.toFixed(1)),
      netBacklogChangePerSecond: Number(netBacklogChangePerSecond.toFixed(1)),
      isUnboundedGrowth,
      explanation,
    };
  }

  public static analyze(
    destinations: MessagingDestination[],
    consumers: MessagingConsumer[],
    producers: MessagingProducer[],
    consumerGroups: ConsumerGroup[]
  ): { findings: MessagingFinding[]; projections: QueueBacklogProjection[] } {
    const findings: MessagingFinding[] = [];
    const projections: QueueBacklogProjection[] = [];

    for (const dest of destinations) {
      const projection = this.projectQueueBacklog(dest, producers, consumers);
      projections.push(projection);

      if (projection.isUnboundedGrowth) {
        findings.push({
          id: `finding-unbounded-queue-growth-${dest.id}`,
          category: "unbounded_queue_growth",
          severity: "critical",
          affectedDestinationId: dest.id,
          title: `Unbounded Queue Growth Backpressure on ${dest.name}`,
          explanation: projection.explanation,
          evidence: [
            `Destination: ${dest.name} (${dest.type})`,
            `Total Arrival Rate: ${projection.arrivalRateRps} RPS`,
            `Consumer Processing Capacity: ${projection.effectiveProcessingRateRps} RPS`,
            `Net Accumulation: +${projection.netBacklogChangePerSecond} msgs/sec`,
          ],
          riskAnalysis: `Unless scaled, the message queue backlog will continuously grow until memory or retention bounds are exhausted, resulting in message loss, massive consumer latency, or broker eviction.`,
          remediation: `Increase consumer worker concurrency, optimize consumer processing latency (currently bottlenecks queue draining), or introduce horizontal autoscaling based on queue depth / lag.`,
          deterministicCalculation: {
            metricName: "Net Backlog Change",
            value: projection.netBacklogChangePerSecond,
            threshold: 0,
            formula: "Arrival RPS - Effective Consumer Capacity RPS",
          },
        });
      }
    }

    // Evaluate Consumer Group Lag Spikes
    for (const group of consumerGroups) {
      if (group.lagMetrics && group.lagMetrics.messageCountLag > 10000) {
        findings.push({
          id: `finding-consumer-lag-spike-${group.id}`,
          category: "consumer_lag_spike",
          severity: "high",
          affectedDestinationId: group.destinationId,
          title: `High Consumer Lag Spike on Group ${group.groupId}`,
          explanation: `Consumer group "${group.groupId}" has an accumulated lag of ${group.lagMetrics.messageCountLag.toLocaleString()} unconsumed messages (oldest message age: ${group.lagMetrics.oldestMessageAgeSeconds}s).`,
          evidence: [
            `Consumer Group: ${group.groupId}`,
            `Message Lag: ${group.lagMetrics.messageCountLag}`,
            `Time Lag: ${group.lagMetrics.timeLagSeconds}s`,
            `Oldest Message: ${group.lagMetrics.oldestMessageAgeSeconds}s`,
          ],
          riskAnalysis: `Stale message queues breach Service Level Agreements (SLAs), delay user-facing workflows, and risk message expiry before processing.`,
          remediation: `Scale active worker instances up to the maximum partition count or optimize batch fetch sizes.`,
        });
      }
    }

    return { findings, projections };
  }
}

