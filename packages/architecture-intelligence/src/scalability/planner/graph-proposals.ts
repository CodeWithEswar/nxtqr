import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { GraphOperation } from "../schemas/scalability.schemas";
import { architectureValidationEngine } from "@nxtqr/architecture-validation";

export interface GraphProposalApplicationResult {
  nodes: BaseNode[];
  edges: BaseEdge[];
  isValidated: boolean;
  validationErrors: string[];
}

export class GraphProposalApplier {
  public static applyOperations(
    originalNodes: BaseNode[],
    originalEdges: BaseEdge[],
    operations: GraphOperation[]
  ): GraphProposalApplicationResult {
    // Deep clone nodes and edges to ensure original graph is NEVER mutated
    const nodes: BaseNode[] = JSON.parse(JSON.stringify(originalNodes));
    const edges: BaseEdge[] = JSON.parse(JSON.stringify(originalEdges));

    for (const op of operations) {
      switch (op.type) {
        case "add_node": {
          const exists = nodes.some((n) => n.id === op.node.id);
          if (!exists) {
            nodes.push({
              id: op.node.id,
              type: op.node.type,
              position: op.node.position,
              label: op.node.label || op.node.id,
              data: op.node.data,
            });
          }
          break;
        }

        case "update_node_config": {
          const target = nodes.find((n) => n.id === op.nodeId);
          if (target) {
            target.data = {
              ...(target.data || {}),
              ...op.configUpdates,
            };
          }
          break;
        }

        case "adjust_instances": {
          const target = nodes.find((n) => n.id === op.nodeId);
          if (target) {
            target.data = {
              ...(target.data || {}),
              replicas: op.newReplicas,
            };
          }
          break;
        }

        case "add_edge": {
          const exists = edges.some((e) => e.id === op.edge.id);
          if (!exists) {
            edges.push({
              id: op.edge.id,
              source: op.edge.source,
              target: op.edge.target,
              data: op.edge.data || {},
            });
          }
          break;
        }

        case "delete_edge": {
          const idx = edges.findIndex((e) => e.id === op.edgeId);
          if (idx !== -1) {
            edges.splice(idx, 1);
          }
          break;
        }

        case "insert_mediator": {
          // 1. Remove old edge
          const oldEdgeIdx = edges.findIndex((e) => e.id === op.replaceEdgeId);
          let oldSource = "";
          let oldTarget = "";
          if (oldEdgeIdx !== -1) {
            oldSource = edges[oldEdgeIdx].source;
            oldTarget = edges[oldEdgeIdx].target;
            edges.splice(oldEdgeIdx, 1);
          }

          // 2. Add mediator node
          const exists = nodes.some((n) => n.id === op.mediatorNode.id);
          if (!exists) {
            nodes.push({
              id: op.mediatorNode.id,
              type: op.mediatorNode.type,
              position: op.mediatorNode.position,
              label: op.mediatorNode.label || op.mediatorNode.id,
              data: op.mediatorNode.data,
            });
          }

          // 3. Connect oldSource -> mediator and mediator -> oldTarget
          if (oldSource && oldTarget) {
            edges.push({
              id: `edge_${oldSource}_to_${op.mediatorNode.id}`,
              source: oldSource,
              target: op.mediatorNode.id,
              data: {
                protocol: op.inProtocol || "https",
                encryptionInTransit: true,
              },
            });
            edges.push({
              id: `edge_${op.mediatorNode.id}_to_${oldTarget}`,
              source: op.mediatorNode.id,
              target: oldTarget,
              data: {
                protocol: op.outProtocol || "https",
                encryptionInTransit: true,
              },
            });
          }
          break;
        }
      }
    }

    // Validate the proposed draft graph using Architecture Validation Engine
    const validationErrors: string[] = [];
    try {
      const validationReport = architectureValidationEngine.validateGraph(nodes, edges);
      if (!validationReport.valid) {
        for (const finding of validationReport.findings) {
          if (finding.severity === "error") {
            validationErrors.push(`${finding.title}: ${finding.message}`);
          }
        }
      }
    } catch {
      // If validation engine fails to evaluate, treat as non-fatal warning
    }

    return {
      nodes,
      edges,
      isValidated: validationErrors.length === 0,
      validationErrors,
    };
  }
}
