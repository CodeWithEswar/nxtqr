import type {
  ArchitectureValidationRule,
  RuleEvaluationContext,
  ValidationRuleOutcome,
} from "../contracts/validation.types";
import { VALIDATION_MESSAGES } from "../messages/validation-messages";

export const directionRules: ArchitectureValidationRule[] = [
  {
    id: "DIR-001-SELF-CONNECTION",
    version: 1,
    name: "Self-Connection Guard",
    description: "Prohibits a node from connecting to itself unless local loopback is explicitly supported.",
    category: "integrity",
    order: 10,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      const srcId = ctx.candidate?.sourceNodeId ?? ctx.activeEdge?.source;
      const tgtId = ctx.candidate?.targetNodeId ?? ctx.activeEdge?.target;

      if (srcId && tgtId && srcId === tgtId) {
        return {
          ruleId: "DIR-001-SELF-CONNECTION",
          category: "integrity",
          severity: "error",
          title: "Self-Connection Prohibited",
          message: VALIDATION_MESSAGES.CANNOT_CONNECT_TO_SELF,
          decisionEffect: "rejected",
        };
      }
      return null;
    },
  },
  {
    id: "DIR-002-BOTH-OUTPUTS",
    version: 1,
    name: "Both Output Ports Guard",
    description: "Disallows connecting two output ports directly together.",
    category: "connection",
    order: 20,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourcePort || !ctx.targetPort) return null;

      if (ctx.sourcePort.direction === "output" && ctx.targetPort.direction === "output") {
        return {
          ruleId: "DIR-002-BOTH-OUTPUTS",
          category: "connection",
          severity: "error",
          title: "Invalid Connection Direction",
          message: VALIDATION_MESSAGES.INVALID_DIRECTION_BOTH_OUTPUTS,
          explanation: "Both ports are emitters of data. An output port must connect to an input or bidirectional receiver port.",
          decisionEffect: "rejected",
          suggestedActions: [
            {
              label: "Connect to an input port",
              type: "reverse-direction",
            },
          ],
        };
      }
      return null;
    },
  },
  {
    id: "DIR-003-BOTH-INPUTS",
    version: 1,
    name: "Both Input Ports Guard",
    description: "Disallows connecting two input ports directly together.",
    category: "connection",
    order: 21,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourcePort || !ctx.targetPort) return null;

      if (ctx.sourcePort.direction === "input" && ctx.targetPort.direction === "input") {
        return {
          ruleId: "DIR-003-BOTH-INPUTS",
          category: "connection",
          severity: "error",
          title: "Invalid Connection Direction",
          message: VALIDATION_MESSAGES.INVALID_DIRECTION_BOTH_INPUTS,
          explanation: "Both ports are receivers of data. Traffic must originate from an output or bidirectional emitter port.",
          decisionEffect: "rejected",
        };
      }
      return null;
    },
  },
  {
    id: "DIR-004-REVERSED-FLOW",
    version: 1,
    name: "Reversed Flow Detection",
    description: "Detects connections initiated from an input port to an output port.",
    category: "connection",
    order: 22,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourcePort || !ctx.targetPort) return null;

      if (ctx.sourcePort.direction === "input" && ctx.targetPort.direction === "output") {
        return {
          ruleId: "DIR-004-REVERSED-FLOW",
          category: "connection",
          severity: "error",
          title: "Reversed Port Direction",
          message: "Attempting to connect an input receiver to an output emitter. Connect from the output port to the input port.",
          decisionEffect: "rejected",
          suggestedActions: [
            {
              label: "Reverse connection direction",
              type: "reverse-direction",
            },
          ],
        };
      }
      return null;
    },
  },
];
