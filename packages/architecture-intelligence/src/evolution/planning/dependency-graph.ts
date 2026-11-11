/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Migration Dependency Graph & Topological Scheduler
 * Features: Strongly Connected Components (SCC) cycle detection, Kahn's topological sort, and Critical Path Method (CPM).
 */

import type {
  MigrationDependency,
  MigrationTask,
} from "../contracts/evolution.types";

export interface TaskScheduleMetrics {
  taskId: string;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
}

export interface DependencyAnalysisResult {
  hasCycle: boolean;
  cycles: string[][]; // Array of task IDs in each detected cycle
  topologicalOrder: string[]; // Valid task execution sequence (empty if cycles exist)
  criticalPathTaskIds: string[]; // Tasks on the longest execution path
  estimatedTotalHours: number; // Duration of the critical path
  scheduleMetrics: Map<string, TaskScheduleMetrics>;
}

export class MigrationDependencyGraph {
  private tasks: Map<string, MigrationTask> = new Map();
  private dependencies: MigrationDependency[] = [];
  private adjacencyList: Map<string, Set<string>> = new Map(); // sourceTaskId -> set of dependent targetTaskIds
  private reverseAdjacencyList: Map<string, Set<string>> = new Map(); // targetTaskId -> set of prerequisite sourceTaskIds

  constructor(tasks: MigrationTask[] = [], dependencies: MigrationDependency[] = []) {
    for (const t of tasks) {
      this.addTask(t);
    }
    for (const d of dependencies) {
      this.addDependency(d);
    }
  }

  public addTask(task: MigrationTask): void {
    this.tasks.set(task.id, task);
    if (!this.adjacencyList.has(task.id)) {
      this.adjacencyList.set(task.id, new Set());
    }
    if (!this.reverseAdjacencyList.has(task.id)) {
      this.reverseAdjacencyList.set(task.id, new Set());
    }

    // Also register implicit dependencies from task.dependsOnTaskIds
    if (task.dependsOnTaskIds && Array.isArray(task.dependsOnTaskIds)) {
      for (const prereqId of task.dependsOnTaskIds) {
        this.addDependency({
          id: `dep-${prereqId}-to-${task.id}`,
          sourceTaskId: prereqId,
          targetTaskId: task.id,
          dependencyType: "finish_to_start",
          isBlocking: true,
        });
      }
    }
  }

  public addDependency(dependency: MigrationDependency): void {
    this.dependencies.push(dependency);
    if (!this.adjacencyList.has(dependency.sourceTaskId)) {
      this.adjacencyList.set(dependency.sourceTaskId, new Set());
    }
    if (!this.adjacencyList.has(dependency.targetTaskId)) {
      this.adjacencyList.set(dependency.targetTaskId, new Set());
    }
    if (!this.reverseAdjacencyList.has(dependency.sourceTaskId)) {
      this.reverseAdjacencyList.set(dependency.sourceTaskId, new Set());
    }
    if (!this.reverseAdjacencyList.has(dependency.targetTaskId)) {
      this.reverseAdjacencyList.set(dependency.targetTaskId, new Set());
    }

    this.adjacencyList.get(dependency.sourceTaskId)!.add(dependency.targetTaskId);
    this.reverseAdjacencyList.get(dependency.targetTaskId)!.add(dependency.sourceTaskId);
  }

  /**
   * Tarjan's Strongly Connected Components algorithm for robust cycle detection.
   */
  public detectCycles(): string[][] {
    let index = 0;
    const indices = new Map<string, number>();
    const lowlinks = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const stronglyConnectedComponents: string[][] = [];

    const strongConnect = (nodeId: string) => {
      indices.set(nodeId, index);
      lowlinks.set(nodeId, index);
      index++;
      stack.push(nodeId);
      onStack.add(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (!indices.has(neighbor)) {
          strongConnect(neighbor);
          lowlinks.set(nodeId, Math.min(lowlinks.get(nodeId)!, lowlinks.get(neighbor)!));
        } else if (onStack.has(neighbor)) {
          lowlinks.set(nodeId, Math.min(lowlinks.get(nodeId)!, indices.get(neighbor)!));
        }
      }

      // Check if root of SCC
      if (lowlinks.get(nodeId) === indices.get(nodeId)) {
        const scc: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          scc.push(w);
        } while (w !== nodeId);

        // An SCC is a cycle if it contains more than 1 node, or 1 node with a self-loop
        if (scc.length > 1) {
          stronglyConnectedComponents.push(scc);
        } else if (scc.length === 1) {
          const single = scc[0];
          if (this.adjacencyList.get(single)?.has(single)) {
            stronglyConnectedComponents.push([single]);
          }
        }
      }
    };

