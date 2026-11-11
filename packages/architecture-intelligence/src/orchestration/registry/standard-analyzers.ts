/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Standard Architecture Analyzers Suite
 */

import type {
  ArchitectureAnalyzer,
  AnalyzerDefinition,
  CanonicalAnalysisContext,
  AnalyzerResultEnvelope,
  NormalizedFinding,
} from "../contracts/orchestration.types";
import { architectureValidationEngine } from "@nxtqr/architecture-validation";
import { architectureHealthEngine } from "../../core/assessment-engine";
import { failureAnalysisEngine } from "../../failure-analysis/engine/failure-engine";
import { securityAnalysisEngine } from "../../security-analysis/engine/security-engine";
import { bottleneckEngine } from "../../bottlenecks/engine/bottleneck-engine";
import { reliabilityEngine } from "../../reliability/engine/reliability-engine";
import { architectureDatabaseEngine } from "../../database/engine/database-engine";
import { architectureNetworkEngine } from "../../network/engine/network-engine";
import { architectureGovernanceEngine } from "../../governance/engine/governance-engine";
import { architectureOperationsEngine } from "../../operations/engine/operations-engine";
import { architectureVerificationEngine } from "../../verification/engine/verification-engine";
import { architectureTestRegistry } from "../../verification/registry/test-registry";
import { suiteRegistry } from "../../verification/registry/suite-registry";
import { gateRegistry } from "../../verification/registry/gate-registry";

// Helper to construct envelopes
function createEnvelope<T>(
  def: AnalyzerDefinition,
  context: CanonicalAnalysisContext,
  startTime: number,
  findings: NormalizedFinding[],
  output: T
): AnalyzerResultEnvelope<T> {
  return {
    analyzerId: def.id,
    analyzerVersion: def.version,
    architectureRevisionId: context.revisionId,
    status: "completed",
    output,
    findings,
    evidenceIds: findings.flatMap((f) => f.evidenceIds),
    durationMs: Math.max(1, Math.round(performance.now() - startTime)),
    executedAt: new Date().toISOString(),
  };
}

