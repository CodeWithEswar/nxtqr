import type {
  ArchitectureValidationRule,
  RuleEvaluationContext,
  ValidationRuleOutcome,
} from "../contracts/validation.types";
import { VALIDATION_MESSAGES } from "../messages/validation-messages";

export const structuralRules: ArchitectureValidationRule[] = [
  {
    id: "STRUC-001-ENDPOINT-EXISTENCE",
    version: 1,
    name: "Endpoint Existence Guard",
    description: "Ensures both source and target nodes exist in the graph.",
    category: "integrity",
    order: 1,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      const srcId = ctx.candidate?.sourceNodeId ?? ctx.activeEdge?.source;
      const tgtId = ctx.candidate?.targetNodeId ?? ctx.activeEdge?.target;

      if (!srcId || !tgtId) {
        return {
          ruleId: "STRUC-001-ENDPOINT-EXISTENCE",
          category: "integrity",
          severity: "error",
          title: "Missing Connection Endpoint",
          message: VALIDATION_MESSAGES.NONEXISTENT_ENDPOINT,
          decisionEffect: "rejected",
        };
      }

      const srcExists = ctx.nodes.some((n) => n.id === srcId);
      const tgtExists = ctx.nodes.some((n) => n.id === tgtId);

      if (!srcExists || !tgtExists) {
        return {
          ruleId: "STRUC-001-ENDPOINT-EXISTENCE",
          category: "integrity",
          severity: "error",
          title: "Referenced Node Not Found",
          message: VALIDATION_MESSAGES.NONEXISTENT_ENDPOINT,
          decisionEffect: "rejected",
        };
      }

      return null;
    },
  },
  {
    id: "STRUC-002-DUPLICATE-EDGE",
    version: 1,
    name: "Duplicate Connection Guard",
    description: "Prohibits creating identical connections between the same source and target ports.",
    category: "integrity",
    order: 2,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.candidate) return null;

      const { sourceNodeId, targetNodeId, sourceHandleId, targetHandleId, edgeId } = ctx.candidate;

      const isDuplicate = ctx.edges.some((e) => {
        if (edgeId && e.id === edgeId) return false;
        return (
          e.source === sourceNodeId &&
          e.target === targetNodeId &&
          (e.sourceHandle ?? null) === (sourceHandleId ?? null) &&
          (e.targetHandle ?? null) === (targetHandleId ?? null)
        );
      });

      if (isDuplicate) {
        return {
          ruleId: "STRUC-002-DUPLICATE-EDGE",
          category: "integrity",
          severity: "error",
          title: "Duplicate Connection",
          message: VALIDATION_MESSAGES.DUPLICATE_EDGE,
          decisionEffect: "rejected",
        };
      }

      return null;
    },
  },
  {
    id: "STRUC-003-PORT-CAPACITY",
    version: 1,
    name: "Port Capacity Enforcement",
    description: "Verifies target port has not exceeded its maximum allowed inbound connections.",
    category: "connection",
    order: 3,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.candidate || !ctx.targetPort) return null;

      const max = ctx.targetPort.maxConnections ?? 20;
      const targetId = ctx.candidate.targetNodeId;
      const handleId = ctx.candidate.targetHandleId;

      if (!handleId) return null;

      const activeInbound = ctx.edges.filter(
        (e) =>
          e.target === targetId &&
          (e.targetHandle === handleId || e.targetPort === handleId) &&
          (!ctx.candidate?.edgeId || e.id !== ctx.candidate.edgeId),
      ).length;

      if (activeInbound >= max) {
        return {
          ruleId: "STRUC-003-PORT-CAPACITY",
          category: "connection",
          severity: "error",
          title: "Port Capacity Limit",
          message: VALIDATION_MESSAGES.PORT_CAPACITY_EXCEEDED(ctx.targetPort.name, max),
          decisionEffect: "rejected",
        };
      }

      return null;
    },
  },
  {
    id: "STRUC-004-CYCLIC-CONTAINMENT",
    version: 1,
    name: "Cyclic Group Containment Guard",
    description: "Detects and prevents cycles in hierarchical group/container parenting.",
    category: "structural",
    order: 4,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      // Check all group containment parent references across nodes
      for (const node of ctx.nodes) {
        const parentId = (node.data?.parentId as string) || (node.metadata?.parentId as string);
        if (!parentId) continue;

        const visited = new Set<string>([node.id]);
        let curr: string | undefined = parentId;

        while (curr) {
          if (visited.has(curr)) {
            return {
              ruleId: "STRUC-004-CYCLIC-CONTAINMENT",
              category: "structural",
              severity: "error",
              title: "Cyclic Group Containment",
              message: VALIDATION_MESSAGES.CYCLIC_CONTAINMENT,
              explanation: `Group "${node.id}" has an ancestral cycle with "${curr}". A container cannot contain itself or one of its parents.`,
              decisionEffect: "rejected",
            };
          }
          visited.add(curr);
          const parentNode = ctx.nodes.find((n) => n.id === curr);
          curr = (parentNode?.data?.parentId as string) || (parentNode?.metadata?.parentId as string);
        }
      }

      return null;
    },
  },
  {
    id: "STRUC-005-TRUST-BOUNDARY-CROSSING",
    version: 1,
    name: "Trust Boundary Crossing Security Check",
    description: "Identifies connections crossing a security/trust boundary without documented TLS/mTLS encryption.",
    category: "structural",
    order: 45,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourceContext || !ctx.targetContext) return null;

      const srcTrust = (ctx.sourceContext.config.trustZone as string) || (ctx.sourceContext.config.environment as string) || "default";
      const tgtTrust = (ctx.targetContext.config.trustZone as string) || (ctx.targetContext.config.environment as string) || "default";

      // If different trust zones, check transport encryption
      if (srcTrust !== tgtTrust && srcTrust !== "default" && tgtTrust !== "default") {
        const isEncrypted =
          ctx.sourcePort?.protocols.includes("https") ||
          ctx.targetPort?.protocols.includes("https") ||
          ctx.sourceContext.capabilities.includes("tls-client") ||
          ctx.targetContext.capabilities.includes("tls-termination") ||
          ctx.candidate?.customData?.encrypted === true;

        if (!isEncrypted) {
          const srcName = ctx.sourceContext.node.label || ctx.sourceContext.componentId;
          const tgtName = ctx.targetContext.node.label || ctx.targetContext.componentId;

          return {
            ruleId: "STRUC-005-TRUST-BOUNDARY-CROSSING",
            category: "structural",
            severity: "warning",
            title: "Unencrypted Trust Boundary Crossing",
            message: VALIDATION_MESSAGES.TRUST_BOUNDARY_CROSSING_UNENCRYPTED(srcName, tgtName),
            explanation: `Connection travels from zone "${srcTrust}" to "${tgtTrust}". Cross-boundary traffic should mandate TLS or mTLS mutual authentication.`,
            documentationId: "trust-boundary",
            decisionEffect: "allowed-with-warnings",
            suggestedActions: [
              {
                label: "Document TLS Encryption",
                type: "open-inspector",
                fieldPath: "tlsEnabled",
              },
            ],
          };
        }
      }

      return null;
    },
  },
];
