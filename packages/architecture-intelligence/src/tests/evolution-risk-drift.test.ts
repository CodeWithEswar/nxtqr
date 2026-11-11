import { describe, it, expect } from "vitest";
import { MigrationRiskAnalyzer } from "../evolution/analysis/migration-risk-analyzer";
import { EvolutionDriftAnalyzer } from "../evolution/analysis/evolution-drift-analyzer";
import { WavePlanner } from "../evolution/planning/wave-planner";
import { RequirementExtractor } from "../evolution/planning/requirement-extractor";
import { ArchitectureEvolutionEngine } from "../evolution/engine/evolution-engine";
import type { ArchitectureSnapshot } from "../comparison/contracts/comparison.types";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

describe("Phase 05.3.26 — Migration Risk Registry & Evolution Drift Analyzer", () => {
  const sourceSnapshot: ArchitectureSnapshot = {
    id: "snap-risk-source",
    title: "Risk Source Snapshot",
    schemaVersion: 1,
    provenance: "current-draft",
    revision: "rev-source-legacy",
    createdAt: new Date().toISOString(),
    nodes: [
      { id: "monolith", type: "custom", position: { x: 0, y: 0 }, data: { label: "Legacy Monolith", nodeType: "service" } } as BaseNode,
      { id: "legacy-db", type: "custom", position: { x: 100, y: 0 }, data: { label: "Legacy SQL DB", nodeType: "database" } } as BaseNode,
    ],
    edges: [{ id: "e1", source: "monolith", target: "legacy-db", type: "smoothstep", data: {} } as unknown as BaseEdge],
    metadata: { environment: "legacy", version: "1.0.0" },
  };

  const targetSnapshot: ArchitectureSnapshot = {
    id: "snap-risk-target",
    title: "Risk Target Snapshot",
    schemaVersion: 1,
    provenance: "what-if-proposal",
    revision: "rev-target-microservices",
    createdAt: new Date().toISOString(),
    nodes: [
      { id: "api-gw", type: "custom", position: { x: 0, y: 0 }, data: { label: "API Gateway", nodeType: "gateway" } } as BaseNode,
      { id: "svc-order", type: "custom", position: { x: 100, y: 0 }, data: { label: "Order Service", nodeType: "service" } } as BaseNode,
      { id: "svc-billing", type: "custom", position: { x: 100, y: 100 }, data: { label: "Billing Service", nodeType: "service" } } as BaseNode,
      { id: "db-target", type: "custom", position: { x: 200, y: 50 }, data: { label: "Cloud Aurora DB", nodeType: "database" } } as BaseNode,
    ],
    edges: [
      { id: "e-gw-order", source: "api-gw", target: "svc-order", type: "smoothstep", data: {} } as unknown as BaseEdge,
      { id: "e-gw-billing", source: "api-gw", target: "svc-billing", type: "smoothstep", data: {} } as unknown as BaseEdge,
      { id: "e-order-db", source: "svc-order", target: "db-target", type: "smoothstep", data: {} } as unknown as BaseEdge,
    ],
    metadata: { environment: "cloud", version: "2.0.0" },
  };

  it("identifies critical dual-write inconsistency and latency hazard risks", () => {
    const requirements = RequirementExtractor.extractRequirements(sourceSnapshot, targetSnapshot, "p-risk");
    const plan = WavePlanner.planWaves(requirements, "strangler_fig", "p-risk");

    const risks = MigrationRiskAnalyzer.analyzeRisks(
      sourceSnapshot,
      targetSnapshot,
      plan.waves,
      plan.tasks,
      "p-risk"
    );

    expect(risks.length).toBeGreaterThanOrEqual(4);

    const categories = risks.map((r) => r.category);
    expect(categories).toContain("dual_write_inconsistency");
    expect(categories).toContain("latency_spike");
    expect(categories).toContain("contract_breakage");
    expect(categories).toContain("service_disruption");
    expect(categories).toContain("rollback_failure");

    const dualWriteRisk = risks.find((r) => r.category === "dual_write_inconsistency");
    expect(dualWriteRisk?.severity).toBe("critical");
    expect(dualWriteRisk?.mitigationPlan).toContain("reconciliation");
  });

  it("detects architecture drift and unplanned additions against baseline project plan", () => {
    const engine = ArchitectureEvolutionEngine.getInstance();
    const result = engine.planEvolution(sourceSnapshot, targetSnapshot, {
      projectId: "p-drift-test",
    });

    // Create an observed snapshot that introduced an unplanned unauthorized node and edge
    const observedCurrentSnapshot: ArchitectureSnapshot = {
      id: "snap-current-drifted",
      title: "Current Observed Snapshot",
      schemaVersion: 1,
      provenance: "imported",
      revision: "rev-current-drifted",
      createdAt: new Date().toISOString(),
      nodes: [
        ...targetSnapshot.nodes,
        {
          id: "shadow-unplanned-cache",
          type: "custom",
          position: { x: 300, y: 300 },
          data: { label: "Unplanned Shadow Cache", nodeType: "cache" },
        } as BaseNode,
      ],
      edges: [
        ...targetSnapshot.edges,
        {
          id: "unplanned-link",
          source: "svc-billing",
          target: "shadow-unplanned-cache",
          type: "smoothstep",
          data: {},
        } as unknown as BaseEdge,
      ],
      metadata: { environment: "production-live", version: "2.1.0" },
    };

    const drift = EvolutionDriftAnalyzer.analyzeDrift(result.project, observedCurrentSnapshot);

    expect(drift.hasRegressions).toBe(true);
    expect(drift.driftItems.length).toBeGreaterThanOrEqual(2);

    const unplannedItem = drift.driftItems.find((d) => d.driftType === "unplanned_change");
    expect(unplannedItem?.description).toContain("Unplanned Shadow Cache");

    const depItem = drift.driftItems.find((d) => d.driftType === "unmitigated_dependency");
    expect(depItem?.description).toContain("shadow-unplanned-cache");
  });
});
