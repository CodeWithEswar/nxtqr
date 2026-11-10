import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  ConnectionCandidate,
  ConnectionValidationResult,
  GraphValidationResult,
  ResolvedNodeContext,
} from "../contracts/validation.types";
import { connectionValidator } from "./connection-validator";
import { graphValidator } from "./graph-validator";
import { capabilityResolver } from "./capability-resolver";
import { portResolver } from "./port-resolver";

export class ArchitectureValidationEngine {
  public validateConnection(
    candidate: ConnectionCandidate,
    nodes: readonly BaseNode[],
    edges: readonly BaseEdge[],
  ): ConnectionValidationResult {
    return connectionValidator.validateConnection(candidate, nodes, edges);
  }

  public validateGraph(
    nodes: readonly BaseNode[],
    edges: readonly BaseEdge[],
  ): GraphValidationResult {
    return graphValidator.validateGraph(nodes, edges);
  }

  public resolveNodeContext(node: BaseNode): ResolvedNodeContext {
    return connectionValidator.resolveNodeContext(node);
  }

  public resolveCapabilities(node: BaseNode): readonly string[] {
    return capabilityResolver.resolveNodeCapabilities(node);
  }

  public resolvePorts(node: BaseNode) {
    return portResolver.resolveNodePorts(node);
  }

  public invalidateNode(nodeId: string): void {
    capabilityResolver.invalidate(nodeId);
  }

  public invalidateEdge(edgeId: string): void {
    graphValidator.invalidateEdge(edgeId);
  }

  public reset(): void {
    capabilityResolver.invalidate();
    graphValidator.clearCache();
  }
}

export const architectureValidationEngine = new ArchitectureValidationEngine();
