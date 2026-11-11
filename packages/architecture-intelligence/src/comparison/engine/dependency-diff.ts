import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ArchitectureChange } from "../contracts/comparison.types";

export interface DependencyAnalysisDelta {
  newSynchronousCouplings: Array<{ sourceId: string; targetId: string; edgeId: string }>;
  removedAsynchronousBoundaries: Array<{ sourceId: string; targetId: string }>;
  newCriticalDependencies: Array<{ callerId: string; dependencyId: string }>;
  sharedDependencyDeltas: Array<{ dependencyId: string; callerCountDelta: number }>;
}

export class DependencyDiff {
  public static analyzeDependencies(
    _baselineNodes: BaseNode[],
    _candidateNodes: BaseNode[],
    baselineEdges: BaseEdge[],
    candidateEdges: BaseEdge[],
    changes: ArchitectureChange[]
  ): DependencyAnalysisDelta {
    const newSynchronousCouplings: Array<{ sourceId: string; targetId: string; edgeId: string }> = [];
    const removedAsynchronousBoundaries: Array<{ sourceId: string; targetId: string }> = [];
    const newCriticalDependencies: Array<{ callerId: string; dependencyId: string }> = [];
    const sharedDependencyDeltas: Array<{ dependencyId: string; callerCountDelta: number }> = [];

    const baselineEdgeMap = new Map<string, BaseEdge>(
      baselineEdges.map((e) => [`${e.source}->${e.target}`, e])
    );

    // 1. Detect new synchronous couplings
    for (const cEdge of candidateEdges) {
      const isSync = cEdge.data?.isSynchronous !== false;
      const key = `${cEdge.source}->${cEdge.target}`;
      const bEdge = baselineEdgeMap.get(key);

      if (!bEdge && isSync) {
        newSynchronousCouplings.push({
          sourceId: cEdge.source,
          targetId: cEdge.target,
          edgeId: cEdge.id,
        });
      } else if (bEdge && bEdge.data?.isSynchronous === false && isSync) {
        // Converted from async to synchronous!
        newSynchronousCouplings.push({
          sourceId: cEdge.source,
          targetId: cEdge.target,
          edgeId: cEdge.id,
        });
      }
    }

    // 2. Detect removed asynchronous boundaries (e.g. queue mediator removed)
    const removedNodes = changes.filter((c) => c.kind === "removed" && c.entityType === "node");
    for (const rem of removedNodes) {
      if (rem.nodeType?.includes("queue") || rem.nodeType?.includes("stream")) {
        removedAsynchronousBoundaries.push({
          sourceId: rem.baselineId || "",
          targetId: rem.label || "",
        });
      }
    }

    // 3. Shared dependency fan-in comparison
    const baselineInDegree = new Map<string, number>();
    for (const e of baselineEdges) {
      baselineInDegree.set(e.target, (baselineInDegree.get(e.target) || 0) + 1);
    }

    const candidateInDegree = new Map<string, number>();
    for (const e of candidateEdges) {
      candidateInDegree.set(e.target, (candidateInDegree.get(e.target) || 0) + 1);
    }

    const allTargets = new Set([...baselineInDegree.keys(), ...candidateInDegree.keys()]);
    for (const target of allTargets) {
      const bDeg = baselineInDegree.get(target) || 0;
      const cDeg = candidateInDegree.get(target) || 0;
      if (bDeg !== cDeg) {
        sharedDependencyDeltas.push({
          dependencyId: target,
          callerCountDelta: cDeg - bDeg,
        });
      }
      if (bDeg === 0 && cDeg >= 2) {
        newCriticalDependencies.push({ callerId: "multiple", dependencyId: target });
      }
    }

    return {
      newSynchronousCouplings,
      removedAsynchronousBoundaries,
      newCriticalDependencies,
      sharedDependencyDeltas,
    };
  }
}
