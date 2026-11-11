import { describe, it, expect } from "vitest";
import { WaveScheduler } from "../orchestration/execution/scheduler";
import { AnalyzerRegistry } from "../orchestration/registry/analyzer-registry";
import { AnalysisContextBuilder } from "../orchestration/execution/context-builder";
import { ExecutionPlanner } from "../orchestration/planner/execution-planner";
import { AnalysisResultCache } from "../orchestration/execution/result-cache";
import type { ArchitectureAnalyzer } from "../orchestration/contracts/orchestration.types";

describe("Phase 05.3.29: Wave Scheduler & Bounded Concurrency", () => {
  it("executes analyzers and populates shared findings progressively", async () => {
    const registry = new AnalyzerRegistry();
    const cache = new AnalysisResultCache();

    let runningCount = 0;
    let maxObservedConcurrency = 0;

    const createDummyAnalyzer = (id: string, deps: string[] = []): ArchitectureAnalyzer => ({
      definition: {
        id,
        version: "1.0.0",
        name: id,
        description: "",
        category: "foundation",
        dependencies: deps,
        inputSelectors: ["nodes", "edges"],
        outputKinds: [],
        executionMode: "local",
        deterministic: true,
        timeoutMs: 2000,
      },
      async analyze(ctx) {
        runningCount++;
        maxObservedConcurrency = Math.max(maxObservedConcurrency, runningCount);
        await new Promise((r) => setTimeout(r, 20));
        runningCount--;

        return {
          analyzerId: id,
          analyzerVersion: "1.0.0",
          architectureRevisionId: ctx.revisionId,
          status: "completed",
          findings: [
            {
              id: `f-${id}`,
              sourceAnalyzerId: id,
              category: "dummy",
              severity: "medium",
              title: `Finding from ${id}`,
              description: `Desc from ${id}`,
              affectedComponentIds: ["node-1"],
              evidenceIds: [],
              confidence: "verified",
              fingerprint: `dummy:${id}:node-1`,
            },
          ],
          evidenceIds: [],
          durationMs: 20,
          executedAt: new Date().toISOString(),
        };
      },
    });

    const a1 = createDummyAnalyzer("analyzer-1");
    const a2 = createDummyAnalyzer("analyzer-2");
    const a3 = createDummyAnalyzer("analyzer-3");
    const a4 = createDummyAnalyzer("analyzer-4", ["analyzer-1"]);

    registry.register(a1);
    registry.register(a2);
    registry.register(a3);
    registry.register(a4);

    const context = AnalysisContextBuilder.build({
      nodes: [],
      edges: [],
      configuration: { maxConcurrency: 2, enableCache: false },
    });

    const plan = ExecutionPlanner.createPlan({
      revisionId: context.revisionId,
      definitions: registry.getAllDefinitions(),
    });

    const result = await WaveScheduler.execute(context, plan, registry, cache);

    expect(result.failed).toBe(false);
    expect(result.cancelled).toBe(false);
    expect(result.runRecords.length).toBe(4);
    expect(result.allFindings.length).toBe(4);
    expect(maxObservedConcurrency).toBeLessThanOrEqual(2);
    expect(context.sharedFindings.has("analyzer-1")).toBe(true);
    expect(context.sharedFindings.has("analyzer-4")).toBe(true);
  });

  it("handles analyzer timeout gracefully without crashing scheduler", async () => {
    const registry = new AnalyzerRegistry();
    const cache = new AnalysisResultCache();

    const slowAnalyzer: ArchitectureAnalyzer = {
      definition: {
        id: "slow-analyzer",
        version: "1.0.0",
        name: "Slow Analyzer",
        description: "",
        category: "risk",
        dependencies: [],
        inputSelectors: [],
        outputKinds: [],
        executionMode: "local",
        deterministic: true,
        timeoutMs: 50, // 50ms timeout
      },
      async analyze() {
        await new Promise((r) => setTimeout(r, 300)); // takes 300ms
        return {} as any;
      },
    };

    registry.register(slowAnalyzer);

    const context = AnalysisContextBuilder.build({
      nodes: [],
      edges: [],
    });

    const plan = ExecutionPlanner.createPlan({
      revisionId: context.revisionId,
      definitions: [slowAnalyzer.definition],
    });

    const result = await WaveScheduler.execute(context, plan, registry, cache);

    expect(result.failed).toBe(true);
    const run = result.runRecords.find((r) => r.analyzerId === "slow-analyzer");
    expect(run?.status).toBe("failed");
    expect(run?.errorMessage).toContain("timed out after 50ms");
  });

  it("aborts execution cleanly when AbortSignal triggers", async () => {
    const registry = new AnalyzerRegistry();
    const cache = new AnalysisResultCache();

    const a1: ArchitectureAnalyzer = {
      definition: {
        id: "a1",
        version: "1.0.0",
        name: "a1",
        description: "",
        category: "foundation",
        dependencies: [],
        inputSelectors: [],
        outputKinds: [],
        executionMode: "local",
        deterministic: true,
        timeoutMs: 2000,
      },
      async analyze() {
        return {
          analyzerId: "a1",
          analyzerVersion: "1.0.0",
          architectureRevisionId: "rev",
          status: "completed",
          findings: [],
          evidenceIds: [],
          durationMs: 5,
          executedAt: new Date().toISOString(),
        };
      },
    };

    const a2: ArchitectureAnalyzer = {
      definition: {
        id: "a2",
        version: "1.0.0",
        name: "a2",
        description: "",
        category: "foundation",
        dependencies: ["a1"],
        inputSelectors: [],
        outputKinds: [],
        executionMode: "local",
        deterministic: true,
        timeoutMs: 2000,
      },
      async analyze() {
        return {
          analyzerId: "a2",
          analyzerVersion: "1.0.0",
          architectureRevisionId: "rev",
          status: "completed",
          findings: [],
          evidenceIds: [],
          durationMs: 5,
          executedAt: new Date().toISOString(),
        };
      },
    };

    registry.register(a1);
    registry.register(a2);

    const context = AnalysisContextBuilder.build({ nodes: [], edges: [] });
    const plan = ExecutionPlanner.createPlan({
      revisionId: context.revisionId,
      definitions: [a1.definition, a2.definition],
    });

    const controller = new AbortController();
    controller.abort(); // Abort upfront

    const result = await WaveScheduler.execute(context, plan, registry, cache, controller.signal);

    expect(result.cancelled).toBe(true);
    expect(result.runRecords.every((r) => r.status === "cancelled")).toBe(true);
  });
});