// 1. Validation Analyzer
export const ValidationAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.validation",
    version: "1.0.0",
    name: "Graph Structural Validation",
    description: "Evaluates node types, connection contracts, and isolated graph components.",
    category: "foundation",
    dependencies: [],
    inputSelectors: ["nodes", "edges"],
    outputKinds: ["validation_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const result = architectureValidationEngine.validateGraph(context.nodes, context.edges);
    const findings: NormalizedFinding[] = (result.findings || []).map((issue: any) => ({
      id: `val-${issue.id}`,
      sourceAnalyzerId: "architecture.validation",
      category: "validation",
      severity: issue.severity === "error" ? "critical" : "medium",
      title: issue.message,
      description: issue.message,
      affectedComponentIds: issue.nodeId ? [issue.nodeId] : [],
      evidenceIds: [],
      confidence: "verified",
      fingerprint: `val:${issue.nodeId || "graph"}:${issue.ruleId || issue.message}`,
    }));
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

// 2. SPOF & Failure Domain Analyzer
export const SpofAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.spof",
    version: "1.0.0",
    name: "Single Points of Failure (SPOF)",
    description: "Identifies articulation points and unmitigated single points of failure.",
    category: "risk",
    dependencies: [],
    inputSelectors: ["nodes", "edges", "graphIndex"],
    outputKinds: ["spof_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const result = failureAnalysisEngine.analyzeGraph(context.nodes, context.edges);
    const findings: NormalizedFinding[] = result.findings.map((f) => ({
      id: `spof-${f.id}`,
      sourceAnalyzerId: "architecture.spof",
      category: "availability",
      severity: f.severity === "critical" ? "critical" : f.severity === "high" ? "high" : "medium",
      title: f.title,
      description: f.explanation || f.title,
      affectedComponentIds: f.affectedNodeIds || [],
      evidenceIds: [],
      confidence: "verified",
      remediationRecommendation: "Introduce redundant replica or warm standby failover.",
      fingerprint: `spof:${(f.affectedNodeIds || []).sort().join(",")}:${f.title}`,
    }));
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

// 3. Security Analysis
export const SecurityAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.security",
    version: "1.0.0",
    name: "Security Architecture & Trust Boundaries",
    description: "Evaluates external perimeter exposure, trust boundary crossings, and authentication boundaries.",
    category: "risk",
    dependencies: [],
    inputSelectors: ["nodes", "edges"],
    outputKinds: ["security_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const result = securityAnalysisEngine.analyzeGraph(context.nodes, context.edges);
    const findings: NormalizedFinding[] = result.findings.map((f) => ({
      id: `sec-${f.id}`,
      sourceAnalyzerId: "architecture.security",
      category: "security",
      severity: f.severity === "critical" ? "critical" : f.severity === "high" ? "high" : "medium",
      title: f.title,
      description: f.explanation || f.title,
      affectedComponentIds: f.affectedNodeIds || [],
      evidenceIds: [],
      confidence: "verified",
      remediationRecommendation: "Enforce network boundary encryption and authentication.",
      fingerprint: `sec:${(f.affectedNodeIds || []).sort().join(",")}:${f.title}`,
    }));
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

// 4. Architecture Health Analyzer (depends on validation)
export const OrchestrationHealthAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.health",
    version: "1.0.0",
    name: "6-Pillar Architecture Health",
    description: "Calculates overall health across security, reliability, performance, cost, operational, and simplicity.",
    category: "foundation",
    dependencies: ["architecture.validation"],
    inputSelectors: ["nodes", "edges", "graphIndex"],
    outputKinds: ["health_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const result = architectureHealthEngine.assessGraph(context.nodes, context.edges);
    const findings: NormalizedFinding[] = [];
    const score = result.overallScore ?? 100;
    if (score < 70) {
      findings.push({
        id: "health-suboptimal",
        sourceAnalyzerId: "architecture.health",
        category: "health",
        severity: score < 50 ? "high" : "medium",
        title: `Overall Architecture Health Degraded (${score}/100)`,
        description: `Architecture health is below the recommended threshold of 70 across 6 pillars.`,
        affectedComponentIds: [],
        evidenceIds: [],
        confidence: "modeled",
        remediationRecommendation: "Review individual pillar deductions in Health breakdown.",
        fingerprint: `health:overall:${score}`,
      });
    }
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

// 5. Bottleneck Analyzer (depends on health)
export const BottleneckAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.bottlenecks",
    version: "1.0.0",
    name: "Bottlenecks & Fan-in Congestion",
    description: "Identifies architectural fan-in congestion and critical path bottlenecks.",
    category: "risk",
    dependencies: ["architecture.health"],
    inputSelectors: ["nodes", "edges"],
    outputKinds: ["bottleneck_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const result = bottleneckEngine.analyzeGraph(context.nodes, context.edges);
    const findings: NormalizedFinding[] = result.findings.map((b) => ({
      id: `btn-${b.id}`,
      sourceAnalyzerId: "architecture.bottlenecks",
      category: "performance",
      severity: b.severity === "critical" ? "critical" : "high",
      title: b.title,
      description: b.explanation || b.title,
      affectedComponentIds: b.affectedNodeIds || [],
      evidenceIds: [],
      confidence: "modeled",
      fingerprint: `btn:${(b.affectedNodeIds || []).sort().join(",")}:${b.title}`,
    }));
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

// 6. Reliability Analyzer (depends on spof)
export const ReliabilityAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.reliability",
    version: "1.0.0",
    name: "Reliability & Resilience Policies",
    description: "Evaluates retries, timeouts, idempotency, and cascading failure resistance.",
    category: "risk",
    dependencies: ["architecture.spof"],
    inputSelectors: ["nodes", "edges"],
    outputKinds: ["reliability_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const result = reliabilityEngine.analyzeGraph(context.nodes, context.edges);
    const findings: NormalizedFinding[] = result.findings.map((f) => ({
      id: `rel-${f.id}`,
      sourceAnalyzerId: "architecture.reliability",
      category: "reliability",
      severity: f.severity === "critical" ? "critical" : f.severity === "high" ? "high" : "medium",
      title: f.title,
      description: f.explanation || f.title,
      affectedComponentIds: f.affectedNodeIds || [],
      evidenceIds: [],
      confidence: "verified",
      remediationRecommendation: "Configure retry policies, circuit breakers, and idempotency keys.",
      fingerprint: `rel:${(f.affectedNodeIds || []).sort().join(",")}:${f.title}`,
    }));
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

// 7. Database Intelligence Analyzer
export const OrchestrationDatabaseAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.database",
    version: "1.0.0",
    name: "Database Design & Storage Architecture",
    description: "Analyzes storage capacity, replication topologies, read replicas, and pooling.",
    category: "data",
    dependencies: [],
    inputSelectors: ["nodes", "edges"],
    outputKinds: ["database_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const now = new Date().toISOString();
    const result = architectureDatabaseEngine.analyzeTopology({
      id: `db-topo-${context.architectureId}`,
      projectId: context.projectId,
      architectureId: context.architectureId,
      graphRevision: context.revisionHash,
      version: 1,
      assets: [],
      schemas: [],
      workloads: [],
      executionPlans: [],
      transactions: [],
      createdAt: now,
      updatedAt: now,
    });
    const findings: NormalizedFinding[] = result.findings.map((f) => {
      const affected = [f.affectedTableId, f.affectedQueryId, f.affectedIndexId, f.affectedTransactionId].filter(
        (x): x is string => Boolean(x)
      );
      return {
        id: `db-${f.id}`,
        sourceAnalyzerId: "architecture.database",
        category: "database",
        severity: f.severity === "critical" ? "critical" : "high",
        title: f.title,
        description: f.explanation || f.title,
        affectedComponentIds: affected,
        evidenceIds: [],
        confidence: "verified",
        fingerprint: `db:${affected.sort().join(",")}:${f.title}`,
      };
    });
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

// 8. Network & Traffic Analyzer
export const OrchestrationNetworkAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.network",
    version: "1.0.0",
    name: "Network & Traffic Engineering",
    description: "Evaluates ingress routing, rate limits, TLS termination, and traffic shaping.",
    category: "interface",
    dependencies: [],
    inputSelectors: ["nodes", "edges"],
    outputKinds: ["network_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const now = new Date().toISOString();
    const result = architectureNetworkEngine.analyzeTopology({
      id: `net-${context.architectureId}`,
      projectId: context.projectId,
      architectureId: context.architectureId,
      graphRevision: context.revisionHash,
      version: 1,
      dnsZones: [],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [],
      gateways: [],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [],
      createdAt: now,
      updatedAt: now,
    });
    const findings: NormalizedFinding[] = result.findings.map((f) => ({
      id: `net-${f.id}`,
      sourceAnalyzerId: "architecture.network",
      category: "network",
      severity: f.severity === "critical" ? "critical" : "high",
      title: f.title,
      description: f.summary || f.title,
      affectedComponentIds: f.affectedResourceIds || [],
      evidenceIds: [],
      confidence: "verified",
      fingerprint: `net:${(f.affectedResourceIds || []).sort().join(",")}:${f.title}`,
    }));
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

// 9. Governance & Policy-as-Code Analyzer
export const GovernanceAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.governance",
    version: "1.0.0",
    name: "Architecture Governance & Compliance",
    description: "Evaluates declarative policy-as-code rules, drift detection, and standards.",
    category: "governance",
    dependencies: ["architecture.security"],
    inputSelectors: ["nodes", "edges", "evidence"],
    outputKinds: ["governance_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const now = new Date().toISOString();
    const result = architectureGovernanceEngine.analyzeTopology(
      {
        id: `gov-${context.architectureId}`,
        projectId: context.projectId,
        architectureId: context.architectureId,
        graphRevision: context.revisionHash,
        version: 1,
        policies: [],
        bundles: [],
        evidence: [],
        exceptions: [],
        baselines: [],
        createdAt: now,
        updatedAt: now,
      },
      { includeStandardBundles: true }
    );
    const findings: NormalizedFinding[] = (result.findings || []).map((f) => ({
      id: `gov-${f.id}`,
      sourceAnalyzerId: "architecture.governance",
      category: "governance",
      severity: f.severity === "critical" ? "critical" : "high",
      title: f.title,
      description: f.summary || f.title,
      affectedComponentIds: f.affectedResourceIds || [],
      evidenceIds: [],
      confidence: "verified",
      fingerprint: `gov:${(f.affectedResourceIds || []).sort().join(",")}:${f.title}`,
    }));
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

// 10. Operations & Disaster Recovery Analyzer (depends on spof, database)
export const OperationsAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.operations",
    version: "1.0.0",
    name: "Disaster Recovery & Operational Readiness",
    description: "Evaluates incident scenarios, recovery DAG critical paths, RTO/RPO targets, and runbooks.",
    category: "operations",
    dependencies: ["architecture.spof", "architecture.database"],
    inputSelectors: ["nodes", "edges", "evidence"],
    outputKinds: ["operations_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const result = architectureOperationsEngine.analyzeOperations(
      {
        id: `op-proj-${context.architectureId}`,
        architectureId: context.architectureId,
        architectureRevisionId: context.revisionId,
        title: "Operational Readiness Project",
        scenarios: [],
        journeys: [],
        ownerships: [],
        escalationPolicies: [],
        runbooks: [],
        objectives: [],
        dependencies: [],
        backupCapabilities: [],
        failoverProcedures: [],
        tabletopExercises: [],
        evidence: [],
      },
      context.nodes,
      context.edges
    );
    const findings: NormalizedFinding[] = result.readiness.findings.map((f) => ({
      id: `op-${f.id}`,
      sourceAnalyzerId: "architecture.operations",
      category: "operations",
      severity: f.severity === "critical" ? "critical" : "high",
      title: f.title,
      description: f.description,
      affectedComponentIds: [],
      evidenceIds: [],
      confidence: "verified",
      remediationRecommendation: f.remediationRecommendation,
      fingerprint: `op:${f.category}:${f.title}`,
    }));
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

// 11. Verification & Readiness Gates Analyzer (depends on governance, operations)
export const VerificationAnalyzer: ArchitectureAnalyzer = {
  definition: {
    id: "architecture.verification",
    version: "1.0.0",
    name: "Architecture Verification & Readiness Gates",
    description: "Evaluates architecture assertions, test suites, 4-state test execution, and 5-state release gates.",
    category: "quality",
    dependencies: ["architecture.governance", "architecture.operations"],
    inputSelectors: ["nodes", "edges", "evidence"],
    outputKinds: ["verification_report"],
    executionMode: "local",
    deterministic: true,
    timeoutMs: 5000,
  },
  async analyze(context, _signal) {
    const start = performance.now();
    const defaultTests = architectureTestRegistry.getAll();
    const result = architectureVerificationEngine.verifyArchitecture(
      {
        id: `ver-proj-${context.architectureId}`,
        name: "Verification Project",
        requirements: [],
        tests: defaultTests,
        suites: suiteRegistry.getAll(),
        evidenceCatalog: context.evidenceCatalog.map((e) => ({
          id: e.id,
          evidenceType: (e.type || "architecture_topology") as any,
          source: e.source,
          owner: e.owner,
          architectureRevisionId: context.revisionId,
          observedAt: e.observedAt,
          importedAt: e.importedAt,
          contentHash: e.contentHash,
          freshnessWindowHours: e.freshnessWindowHours,
          isVerified: e.isVerified,
          metadata: e.metadata,
        })),
        baselines: [],
        gates: gateRegistry.getAll(),
        exceptions: [],
        runs: [],
      },
      context.nodes,
      context.edges
    );
    const findings: NormalizedFinding[] = result.run.results
      .filter((r) => r.status === "fail")
      .map((r) => ({
        id: `ver-${r.testId}`,
        sourceAnalyzerId: "architecture.verification",
        category: "verification",
        severity: "critical",
        title: `Verification Test Failed: ${r.testId}`,
        description: r.explanation,
        affectedComponentIds: r.affectedComponentIds,
        evidenceIds: r.evidenceIds,
        confidence: "verified",
        fingerprint: `ver:${r.testId}`,
      }));
    return createEnvelope(this.definition, context, start, findings, result);
  },
};

export const STANDARD_ANALYZERS: ArchitectureAnalyzer[] = [
  ValidationAnalyzer,
  SpofAnalyzer,
  SecurityAnalyzer,
  OrchestrationHealthAnalyzer,
  BottleneckAnalyzer,
  ReliabilityAnalyzer,
  OrchestrationDatabaseAnalyzer,
  OrchestrationNetworkAnalyzer,
  GovernanceAnalyzer,
  OperationsAnalyzer,
  VerificationAnalyzer,
];
