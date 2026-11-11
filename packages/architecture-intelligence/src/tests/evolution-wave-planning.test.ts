import { describe, it, expect } from "vitest";
import { WavePlanner } from "../evolution/planning/wave-planner";
import { IntermediateModeler } from "../evolution/planning/intermediate-modeler";
import { RequirementExtractor } from "../evolution/planning/requirement-extractor";
import type { ArchitectureSnapshot } from "../comparison/contracts/comparison.types";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

describe("Phase 05.3.26 — Migration Wave Planner & Intermediate Modeler", () => {
  const sourceSnapshot: ArchitectureSnapshot = {
    id: "snap-source-wave-legacy",
    title: "Wave Legacy Snapshot",
    schemaVersion: 1,
    provenance: "current-draft",
    revision: "rev-source-legacy",
    createdAt: new Date().toISOString(),
    nodes: [
      {
        id: "monolith-core",
        type: "custom",
        position: { x: 100, y: 100 },
        data: { label: "Legacy Monolith Core", nodeType: "service" },
      } as BaseNode,
      {
        id: "monolith-db",
        type: "custom",
        position: { x: 300, y: 100 },
        data: { label: "Legacy Database", nodeType: "database" },
      } as BaseNode,
    ],
    edges: [
      { id: "e-m-db", source: "monolith-core", target: "monolith-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
    ],
    metadata: { environment: "legacy", version: "1.0.0" },
  };

  const targetSnapshot: ArchitectureSnapshot = {
    id: "snap-target-wave-modern",
    title: "Wave Modern Snapshot",
    schemaVersion: 1,
    provenance: "what-if-proposal",
    revision: "rev-target-modern",
    createdAt: new Date().toISOString(),
    nodes: [
      {
        id: "api-gw",
        type: "custom",
        position: { x: 50, y: 100 },
        data: { label: "API Gateway", nodeType: "gateway" },
      } as BaseNode,
      {
        id: "order-svc",
        type: "custom",
        position: { x: 250, y: 50 },
        data: { label: "Order Service", nodeType: "service" },
      } as BaseNode,
      {
        id: "order-db",
        type: "custom",
        position: { x: 450, y: 50 },
        data: { label: "Order DB", nodeType: "database" },
      } as BaseNode,
    ],
    edges: [
      { id: "e1", source: "api-gw", target: "order-svc", type: "smoothstep", data: {} } as unknown as BaseEdge,
      { id: "e2", source: "order-svc", target: "order-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
    ],
    metadata: { environment: "modern", version: "2.0.0" },
  };

  it("plans 5 sequential migration waves with tasks, dependencies, and gates", () => {
    const requirements = RequirementExtractor.extractRequirements(
      sourceSnapshot,
      targetSnapshot,
      "proj-wave-test"
    );

    const plan = WavePlanner.planWaves(requirements, "strangler_fig", "proj-wave-test");

    expect(plan.waves).toHaveLength(5);
    expect(plan.waves[0].waveNumber).toBe(1);
    expect(plan.waves[0].title).toContain("Foundation & Gateway Facade");
    expect(plan.waves[1].waveNumber).toBe(2);
    expect(plan.waves[1].title).toContain("Data Replication & Synchronization");
    expect(plan.waves[2].waveNumber).toBe(3);
    expect(plan.waves[2].title).toContain("Service Extraction & Canary Routing");
    expect(plan.waves[3].waveNumber).toBe(4);
    expect(plan.waves[3].title).toContain("Progressive Cutover & Full Traffic Migration");
    expect(plan.waves[4].waveNumber).toBe(5);
    expect(plan.waves[4].title).toContain("Decommissioning & Schema Contraction");

    // Verify task count and dependencies
    expect(plan.tasks.length).toBeGreaterThanOrEqual(8);
    expect(plan.dependencies.length).toBeGreaterThanOrEqual(7);

    // Verify verification gates exist for each wave
    expect(plan.gates.length).toBe(5);
    const gateTypes = plan.gates.map((g) => g.gateType);
    expect(gateTypes).toContain("performance_benchmark");
    expect(gateTypes).toContain("data_reconciliation");
    expect(gateTypes).toContain("contract_verification");
    expect(gateTypes).toContain("reliability_slo");
    expect(gateTypes).toContain("security_audit");
  });

  it("generates and validates intermediate architecture snapshots for each wave", () => {
    const requirements = RequirementExtractor.extractRequirements(
      sourceSnapshot,
      targetSnapshot,
      "proj-inter-test"
    );
    const plan = WavePlanner.planWaves(requirements, "strangler_fig", "proj-inter-test");

    const intermediateStates = IntermediateModeler.generateIntermediateSnapshots(
      sourceSnapshot,
      targetSnapshot,
      plan.waves,
      "proj-inter-test"
    );

    expect(intermediateStates).toHaveLength(5);

    // Wave 1 intermediate should contain gateway facade and legacy monolith
    const w1State = intermediateStates[0];
    expect(w1State.waveNumber).toBe(1);
    expect(w1State.reachabilityVerified).toBe(true);
    expect(w1State.validationStatus).toBe("valid");
    expect(w1State.snapshot.nodes.length).toBeGreaterThan(sourceSnapshot.nodes.length);

    // Wave 5 intermediate should match target state
    const w5State = intermediateStates[4];
    expect(w5State.waveNumber).toBe(5);
    expect(w5State.snapshot.nodes.length).toBe(targetSnapshot.nodes.length);
  });
});
