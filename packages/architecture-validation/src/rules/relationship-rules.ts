import type {
  ArchitectureValidationRule,
  RuleEvaluationContext,
  ValidationRuleOutcome,
} from "../contracts/validation.types";
import { VALIDATION_MESSAGES } from "../messages/validation-messages";

export const relationshipRules: ArchitectureValidationRule[] = [
  {
    id: "REL-001-BROWSER-DIRECT-DATABASE",
    version: 1,
    name: "Browser Direct Database Access Guard",
    description: "Flags direct wire connections from a Web Browser directly to a database without an API Gateway or Backend Service.",
    category: "relationship",
    order: 40,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourceContext || !ctx.targetContext) return null;

      const srcComp = ctx.sourceContext.componentId;
      const tgtCat = ctx.targetContext.categoryId;

      if (srcComp === "web-browser" && tgtCat === "databases-and-persistence") {
        return {
          ruleId: "REL-001-BROWSER-DIRECT-DATABASE",
          category: "relationship",
          severity: "warning",
          title: "Direct Client Database Connection",
          message: "Web browsers cannot initiate direct TCP/SQL wire connections to databases. Route requests through an API Gateway, Backend Service, or serverless function.",
          explanation: "Database wire protocols operate over raw TCP sockets and require secret credentials that should never be exposed in a browser bundle.",
          documentationId: "clients-and-user-interfaces",
          decisionEffect: "allowed-with-warnings",
          suggestedActions: [
            {
              label: "Insert API Gateway or Backend Service",
              type: "insert-adapter",
            },
          ],
        };
      }
      return null;
    },
  },
  {
    id: "REL-002-DATABASE-REPLICATION-PRIMARY",
    version: 1,
    name: "Read Replica Replication Target Rule",
    description: "Validates that a Read Replica connects to a Primary Database via replication rather than arbitrary clients.",
    category: "relationship",
    order: 41,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourceContext || !ctx.targetContext) return null;

      const srcComp = ctx.sourceContext.componentId;
      const tgtComp = ctx.targetContext.componentId;
      const isReplica =
        srcComp.includes("replica") ||
        tgtComp.includes("replica") ||
        (ctx.sourceContext.config.role === "replica") ||
        (ctx.targetContext.config.role === "replica") ||
        ctx.sourcePort?.relationshipKinds.includes("replication") ||
        ctx.targetPort?.relationshipKinds.includes("replication");

      if (isReplica) {
        const otherContext = srcComp.includes("replica") ? ctx.targetContext : ctx.sourceContext;
        const otherIsPrimary =
          otherContext.categoryId === "databases-and-persistence" &&
          (otherContext.componentId.includes("primary") ||
            otherContext.componentId.includes("relational") ||
            otherContext.componentId.includes("cluster") ||
            otherContext.componentId.includes("postgres") ||
            otherContext.componentId.includes("mysql") ||
            otherContext.componentId.includes("database"));

        if (!otherIsPrimary) {
          return {
            ruleId: "REL-002-DATABASE-REPLICATION-PRIMARY",
            category: "relationship",
            severity: "error",
            title: "Invalid Replication Source",
            message: VALIDATION_MESSAGES.INVALID_REPLICATION_TARGET,
            explanation: "Read Replicas must subscribe to the write-ahead log (WAL) or binlog stream of a primary database instance.",
            documentationId: "database-replication",
            decisionEffect: "rejected",
          };
        }
      }
      return null;
    },
  },
  {
    id: "REL-003-PRODUCER-TO-CONSUMER-DIRECT",
    version: 1,
    name: "Asynchronous Message Decoupling Rule",
    description: "Suggests inserting a Message Broker or Queue when an event producer connects directly to a consumer.",
    category: "relationship",
    order: 42,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourceContext || !ctx.targetContext) return null;

      const srcPort = ctx.sourcePort;
      const tgtPort = ctx.targetPort;

      if (!srcPort || !tgtPort) return null;

      const srcIsProducer =
        srcPort.roles.includes("producer") || srcPort.roles.includes("publisher");
      const tgtIsConsumer =
        tgtPort.roles.includes("consumer") || tgtPort.roles.includes("subscriber");

      const tgtIsBroker =
        ctx.targetContext.categoryId === "messaging-and-event-systems" ||
        ctx.targetContext.capabilities.includes("message-broker");

      if (srcIsProducer && tgtIsConsumer && !tgtIsBroker) {
        return {
          ruleId: "REL-003-PRODUCER-TO-CONSUMER-DIRECT",
          category: "relationship",
          severity: "info",
          title: "Direct Producer-Consumer Coupling",
          message: "Event producer connects directly to a consumer. For resilient asynchronous processing, consider introducing a Message Broker, Event Stream, or Queue.",
          explanation: "Direct point-to-point connections create temporal coupling. A message queue buffers surges and guarantees delivery.",
          documentationId: "messaging-and-event-systems",
          decisionEffect: "allowed",
          suggestedActions: [
            {
              label: "Learn about Message Queues",
              type: "open-docs",
              documentationPath: "/tutorial/system-design/categories/messaging-and-event-systems",
            },
          ],
        };
      }
      return null;
    },
  },
  {
    id: "REL-004-WEBRTC-SIGNALING-MEDIA",
    version: 1,
    name: "WebRTC Signaling vs Media Separation",
    description: "Clarifies that WebRTC signaling servers exchange SDP/ICE, not heavy audio/video media payloads.",
    category: "relationship",
    order: 43,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourceContext || !ctx.targetContext) return null;

      const tgtComp = ctx.targetContext.componentId;
      if (tgtComp === "webrtc-signaling-server") {
        const srcPortName = (ctx.sourcePort?.name || "").toLowerCase();
        if (srcPortName.includes("media") || srcPortName.includes("video") || srcPortName.includes("stream")) {
          return {
            ruleId: "REL-004-WEBRTC-SIGNALING-MEDIA",
            category: "relationship",
            severity: "info",
            title: "WebRTC Signaling Role",
            message: VALIDATION_MESSAGES.WEBRTC_SIGNALING_MEDIA_NOTE,
            explanation: "Signaling servers only establish session metadata. High-bandwidth RTP/RTCP media streams should route to a Media Server (SFU/MCU) or peer.",
            documentationId: "media-and-real-time-communication",
            decisionEffect: "allowed",
          };
        }
      }
      return null;
    },
  },
  {
    id: "REL-005-CLOUD-REGION-NETWORK-SERVICE",
    version: 1,
    name: "Cloud Region Boundary Semantic Check",
    description: "Verifies Cloud Region and Availability Zone are treated as containment scopes, not request-processing services.",
    category: "structural",
    order: 44,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourceContext || !ctx.targetContext) return null;

      const srcComp = ctx.sourceContext.componentId;
      const tgtComp = ctx.targetContext.componentId;

      if (srcComp === "cloud-region" || srcComp === "availability-zone") {
        const isStructuralEdge = ctx.candidate?.customData?.isStructural === true;
        if (!isStructuralEdge) {
          return {
            ruleId: "REL-005-CLOUD-REGION-NETWORK-SERVICE",
            category: "structural",
            severity: "warning",
            title: "Regional Scope Not a Service",
            message: `"${ctx.sourceContext.node.label || srcComp}" represents a geographic boundary, not an active network service. Connect directly to compute or load balancer instances within the region.`,
            documentationId: "cloud-infrastructure",
            decisionEffect: "allowed-with-warnings",
          };
        }
      }

      if (tgtComp === "cloud-region" || tgtComp === "availability-zone") {
        const isStructuralEdge = ctx.candidate?.customData?.isStructural === true;
        if (!isStructuralEdge) {
          return {
            ruleId: "REL-005-CLOUD-REGION-NETWORK-SERVICE",
            category: "structural",
            severity: "warning",
            title: "Regional Scope Not a Service",
            message: `Target "${ctx.targetContext.node.label || tgtComp}" is a physical geographic container. Route traffic to resources deployed inside the region.`,
            documentationId: "cloud-infrastructure",
            decisionEffect: "allowed-with-warnings",
          };
        }
      }

      return null;
    },
  },
];
