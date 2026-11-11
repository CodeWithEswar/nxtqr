/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Dependency-Aware Invalidation Planner
 */

import type { AnalyzerDefinition } from "../contracts/orchestration.types";
import { AnalyzerDependencyGraph } from "./dependency-graph";

export interface ChangeDelta {
  topologyChanged?: boolean;
  contractsChanged?: boolean;
  evidenceChanged?: boolean;
  policiesChanged?: boolean;
  scenariosChanged?: boolean;
  affectedComponentIds?: string[];
}

export interface InvalidationResult {
  directlyInvalidated: string[];
  cascadedInvalidated: string[];
  allInvalidated: string[];
}

export class InvalidationPlanner {
  private depGraph: AnalyzerDependencyGraph;
  private definitions: AnalyzerDefinition[];

  constructor(definitions: AnalyzerDefinition[]) {
    this.definitions = definitions;
    this.depGraph = new AnalyzerDependencyGraph(definitions);
  }

  /**
   * Identifies which analyzers must be invalidated based on the nature of the change delta,
   * plus all downstream transitive dependents.
   */
  public planInvalidation(delta: ChangeDelta): InvalidationResult {
    const directlyInvalidated = new Set<string>();

    for (const def of this.definitions) {
      if (delta.topologyChanged && (def.inputSelectors.includes("nodes") || def.inputSelectors.includes("edges") || def.inputSelectors.includes("graphIndex"))) {
        directlyInvalidated.add(def.id);
      }
      if (delta.contractsChanged && def.inputSelectors.includes("contracts")) {
        directlyInvalidated.add(def.id);
      }
      if (delta.evidenceChanged && (def.inputSelectors.includes("evidence") || def.requiresEvidence)) {
        directlyInvalidated.add(def.id);
      }
      if (delta.policiesChanged && def.inputSelectors.includes("policies")) {
        directlyInvalidated.add(def.id);
      }
      if (delta.scenariosChanged && def.inputSelectors.includes("scenarios")) {
        directlyInvalidated.add(def.id);
      }
    }

    // Cascade to downstream dependents
    const cascadedInvalidated = new Set<string>();
    for (const analyzerId of directlyInvalidated) {
      const downstream = this.depGraph.resolveTransitiveDependents(analyzerId);
      for (const dep of downstream) {
        if (!directlyInvalidated.has(dep)) {
          cascadedInvalidated.add(dep);
        }
      }
    }

    const allInvalidated = new Set([...directlyInvalidated, ...cascadedInvalidated]);

    return {
      directlyInvalidated: Array.from(directlyInvalidated).sort(),
      cascadedInvalidated: Array.from(cascadedInvalidated).sort(),
      allInvalidated: Array.from(allInvalidated).sort(),
    };
  }
}
