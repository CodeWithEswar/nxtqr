import type {
  ArchitectureValidationRule,
  RuleEvaluationContext,
  ValidationRuleOutcome,
} from "../contracts/validation.types";
import { VALIDATION_MESSAGES } from "../messages/validation-messages";

export const protocolRules: ArchitectureValidationRule[] = [
  {
    id: "PROTO-001-UDP-TO-TCP",
    version: 1,
    name: "UDP to TCP Incompatibility",
    description: "Rejects direct connections between UDP datagram emitters and TCP byte-stream listeners without an adapter.",
    category: "connection",
    order: 30,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourcePort || !ctx.targetPort) return null;

      const srcIsUdpOnly =
        ctx.sourcePort.protocols.includes("udp") &&
        !ctx.sourcePort.protocols.includes("tcp") &&
        !ctx.sourcePort.protocols.includes("http");

      const tgtIsTcpOnly =
        (ctx.targetPort.protocols.includes("tcp") || ctx.targetPort.protocols.includes("http")) &&
        !ctx.targetPort.protocols.includes("udp");

      if (srcIsUdpOnly && tgtIsTcpOnly) {
        return {
          ruleId: "PROTO-001-UDP-TO-TCP",
          category: "connection",
          severity: "error",
          title: "Transport Protocol Mismatch",
          message: VALIDATION_MESSAGES.PROTOCOL_MISMATCH_UDP_TCP,
          explanation: "UDP sends connectionless datagrams, whereas TCP requires a three-way handshake and stream socket. Add a gateway or proxy to bridge them.",
          documentationId: "protocol-and-interface-components",
          decisionEffect: "rejected",
          suggestedActions: [
            {
              label: "Insert Protocol Bridge",
              type: "insert-adapter",
            },
          ],
        };
      }
      return null;
    },
  },
  {
    id: "PROTO-002-MQTT-TO-HTTP",
    version: 1,
    name: "MQTT to HTTP Bridge Requirement",
    description: "Rejects connecting an MQTT publisher directly to an HTTP-only endpoint without an intermediate MQTT broker.",
    category: "connection",
    order: 31,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourcePort || !ctx.targetPort) return null;

      const srcIsMqtt = ctx.sourcePort.protocols.includes("mqtt");
      const tgtIsHttpOnly =
        ctx.targetPort.protocols.includes("http") &&
        !ctx.targetPort.protocols.includes("mqtt") &&
        !ctx.targetPort.protocols.includes("websocket");

      const tgtCaps = ctx.targetContext?.capabilities ?? [];
      const tgtAcceptsMqtt = tgtCaps.includes("mqtt-broker") || tgtCaps.includes("iot-gateway");

      if (srcIsMqtt && tgtIsHttpOnly && !tgtAcceptsMqtt) {
        return {
          ruleId: "PROTO-002-MQTT-TO-HTTP",
          category: "connection",
          severity: "error",
          title: "MQTT Protocol Incompatibility",
          message: VALIDATION_MESSAGES.MQTT_TO_HTTP_MISMATCH,
          explanation: "MQTT is an asynchronous pub/sub protocol operating over persistent TCP/WebSocket connections, not direct synchronous HTTP.",
          documentationId: "mqtt-broker",
          decisionEffect: "rejected",
          suggestedActions: [
            {
              label: "Connect to MQTT Broker",
              type: "reconfigure",
            },
          ],
        };
      }
      return null;
    },
  },
  {
    id: "PROTO-003-GRPC-INTERFACE-CONFIG",
    version: 1,
    name: "gRPC Server Configuration Requirement",
    description: "Verifies that target service supports gRPC before connecting a gRPC client.",
    category: "component",
    order: 32,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourcePort || !ctx.targetContext) return null;

      const isGrpcSource =
        ctx.sourcePort.protocols.includes("grpc") ||
        (ctx.sourceContext?.componentId === "grpc-endpoint");

      if (isGrpcSource) {
        const tgtCaps = ctx.targetContext.capabilities;
        const tgtHasGrpc =
          tgtCaps.includes("grpc-server") ||
          tgtCaps.includes("protocol-grpc") ||
          ctx.targetContext.componentId === "grpc-endpoint" ||
          ctx.targetPort?.protocols.includes("grpc");

        if (!tgtHasGrpc) {
          const targetName = ctx.targetContext.node.label || ctx.targetContext.componentId;
          return {
            ruleId: "PROTO-003-GRPC-INTERFACE-CONFIG",
            category: "component",
            severity: "warning",
            title: "Missing gRPC Interface Configuration",
            message: VALIDATION_MESSAGES.MISSING_GRPC_CONFIGURATION(targetName),
            explanation: "The client expects a gRPC HTTP/2 interface, but the target service has not enabled gRPC in its supported protocols list.",
            documentationId: "grpc-endpoint",
            decisionEffect: "requires-configuration",
            suggestedActions: [
              {
                label: "Configure gRPC on Target",
                type: "open-inspector",
                fieldPath: "protocols",
              },
            ],
          };
        }
      }
      return null;
    },
  },
  {
    id: "PROTO-004-HTTPS-TLS-TERMINATION",
    version: 1,
    name: "HTTPS TLS Termination Verification",
    description: "Issues a warning if an HTTPS client connects to an endpoint without documented TLS termination.",
    category: "connection",
    order: 33,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourceContext || !ctx.targetContext) return null;

      const isHttpsClient =
        ctx.sourcePort?.protocols.includes("https") ||
        ctx.sourceContext.componentId === "https-endpoint";

      if (isHttpsClient) {
        const tgtCaps = ctx.targetContext.capabilities;
        const tgtConfig = ctx.targetContext.config;
        const hasTls =
          tgtCaps.includes("tls-termination") ||
          tgtCaps.includes("https-server") ||
          tgtConfig.tlsEnabled === true ||
          tgtConfig.tlsTermination === true ||
          ctx.targetContext.componentId === "https-endpoint" ||
          ctx.targetContext.componentId === "api-gateway" ||
          ctx.targetContext.componentId === "cdn" ||
          ctx.targetContext.componentId === "load-balancer";

        if (!hasTls) {
          const targetName = ctx.targetContext.node.label || ctx.targetContext.componentId;
          return {
            ruleId: "PROTO-004-HTTPS-TLS-TERMINATION",
            category: "connection",
            severity: "warning",
            title: "Undocumented TLS Termination",
            message: VALIDATION_MESSAGES.MISSING_TLS_CONFIGURATION(targetName),
            explanation: "The client initiates an encrypted HTTPS connection, but the target has not explicitly documented TLS termination or certificate offload.",
            documentationId: "https-endpoint",
            decisionEffect: "allowed-with-warnings",
            suggestedActions: [
              {
                label: "Enable TLS in Inspector",
                type: "open-inspector",
                fieldPath: "tlsTermination",
              },
            ],
          };
        }
      }
      return null;
    },
  },
  {
    id: "PROTO-005-DATABASE-WIRE-PROTOCOL",
    version: 1,
    name: "Database Wire Protocol Compatibility",
    description: "Verifies relational database client communicates with matching database wire protocol.",
    category: "connection",
    order: 34,
    evaluate(ctx: RuleEvaluationContext): ValidationRuleOutcome | null {
      if (!ctx.sourceContext || !ctx.targetContext) return null;

      const srcComp = ctx.sourceContext.componentId;
      const tgtComp = ctx.targetContext.componentId;
      const srcConfig = ctx.sourceContext.config;

      // Check if client specifies Postgres engine but connects to Redis or Cassandra
      if (srcConfig.databaseDriver === "postgres" || srcComp.includes("postgres")) {
        if (
          tgtComp.includes("redis") ||
          tgtComp.includes("memcached") ||
          tgtComp.includes("mongodb") ||
          tgtComp.includes("cassandra")
        ) {
          return {
            ruleId: "PROTO-005-DATABASE-WIRE-PROTOCOL",
            category: "connection",
            severity: "error",
            title: "Database Wire Incompatibility",
            message: VALIDATION_MESSAGES.DATABASE_WIRE_MISMATCH("PostgreSQL", tgtComp),
            explanation: "PostgreSQL wire protocol requires an SQL engine target, not key-value or document storage.",
            documentationId: "databases-and-persistence",
            decisionEffect: "rejected",
          };
        }
      }
      return null;
    },
  },
];
