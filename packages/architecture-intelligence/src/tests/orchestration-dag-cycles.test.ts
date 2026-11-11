import { describe, it, expect } from "vitest";
import { DependencyCycleDetector } from "../orchestration/planner/cycle-detector";
import { AnalyzerDependencyGraph } from "../orchestration/planner/dependency-graph";
import type { AnalyzerDefinition } from "../orchestration/contracts/orchestration.types";

describe("Phase 05.3.29: Orchestration DAG & Cycle Detection", () => {
  it("detects no cycles in a clean DAG", () => {
    const adjacency = new Map<string, string[]>([
      ["analyzer-a", []],
      ["analyzer-b", ["analyzer-a"]],
      ["analyzer-c", ["analyzer-b"]],
    ]);

    const result = DependencyCycleDetector.detectCycles(adjacency);
    expect(result.hasCycles).toBe(false);
    expect(result.cyclePath).toBeUndefined();
  });

  it("detects direct cycle between two analyzers (A -> B -> A)", () => {
    const adjacency = new Map<string, string[]>([
      ["analyzer-a", ["analyzer-b"]],
      ["analyzer-b", ["analyzer-a"]],
    ]);

    const result = DependencyCycleDetector.detectCycles(adjacency);
    expect(result.hasCycles).toBe(true);
    expect(result.cyclePath).toBeDefined();
    expect(result.cyclePath?.length).toBeGreaterThanOrEqual(2);
  });

  it("detects transitive 3-node cycle (A -> B -> C -> A)", () => {
    const definitions: AnalyzerDefinition[] = [
      {
        id: "A",
        version: "1.0.0",
        name: "A",
        description: "",
        category: "foundation",
        dependencies: ["B"],
        inputSelectors: [],
        outputKinds: [],
        executionMode: "local",
        deterministic: true,
        timeoutMs: 1000,
      },
      {
        id: "B",
        version: "1.0.0",
        name: "B",
        description: "",
        category: "foundation",
        dependencies: ["C"],
        inputSelectors: [],
        outputKinds: [],
        executionMode: "local",
        deterministic: true,
        timeoutMs: 1000,
      },
      {
        id: "C",
        version: "1.0.0",
        name: "C",
        description: "",
        category: "foundation",
        dependencies: ["A"],
        inputSelectors: [],
        outputKinds: [],
        executionMode: "local",
        deterministic: true,
        timeoutMs: 1000,
      },
    ];

    const graph = new AnalyzerDependencyGraph(definitions);
    const result = graph.detectCycles();
    expect(result.hasCycles).toBe(true);
    expect(() => graph.getTopologicalOrder()).toThrowError(/Cycle detected/);
  });

  it("correctly topologically sorts independent and dependent analyzers", () => {
    const definitions: AnalyzerDefinition[] = [
      {
        id: "val",
        version: "1.0.0",
        name: "Validation",
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
        id: "health",
        version: "1.0.0",
        name: "Health",
        description: "",
        category: "quality",
        dependencies: ["val"],
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
    ];

    const graph = new AnalyzerDependencyGraph(definitions);
    const order = graph.getTopologicalOrder();
    expect(order).toEqual(["val", "health", "bottlenecks"]);
  });
});
