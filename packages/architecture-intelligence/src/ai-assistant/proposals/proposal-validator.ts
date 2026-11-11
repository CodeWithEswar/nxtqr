import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { AIArchitectureProposal } from "../contracts/ai-assistant.types";
import { GraphProposalApplier } from "../../scalability/planner/graph-proposals";
import { architectureValidationEngine } from "@nxtqr/architecture-validation";
import { infrastructureRegistry } from "@nxtqr/node-registry";
import { AIArchitectureProposalSchema } from "../schemas/ai-assistant.schemas";

export interface ProposalValidationResult {
  isValid: boolean;
  validationStatus: "valid" | "invalid";
  validationErrors: string[];
  proposedNodes: BaseNode[];
  proposedEdges: BaseEdge[];
  addedNodes: BaseNode[];
  removedNodeIds: string[];
  addedEdges: BaseEdge[];
  removedEdgeIds: string[];
  modifiedNodes: BaseNode[];
}

export class ProposalValidator {
  /**
   * Deterministically validates an AI-generated architecture proposal against the active graph
   * and architecture validation rules without mutating the original graph.
   */
  public static validate(
    proposal: AIArchitectureProposal,
    currentNodes: BaseNode[],
    currentEdges: BaseEdge[],
    expectedRevision?: string
  ): ProposalValidationResult {
    const errors: string[] = [];

    // 1. Schema Validation
    const schemaCheck = AIArchitectureProposalSchema.safeParse(proposal);
    if (!schemaCheck.success) {
      errors.push(...schemaCheck.error.errors.map((e) => `Schema error: ${e.path.join(".")} ${e.message}`));
    }

    // 2. Revision Check
    if (expectedRevision && proposal.baseGraphRevision !== expectedRevision) {
      errors.push(
        `Revision mismatch: proposal was generated on revision '${proposal.baseGraphRevision}', but active revision is '${expectedRevision}'.`
      );
    }

    // 3. Verify component types against Infrastructure Registry
    if (proposal.operations && Array.isArray(proposal.operations)) {
      for (const op of proposal.operations) {
        if (op.type === "add_node") {
          const type = op.node.type;
          const def = infrastructureRegistry.getComponent ? infrastructureRegistry.getComponent(type) : null;
          if (!def && !type.includes("-") && type !== "custom") {
            errors.push(`Unregistered component type '${type}' in proposed operation.`);
          }
        } else if (op.type === "insert_mediator") {
          const type = op.mediatorNode.type;
          const def = infrastructureRegistry.getComponent ? infrastructureRegistry.getComponent(type) : null;
          if (!def && !type.includes("-") && type !== "custom") {
            errors.push(`Unregistered mediator component type '${type}' in proposed operation.`);
          }
        }
      }
    }

    // 4. Apply operations non-destructively
    let appliedResult;
    try {
      appliedResult = GraphProposalApplier.applyOperations(
        currentNodes,
        currentEdges,
        proposal.operations || []
      );
    } catch (err: any) {
      errors.push(`Failed to apply proposal operations: ${err?.message || String(err)}`);
      return {
        isValid: false,
        validationStatus: "invalid",
        validationErrors: errors,
        proposedNodes: currentNodes,
        proposedEdges: currentEdges,
        addedNodes: [],
        removedNodeIds: [],
        addedEdges: [],
        removedEdgeIds: [],
        modifiedNodes: [],
      };
    }

    // 5. Run architecture validation engine on proposed graph
    const valResult = architectureValidationEngine.validateGraph(appliedResult.nodes, appliedResult.edges);
    const engineErrors = (valResult.findings || [])
      .filter((f) => f.severity === "error")
      .map((f) => `[${f.ruleId}] ${f.message}`);

    errors.push(...engineErrors);

    // Identify semantic diffs for preview
    const currentNodeIds = new Set(currentNodes.map((n) => n.id));
    const currentEdgeIds = new Set(currentEdges.map((e) => e.id));
    const proposedNodeIds = new Set(appliedResult.nodes.map((n) => n.id));
    const proposedEdgeIds = new Set(appliedResult.edges.map((e) => e.id));

    const addedNodes = appliedResult.nodes.filter((n) => !currentNodeIds.has(n.id));
    const removedNodeIds = currentNodes.filter((n) => !proposedNodeIds.has(n.id)).map((n) => n.id);
    const addedEdges = appliedResult.edges.filter((e) => !currentEdgeIds.has(e.id));
    const removedEdgeIds = currentEdges.filter((e) => !proposedEdgeIds.has(e.id)).map((e) => e.id);
    const modifiedNodes = appliedResult.nodes.filter((n) => {
      if (!currentNodeIds.has(n.id)) return false;
      const original = currentNodes.find((orig) => orig.id === n.id);
      return JSON.stringify(original?.data) !== JSON.stringify(n.data);
    });

    const isValid = errors.length === 0;

    return {
      isValid,
      validationStatus: isValid ? "valid" : "invalid",
      validationErrors: errors,
      proposedNodes: appliedResult.nodes,
      proposedEdges: appliedResult.edges,
      addedNodes,
      removedNodeIds,
      addedEdges,
      removedEdgeIds,
      modifiedNodes,
    };
  }
}
