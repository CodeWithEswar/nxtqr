/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Evolution Drift Analyzer
 * Detects scope creep, unplanned architectural changes, and broken prerequisites between baseline plan and current state.
 */

import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";
import type {
  MigrationDrift,
  MigrationDriftItem,
  MigrationProject,
} from "../contracts/evolution.types";

export class EvolutionDriftAnalyzer {
  /**
   * Compares the baseline migration project target architecture against the current architecture snapshot.
   */
  public static analyzeDrift(
    baselineProject: MigrationProject,
    currentSnapshot: ArchitectureSnapshot
  ): MigrationDrift {
    const driftItems: MigrationDriftItem[] = [];
    let driftCount = 1;
    const makeDriftId = () => `${baselineProject.id}-drift-${driftCount++}`;

    const plannedTargetNodeIds = new Set(baselineProject.targetSnapshot.nodes.map((n) => n.id));

    // 1. Detect Unplanned Components in Current Architecture
    for (const node of currentSnapshot.nodes) {
      if (!plannedTargetNodeIds.has(node.id) && !baselineProject.sourceSnapshot.nodes.some((sn) => sn.id === node.id)) {
        driftItems.push({
          id: makeDriftId(),
          driftType: "unplanned_change",
          description: `Component '${node.data.label || node.id}' (${node.data.nodeType}) detected in current architecture but is absent from the approved target evolution blueprint.`,
          severity: "high",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Check for Missing Prerequisite Verification Gates
    for (const gate of baselineProject.gates) {
      if (gate.status === "failed") {
        driftItems.push({
          id: makeDriftId(),
          driftType: "missing_prerequisite",
          description: `Verification gate '${gate.title}' failed verification: ${gate.evaluationNotes}`,
          severity: "critical",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Detect Unmitigated Dependencies
    const plannedTargetEdges = new Set(
      baselineProject.targetSnapshot.edges.map((e) => `${e.source}->${e.target}`)
    );
    for (const edge of currentSnapshot.edges) {
      const edgeKey = `${edge.source}->${edge.target}`;
      if (!plannedTargetEdges.has(edgeKey)) {
        driftItems.push({
          id: makeDriftId(),
          driftType: "unmitigated_dependency",
          description: `Unplanned dependency link between '${edge.source}' and '${edge.target}' observed in current topology, bypassing planned boundary isolation.`,
          severity: "medium",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 4. Check for Scope Creep
    if (baselineProject.requirements.length > 15) {
      driftItems.push({
        id: makeDriftId(),
        driftType: "scope_creep",
        description: `Project contains ${baselineProject.requirements.length} requirements. High requirement volume elevates cross-wave synchronization hazard.`,
        severity: "low",
        detectedAt: new Date().toISOString(),
      });
    }

    const hasRegressions = driftItems.some((d) => d.severity === "critical" || d.severity === "high");

    return {
      id: `${baselineProject.id}-drift-report`,
      projectId: baselineProject.id,
      baselineRevision: baselineProject.targetRevisionId || baselineProject.targetSnapshot.revision,
      currentRevision: currentSnapshot.revision,
      driftItems,
      hasRegressions,
      analyzedAt: new Date().toISOString(),
    };
  }
}
