/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Master Engine Facade
 */

import type {
  DistributedStateTopology,
  CacheStateFinding,
  CacheStampedeEvaluation,
  StaleReadEvaluation,
  CacheCapacityEvaluation,
  MultiLayerCachePathTrace,
  CacheProviderCapabilities,
  CacheFindingSeverity,
} from "../contracts/cache-state.types";
import { DistributedStateTopologySchema } from "../schemas/cache-state.schemas";
import { CacheCapabilityRegistry } from "../providers/cache-capability-registry";
import { InvalidationAnalyzer } from "../analysis/invalidation-analyzer";
import { StampedeAnalyzer } from "../analysis/stampede-analyzer";
import { CapacityAnalyzer } from "../analysis/capacity-analyzer";
import { StaleReadAnalyzer } from "../analysis/stale-read-analyzer";
import { ReplicationConsistencyAnalyzer } from "../analysis/replication-consistency-analyzer";
import { StateCorrectnessAnalyzer } from "../analysis/state-correctness-analyzer";
import { LockSafetyAnalyzer } from "../analysis/lock-safety-analyzer";
import { CachePathTracer } from "../topology/cache-paths";

export interface CacheStateSummary {
  cacheLayerCount: number;
  sourceOfTruthCount: number;
  invalidationRuleCount: number;
  replicaGroupCount: number;
  stateOwnerCount: number;
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  stampedeRiskCount: number;
  staleReadRiskCount: number;
  capacityExhaustedCount: number;
  unfencedLockCount: number;
  netOffloadPercentage: number;
}

export interface CacheStateAnalysisOutput {
  topology: DistributedStateTopology;
  summary: CacheStateSummary;
  findings: CacheStateFinding[];
  capabilities: Record<string, CacheProviderCapabilities>;
  stampedeEvaluations: CacheStampedeEvaluation[];
  capacityEvaluations: CacheCapacityEvaluation[];
  staleReadEvaluations: StaleReadEvaluation[];
  cachePathTraces: MultiLayerCachePathTrace[];
  uncoveredLayersByRule: Record<string, string[]>;
}

export class ArchitectureCacheStateEngine {
  private readonly capabilityRegistry = new CacheCapabilityRegistry();

  public analyzeTopology(rawTopology: DistributedStateTopology): CacheStateAnalysisOutput {
    // 1. Validate Schema
    const topology = DistributedStateTopologySchema.parse(rawTopology);

    const allFindings: CacheStateFinding[] = [];

    // 2. Resolve Capabilities
    const capabilities: Record<string, CacheProviderCapabilities> = {};
    for (const layer of topology.cacheLayers) {
      capabilities[layer.id] = this.capabilityRegistry.resolveCapabilities(layer);
    }

    // 3. Invalidation & Multi-Tier Propagation Analysis
    const { findings: invFindings, uncoveredLayersByRule } = InvalidationAnalyzer.analyze(topology);
    allFindings.push(...invFindings);

    // 4. Stampede, Avalanche & Penetration Analysis
    const { evaluations: stampedeEvaluations, findings: stampedeFindings } =
      StampedeAnalyzer.analyze(topology);
    allFindings.push(...stampedeFindings);

    // 5. Working Set Capacity Analysis
    const { evaluations: capacityEvaluations, findings: capacityFindings } =
      CapacityAnalyzer.analyze(topology);
    allFindings.push(...capacityFindings);

    // 6. Stale Read & Read-After-Write Consistency Analysis
    const { evaluations: staleReadEvaluations, findings: staleFindings } =
      StaleReadAnalyzer.analyze(topology);
    allFindings.push(...staleFindings);

    // 7. Replication & Quorum Consistency Analysis
    const repFindings = ReplicationConsistencyAnalyzer.analyze(topology);
    allFindings.push(...repFindings);

    // 8. State Ownership & Concurrency Analysis
    const stateFindings = StateCorrectnessAnalyzer.analyze(topology);
    allFindings.push(...stateFindings);

    // 9. Distributed Lock Fencing Analysis
    const lockFindings = LockSafetyAnalyzer.analyze(topology);
    allFindings.push(...lockFindings);

    // 10. Multi-Layer Path Traversal
    const cachePathTraces = CachePathTracer.traceHierarchy(topology);

    // Deduplicate findings by ID & sort by severity
    const uniqueFindingsMap = new Map<string, CacheStateFinding>();
    for (const f of allFindings) {
      if (!uniqueFindingsMap.has(f.id)) {
        uniqueFindingsMap.set(f.id, f);
      }
    }

    const severityWeight: Record<CacheFindingSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0,
    };

    const sortedFindings = Array.from(uniqueFindingsMap.values()).sort(
      (a, b) => severityWeight[b.severity] - severityWeight[a.severity]
    );

    const findingsCount = {
      critical: sortedFindings.filter((f) => f.severity === "critical").length,
      high: sortedFindings.filter((f) => f.severity === "high").length,
      medium: sortedFindings.filter((f) => f.severity === "medium").length,
      low: sortedFindings.filter((f) => f.severity === "low").length,
      info: sortedFindings.filter((f) => f.severity === "info").length,
      total: sortedFindings.length,
    };

    const stampedeRiskCount = stampedeEvaluations.filter((e) => e.isStampedeRisk).length;
    const staleReadRiskCount = staleReadEvaluations.filter((e) => e.isStaleReadRisk).length;
    const capacityExhaustedCount = capacityEvaluations.filter((e) => e.isCapacityExhausted).length;
    const unfencedLockCount = topology.stateOwners.filter(
      (o) => o.distributedLockConfig && !o.distributedLockConfig.hasFencingToken
    ).length;

    const netOffloadPercentage =
      cachePathTraces.length > 0 ? cachePathTraces[0].netOffloadPercentage : 0;

    const summary: CacheStateSummary = {
      cacheLayerCount: topology.cacheLayers.length,
      sourceOfTruthCount: topology.sourcesOfTruth.length,
      invalidationRuleCount: topology.invalidationRules.length,
      replicaGroupCount: topology.replicaGroups.length,
      stateOwnerCount: topology.stateOwners.length,
      findingsCount,
      stampedeRiskCount,
      staleReadRiskCount,
      capacityExhaustedCount,
      unfencedLockCount,
      netOffloadPercentage,
    };

    return {
      topology,
      summary,
      findings: sortedFindings,
      capabilities,
      stampedeEvaluations,
      capacityEvaluations,
      staleReadEvaluations,
      cachePathTraces,
      uncoveredLayersByRule,
    };
  }

  public getCapabilityRegistry(): CacheCapabilityRegistry {
    return this.capabilityRegistry;
  }
}

export const architectureCacheStateEngine = new ArchitectureCacheStateEngine();

