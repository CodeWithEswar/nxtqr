/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Cache Capacity & Working Set Saturation Analyzer
 */

import type {
  DistributedStateTopology,
  CacheCapacityEvaluation,
  CacheStateFinding,
} from "../contracts/cache-state.types";

export interface CapacityAnalysisResult {
  evaluations: CacheCapacityEvaluation[];
  findings: CacheStateFinding[];
}

export class CapacityAnalyzer {
  public static analyze(topology: DistributedStateTopology): CapacityAnalysisResult {
    const evaluations: CacheCapacityEvaluation[] = [];
    const findings: CacheStateFinding[] = [];

    for (const layer of topology.cacheLayers) {
      let totalWorkingSetBytes = 0;
      for (const ks of layer.keySpaces) {
        totalWorkingSetBytes += ks.estimatedKeyCount * ks.estimatedEntrySizeBytes;
      }

      // Convert to MB with 15% indexing/key overhead
      const projectedWorkingSetMb = Number(
        ((totalWorkingSetBytes * 1.15) / (1024 * 1024)).toFixed(1)
      );
      const allocatedMemoryMb = layer.allocatedMemoryMb > 0 ? layer.allocatedMemoryMb : 512;
      const saturationRatio = Number((projectedWorkingSetMb / allocatedMemoryMb).toFixed(2));
      const isCapacityExhausted = saturationRatio >= 1.0;

      let evictionRisk: "none" | "moderate" | "severe_thrashing" = "none";
      if (saturationRatio > 1.0) {
        evictionRisk = "severe_thrashing";
      } else if (saturationRatio > 0.8) {
        evictionRisk = "moderate";
      }

      // 1. Out of Memory Crash Hazard (no_eviction with saturation >= 1.0)
      if (isCapacityExhausted && layer.evictionPolicy === "no_eviction") {
        findings.push({
          id: `finding-oom-no-eviction-${layer.id}`,
          category: "unshielded_backend_overload",
          severity: "critical",
          affectedCacheLayerId: layer.id,
          title: `Fatal Out-Of-Memory Crash Risk on "${layer.name}" (no_eviction)`,
          explanation: `Projected working set (${projectedWorkingSetMb} MB) exceeds allocated memory (${allocatedMemoryMb} MB) on cache layer "${layer.name}", which is configured with eviction policy 'no_eviction'. In Redis/Valkey, when memory is exhausted under 'no_eviction', all write commands are rejected with OOM errors.`,
          evidence: [
            `Layer: ${layer.name} (${layer.technology})`,
            `Allocated Memory: ${allocatedMemoryMb} MB`,
            `Projected Working Set: ${projectedWorkingSetMb} MB`,
            `Saturation Ratio: ${saturationRatio}x`,
            `Eviction Policy: no_eviction`,
          ],
          riskAnalysis:
            "Complete write outage for services relying on session storage or cache writes, triggering cascading application crashes.",
          remediation:
            "Change eviction policy to 'allkeys-lru' or 'volatile-lru', or scale memory capacity above projected working set.",
          deterministicCalculation: {
            metricName: "Working Set Saturation Ratio",
            value: saturationRatio,
            threshold: 1.0,
            formula: "Projected Working Set MB / Allocated Memory MB",
          },
        });
      } else if (evictionRisk === "severe_thrashing") {
        findings.push({
          id: `finding-eviction-thrashing-${layer.id}`,
          category: "unshielded_backend_overload",
          severity: "high",
          affectedCacheLayerId: layer.id,
          title: `Severe Eviction Thrashing on "${layer.name}" (${saturationRatio}x Saturation)`,
          explanation: `Working set (${projectedWorkingSetMb} MB) exceeds allocated memory (${allocatedMemoryMb} MB). Active keys will be aggressively evicted shortly after insertion, causing continuous miss thrashing and degrading backend database performance.`,
          evidence: [
            `Allocated: ${allocatedMemoryMb} MB`,
            `Working Set: ${projectedWorkingSetMb} MB`,
            `Saturation: ${saturationRatio}x`,
            `Eviction Policy: ${layer.evictionPolicy}`,
          ],
          riskAnalysis:
            "Severe cache hit ratio drop, elevated database load, and increased p99 tail latencies.",
          remediation:
            "Scale cache instance memory or partition key spaces across dedicated cache clusters.",
        });
      }

      evaluations.push({
        layerId: layer.id,
        allocatedMemoryMb,
        projectedWorkingSetMb,
        isCapacityExhausted,
        saturationRatio,
        evictionRisk,
        explanation: isCapacityExhausted
          ? `Working set (${projectedWorkingSetMb} MB) exceeds allocated memory (${allocatedMemoryMb} MB) by ${(
              (saturationRatio - 1) *
              100
            ).toFixed(0)}%.`
          : `Working set (${projectedWorkingSetMb} MB) occupies ${(saturationRatio * 100).toFixed(
              0
            )}% of allocated ${allocatedMemoryMb} MB memory.`,
      });
    }

    return { evaluations, findings };
  }
}

