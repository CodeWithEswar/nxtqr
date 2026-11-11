"use client";

/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Interactive Orchestration Testbed & Verification Page
 */

import React, { useState } from "react";
import { OrchestrationWorkspace } from "@/features/system-design/orchestration";
import {
  DependencyCycleDetector,
  ExecutionPlanner,
  InvalidationPlanner,
  OrchestrationFindingNormalizer as FindingNormalizer,
  FindingCorrelator,
  ContradictionDetector,
  architectureOrchestrationEngine,
  AnalysisContextBuilder,
  type AnalyzerDefinition,
} from "@nxtqr/architecture-intelligence";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { PlayIcon, CheckCircleIcon, AlertCircleIcon } from "@nxtqr/icons";

export default function ArchitectureOrchestrationTestbedPage() {
  const [verificationResults, setVerificationResults] = useState<
    Array<{ name: string; status: "passed" | "failed"; detail: string }>
  >([]);
  const [hasRunVerification, setHasRunVerification] = useState(false);

  const sampleNodes: BaseNode[] = [
    {
      id: "client-web",
      type: "custom",
      position: { x: 50, y: 100 },
      data: {
        label: "Web Browser Client",
        nodeType: "client",
        componentKind: "client",
      },
    },
    {
      id: "api-gw",
      type: "custom",
      position: { x: 250, y: 100 },
      data: {
        label: "API Gateway (Traefik)",
        nodeType: "gateway",
        componentKind: "gateway",
        rateLimit: 10000,
        tlsEnforced: true,
      },
    },
    {
      id: "order-svc",
      type: "custom",
      position: { x: 450, y: 50 },
      data: {
        label: "Order Service",
        nodeType: "service",
        componentKind: "compute",
        replicas: 2,
      },
    },
    {
      id: "payment-svc",
      type: "custom",
      position: { x: 450, y: 180 },
      data: {
        label: "Payment Service",
        nodeType: "service",
        componentKind: "compute",
        replicas: 1,
      },
    },
    {
      id: "primary-db",
      type: "custom",
      position: { x: 700, y: 100 },
      data: {
        label: "PostgreSQL Primary",
        nodeType: "database",
        componentKind: "datastore",
        storageType: "relational",
        rtoMinutes: 15,
      },
    },
  ];

  const sampleEdges: BaseEdge[] = [
    {
      id: "e1",
      source: "client-web",
      target: "api-gw",
      data: { isSynchronous: true, relationshipKind: "http" },
    },
    {
      id: "e2",
      source: "api-gw",
      target: "order-svc",
      data: { isSynchronous: true, relationshipKind: "http" },
    },
    {
      id: "e3",
      source: "api-gw",
      target: "payment-svc",
      data: { isSynchronous: true, relationshipKind: "http" },
    },
    {
      id: "e4",
      source: "order-svc",
      target: "primary-db",
      data: { isSynchronous: true, relationshipKind: "database" },
    },
    {
      id: "e5",
      source: "payment-svc",
      target: "primary-db",
      data: { isSynchronous: true, relationshipKind: "database" },
    },
  ];

  const runAllChecks = async () => {
    const checks: Array<{ name: string; status: "passed" | "failed"; detail: string }> = [];

    // Check 1: Dependency Cycle Detection
    try {
      const cleanGraph = new Map<string, string[]>([
        ["a", []],
        ["b", ["a"]],
      ]);
      const cleanResult = DependencyCycleDetector.detectCycles(cleanGraph);

      const cyclicGraph = new Map<string, string[]>([
        ["a", ["b"]],
        ["b", ["a"]],
      ]);
      const cyclicResult = DependencyCycleDetector.detectCycles(cyclicGraph);

      const passed = !cleanResult.hasCycles && cyclicResult.hasCycles;
      checks.push({
        name: "Check 1: Dependency DAG & Cycle Detection",
        status: passed ? "passed" : "failed",
        detail: passed
          ? `Correctly validated acyclic graph and detected cycle [${cyclicResult.cyclePath?.join(" -> ")}]`
          : "Cycle detection algorithm failed",
      });
    } catch (e: any) {
      checks.push({
        name: "Check 1: Dependency DAG & Cycle Detection",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    // Check 2: Multi-Wave Execution Planner
    try {
      const definitions: AnalyzerDefinition[] = [
        {
          id: "root-1",
          version: "1.0.0",
          name: "Root 1",
          description: "",
          category: "foundation",
          dependencies: [],
          inputSelectors: [],
          outputKinds: [],
          executionMode: "local",
          deterministic: true,
          timeoutMs: 1000,
        },
        {
          id: "child-1",
          version: "1.0.0",
          name: "Child 1",
          description: "",
          category: "risk",
          dependencies: ["root-1"],
          inputSelectors: [],
          outputKinds: [],
          executionMode: "local",
          deterministic: true,
          timeoutMs: 1000,
        },
      ];

      const plan = ExecutionPlanner.createPlan({
        revisionId: "test-rev",
        definitions,
      });

      const passed =
        plan.waves.length === 2 &&
        plan.waves[0].analyzerIds.includes("root-1") &&
        plan.waves[1].analyzerIds.includes("child-1");

      checks.push({
        name: "Check 2: Multi-Wave Execution Planner",
        status: passed ? "passed" : "failed",
        detail: passed
          ? `Generated ${plan.waves.length} waves: Wave 0 (root-1) -> Wave 1 (child-1)`
          : "Wave planning scheduling failed",
      });
    } catch (e: any) {
      checks.push({
        name: "Check 2: Multi-Wave Execution Planner",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    // Check 3: Deterministic Invalidation Planner
    try {
      const definitions: AnalyzerDefinition[] = [
        {
          id: "topo-analyzer",
          version: "1.0.0",
          name: "Topo",
          description: "",
          category: "foundation",
          dependencies: [],
          inputSelectors: ["nodes", "edges"],
          outputKinds: [],
          executionMode: "local",
          deterministic: true,
          timeoutMs: 1000,
        },
        {
          id: "downstream-analyzer",
          version: "1.0.0",
          name: "Downstream",
          description: "",
          category: "quality",
          dependencies: ["topo-analyzer"],
          inputSelectors: [],
          outputKinds: [],
          executionMode: "local",
          deterministic: true,
          timeoutMs: 1000,
        },
      ];

      const invPlanner = new InvalidationPlanner(definitions);
      const invResult = invPlanner.planInvalidation({ topologyChanged: true });

      const passed =
        invResult.directlyInvalidated.includes("topo-analyzer") &&
        invResult.cascadedInvalidated.includes("downstream-analyzer");

      checks.push({
        name: "Check 3: Deterministic Cache Invalidation Planner",
        status: passed ? "passed" : "failed",
        detail: passed
          ? `Directly invalidated [${invResult.directlyInvalidated.join(", ")}], cascaded [${invResult.cascadedInvalidated.join(", ")}]`
          : "Invalidation planner cascade failed",
      });
    } catch (e: any) {
      checks.push({
        name: "Check 3: Deterministic Cache Invalidation Planner",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    // Check 4: Finding Normalization & Fingerprinting
    try {
      const f1 = FindingNormalizer.normalize({
        sourceAnalyzerId: "test.analyzer",
        category: "risk",
        severity: "critical",
        title: "Unmitigated single point of failure",
        description: "Node db-1 has no replica",
        affectedComponentIds: ["db-1"],
      });
      const f2 = FindingNormalizer.normalize({
        sourceAnalyzerId: "test.analyzer",
        category: "risk",
        severity: "critical",
        title: "Unmitigated single point of failure",
        description: "Duplicate report",
        affectedComponentIds: ["db-1"],
      });

      const passed = f1.fingerprint === f2.fingerprint && f1.severity === "critical";

      checks.push({
        name: "Check 4: Finding Normalization & Stable Fingerprints",
        status: passed ? "passed" : "failed",
        detail: passed
          ? `Deterministic fingerprint: ${f1.fingerprint}`
          : "Fingerprint normalization failed",
      });
    } catch (e: any) {
      checks.push({
        name: "Check 4: Finding Normalization & Stable Fingerprints",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    // Check 5: Finding Correlation & Recommendation Clustering
    try {
      const correlated = FindingCorrelator.correlate([
        {
          id: "f-spof",
          sourceAnalyzerId: "arch.spof",
          category: "spof",
          severity: "critical",
          title: "SPOF on db-1",
          description: "No replica",
          affectedComponentIds: ["db-1"],
          evidenceIds: ["ev-1"],
          confidence: "verified",
          fingerprint: "spof:db-1",
        },
        {
          id: "f-btn",
          sourceAnalyzerId: "arch.bottlenecks",
          category: "bottlenecks",
          severity: "high",
          title: "Bottleneck on db-1",
          description: "High IOPS",
          affectedComponentIds: ["db-1"],
          evidenceIds: ["ev-2"],
          confidence: "modeled",
          fingerprint: "btn:db-1",
        },
      ]);

      const passed =
        correlated.correlationGroups.length === 1 &&
        correlated.unifiedRecommendations.length >= 1 &&
        correlated.correlationGroups[0].sharedComponentIds.includes("db-1");

      checks.push({
        name: "Check 5: Multi-Discipline Finding Correlation & Clustering",
        status: passed ? "passed" : "failed",
        detail: passed
          ? `Synthesized correlation group for 'db-1' with ${correlated.correlationGroups[0].findings.length} findings and holistic action`
          : "Finding correlation failed",
      });
    } catch (e: any) {
      checks.push({
        name: "Check 5: Multi-Discipline Finding Correlation & Clustering",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    // Check 6: Architectural Contradiction Detection
    try {
      const context = AnalysisContextBuilder.build({ nodes: [], edges: [] });
      const contradictions = ContradictionDetector.detectContradictions(
        [
          {
            id: "f-spof",
            sourceAnalyzerId: "architecture.spof",
            category: "spof",
            severity: "critical",
            title: "SPOF on primary-db",
            description: "No replica",
            affectedComponentIds: ["primary-db"],
            evidenceIds: [],
            confidence: "verified",
            fingerprint: "spof:db",
          },
          {
            id: "f-rel",
            sourceAnalyzerId: "architecture.reliability",
            category: "reliability",
            severity: "low",
            title: "Redundant replica active on primary-db",
            description: "Failover configured",
            affectedComponentIds: ["primary-db"],
            evidenceIds: [],
            confidence: "modeled",
            fingerprint: "rel:db",
          },
        ],
        context
      );

      const passed =
        contradictions.length === 1 && contradictions[0].type === "redundancy_conflict";

      checks.push({
        name: "Check 6: Architectural Contradiction Detection",
        status: passed ? "passed" : "failed",
        detail: passed
          ? `Detected conflict: ${contradictions[0].description}`
          : "Contradiction detection failed",
      });
    } catch (e: any) {
      checks.push({
        name: "Check 6: Architectural Contradiction Detection",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    // Check 7: Master Orchestration Engine End-to-End Pipeline
    try {
      const assessment = await architectureOrchestrationEngine.orchestrateAnalysis({
        projectId: "verify-proj",
        architectureId: "verify-arch",
        nodes: sampleNodes,
        edges: sampleEdges,
        configuration: {
          maxConcurrency: 4,
          enableCache: true,
        },
      });

      const passed =
        assessment.completenessStatus === "completed" &&
        assessment.analyzersCompleted >= 10 &&
        assessment.healthScore !== undefined;

      checks.push({
        name: "Check 7: Master Orchestration Engine Pipeline",
        status: passed ? "passed" : "failed",
        detail: passed
          ? `Orchestrated ${assessment.analyzersCompleted}/${assessment.analyzersRun} analyzers in ${assessment.executionDurationMs}ms (Health: ${assessment.healthScore}/100, Findings: ${assessment.totalFindingsCount})`
          : `Pipeline incomplete: status ${assessment.completenessStatus}, completed ${assessment.analyzersCompleted}/${assessment.analyzersRun}`,
      });
    } catch (e: any) {
      checks.push({
        name: "Check 7: Master Orchestration Engine Pipeline",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    setVerificationResults(checks);
    setHasRunVerification(true);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex flex-col">
      {/* Testbed Header */}
      <div className="p-6 border-b border-[#262626] bg-[#080808] max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-mono text-[#858585]">
              NXTQR Architecture Intelligence Orchestrator · Phase 05.3.29
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#FFFFFF] mt-1">
              Architecture Intelligence Orchestration & Unified Analysis Testbed
            </h1>
            <p className="text-xs text-[#858585] mt-1.5 max-w-3xl leading-relaxed">
              Coordinates 28 previously developed architecture intelligence features into one multi-wave execution DAG, shares validated findings, detects cross-analyzer contradictions, and produces a unified architecture assessment.
            </p>
          </div>

          <button
            onClick={runAllChecks}
            className="px-4 py-2 rounded-md bg-[#1A1A1A] hover:bg-[#262626] border border-[#404040] text-xs font-semibold text-[#FFFFFF] flex items-center gap-2 transition-all shadow-level-1 shrink-0"
          >
            <PlayIcon size={14} className="text-[#22c55e]" />
            Execute Orchestration Self-Test
          </button>
        </div>

        {/* Verification Checklist */}
        {hasRunVerification && (
          <div className="mt-6 pt-5 border-t border-[#1A1A1A] space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
              Automated Orchestration Check Results (
              {verificationResults.filter((r) => r.status === "passed").length}/
              {verificationResults.length} Passed)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {verificationResults.map((check, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] flex items-start gap-2.5 text-xs"
                >
                  {check.status === "passed" ? (
                    <CheckCircleIcon size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircleIcon size={16} className="text-[#ef4444] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[#FFFFFF]">{check.name}</div>
                    <div className="text-[11px] text-[#858585] leading-relaxed font-mono">
                      {check.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Embedded Studio Workbench */}
      <div className="flex-1">
        <OrchestrationWorkspace
          nodes={sampleNodes}
          edges={sampleEdges}
          projectId="testbed-project"
          architectureId="testbed-arch"
        />
      </div>
    </div>
  );
}
