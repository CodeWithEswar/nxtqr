import { describe, it, expect } from "vitest";
import { MigrationDependencyGraph } from "../evolution/planning/dependency-graph";
import type { MigrationTask } from "../evolution/contracts/evolution.types";

describe("Phase 05.3.26 — Migration Dependency Graph & Topological Scheduler", () => {
  const tasks: MigrationTask[] = [
    {
      id: "task-1",
      waveId: "wave-1",
      title: "Provision Infrastructure",
      description: "Provision clusters",
      taskType: "provision_infrastructure",
      estimatedHours: 20,
      dependsOnTaskIds: [],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Destroy",
      status: "planned",
    },
    {
      id: "task-2",
      waveId: "wave-1",
      title: "Deploy Gateway Facade",
      description: "Deploy proxy",
      taskType: "deploy_facade",
      estimatedHours: 30,
      dependsOnTaskIds: ["task-1"],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Repoint DNS",
      status: "planned",
    },
    {
      id: "task-3",
      waveId: "wave-2",
      title: "Target Schema Expand",
      description: "Expand schema",
      taskType: "schema_expand",
      estimatedHours: 15,
      dependsOnTaskIds: ["task-2"],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Drop tables",
      status: "planned",
    },
    {
      id: "task-4",
      waveId: "wave-3",
      title: "Service Extraction",
      description: "Extract microservice",
      taskType: "extract_service",
      estimatedHours: 40,
      dependsOnTaskIds: ["task-3"],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Scale to 0",
      status: "planned",
    },
  ];

  it("computes valid topological sort and critical path for acyclic DAG", () => {
    const graph = new MigrationDependencyGraph(tasks);
    const analysis = graph.analyze();

    expect(analysis.hasCycle).toBe(false);
    expect(analysis.cycles).toHaveLength(0);
    expect(analysis.topologicalOrder).toEqual(["task-1", "task-2", "task-3", "task-4"]);

    // Total duration: 20 + 30 + 15 + 40 = 105 hours
    expect(analysis.estimatedTotalHours).toBe(105);
    expect(analysis.criticalPathTaskIds).toEqual(["task-1", "task-2", "task-3", "task-4"]);

    // Verify task schedule metrics
    const t1Metrics = analysis.scheduleMetrics.get("task-1");
    expect(t1Metrics?.earliestStart).toBe(0);
    expect(t1Metrics?.earliestFinish).toBe(20);
    expect(t1Metrics?.slack).toBe(0);
    expect(t1Metrics?.isCritical).toBe(true);

    const t4Metrics = analysis.scheduleMetrics.get("task-4");
    expect(t4Metrics?.earliestStart).toBe(65);
    expect(t4Metrics?.earliestFinish).toBe(105);
    expect(t4Metrics?.isCritical).toBe(true);
  });

  it("identifies parallel non-critical tasks with positive slack", () => {
    const parallelTask: MigrationTask = {
      id: "task-aux",
      waveId: "wave-2",
      title: "Deploy Documentation Portal",
      description: "Deploy internal docs",
      taskType: "provision_infrastructure",
      estimatedHours: 5,
      dependsOnTaskIds: ["task-1"],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Destroy",
      status: "planned",
    };

    const graph = new MigrationDependencyGraph([...tasks, parallelTask]);
    const analysis = graph.analyze();

    expect(analysis.hasCycle).toBe(false);
    expect(analysis.estimatedTotalHours).toBe(105);

    // Aux task starts at 20, finishes at 25, but project finishes at 105
    const auxMetrics = analysis.scheduleMetrics.get("task-aux");
    expect(auxMetrics?.isCritical).toBe(false);
    expect(auxMetrics?.slack).toBeGreaterThan(0);
  });

  it("detects circular prerequisite dependency cycles via Tarjan SCC algorithm", () => {
    const cyclicTasks: MigrationTask[] = [
      {
        id: "c-task-a",
        waveId: "wave-1",
        title: "Task A",
        description: "Depends on B",
        taskType: "provision_infrastructure",
        estimatedHours: 10,
        dependsOnTaskIds: ["c-task-b"], // Cyclic dependency!
        verificationGateIds: [],
        isPointOfNoReturn: false,
        rollbackProcedure: "none",
        status: "planned",
      },
      {
        id: "c-task-b",
        waveId: "wave-1",
        title: "Task B",
        description: "Depends on A",
        taskType: "extract_service",
        estimatedHours: 10,
        dependsOnTaskIds: ["c-task-a"], // Cyclic dependency!
        verificationGateIds: [],
        isPointOfNoReturn: false,
        rollbackProcedure: "none",
        status: "planned",
      },
    ];

    const graph = new MigrationDependencyGraph(cyclicTasks);
    const analysis = graph.analyze();

    expect(analysis.hasCycle).toBe(true);
    expect(analysis.cycles.length).toBeGreaterThan(0);
    expect(analysis.topologicalOrder).toHaveLength(0);
    expect(analysis.estimatedTotalHours).toBe(0);
  });
});

