import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { GraphIndex } from "../../core/graph-index";
import type {
  BottleneckReport,
  BottleneckFinding,
  WorkloadScenario,
  NodeUtilization,
} from "../contracts/bottleneck.types";
import { DEFAULT_WORKLOAD_SCENARIOS } from "../scenarios/scenario-registry";
import { CapacityResolver, type ResolvedComponentCapacity } from "./capacity-resolver";
import { TrafficResolver } from "./traffic-resolver";
import { CriticalPathResolver } from "./critical-path-resolver";
import { ServiceAnalyzer } from "../analyzers/service-analyzer";
import { QueueAnalyzer } from "../analyzers/queue-analyzer";
import { DatabaseAnalyzer } from "../analyzers/database-analyzer";
import { CacheAnalyzer } from "../analyzers/cache-analyzer";
import { NetworkAnalyzer } from "../analyzers/network-analyzer";
import { ExternalAnalyzer } from "../analyzers/external-analyzer";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export class BottleneckEngine {
  private cachedRevision: string | null = null;
  private cachedReport: BottleneckReport | null = null;

  public computeRevision(nodes: BaseNode[], edges: BaseEdge[], scenario: WorkloadScenario): string {
    const nodeKeys = nodes.map((n) => `${n.id}:${JSON.stringify(n.data || {})}`).sort().join("|");
    const edgeKeys = edges.map((e) => `${e.id}:${e.source}->${e.target}`).sort().join("|");
    const scenarioKey = `${scenario.id}:${scenario.parameters.ingressRps}:${scenario.parameters.peakMultiplier}:${scenario.parameters.readRatio}:${scenario.parameters.cacheHitRate}`;
    
    let hash = 0;
    const combined = `${nodeKeys}#${edgeKeys}#${scenarioKey}`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return `bot_${Math.abs(hash).toString(36)}_${nodes.length}n_${edges.length}e`;
  }

  public analyzeGraph(
    nodes: BaseNode[],
    edges: BaseEdge[],
    scenario: WorkloadScenario = DEFAULT_WORKLOAD_SCENARIOS.normal_traffic,
    existingIndex?: GraphIndex
  ): BottleneckReport {
    const startTime = Date.now();
    const revision = this.computeRevision(nodes, edges, scenario);

    if (this.cachedRevision === revision && this.cachedReport) {
      return this.cachedReport;
    }

    // 1. Build or reuse Graph Index
    const index = existingIndex ?? new GraphIndex(nodes, edges);

    // 2. Resolve capacity for every component
    const capacityMap = new Map<string, ResolvedComponentCapacity>();
    for (const node of nodes) {
      capacityMap.set(node.id, CapacityResolver.resolveNodeCapacity(node, scenario));
    }

    // 3. Resolve traffic propagation
    const demandMap = TrafficResolver.resolveTraffic(nodes, edges, index, scenario);

    // 4. Run individual bottleneck analyzers
    const { findings: serviceFindings, nodeUtilizations } = ServiceAnalyzer.analyze(
      nodes,
      index,
      demandMap,
      capacityMap,
      scenario
    );

    const { findings: queueFindings, queueMetrics } = QueueAnalyzer.analyze(
      nodes,
      index,
      demandMap,
      capacityMap,
      scenario
    );

    const { findings: dbFindings, dbUtilizations } = DatabaseAnalyzer.analyze(
      nodes,
      index,
      demandMap,
      capacityMap,
      scenario
    );

    const cacheFindings = CacheAnalyzer.analyze(nodes, index, demandMap, scenario);
    const networkFindings = NetworkAnalyzer.analyze(nodes, index, demandMap, capacityMap, scenario);
    const externalFindings = ExternalAnalyzer.analyze(nodes, index, demandMap, scenario);

    // 5. Critical path analysis
    const criticalPaths = CriticalPathResolver.resolveCriticalPaths(nodes, index, capacityMap);

    // 6. Merge node utilizations
    const combinedUtilizations: Record<string, NodeUtilization> = {
      ...nodeUtilizations,
      ...dbUtilizations,
    };

    // 7. Aggregate and deduplicate findings
    const allFindingsRaw: BottleneckFinding[] = [
      ...serviceFindings,
      ...queueFindings,
      ...dbFindings,
      ...cacheFindings,
      ...networkFindings,
      ...externalFindings,
    ];

    const findingsMap = new Map<string, BottleneckFinding>();
    for (const f of allFindingsRaw) {
      if (!findingsMap.has(f.id)) {
        findingsMap.set(f.id, f);
      }
    }

    const sortedFindings = Array.from(findingsMap.values()).sort((a, b) => {
      const diff = (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4);
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });

    const executionDuration = Math.max(1, Date.now() - startTime);

    const report: BottleneckReport = {
      id: `bot_report_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      graphRevision: revision,
      scenario,
      findings: sortedFindings,
      nodeUtilization: combinedUtilizations,
      queueMetrics,
      criticalPaths,
      metrics: {
        analyzedNodesCount: nodes.length,
        bottlenecksDetectedCount: sortedFindings.length,
        criticalCount: sortedFindings.filter((f) => f.severity === "critical").length,
        highCount: sortedFindings.filter((f) => f.severity === "high").length,
        executionTimeMs: executionDuration,
      },
    };

    this.cachedRevision = revision;
    this.cachedReport = report;

    return report;
  }

  public reset(): void {
    this.cachedRevision = null;
    this.cachedReport = null;
  }
}

export const bottleneckEngine = new BottleneckEngine();
