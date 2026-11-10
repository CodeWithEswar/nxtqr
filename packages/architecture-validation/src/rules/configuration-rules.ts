import type {
  ArchitectureValidationRule,
  RuleEvaluationContext,
  ValidationRuleOutcome,
} from "../contracts/validation.types";
import { VALIDATION_MESSAGES } from "../messages/validation-messages";

export const configurationRules: ArchitectureValidationRule[] = [
  {
    id: "CONF-001-RETRY-IDEMPOTENCY",
    version: 1,
    name: "Retry Controller Idempotency Assumption",
    description: "Flags retry controllers connecting to endpoints without documented idempotency handling.",
    category: "component",
    order: 60,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourceContext || !ctx.targetContext) return null;

      const srcComp = ctx.sourceContext.componentId;
      if (srcComp === "retry-controller") {
        const tgtConfig = ctx.targetContext.config;
        const hasIdempotency =
          tgtConfig.idempotencySupported === true ||
          tgtConfig.idempotencyKey === true ||
          ctx.targetContext.capabilities.includes("idempotency");

        if (!hasIdempotency) {
          const targetName = ctx.targetContext.node.label || ctx.targetContext.componentId;
          return {
            ruleId: "CONF-001-RETRY-IDEMPOTENCY",
            category: "component",
            severity: "warning",
            title: "Undocumented Retry Idempotency",
            message: VALIDATION_MESSAGES.MISSING_RETRY_IDEMPOTENCY(targetName),
            explanation: "Automatic retries on non-idempotent operations (such as POST payments or state mutations) risk duplicate side effects without idempotency keys.",
            documentationId: "idempotency",
            decisionEffect: "allowed-with-warnings",
            suggestedActions: [
              {
                label: "Document Idempotency Support",
                type: "open-inspector",
                fieldPath: "idempotencySupported",
              },
            ],
          };
        }
      }

      return null;
    },
  },
  {
    id: "CONF-002-PUBLIC-ENDPOINT-AUTH",
    version: 1,
    name: "Public Interface Authentication Policy",
    description: "Checks whether public ingress or API gateway endpoints document authentication requirements.",
    category: "component",
    order: 61,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      for (const node of ctx.nodes) {
        const compId = (node.data?.componentType as string) || (node.data?.componentId as string) || node.type || "";
        const config = (node.data || {}) as Record<string, unknown>;

        if (compId === "api-gateway" || compId === "ingress-controller") {
          const isPublic = config.exposure === "public" || config.isPublic === true;
          const authSpecified =
            Boolean(config.authType) ||
            Boolean(config.authentication) ||
            Boolean(config.jwtVerification) ||
            Boolean(config.apiKeyRequired);

          if (isPublic && !authSpecified) {
            return {
              ruleId: "CONF-002-PUBLIC-ENDPOINT-AUTH",
              category: "component",
              severity: "info",
              title: "Public Interface Authentication",
              message: VALIDATION_MESSAGES.PUBLIC_INTERFACE_UNAUTHENTICATED(node.label || compId),
              explanation: "Public-facing ingress points should declare an authentication mechanism (JWT, OAuth2, API Key, mTLS) or explicitly document anonymous access.",
              documentationId: "security-and-identity",
              suggestedActions: [
                {
                  label: "Specify Auth Policy",
                  type: "open-inspector",
                  fieldPath: "authType",
                },
              ],
            };
          }
        }
      }

      return null;
    },
  },
];
