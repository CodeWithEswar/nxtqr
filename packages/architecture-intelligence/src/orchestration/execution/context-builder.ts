/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Canonical Analysis Context Builder
 */

import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { GraphIndex } from "../../core/graph-index";
import type {
  CanonicalAnalysisContext,
  NormalizedEvidenceReference,
  OrchestrationConfiguration,
} from "../contracts/orchestration.types";

export interface BuildContextOptions {
  projectId?: string;
  architectureId?: string;
  revisionId?: string;
  revisionHash?: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  evidenceCatalog?: NormalizedEvidenceReference[];
  scenarioInputs?: Record<string, any>;
  configuration?: Partial<OrchestrationConfiguration>;
}

export class AnalysisContextBuilder {
  /**
   * Generates a deterministic lightweight hash of graph topology and metadata.
   */
  public static computeRevisionHash(nodes: BaseNode[], edges: BaseEdge[]): string {
    const sortedNodeIds = nodes.map((n) => n.id).sort().join(",");
    const sortedEdgeIds = edges.map((e) => `${e.source}->${e.target}`).sort().join(",");
    const summary = `${nodes.length}:${edges.length}:${sortedNodeIds}:${sortedEdgeIds}`;

    // Simple deterministic string hash
    let hash = 0;
    for (let i = 0; i < summary.length; i++) {
      const char = summary.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `rev_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Builds the canonical analysis context required for orchestration.
   */
  public static build(options: BuildContextOptions): CanonicalAnalysisContext {
    const projectId = options.projectId || "default-project";
    const architectureId = options.architectureId || "default-arch";
    const revisionId = options.revisionId || `rev-${Date.now()}`;
    const revisionHash =
      options.revisionHash || this.computeRevisionHash(options.nodes, options.edges);

    const configuration: OrchestrationConfiguration = {
      maxConcurrency: options.configuration?.maxConcurrency ?? 4,
      overallTimeoutMs: options.configuration?.overallTimeoutMs ?? 30000,
      enableCache: options.configuration?.enableCache ?? true,
      failFast: options.configuration?.failFast ?? false,
    };

    const graphIndex = new GraphIndex(options.nodes, options.edges);

    return {
      projectId,
      architectureId,
      revisionId,
      revisionHash,
      nodes: options.nodes,
      edges: options.edges,
      graphIndex,
      evidenceCatalog: options.evidenceCatalog || [],
      scenarioInputs: options.scenarioInputs || {},
      configuration,
      sharedFindings: new Map(),
    };
  }
}
