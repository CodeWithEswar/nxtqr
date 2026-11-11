import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  ArchitectureChange,
  ChangeCategory,
  ChangeImpact,
  FieldDelta,
  MatchResolution,
} from "../contracts/comparison.types";
import { ConfigurationDiff } from "./configuration-diff";

export interface SemanticDiffOptions {
  includeUnchanged?: boolean;
  detectVisualChanges?: boolean;
}

export class SemanticDiff {
  public static diff(
    baselineNodes: BaseNode[],
    candidateNodes: BaseNode[],
    baselineEdges: BaseEdge[],
    candidateEdges: BaseEdge[],
    matchResolution: MatchResolution,
    options: SemanticDiffOptions = {}
  ): ArchitectureChange[] {
    const { includeUnchanged = false, detectVisualChanges = false } = options;
    const changes: ArchitectureChange[] = [];

    const baselineNodesById = new Map<string, BaseNode>(baselineNodes.map((n) => [n.id, n]));
    const candidateNodesById = new Map<string, BaseNode>(candidateNodes.map((n) => [n.id, n]));
    const baselineEdgesById = new Map<string, BaseEdge>(baselineEdges.map((e) => [e.id, e]));
    const candidateEdgesById = new Map<string, BaseEdge>(candidateEdges.map((e) => [e.id, e]));

    // 1. Added Nodes
    for (const candId of matchResolution.unmatchedCandidateNodeIds) {
      const cNode = candidateNodesById.get(candId)!;
      const compType = (cNode.data?.componentType as string) || cNode.type;

      const categories: ChangeCategory[] = ["topology"];
      if (this.isSecurityComponent(compType)) categories.push("security");
      if (this.isPersistenceComponent(compType)) categories.push("data-flow", "capacity");
      if (this.isMessagingComponent(compType)) categories.push("reliability", "scalability");

      const connectedEdges = candidateEdges.filter(
        (e) => e.source === candId || e.target === candId
      );

      changes.push({
        id: `change_add_node_${candId}`,
        kind: "added",
        entityType: "node",
        candidateId: candId,
        nodeType: compType,
        label: cNode.label || candId,
        changedFields: ["node"],
        fieldDeltas: [],
        categories,
        impact: {
          directlyAffectedNodeIds: [candId],
          indirectlyAffectedNodeIds: connectedEdges.map((e) =>
            e.source === candId ? e.target : e.source
          ),
          affectedEdgeIds: connectedEdges.map((e) => e.id),
          reliabilityImplications: [`Introduced new runtime entity "${cNode.label || candId}"`],
          securityImplications: [
            cNode.data?.publiclyAccessible
              ? "New public exposure point added"
              : "Internal component added",
          ],
          scalabilityImplications: [`Added component with type ${compType}`],
        },
        evidence: [
          {
            kind: "node",
            elementId: candId,
            description: `Added infrastructure node "${cNode.label || candId}" (${compType})`,
          },
        ],
      });
    }

    // 2. Removed Nodes
    for (const baseId of matchResolution.unmatchedBaselineNodeIds) {
      const bNode = baselineNodesById.get(baseId)!;
      const compType = (bNode.data?.componentType as string) || bNode.type;

      const categories: ChangeCategory[] = ["topology"];
      if (this.isSecurityComponent(compType)) categories.push("security");
      if (this.isPersistenceComponent(compType)) categories.push("data-flow");

      const priorConnectedEdges = baselineEdges.filter(
        (e) => e.source === baseId || e.target === baseId
      );

      changes.push({
        id: `change_remove_node_${baseId}`,
        kind: "removed",
        entityType: "node",
        baselineId: baseId,
        nodeType: compType,
        label: bNode.label || baseId,
        changedFields: ["node"],
        fieldDeltas: [],
        categories,
        impact: {
          directlyAffectedNodeIds: [baseId],
          indirectlyAffectedNodeIds: priorConnectedEdges.map((e) =>
            e.source === baseId ? e.target : e.source
          ),
          affectedEdgeIds: priorConnectedEdges.map((e) => e.id),
          reliabilityImplications: [
            `Removed component "${bNode.label || baseId}". Ensure dependent workloads are rerouted.`,
          ],
          securityImplications: [],
          scalabilityImplications: [],
        },
        evidence: [
          {
            kind: "node",
            elementId: baseId,
            description: `Decommissioned node "${bNode.label || baseId}" (${compType})`,
          },
        ],
      });
    }

    // 3. Modified & Unchanged Nodes
    for (const [baseId, candId] of matchResolution.matchedNodePairs.entries()) {
      const bNode = baselineNodesById.get(baseId)!;
      const cNode = candidateNodesById.get(candId)!;

      const bComp = (bNode.data?.componentType as string) || bNode.type;
      const cComp = (cNode.data?.componentType as string) || cNode.type;

      const { changedFields, fieldDeltas } = ConfigurationDiff.diffConfigs(
        bNode.data as Record<string, unknown>,
        cNode.data as Record<string, unknown>
      );

      const isLabelChanged = bNode.label !== cNode.label;
      if (isLabelChanged) {
        changedFields.push("label");
        fieldDeltas.push({
          fieldPath: "label",
          baselineValue: bNode.label,
          candidateValue: cNode.label,
        });
      }

      const isCompChanged = bComp !== cComp;
      if (isCompChanged) {
        changedFields.push("componentType");
        fieldDeltas.push({
          fieldPath: "componentType",
          baselineValue: bComp,
          candidateValue: cComp,
        });
      }

      // Check visual coordinate changes
      const isPosChanged =
        detectVisualChanges &&
        (Math.round(bNode.position.x) !== Math.round(cNode.position.x) ||
          Math.round(bNode.position.y) !== Math.round(cNode.position.y));

      if (isPosChanged) {
        changedFields.push("position");
      }

      const isModified = changedFields.length > 0;

      if (isModified) {
        const categories = this.classifyNodeChanges(changedFields, bComp);
        changes.push({
          id: `change_mod_node_${baseId}_${candId}`,
          kind: "modified",
          entityType: "node",
          baselineId: baseId,
          candidateId: candId,
          nodeType: cComp,
          label: cNode.label || bNode.label || candId,
          changedFields,
          fieldDeltas,
          categories,
          impact: this.resolveNodeChangeImpact(candId, changedFields, fieldDeltas, cComp),
          evidence: fieldDeltas.map((d) => ({
            kind: "property",
            elementId: candId,
            propertyKey: d.fieldPath,
            expectedValue: d.baselineValue,
            actualValue: d.candidateValue,
            description: `Field "${d.fieldPath}" modified from ${JSON.stringify(d.baselineValue)} to ${JSON.stringify(d.candidateValue)}${d.unit ? ` (${d.unit})` : ""}`,
          })),
        });
      } else if (includeUnchanged) {
        changes.push({
          id: `change_unchanged_node_${baseId}`,
          kind: "unchanged",
          entityType: "node",
          baselineId: baseId,
          candidateId: candId,
          nodeType: cComp,
          label: cNode.label || baseId,
          changedFields: [],
          fieldDeltas: [],
          categories: [],
          impact: {
            directlyAffectedNodeIds: [candId],
            indirectlyAffectedNodeIds: [],
            affectedEdgeIds: [],
            reliabilityImplications: [],
            securityImplications: [],
            scalabilityImplications: [],
          },
          evidence: [],
        });
      }
    }

    // 4. Added Edges
    for (const candEdgeId of matchResolution.unmatchedCandidateEdgeIds) {
      const cEdge = candidateEdgesById.get(candEdgeId)!;
      changes.push({
        id: `change_add_edge_${candEdgeId}`,
        kind: "added",
        entityType: "edge",
        candidateId: candEdgeId,
        label: cEdge.label || `${cEdge.source} -> ${cEdge.target}`,
        changedFields: ["edge"],
        fieldDeltas: [],
        categories: ["topology", "dependency"],
        impact: {
          directlyAffectedNodeIds: [cEdge.source, cEdge.target],
          indirectlyAffectedNodeIds: [],
          affectedEdgeIds: [candEdgeId],
          reliabilityImplications: [
            `Established new connection between ${cEdge.source} and ${cEdge.target}`,
          ],
          securityImplications: [
            cEdge.data?.encryptionInTransit
              ? "Encrypted communication path"
              : "Verify transport encryption",
          ],
          scalabilityImplications: [],
        },
        evidence: [
          {
            kind: "edge",
            elementId: candEdgeId,
            description: `Added connection from ${cEdge.source} to ${cEdge.target}`,
          },
        ],
      });
    }

    // 5. Removed Edges
    for (const baseEdgeId of matchResolution.unmatchedBaselineEdgeIds) {
      const bEdge = baselineEdgesById.get(baseEdgeId)!;
      changes.push({
        id: `change_remove_edge_${baseEdgeId}`,
        kind: "removed",
        entityType: "edge",
        baselineId: baseEdgeId,
        label: bEdge.label || `${bEdge.source} -> ${bEdge.target}`,
        changedFields: ["edge"],
        fieldDeltas: [],
        categories: ["topology", "dependency"],
        impact: {
          directlyAffectedNodeIds: [bEdge.source, bEdge.target],
          indirectlyAffectedNodeIds: [],
          affectedEdgeIds: [baseEdgeId],
          reliabilityImplications: [
            `Removed coupling between ${bEdge.source} and ${bEdge.target}`,
          ],
          securityImplications: [],
          scalabilityImplications: [],
        },
        evidence: [
          {
            kind: "edge",
            elementId: baseEdgeId,
            description: `Removed connection from ${bEdge.source} to ${bEdge.target}`,
          },
        ],
      });
    }

    // 6. Modified Edges
    for (const [baseEdgeId, candEdgeId] of matchResolution.matchedEdgePairs.entries()) {
      const bEdge = baselineEdgesById.get(baseEdgeId)!;
      const cEdge = candidateEdgesById.get(candEdgeId)!;

      const { changedFields, fieldDeltas } = ConfigurationDiff.diffConfigs(
        bEdge.data as Record<string, unknown>,
        cEdge.data as Record<string, unknown>
      );

      if (bEdge.sourceHandle !== cEdge.sourceHandle) {
        changedFields.push("sourceHandle");
        fieldDeltas.push({
          fieldPath: "sourceHandle",
          baselineValue: bEdge.sourceHandle,
          candidateValue: cEdge.sourceHandle,
        });
      }
      if (bEdge.targetHandle !== cEdge.targetHandle) {
        changedFields.push("targetHandle");
        fieldDeltas.push({
          fieldPath: "targetHandle",
          baselineValue: bEdge.targetHandle,
          candidateValue: cEdge.targetHandle,
        });
      }

      if (changedFields.length > 0) {
        const categories: ChangeCategory[] = ["configuration"];
        if (changedFields.some((f) => f.includes("protocol") || f.includes("sync"))) {
          categories.push("data-flow", "dependency");
        }
        if (changedFields.some((f) => f.includes("tls") || f.includes("auth"))) {
          categories.push("security");
        }
        if (changedFields.some((f) => f.includes("timeout") || f.includes("retry"))) {
          categories.push("reliability");
        }

        changes.push({
          id: `change_mod_edge_${baseEdgeId}_${candEdgeId}`,
          kind: "modified",
          entityType: "edge",
          baselineId: baseEdgeId,
          candidateId: candEdgeId,
          label: cEdge.label || `${cEdge.source} -> ${cEdge.target}`,
          changedFields,
          fieldDeltas,
          categories,
          impact: {
            directlyAffectedNodeIds: [cEdge.source, cEdge.target],
            indirectlyAffectedNodeIds: [],
            affectedEdgeIds: [candEdgeId],
            reliabilityImplications: [
              `Connection configuration modified (${changedFields.join(", ")})`,
            ],
            securityImplications: [],
            scalabilityImplications: [],
          },
          evidence: fieldDeltas.map((d) => ({
            kind: "property",
            elementId: candEdgeId,
            propertyKey: d.fieldPath,
            expectedValue: d.baselineValue,
            actualValue: d.candidateValue,
            description: `Edge property "${d.fieldPath}" changed from ${JSON.stringify(d.baselineValue)} to ${JSON.stringify(d.candidateValue)}`,
          })),
        });
      }
    }

    return changes;
  }