    for (const taskId of this.tasks.keys()) {
      if (!indices.has(taskId)) {
        strongConnect(taskId);
      }
    }

    return stronglyConnectedComponents;
  }

  /**
   * Performs Kahn's algorithm for topological sorting and computes Critical Path Method (CPM).
   */
  public analyze(): DependencyAnalysisResult {
    const cycles = this.detectCycles();
    const hasCycle = cycles.length > 0;

    if (hasCycle) {
      return {
        hasCycle: true,
        cycles,
        topologicalOrder: [],
        criticalPathTaskIds: [],
        estimatedTotalHours: 0,
        scheduleMetrics: new Map(),
      };
    }

    // 1. Kahn's algorithm for topological sort
    const inDegree = new Map<string, number>();
    for (const taskId of this.tasks.keys()) {
      const prereqs = this.reverseAdjacencyList.get(taskId) || new Set();
      inDegree.set(taskId, prereqs.size);
    }

    const queue: string[] = [];
    for (const [taskId, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(taskId);
      }
    }

    const topologicalOrder: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      topologicalOrder.push(u);

      const dependents = this.adjacencyList.get(u) || new Set();
      for (const v of dependents) {
        const newDeg = (inDegree.get(v) || 0) - 1;
        inDegree.set(v, newDeg);
        if (newDeg === 0) {
          queue.push(v);
        }
      }
    }

    // 2. Critical Path Method (CPM): Forward Pass (Earliest Start / Finish)
    const earliestStart = new Map<string, number>();
    const earliestFinish = new Map<string, number>();

    for (const taskId of topologicalOrder) {
      const task = this.tasks.get(taskId);
      const duration = task ? task.estimatedHours : 0;
      const prereqs = this.reverseAdjacencyList.get(taskId) || new Set();

      let maxPrereqFinish = 0;
      for (const p of prereqs) {
        const pFinish = earliestFinish.get(p) || 0;
        if (pFinish > maxPrereqFinish) {
          maxPrereqFinish = pFinish;
        }
      }

      const es = maxPrereqFinish;
      const ef = es + duration;
      earliestStart.set(taskId, es);
      earliestFinish.set(taskId, ef);
    }

    const totalProjectDuration = Math.max(0, ...Array.from(earliestFinish.values()));

    // 3. CPM: Backward Pass (Latest Start / Finish)
    const latestFinish = new Map<string, number>();
    const latestStart = new Map<string, number>();

    for (let i = topologicalOrder.length - 1; i >= 0; i--) {
      const taskId = topologicalOrder[i];
      const task = this.tasks.get(taskId);
      const duration = task ? task.estimatedHours : 0;
      const dependents = this.adjacencyList.get(taskId) || new Set();

      let minDepStart = totalProjectDuration;
      if (dependents.size > 0) {
        for (const d of dependents) {
          const dStart = latestStart.get(d) ?? totalProjectDuration;
          if (dStart < minDepStart) {
            minDepStart = dStart;
          }
        }
      }

      const lf = minDepStart;
      const ls = lf - duration;
      latestFinish.set(taskId, lf);
      latestStart.set(taskId, ls);
    }

    // 4. Slack calculation & Critical Path Identification
    const scheduleMetrics = new Map<string, TaskScheduleMetrics>();
    const criticalPathTaskIds: string[] = [];

    for (const taskId of topologicalOrder) {
      const es = earliestStart.get(taskId) || 0;
      const ef = earliestFinish.get(taskId) || 0;
      const ls = latestStart.get(taskId) ?? es;
      const lf = latestFinish.get(taskId) ?? ef;
      const slack = Math.max(0, ls - es);
      const isCritical = slack === 0;

      if (isCritical) {
        criticalPathTaskIds.push(taskId);
      }

      scheduleMetrics.set(taskId, {
        taskId,
        earliestStart: es,
        earliestFinish: ef,
        latestStart: ls,
        latestFinish: lf,
        slack,
        isCritical,
      });
    }

    return {
      hasCycle: false,
      cycles: [],
      topologicalOrder,
      criticalPathTaskIds,
      estimatedTotalHours: totalProjectDuration,
      scheduleMetrics,
    };
  }
}

