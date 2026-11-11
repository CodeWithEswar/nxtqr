import { describe, it, expect } from "vitest";
import {
  RecoveryScheduler,
  type RecoveryDependency,
} from "../operations";

describe("Phase 05.3.27: Recovery Dependency Graph & Critical Path Scheduler", () => {
  it("detects cyclic deadlocks using Tarjan SCC and flags blocking findings", () => {
    // Cycle: A -> B -> C -> A
    const cyclicDeps: RecoveryDependency[] = [
      { id: "d1", sourceComponentId: "auth-svc", targetComponentId: "database", dependencyType: "infrastructure", isBlocking: true },
      { id: "d2", sourceComponentId: "database", targetComponentId: "secrets-vault", dependencyType: "secrets", isBlocking: true },
      { id: "d3", sourceComponentId: "secrets-vault", targetComponentId: "auth-svc", dependencyType: "identity", isBlocking: true },
    ];

    const result = RecoveryScheduler.scheduleRecoverySequence(
      ["auth-svc", "database", "secrets-vault"],
      cyclicDeps
    );

    expect(result.plan.hasCycles).toBe(true);
    expect(result.plan.topologicalSequence.length).toBe(0);
    expect(result.findings.length).toBe(1);
    expect(result.findings[0].category).toBe("recovery_dependency_cycle");
    expect(result.findings[0].description).toContain("circular dependencies");
  });

  it("schedules acyclic recovery sequence using Kahn topological sort", () => {
    // Valid DAG: dns -> gateway -> auth -> db -> backend
    const deps: RecoveryDependency[] = [
      { id: "d1", sourceComponentId: "dns", targetComponentId: "gateway", dependencyType: "network", isBlocking: true },
      { id: "d2", sourceComponentId: "gateway", targetComponentId: "auth", dependencyType: "identity", isBlocking: true },
      { id: "d3", sourceComponentId: "auth", targetComponentId: "db", dependencyType: "data", isBlocking: true },
      { id: "d4", sourceComponentId: "db", targetComponentId: "backend", dependencyType: "infrastructure", isBlocking: true },
    ];

    const result = RecoveryScheduler.scheduleRecoverySequence(
      ["dns", "gateway", "auth", "db", "backend"],
      deps
    );

    expect(result.plan.hasCycles).toBe(false);
    expect(result.plan.topologicalSequence).toEqual(["dns", "gateway", "auth", "db", "backend"]);
    expect(result.findings.length).toBe(0);
  });

  it("calculates Critical Path Method (CPM) duration bounds accurately", () => {
    // Parallel branches:
    // start (10s) -> branchA (100s) -> end (20s)
    // start (10s) -> branchB (200s) -> end (20s)  <-- Critical path = 10 + 200 + 20 = 230s
    const deps: RecoveryDependency[] = [
      { id: "d1", sourceComponentId: "start", targetComponentId: "branchA", dependencyType: "infrastructure", isBlocking: true },
      { id: "d2", sourceComponentId: "start", targetComponentId: "branchB", dependencyType: "infrastructure", isBlocking: true },
      { id: "d3", sourceComponentId: "branchA", targetComponentId: "end", dependencyType: "infrastructure", isBlocking: true },
      { id: "d4", sourceComponentId: "branchB", targetComponentId: "end", dependencyType: "infrastructure", isBlocking: true },
    ];

    const durations = new Map<string, number>([
      ["start", 10],
      ["branchA", 100],
      ["branchB", 200],
      ["end", 20],
    ]);

    const result = RecoveryScheduler.scheduleRecoverySequence(
      ["start", "branchA", "branchB", "end"],
      deps,
      durations
    );

    expect(result.plan.hasCycles).toBe(false);
    expect(result.plan.criticalPathSeconds).toBe(230);

    const stepStart = result.scheduledSteps.find((s) => s.componentId === "start")!;
    const stepA = result.scheduledSteps.find((s) => s.componentId === "branchA")!;
    const stepB = result.scheduledSteps.find((s) => s.componentId === "branchB")!;
    const stepEnd = result.scheduledSteps.find((s) => s.componentId === "end")!;

    expect(stepStart.isCriticalPath).toBe(true);
    expect(stepB.isCriticalPath).toBe(true);
    expect(stepEnd.isCriticalPath).toBe(true);
    expect(stepA.isCriticalPath).toBe(false); // Has slack!
  });
});