  private static classifyNodeChanges(changedFields: string[], _componentType: string): ChangeCategory[] {
    const cats = new Set<ChangeCategory>(["configuration"]);

    for (const f of changedFields) {
      const lower = f.toLowerCase();
      if (lower.includes("replicas") || lower.includes("capacity") || lower.includes("autoscale")) {
        cats.add("scalability");
        cats.add("capacity");
      }
      if (lower.includes("timeout") || lower.includes("retry") || lower.includes("fallback") || lower.includes("circuit")) {
        cats.add("reliability");
      }
      if (lower.includes("auth") || lower.includes("tls") || lower.includes("encrypt") || lower.includes("public")) {
        cats.add("security");
      }
      if (lower.includes("zone") || lower.includes("region") || lower.includes("az") || lower.includes("domain")) {
        cats.add("deployment");
      }
      if (lower === "position") {
        cats.add("visual-only");
      }
    }

    return Array.from(cats);
  }

  private static resolveNodeChangeImpact(
    nodeId: string,
    _changedFields: string[],
    fieldDeltas: FieldDelta[],
    _componentType: string
  ): ChangeImpact {
    const reliabilityImplications: string[] = [];
    const securityImplications: string[] = [];
    const scalabilityImplications: string[] = [];
    let capacityDeltaRps: number | undefined;

    for (const delta of fieldDeltas) {
      const key = delta.fieldPath.toLowerCase();

      if (key.includes("replicas") || key.includes("instancecount")) {
        const base = Number(delta.baselineValue) || 1;
        const cand = Number(delta.candidateValue) || 1;
        scalabilityImplications.push(`Replica count changed from ${base} to ${cand}`);
      }

      if (key.includes("timeout")) {
        reliabilityImplications.push(
          `Timeout updated: ${delta.baselineValue} -> ${delta.candidateValue} ms`
        );
      }

      if (key.includes("tls") || key.includes("auth")) {
        securityImplications.push(
          `Security policy modified on "${key}": ${delta.baselineValue} -> ${delta.candidateValue}`
        );
      }

      if (key.includes("capacityrps") || key.includes("throughput")) {
        const base = Number(delta.baselineValue) || 0;
        const cand = Number(delta.candidateValue) || 0;
        capacityDeltaRps = cand - base;
      }
    }

    return {
      directlyAffectedNodeIds: [nodeId],
      indirectlyAffectedNodeIds: [],
      affectedEdgeIds: [],
      reliabilityImplications,
      securityImplications,
      scalabilityImplications,
      capacityDeltaRps,
    };
  }

  private static isSecurityComponent(compType: string): boolean {
    return ["api-gateway", "reverse-proxy", "waf", "firewall", "auth-service"].includes(compType);
  }

  private static isPersistenceComponent(compType: string): boolean {
    return ["relational-database", "nosql-database", "document-store", "object-storage"].includes(
      compType
    );
  }

  private static isMessagingComponent(compType: string): boolean {
    return ["message-queue", "event-stream", "pub-sub", "kafka"].includes(compType);
  }
}
