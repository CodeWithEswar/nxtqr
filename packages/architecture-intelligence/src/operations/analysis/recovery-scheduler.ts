/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Recovery Dependency Graph & Critical Path Scheduler
 */

import type {
  RecoveryDependency,
  RecoveryPlanResult,
  OperationalFinding,
} from "../contracts/operations.types";

export interface ScheduledRecoveryStep {
  componentId: string;
  orderIndex: number;
  earliestStartSeconds: number;
  durationSeconds: number;
  latestFinishSeconds: number;
  prerequisiteComponentIds: string[];
  isCriticalPath: boolean;
}

export class RecoveryScheduler {
  /**
   * Evaluates recovery dependencies, checks for cycles using Tarjan's SCC,
   * and computes a topological recovery sequence and critical path.
   */
  public static scheduleRecoverySequence(
    componentIds: string[],
    dependencies: RecoveryDependency[],
    durationOverrides: Map<string, number> = new Map()
  ): {
    plan: RecoveryPlanResult;
    scheduledSteps: ScheduledRecoveryStep[];
    findings: OperationalFinding[];
  } {
    const findings: OperationalFinding[] = [];
    const allComponents = Array.from(
      new Set<string>([
        ...componentIds,
        ...dependencies.map((d) => d.sourceComponentId),
        ...dependencies.map((d) => d.targetComponentId),
      ])
    );

    // Build directed graph:
    // sourceComponentId is a prerequisite for targetComponentId
    // Edge: source -> target
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const cid of allComponents) {
      adj.set(cid, []);
      inDegree.set(cid, 0);
    }

    for (const dep of dependencies) {
      adj.get(dep.sourceComponentId)?.push(dep.targetComponentId);
      inDegree.set(dep.targetComponentId, (inDegree.get(dep.targetComponentId) || 0) + 1);
    }

    // 1. Tarjan SCC Cycle Detection
    let index = 0;
    const indices = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const sccs: string[][] = [];

    function strongConnect(node: string) {
      indices.set(node, index);
      lowlink.set(node, index);
      index++;
      stack.push(node);
      onStack.add(node);

      for (const neighbor of adj.get(node) || []) {
        if (!indices.has(neighbor)) {
          strongConnect(neighbor);
          lowlink.set(node, Math.min(lowlink.get(node)!, lowlink.get(neighbor)!));
        } else if (onStack.has(neighbor)) {
          lowlink.set(node, Math.min(lowlink.get(node)!, indices.get(neighbor)!));
        }
      }

      if (lowlink.get(node) === indices.get(node)) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          component.push(w);
        } while (w !== node);

        if (component.length > 1) {
          sccs.push(component);
        }
      }
    }

    for (const cid of allComponents) {
      if (!indices.has(cid)) {
        strongConnect(cid);
      }
    }

    const hasCycles = sccs.length > 0;
    const cycleComponentIds: string[] = hasCycles ? sccs.flat() : [];

    if (hasCycles) {
      findings.push({
        id: "FND-RECOVERY-CYCLE-DETECTED",
        category: "recovery_dependency_cycle",
        severity: "critical",
        title: "Deadlock Detected in Recovery Dependency Graph",
        description: `Disaster recovery prerequisites contain circular dependencies among components [${cycleComponentIds.join(", ")}]. Recovery cannot execute deterministically.`,
        affectedComponentIds: cycleComponentIds,
        remediationRecommendation: "Break circular recovery prerequisites by establishing asynchronous decoupling, cached local identity fallbacks, or reordering initialization steps.",
      });

      return {
        plan: {
          criticalPathSeconds: 0,
          criticalPathStepsCount: 0,
          hasCycles: true,
          topologicalSequence: [],
          cycleComponentIds,
        },
        scheduledSteps: [],
        findings,
      };
    }

    // 2. Kahn's Algorithm for Topological Sort
    const queue: string[] = [];
    const currentInDegree = new Map<string, number>(inDegree);

    for (const [cid, deg] of currentInDegree.entries()) {
      if (deg === 0) {
        queue.push(cid);
      }
    }

    const topologicalSequence: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      topologicalSequence.push(u);

      for (const v of adj.get(u) || []) {
        currentInDegree.set(v, currentInDegree.get(v)! - 1);
        if (currentInDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    // 3. CPM: Forward Pass for Earliest Start & Critical Path
    const earliestStart = new Map<string, number>();
    const earliestFinish = new Map<string, number>();

    for (const cid of topologicalSequence) {
      const duration = durationOverrides.get(cid) ?? 300; // default 5 minutes (300s) if unknown
      let maxPredecessorFinish = 0;

      // Find all prerequisites of cid
      const prereqs = dependencies.filter((d) => d.targetComponentId === cid).map((d) => d.sourceComponentId);
      for (const p of prereqs) {
        const pFinish = earliestFinish.get(p) ?? 0;
        if (pFinish > maxPredecessorFinish) {
          maxPredecessorFinish = pFinish;
        }
      }

      earliestStart.set(cid, maxPredecessorFinish);
      earliestFinish.set(cid, maxPredecessorFinish + duration);
    }

    const totalDuration = Math.max(0, ...Array.from(earliestFinish.values()));

    // 4. Backward Pass for Latest Start and Slack
    const latestFinish = new Map<string, number>();
    const latestStart = new Map<string, number>();

    for (let i = topologicalSequence.length - 1; i >= 0; i--) {
      const cid = topologicalSequence[i];
      const duration = durationOverrides.get(cid) ?? 300;
      const successors = adj.get(cid) || [];

      let minSuccessorStart = totalDuration;
      for (const s of successors) {
        const sStart = latestStart.get(s) ?? totalDuration;
        if (sStart < minSuccessorStart) {
          minSuccessorStart = sStart;
        }
      }

      latestFinish.set(cid, minSuccessorStart);
      latestStart.set(cid, minSuccessorStart - duration);
    }

    const scheduledSteps: ScheduledRecoveryStep[] = [];
    let criticalPathStepsCount = 0;

    for (let i = 0; i < topologicalSequence.length; i++) {
      const cid = topologicalSequence[i];
      const es = earliestStart.get(cid) ?? 0;
      const ls = latestStart.get(cid) ?? 0;
      const duration = durationOverrides.get(cid) ?? 300;
      const lf = latestFinish.get(cid) ?? totalDuration;
      const isCritical = Math.abs(es - ls) < 0.001;

      if (isCritical) {
        criticalPathStepsCount++;
      }

      const prereqs = dependencies.filter((d) => d.targetComponentId === cid).map((d) => d.sourceComponentId);

      scheduledSteps.push({
        componentId: cid,
        orderIndex: i + 1,
        earliestStartSeconds: es,
        durationSeconds: duration,
        latestFinishSeconds: lf,
        prerequisiteComponentIds: prereqs,
        isCriticalPath: isCritical,
      });
    }

    return {
      plan: {
        criticalPathSeconds: totalDuration,
        criticalPathStepsCount,
        hasCycles: false,
        topologicalSequence,
      },
      scheduledSteps,
      findings,
    };
  }
}

