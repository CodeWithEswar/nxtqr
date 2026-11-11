import { describe, it, expect } from "vitest";
import { AnalysisResultCache } from "../orchestration/execution/result-cache";
import { InvalidationPlanner } from "../orchestration/planner/invalidation-planner";
import type { AnalyzerDefinition, AnalyzerResultEnvelope } from "../orchestration/contracts/orchestration.types";

describe("Phase 05.3.29: Analysis Cache & Dependency Invalidation", () => {
  it("stores and retrieves cached envelopes with tenant/revision isolation", () => {
    const cache = new AnalysisResultCache();

    const envelope: AnalyzerResultEnvelope = {
      analyzerId: "arch.spof",
      analyzerVersion: "1.0.0",
      architectureRevisionId: "rev-1",
      status: "completed",
      findings: [],
      evidenceIds: [],
      durationMs: 12,
      executedAt: new Date().toISOString(),
    };

    const keyParams = {
      projectId: "proj-1",
      revisionHash: "hash-abc",
      analyzerId: "arch.spof",
      analyzerVersion: "1.0.0",
    };

    expect(cache.has(keyParams)).toBe(false);
    cache.set(keyParams, envelope);
    expect(cache.has(keyParams)).toBe(true);

    const retrieved = cache.get(keyParams);
    expect(retrieved?.analyzerId).toBe("arch.spof");

    // Different revision hash is a miss
    expect(cache.has({ ...keyParams, revisionHash: "hash-xyz" })).toBe(false);

    // Invalidation by analyzer
    cache.invalidate("arch.spof", "proj-1");
    expect(cache.has(keyParams)).toBe(false);
  });

  it("plans cascaded invalidation when topology changes", () => {
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
        id: "health",
        version: "1.0.0",
        name: "Health",
        description: "",
        category: "quality",
        dependencies: ["validation"],
        inputSelectors: [],
        outputKinds: [],
        executionMode: "local",
        deterministic: true,
        timeoutMs: 1000,
      },
      {
        id: "bottlenecks",
        version: "1.0.0",
        name: "Bottlenecks",
        description: "",
        category: "optimization",
        dependencies: ["health"],
        inputSelectors: [],
        outputKinds: [],
        executionMode: "local",
        deterministic: true,
        timeoutMs: 1000,
      },
      {
        id: "contracts",
        version: "1.0.0",
        name: "Contracts",
        description: "",
        category: "interface",
        dependencies: [],
        inputSelectors: ["contracts"],
        outputKinds: [],
        executionMode: "local",
        deterministic: true,
        timeoutMs: 1000,
      },
    ];

    const planner = new InvalidationPlanner(definitions);

    // When topology changes:
    // "validation" is directly invalidated (reads nodes, edges)
    // "health" depends on "validation" -> cascaded
    // "bottlenecks" depends on "health" -> cascaded
    // "contracts" does not depend on validation and does not read nodes -> NOT invalidated
    const result = planner.planInvalidation({ topologyChanged: true });

    expect(result.directlyInvalidated).toContain("validation");
    expect(result.cascadedInvalidated).toContain("health");
    expect(result.cascadedInvalidated).toContain("bottlenecks");
    expect(result.allInvalidated).not.toContain("contracts");
  });
});
