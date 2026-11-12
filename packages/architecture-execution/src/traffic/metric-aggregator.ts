import type {
  PerformanceSample,
  PerformanceSummary,
  BottleneckEvidence,
  ServiceInstance,
  ModeledTrafficQueue,
} from "./traffic-schemas";
import type { BaseNode } from "@nxtqr/graph-schema";

export interface CompletedRequestRecord {
  requestId: string;
  arrivalAtMs: number;
  completedAtMs: number;
  latencyMs: number;
  status: "success" | "error" | "rejected";
  terminalNodeId: string;
  queueWaitMs: number;
}

export class MetricAggregator {
  /**
   * Calculates percentile value using nearest-rank method on sorted numbers.
   */
  public static calculatePercentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    if (p <= 0) return sortedValues[0];
    if (p >= 100) return sortedValues[sortedValues.length - 1];

    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
  }

  /**
   * Computes a performance metric sample for a specific virtual-time window.
   */
  public static computeWindowSample(
    windowStartMs: number,
    windowEndMs: number,
    arrivalsCount: number,
    completedRecords: CompletedRequestRecord[],
    activeInFlight: number,
    instancesMap: Record<string, ServiceInstance[]>,
    queuesMap: Record<string, ModeledTrafficQueue>
  ): PerformanceSample {
    const windowSec = Math.max(0.001, (windowEndMs - windowStartMs) / 1000);
    const windowRecords = completedRecords.filter(
      (r) => r.completedAtMs >= windowStartMs && r.completedAtMs < windowEndMs
    );

    const successfulRecords = windowRecords.filter((r) => r.status === "success");
    const failedRecords = windowRecords.filter((r) => r.status === "error" || r.status === "rejected");

    const incomingRps = Math.round(arrivalsCount / windowSec);
    const completedRps = Math.round(windowRecords.length / windowSec);
    const successfulRps = Math.round(successfulRecords.length / windowSec);
    const failedRps = Math.round(failedRecords.length / windowSec);

    const latencies = windowRecords.map((r) => r.latencyMs).sort((a, b) => a - b);
    const sumLatency = latencies.reduce((acc, l) => acc + l, 0);

    const p50 = this.calculatePercentile(latencies, 50);
    const p90 = this.calculatePercentile(latencies, 90);
    const p95 = this.calculatePercentile(latencies, 95);
    const p99 = this.calculatePercentile(latencies, 99);
    const maxLat = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
    const meanLat = latencies.length > 0 ? Math.round(sumLatency / latencies.length) : 0;

    let totalQueueDepth = 0;
    const componentQueueDepths: Record<string, number> = {};
    for (const [nodeId, q] of Object.entries(queuesMap)) {
      totalQueueDepth += q.waitingCount;
      componentQueueDepths[nodeId] = q.waitingCount;
    }

    const componentUtilizations: Record<string, number> = {};
    const componentInstanceCounts: Record<string, number> = {};

    for (const [nodeId, instList] of Object.entries(instancesMap)) {
      componentInstanceCounts[nodeId] = instList.filter((i) => i.status === "healthy").length;
      const totalWorkers = instList.reduce((sum, i) => sum + i.workerCount, 0);
      const busyWorkers = instList.reduce((sum, i) => sum + i.busyWorkers, 0);
      componentUtilizations[nodeId] =
        totalWorkers > 0 ? Math.round((busyWorkers / totalWorkers) * 100) : 0;
    }

    return {
      atMs: windowEndMs,
      incomingRps,
      completedRps,
      successfulRps,
      failedRps,
      activeInFlight,
      p50LatencyMs: p50,
      p90LatencyMs: p90,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      maxLatencyMs: maxLat,
      meanLatencyMs: meanLat,
      totalQueueDepth,
      componentUtilizations,
      componentQueueDepths,
      componentInstanceCounts,
    };
  }

  /**
   * Generates overall performance summary, bottleneck evidence, and aggregates across full simulation.
   */
  public static computeSummary(
    totalRequests: number,
    completedRecords: CompletedRequestRecord[],
    timedOutCount: number,
    rejectedCount: number,
    samples: PerformanceSample[],
    nodes: BaseNode[],
    instancesMap: Record<string, ServiceInstance[]>,
    queuesMap: Record<string, ModeledTrafficQueue>,
    scalingEventsCount: number
  ): PerformanceSummary {
    const nodeMap = new Map<string, BaseNode>(nodes.map((n) => [n.id, n]));
    const successfulCount = completedRecords.filter((r) => r.status === "success").length;
    const failedCount = completedRecords.filter((r) => r.status === "error" || r.status === "rejected").length;

    const allLatencies = completedRecords.map((r) => r.latencyMs).sort((a, b) => a - b);
    const sumLatency = allLatencies.reduce((acc, l) => acc + l, 0);

    const p50 = this.calculatePercentile(allLatencies, 50);
    const p90 = this.calculatePercentile(allLatencies, 90);
    const p95 = this.calculatePercentile(allLatencies, 95);
    const p99 = this.calculatePercentile(allLatencies, 99);
    const maxLat = allLatencies.length > 0 ? allLatencies[allLatencies.length - 1] : 0;
    const meanLat = allLatencies.length > 0 ? Math.round(sumLatency / allLatencies.length) : 0;

    let peakThroughputRps = 0;
    let sumThroughput = 0;
    let peakQueueDepth = 0;
    let sumUtilization = 0;

    for (const sample of samples) {
      if (sample.completedRps > peakThroughputRps) peakThroughputRps = sample.completedRps;
      sumThroughput += sample.completedRps;
      if (sample.totalQueueDepth > peakQueueDepth) peakQueueDepth = sample.totalQueueDepth;

      const utils = Object.values(sample.componentUtilizations);
      if (utils.length > 0) {
        sumUtilization += utils.reduce((a, b) => a + b, 0) / utils.length;
      }
    }

    const avgThroughputRps = samples.length > 0 ? Math.round(sumThroughput / samples.length) : 0;
    const avgUtilizationPercent = samples.length > 0 ? Math.round(sumUtilization / samples.length) : 0;

    // Detect bottlenecks with empirical evidence
    const bottlenecks: BottleneckEvidence[] = [];

    for (const [nodeId, q] of Object.entries(queuesMap)) {
      const node = nodeMap.get(nodeId);
      const instList = instancesMap[nodeId] || [];
      const totalWorkers = instList.reduce((sum, i) => sum + i.workerCount, 0);
      const busyWorkers = instList.reduce((sum, i) => sum + i.busyWorkers, 0);
      const utilizationPercent =
        totalWorkers > 0 ? Math.round((busyWorkers / totalWorkers) * 100) : 0;

      const nodeRecords = completedRecords.filter((r) => r.terminalNodeId === nodeId);
      const avgWaitMs =
        nodeRecords.length > 0
          ? Math.round(nodeRecords.reduce((sum, r) => sum + r.queueWaitMs, 0) / nodeRecords.length)
          : 0;

      if (q.rejectedCount > 0 || utilizationPercent >= 90 || q.waitingCount >= q.capacity * 0.8) {
        bottlenecks.push({
          nodeId,
          nodeLabel: node?.label || nodeId,
          severity: "critical",
          reason:
            q.rejectedCount > 0
              ? `Queue capacity overflow: ${q.rejectedCount} request(s) rejected on ${node?.label || nodeId}.`
              : `Worker saturation: ${utilizationPercent}% sustained worker occupancy with ${q.waitingCount} waiting requests.`,
          utilizationPercent,
          queueDepth: q.waitingCount,
          rejectionCount: q.rejectedCount,
          waitingTimeMs: avgWaitMs,
        });
      } else if (utilizationPercent >= 75 || q.waitingCount > 5) {
        bottlenecks.push({
          nodeId,
          nodeLabel: node?.label || nodeId,
          severity: "warning",
          reason: `High load: ${utilizationPercent}% worker utilization with queue depth ${q.waitingCount}.`,
          utilizationPercent,
          queueDepth: q.waitingCount,
          rejectionCount: q.rejectedCount,
          waitingTimeMs: avgWaitMs,
        });
      }
    }

    return {
      totalRequests,
      completedRequests: completedRecords.length,
      successfulRequests: successfulCount,
      failedRequests: failedCount,
      timedOutRequests: timedOutCount,
      rejectedRequests: rejectedCount,
      overallP50LatencyMs: p50,
      overallP90LatencyMs: p90,
      overallP95LatencyMs: p95,
      overallP99LatencyMs: p99,
      maxLatencyMs: maxLat,
      meanLatencyMs: meanLat,
      averageThroughputRps: avgThroughputRps,
      peakThroughputRps: peakThroughputRps,
      peakQueueDepth,
      averageUtilizationPercent: avgUtilizationPercent,
      bottlenecks,
      scalingEventsCount,
    };
  }
}
