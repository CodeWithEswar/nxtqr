import type {
  ArchitectureValidationRule,
  RuleEvaluationContext,
  ValidationRuleOutcome,
} from "../contracts/validation.types";

export const dependencyRules: ArchitectureValidationRule[] = [
  {
    id: "DEP-001-READ-REPLICA-PRIMARY",
    version: 1,
    name: "Read Replica Upstream Dependency",
    description: "Ensures a read replica has an upstream replication link to a primary database node.",
    category: "dependency",
    order: 50,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      // Evaluate for full graph validation: check read replica nodes without replication source
      for (const node of ctx.nodes) {
        const compId = (node.data?.componentType as string) || (node.data?.componentId as string) || node.type || "";
        const role = (node.data?.role as string) || "";

        if (compId.includes("read-replica") || role === "replica") {
          const hasInboundReplication = ctx.edges.some((e) => {
            if (e.target !== node.id) return false;
            const srcNode = ctx.nodes.find((n) => n.id === e.source);
            if (!srcNode) return false;
            const srcComp = (srcNode.data?.componentType as string) || (srcNode.data?.componentId as string) || srcNode.type || "";
            return (
              srcComp.includes("primary") ||
              srcComp.includes("relational") ||
              srcComp.includes("postgres") ||
              srcComp.includes("mysql") ||
              srcComp.includes("cluster")
            );
          });

          if (!hasInboundReplication) {
            return {
              ruleId: "DEP-001-READ-REPLICA-PRIMARY",
              category: "dependency",
              severity: "warning",
              title: "Orphaned Read Replica",
              message: `Read replica "${node.label || node.id}" requires an upstream replication connection from a primary database instance.`,
              explanation: "Without an active replication stream, the replica cannot synchronize data mutations.",
              documentationId: "database-replication",
              suggestedActions: [
                {
                  label: "Connect to Primary Database",
                  type: "reconfigure",
                },
              ],
            };
          }
        }
      }

      return null;
    },
  },
  {
    id: "DEP-002-SECRETS-INJECTION-PROVIDER",
    version: 1,
    name: "Secrets Injection Provider Dependency",
    description: "Ensures Secrets Injection component connects to a Vault, Secrets Manager, or KMS.",
    category: "dependency",
    order: 51,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      for (const node of ctx.nodes) {
        const compId = (node.data?.componentType as string) || (node.data?.componentId as string) || node.type || "";

        if (compId === "secrets-injection") {
          const hasProvider = ctx.edges.some((e) => {
            if (e.target !== node.id && e.source !== node.id) return false;
            const otherId = e.source === node.id ? e.target : e.source;
            const otherNode = ctx.nodes.find((n) => n.id === otherId);
            if (!otherNode) return false;
            const otherComp = (otherNode.data?.componentType as string) || (otherNode.data?.componentId as string) || otherNode.type || "";
            return (
              otherComp.includes("secret") ||
              otherComp.includes("vault") ||
              otherComp.includes("kms") ||
              otherComp.includes("key-management")
            );
          });

          if (!hasProvider) {
            return {
              ruleId: "DEP-002-SECRETS-INJECTION-PROVIDER",
              category: "dependency",
              severity: "info",
              title: "Unconnected Secrets Injection",
              message: `Secrets Injection service "${node.label || node.id}" has no connected Secrets Manager or Vault provider.`,
              documentationId: "security-and-identity",
            };
          }
        }
      }

      return null;
    },
  },
];
