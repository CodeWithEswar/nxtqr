import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { GraphIndex } from "../../core/graph-index";
import { DependencyResolver } from "./dependency-resolver";
import { CriticalityResolver } from "./criticality-resolver";
import { RedundancyResolver } from "./redundancy-resolver";
import { FailureDomainResolver } from "./failure-domain-resolver";
import { BlastRadiusResolver } from "./blast-radius-resolver";
import { SPOFAnalyzer } from "../analyzers/spof-analyzer";
import { SharedDependencyAnalyzer } from "../analyzers/shared-dependencies-analyzer";
import { FailoverAnalyzer } from "../analyzers/failover-analyzer";
import { DatabaseAvailabilityAnalyzer } from "../analyzers/database-availability-analyzer";
import { MessagingNetworkAnalyzer } from "../analyzers/messaging-network-analyzer";
import type {
  FailureAnalysisReport,
  FailureFinding,
  BlastRadiusReport,
} from "../contracts/failure.types";

export class FailureAnalysisEngine {
  private cachedRevision: string | null = null;
  private cachedReport: FailureAnalysisReport | null = null;

  public computeGraphRevision(nodes: BaseNode[], edges: BaseEdge[]): string {
    const nodeKeys = nodes
      .map((n) => `${n.id}:${n.type}:${JSON.stringify(n.data || {})}`)
      .sort()
      .join("|");
    const edgeKeys = edges
      .map((e) => `${e.id}:${e.source}->${e.target}:${JSON.stringify(e.data || {})}`)
      .sort()
      .join("|");

    let hash = 0;
    const combined = `${nodeKeys}#${edgeKeys}`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return `fail_rev_${Math.abs(hash).toString(36)}_${nodes.length}n_${edges.length}e`;
  }

  public reset(): void {
    this.cachedRevision = null;
    this.cachedReport = null;
  }

  public analyzeGraph(
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): FailureAnalysisReport {
    const startTime = Date.now();
    const revision = this.computeGraphRevision(nodes, edges);

    if (this.cachedRevision === revision && this.cachedReport) {
      return this.cachedReport;
    }

    const index = new GraphIndex(nodes, edges);
    const dependencyMap = DependencyResolver.resolveDependencies(nodes, edges, index);
    const capabilities = CriticalityResolver.resolveCapabilities(nodes, index);
    const redundancyGroups = RedundancyResolver.resolveRedundancy(nodes, index);
    const failureDomains = FailureDomainResolver.resolveFailureDomains(nodes, index);

    // Run Analyzers
    const findings: FailureFinding[] = [];

    findings.push(
      ...SPOFAnalyzer.analyze(nodes, index, dependencyMap, redundancyGroups, capabilities)
    );
    findings.push(
      ...SharedDependencyAnalyzer.analyze(nodes, index, dependencyMap, redundancyGroups)
    );
    findings.push(
      ...FailoverAnalyzer.analyze(nodes, index, redundancyGroups)
    );
    findings.push(
      ...DatabaseAvailabilityAnalyzer.analyze(nodes, index)
    );
    findings.push(
      ...MessagingNetworkAnalyzer.analyze(nodes, index, dependencyMap)
    );

    // Compute Blast Radius Profiles for all nodes
    const blastRadiusProfiles: Record<string, BlastRadiusReport> = {};
    for (const node of nodes) {
      blastRadiusProfiles[node.id] = BlastRadiusResolver.calculateNodeBlastRadius(
        node.id,
        nodes,
        index,
        dependencyMap,
        redundancyGroups,
        capabilities
      );
    }

    // Compute Metrics
    const spofCount = findings.filter(
      (f) => f.classification === "modeled-spof" || f.classification === "potential-spof"
    ).length;
    const sharedDependencyRisksCount = findings.filter(
      (f) => f.classification === "shared-dependency"
    ).length;
    const failoverGapsCount = findings.filter(
      (f) => f.classification === "failover-gap"
    ).length;
    const failureDomainRisksCount = findings.filter(
      (f) => f.classification === "failure-domain-risk"
    ).length;

    const report: FailureAnalysisReport = {
      id: `fail_rep_${Date.now()}`,
      timestamp: new Date().toISOString(),
      graphRevision: revision,
      findings,
      redundancyGroups,
      failureDomains,
      capabilities,
      blastRadiusProfiles,
      metrics: {
        totalComponents: nodes.length,
        totalDependencies: edges.length,
        spofCount,
        sharedDependencyRisksCount,
        failoverGapsCount,
        failureDomainRisksCount,
        criticalCapabilitiesCount: Object.keys(capabilities).length,
        executionTimeMs: Date.now() - startTime,
      },
    };

    this.cachedRevision = revision;
    this.cachedReport = report;

    return report;
  }

  public calculateBlastRadius(
    nodeId: string,
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): BlastRadiusReport {
    const index = new GraphIndex(nodes, edges);
    const dependencyMap = DependencyResolver.resolveDependencies(nodes, edges, index);
    const capabilities = CriticalityResolver.resolveCapabilities(nodes, index);
    const redundancyGroups = RedundancyResolver.resolveRedundancy(nodes, index);

    return BlastRadiusResolver.calculateNodeBlastRadius(
      nodeId,
      nodes,
      index,
      dependencyMap,
      redundancyGroups,
      capabilities
    );
  }
}

export const failureAnalysisEngine = new FailureAnalysisEngine();
