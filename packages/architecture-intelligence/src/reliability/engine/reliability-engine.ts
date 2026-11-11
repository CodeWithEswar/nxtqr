import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { GraphIndex } from "../../core/graph-index";
import type {
  ReliabilityAnalysisReport,
  ReliabilityFinding,
  ReliabilityCategory,
  ReliabilitySummary,
} from "../schemas/reliability.schemas";
import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import { PolicyResolver } from "./policy-resolver";
import { FailurePropagationEngine } from "./failure-propagation";
import { RetryAnalyzer } from "../analyzers/retry-analyzer";
import { TimeoutAnalyzer } from "../analyzers/timeout-analyzer";
import { CircuitBreakerAnalyzer } from "../analyzers/circuit-breaker-analyzer";
import { BulkheadAnalyzer } from "../analyzers/bulkhead-analyzer";
import { IdempotencyAnalyzer } from "../analyzers/idempotency-analyzer";
import { MessagingAnalyzer } from "../analyzers/messaging-analyzer";
import { CascadingFailureAnalyzer } from "../analyzers/cascading-failure-analyzer";
import { GracefulDegradationAnalyzer } from "../analyzers/graceful-degradation-analyzer";
import { BackpressureAnalyzer } from "../analyzers/backpressure-analyzer";
import { RecoveryAnalyzer } from "../analyzers/recovery-analyzer";

const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 20,
  high: 10,
  medium: 4,
  low: 1,
  info: 0,
};

export class ReliabilityEngine {
  private analyzers: IReliabilityAnalyzer[] = [
    new RetryAnalyzer(),
    new TimeoutAnalyzer(),
    new CircuitBreakerAnalyzer(),
    new BulkheadAnalyzer(),
    new IdempotencyAnalyzer(),
    new MessagingAnalyzer(),
    new CascadingFailureAnalyzer(),
    new GracefulDegradationAnalyzer(),
    new BackpressureAnalyzer(),
    new RecoveryAnalyzer(),
  ];

  private cache: {
    revisionHash: string;
    report: ReliabilityAnalysisReport;
  } | null = null;

  public analyzeGraph(nodes: BaseNode[], edges: BaseEdge[]): ReliabilityAnalysisReport {
    const revisionHash = this.computeRevisionHash(nodes, edges);
    if (this.cache && this.cache.revisionHash === revisionHash) {
      return this.cache.report;
    }

    // 1. Build Index & Maps
    const graphIndex = new GraphIndex(nodes, edges);
    const nodeMap = new Map<string, BaseNode>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    const outgoingEdgesMap = new Map<string, BaseEdge[]>();
    const incomingEdgesMap = new Map<string, BaseEdge[]>();
    for (const edge of edges) {
      if (!outgoingEdgesMap.has(edge.source)) outgoingEdgesMap.set(edge.source, []);
      outgoingEdgesMap.get(edge.source)!.push(edge);

      if (!incomingEdgesMap.has(edge.target)) incomingEdgesMap.set(edge.target, []);
      incomingEdgesMap.get(edge.target)!.push(edge);
    }

    // 2. Resolve Node Profiles & Propagation Paths
    const nodeProfiles = PolicyResolver.resolveProfiles(nodes, edges);
    const propagationPaths = FailurePropagationEngine.tracePropagationPaths(nodes, edges, nodeProfiles);

    // 3. Build Context
    const context: ReliabilityContext = {
      nodes,
      edges,
      graphIndex,
      nodeMap,
      outgoingEdgesMap,
      incomingEdgesMap,
      nodeProfiles,
    };

    // 4. Run Analyzers
    const findingsMap = new Map<string, ReliabilityFinding>();
    for (const analyzer of this.analyzers) {
      const results = analyzer.analyze(context);
      for (const finding of results) {
        findingsMap.set(finding.id, finding);
      }
    }

    // 5. Deterministic Sort
    const findings = Array.from(findingsMap.values()).sort((a, b) => {
      const weightA = SEVERITY_WEIGHTS[a.severity] ?? 0;
      const weightB = SEVERITY_WEIGHTS[b.severity] ?? 0;
      if (weightB !== weightA) return weightB - weightA;
      return a.ruleId.localeCompare(b.ruleId);
    });

    // 6. Calculate Summary & Score
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let penalty = 0;

    const categoryBreakdown: Record<ReliabilityCategory, number> = {
      "retry": 0,
      "timeout": 0,
      "circuit-breaker": 0,
      "bulkhead": 0,
      "idempotency": 0,
      "messaging": 0,
      "cascading-failure": 0,
      "graceful-degradation": 0,
      "backpressure": 0,
      "recovery": 0,
      "dependency": 0,
    };

    let unprotectedCriticalCount = 0;
    let retryAmplificationRiskCount = 0;
    let missingTimeoutCount = 0;

    for (const f of findings) {
      categoryBreakdown[f.category] = (categoryBreakdown[f.category] || 0) + 1;
      penalty += SEVERITY_WEIGHTS[f.severity] ?? 0;

      if (f.severity === "critical") criticalCount++;
      else if (f.severity === "high") highCount++;
      else if (f.severity === "medium") mediumCount++;
      else if (f.severity === "low") lowCount++;

      if (f.ruleId === "REL-CB-001") unprotectedCriticalCount++;
      if (f.ruleId === "REL-RETRY-003") retryAmplificationRiskCount++;
      if (f.ruleId === "REL-TIME-001") missingTimeoutCount++;
    }

    const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

    const summary: ReliabilitySummary = {
      score,
      totalFindings: findings.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      categoryBreakdown,
      unprotectedCriticalCount,
      retryAmplificationRiskCount,
      missingTimeoutCount,
    };

    const report: ReliabilityAnalysisReport = {
      id: `rel_report_${revisionHash}`,
      analyzedAt: new Date().toISOString(),
      revisionHash,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      findings,
      nodeProfiles,
      propagationPaths,
      summary,
    };

    this.cache = { revisionHash, report };
    return report;
  }

  private computeRevisionHash(nodes: BaseNode[], edges: BaseEdge[]): string {
    const nodeKey = nodes
      .map(
        (n) =>
          `${n.id}:${n.type}:${JSON.stringify(n.data || {})}:${
            (n as { parentId?: string }).parentId || ""
          }`
      )
      .sort()
      .join("|");
    const edgeKey = edges
      .map((e) => `${e.id}:${e.source}->${e.target}:${JSON.stringify(e.data || {})}`)
      .sort()
      .join("|");
    return `${nodes.length}_${edges.length}_${this.simpleHash(nodeKey + "::" + edgeKey)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

export const reliabilityEngine = new ReliabilityEngine();

