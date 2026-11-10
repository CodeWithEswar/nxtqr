import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  ConnectionCandidate,
  ConnectionDecision,
  ConnectionValidationResult,
  RelationshipKind,
  ResolvedNodeContext,
  RuleEvaluationContext,
  ValidationFinding,
} from "../contracts/validation.types";
import { ALL_VALIDATION_RULES } from "../rules";
import { capabilityResolver } from "./capability-resolver";
import { portResolver } from "./port-resolver";
import { FindingAggregator } from "./finding-aggregator";
import { getDocumentationLink } from "../messages/validation-messages";

export class ConnectionValidator {
  public validateConnection(
    candidate: ConnectionCandidate,
    nodes: readonly BaseNode[],
    edges: readonly BaseEdge[],
    nodeMap?: Map<string, BaseNode>,
    contextCache?: Map<string, ResolvedNodeContext>,
  ): ConnectionValidationResult {
    const sourceNode = nodeMap
      ? nodeMap.get(candidate.sourceNodeId)
      : nodes.find((n) => n.id === candidate.sourceNodeId);
    const targetNode = nodeMap
      ? nodeMap.get(candidate.targetNodeId)
      : nodes.find((n) => n.id === candidate.targetNodeId);

    // Resolve context for source and target
    const sourceContext = sourceNode
      ? contextCache
        ? (contextCache.get(sourceNode.id) ??
          (() => {
            const ctx = this.resolveNodeContext(sourceNode);
            contextCache.set(sourceNode.id, ctx);
            return ctx;
          })())
        : this.resolveNodeContext(sourceNode)
      : undefined;

    const targetContext = targetNode
      ? contextCache
        ? (contextCache.get(targetNode.id) ??
          (() => {
            const ctx = this.resolveNodeContext(targetNode);
            contextCache.set(targetNode.id, ctx);
            return ctx;
          })())
        : this.resolveNodeContext(targetNode)
      : undefined;

    const sourcePort = sourceContext
      ? portResolver.findPort(sourceContext.ports, candidate.sourceHandleId)
      : undefined;
    const targetPort = targetContext
      ? portResolver.findPort(targetContext.ports, candidate.targetHandleId)
      : undefined;

    const evalContext: RuleEvaluationContext = {
      nodes,
      edges,
      candidate,
      sourceContext,
      targetContext,
      sourcePort,
      targetPort,
    };

    const findings: ValidationFinding[] = [];

    // Run rules in ordered sequence
    for (const rule of ALL_VALIDATION_RULES) {
      const outcome = rule.evaluate(evalContext);
      if (outcome) {
        const docTarget = outcome.documentationId
          ? getDocumentationLink(outcome.documentationId)
          : undefined;

        findings.push({
          id: `fnd_${rule.id}_${candidate.sourceNodeId}_${candidate.targetNodeId}`,
          ruleId: rule.id,
          category: outcome.category,
          severity: outcome.severity,
          title: outcome.title,
          message: outcome.message,
          explanation: outcome.explanation,
          sourceNodeId: candidate.sourceNodeId,
          targetNodeId: candidate.targetNodeId,
          sourcePortId: candidate.sourceHandleId ?? undefined,
          targetPortId: candidate.targetHandleId ?? undefined,
          documentationId: outcome.documentationId,
          documentationPath: docTarget?.path,
          suggestedActions: outcome.suggestedActions,
          timestamp: Date.now(),
        });
      }
    }

    const deduplicated = FindingAggregator.deduplicateFindings(findings);

    // Determine ConnectionDecision
    const hasError = deduplicated.some((f) => f.severity === "error");
    const hasRequiresConfig = deduplicated.some(
      (f) => f.ruleId.includes("CONFIG") || f.ruleId.includes("GRPC"),
    );
    const hasWarning = deduplicated.some((f) => f.severity === "warning");

    let decision: ConnectionDecision = "allowed";
    if (hasError) {
      decision = "rejected";
    } else if (hasRequiresConfig) {
      decision = "requires-configuration";
    } else if (hasWarning) {
      decision = "allowed-with-warnings";
    }

    // Infer resolved relationship & protocol
    const resolvedRelationship = this.inferRelationship(sourcePort, targetPort, sourceContext, targetContext);
    const resolvedProtocol = this.inferProtocol(sourcePort, targetPort);

    return {
      decision,
      valid: decision !== "rejected",
      findings: deduplicated,
      resolvedRelationship,
      resolvedProtocolId: resolvedProtocol,
    };
  }

  public resolveNodeContext(node: BaseNode): ResolvedNodeContext {
    const componentId =
      (node.data?.componentType as string) ||
      (node.data?.componentId as string) ||
      node.type ||
      "custom";
    const categoryId = (node.data?.categoryId as string) || "";
    const capabilities = capabilityResolver.resolveNodeCapabilities(node);
    const ports = portResolver.resolveNodePorts(node);
    const config = (node.data || {}) as Record<string, unknown>;

    const isBoundary =
      categoryId === "architecture-and-diagram-utilities" ||
      componentId.includes("boundary") ||
      componentId.includes("zone");
    const isAnnotation =
      componentId.includes("note") ||
      componentId.includes("annotation") ||
      componentId.includes("label");

    return {
      node,
      componentId,
      categoryId,
      capabilities,
      ports,
      config,
      isBoundary,
      isAnnotation,
    };
  }

  private inferRelationship(
    srcPort?: { relationshipKinds: RelationshipKind[] },
    tgtPort?: { relationshipKinds: RelationshipKind[] },
    srcCtx?: ResolvedNodeContext,
    tgtCtx?: ResolvedNodeContext,
  ): RelationshipKind {
    if (srcCtx?.componentId.includes("replica") || tgtPort?.relationshipKinds.includes("replication")) {
      return "replication";
    }
    if (srcCtx?.categoryId === "messaging-and-event-systems" || tgtCtx?.categoryId === "messaging-and-event-systems") {
      return "publish-subscribe";
    }
    if (tgtCtx?.categoryId === "databases-and-persistence") {
      return "database-access";
    }
    if (tgtCtx?.categoryId === "caching-and-performance") {
      return "cache-access";
    }
    if (tgtCtx?.categoryId === "storage-and-file-systems") {
      return "storage-access";
    }
    if (tgtCtx?.categoryId === "observability-and-reliability") {
      return "observability";
    }
    if (srcPort?.relationshipKinds.includes("stream") || tgtPort?.relationshipKinds.includes("stream")) {
      return "stream";
    }
    return "request-response";
  }

  private inferProtocol(
    srcPort?: { protocols: string[] },
    tgtPort?: { protocols: string[] },
  ): string {
    const srcProtocols = srcPort?.protocols ?? [];
    const tgtProtocols = tgtPort?.protocols ?? [];

    const common = srcProtocols.filter((p) => tgtProtocols.includes(p));
    if (common.length > 0) {
      if (common.includes("https")) return "https";
      if (common.includes("grpc")) return "grpc";
      if (common.includes("websocket")) return "websocket";
      return common[0];
    }
    if (srcProtocols.includes("https") || tgtProtocols.includes("https")) return "https";
    if (srcProtocols.includes("http") || tgtProtocols.includes("http")) return "http";
    if (srcProtocols.includes("sql") || tgtProtocols.includes("sql")) return "sql";
    if (srcProtocols.includes("redis") || tgtProtocols.includes("redis")) return "redis";
    return srcProtocols[0] || "http";
  }
}

export const connectionValidator = new ConnectionValidator();
