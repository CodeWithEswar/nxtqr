import { describe, it, expect } from "vitest";
import { ExecutionPlanner } from "../orchestration/planner/execution-planner";
import type { AnalyzerDefinition } from "../orchestration/contracts/orchestration.types";

describe("Phase 05.3.29: Execution Planner & Wave Scheduling", () => {
  const definitions: AnalyzerDefinition[] = [
    {
      id: "validation",
      version: "1.0.0",
      name: "Validation",
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
      id: "spof",
      version: "1.0.0",
      name: "SPOF",
      description: "",
      category: "risk",
      dependencies: [],
      inputSelectors: ["nodes", "edges"],
      outputKinds: [],
      executionMode: "local",
      deterministic: true,
      timeoutMs: 1000,
    },
    {
      id: "health",
      version: "1.0.0",
      name: "Health",
      description: "",
      category: "quality",
      dependencies: ["validation"],
      inputSelectors: ["nodes", "edges"],
      outputKinds: [],
      executionMode: "local",
      deterministic: true,
      timeoutMs: 1000,
    },
    {
      id: "reliability",
      version: "1.0.0",
      name: "Reliability",
      description: "",
      category: "risk",
      dependencies: ["spof"],
      inputSelectors: ["nodes", "edges"],
      outputKinds: [],
      executionMode: "local",
      deterministic: true,
      timeoutMs: 1000,
    },
    {
      id: "verification",
      version: "1.0.0",
      name: "Verification",
      description: "",
      category: "quality",
      dependencies: ["reliability", "health"],
      inputSelectors: ["nodes", "edges"],
      outputKinds: [],
      executionMode: "local",
      deterministic: true,
      timeoutMs: 1000,
    },
  ];

  it("plans all analyzers across 3 distinct waves", () => {
    const plan = ExecutionPlanner.createPlan({
      revisionId: "rev-1",
      definitions,
    });

    expect(plan.waves.length).toBe(3);
    // Wave 0: validation, spof
    expect(plan.waves[0].analyzerIds).toContain("validation");
    expect(plan.waves[0].analyzerIds).toContain("spof");
    // Wave 1: health, reliability
    expect(plan.waves[1].analyzerIds).toContain("health");
    expect(plan.waves[1].analyzerIds).toContain("reliability");
    // Wave 2: verification
    expect(plan.waves[2].analyzerIds).toEqual(["verification"]);
  });

  it("transitively includes all prerequisites when requesting only verification", () => {
    const plan = ExecutionPlanner.createPlan({
      revisionId: "rev-2",
      requestedAnalyzerIds: ["verification"],
      definitions,
    });

    // Verification requires health & reliability, which require validation & spof
    expect(plan.resolvedExecutionOrder).toContain("validation");
    expect(plan.resolvedExecutionOrder).toContain("spof");
    expect(plan.resolvedExecutionOrder).toContain("health");
    expect(plan.resolvedExecutionOrder).toContain("reliability");
    expect(plan.resolvedExecutionOrder).toContain("verification");
    expect(plan.totalEstimatedAnalyzers).toBe(5);
  });

  it("handles pre-cached analyzers and schedules remaining waves appropriately", () => {
    const plan = ExecutionPlanner.createPlan({
      revisionId: "rev-3",
      cachedAnalyzerIds: ["validation", "spof"],
      definitions,
    });

    expect(plan.cachedAnalyzerIds).toEqual(["spof", "validation"].sort());
    // Wave 0 should now be health and reliability because their dependencies are already satisfied
    expect(plan.waves[0].analyzerIds).toContain("health");
    expect(plan.waves[0].analyzerIds).toContain("reliability");
    // Wave 1 should be verification
    expect(plan.waves[1].analyzerIds).toEqual(["verification"]);
  });
});
