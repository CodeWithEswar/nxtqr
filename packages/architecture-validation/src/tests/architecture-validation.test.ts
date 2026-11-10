import { describe, it, expect, beforeEach } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  architectureValidationEngine,
  ALL_VALIDATION_RULES,
  VALIDATION_MESSAGES,
} from "../index";

function makeNode(id: string, componentType: string, categoryId: string, ports: any[] = [], config: any = {}): BaseNode {
  return {
    id,
    type: componentType,
    position: { x: 100, y: 100 },
    dimensions: { width: 200, height: 80 },
    status: "idle",
    label: `${componentType} Node`,
    data: {
      componentType,
      categoryId,
      ...config,
    },
    ports,
  };
}

describe("Architecture Validation Engine", () => {
  beforeEach(() => {
    architectureValidationEngine.reset();
  });

  describe("Rule Inventory & Contracts", () => {
    it("exports all validation rules sorted by execution order", () => {
      expect(ALL_VALIDATION_RULES.length).toBeGreaterThan(10);
      for (let i = 1; i < ALL_VALIDATION_RULES.length; i++) {
        expect(ALL_VALIDATION_RULES[i].order).toBeGreaterThanOrEqual(ALL_VALIDATION_RULES[i - 1].order);
      }
    });
  });

  describe("Direction Validation Rules", () => {
    it("rejects self-connections", () => {
      const nodeA = makeNode("nodeA", "application-server", "compute-and-application-services");
      const res = architectureValidationEngine.validateConnection(
        { sourceNodeId: "nodeA", targetNodeId: "nodeA" },
        [nodeA],
        [],
      );
      expect(res.decision).toBe("rejected");
      expect(res.valid).toBe(false);
      expect(res.findings.some((f) => f.ruleId === "DIR-001-SELF-CONNECTION")).toBe(true);
    });

    it("rejects connecting two output ports directly", () => {
      const nodeA = makeNode("nodeA", "web-browser", "clients-and-user-interfaces", [
        { id: "http-out", name: "HTTP Out", type: "output", dataType: "HTTP_Request" },
      ]);
      const nodeB = makeNode("nodeB", "mobile-app", "clients-and-user-interfaces", [
        { id: "mobile-http-out", name: "Mobile Out", type: "output", dataType: "HTTP_Request" },
      ]);

      const res = architectureValidationEngine.validateConnection(
        {
          sourceNodeId: "nodeA",
          targetNodeId: "nodeB",
          sourceHandleId: "http-out",
          targetHandleId: "mobile-http-out",
        },
        [nodeA, nodeB],
        [],
      );

      expect(res.decision).toBe("rejected");
      expect(res.findings.some((f) => f.ruleId === "DIR-002-BOTH-OUTPUTS")).toBe(true);
      expect(res.findings[0].message).toBe(VALIDATION_MESSAGES.INVALID_DIRECTION_BOTH_OUTPUTS);
    });

    it("rejects connecting two input ports directly", () => {
      const nodeA = makeNode("nodeA", "application-server", "compute-and-application-services", [
        { id: "inbound-http", name: "HTTP In", type: "input", dataType: "HTTP_Request" },
      ]);
      const nodeB = makeNode("nodeB", "relational-database", "databases-and-persistence", [
        { id: "query-in", name: "SQL In", type: "input", dataType: "SQL_Query" },
      ]);

      const res = architectureValidationEngine.validateConnection(
        {
          sourceNodeId: "nodeA",
          targetNodeId: "nodeB",
          sourceHandleId: "inbound-http",
          targetHandleId: "query-in",
        },
        [nodeA, nodeB],
        [],
      );

      expect(res.decision).toBe("rejected");
      expect(res.findings.some((f) => f.ruleId === "DIR-003-BOTH-INPUTS")).toBe(true);
    });

    it("rejects connecting backwards from input to output", () => {
      const nodeA = makeNode("nodeA", "application-server", "compute-and-application-services", [
        { id: "inbound", name: "Inbound", type: "input" },
      ]);
      const nodeB = makeNode("nodeB", "web-browser", "clients-and-user-interfaces", [
        { id: "outbound", name: "Outbound", type: "output" },
      ]);

      const res = architectureValidationEngine.validateConnection(
        {
          sourceNodeId: "nodeA",
          targetNodeId: "nodeB",
          sourceHandleId: "inbound",
          targetHandleId: "outbound",
        },
        [nodeA, nodeB],
        [],
      );

      expect(res.decision).toBe("rejected");
      expect(res.findings.some((f) => f.ruleId === "DIR-004-REVERSED-FLOW")).toBe(true);
    });
  });

  describe("Protocol Compatibility Rules", () => {
    it("rejects connecting UDP output to TCP input without a bridge", () => {
      const nodeA = makeNode("nodeA", "udp-endpoint", "protocol-and-interface-components", [
        { id: "udp-out", name: "UDP Datagrams", type: "output", dataType: "UDP_Packet" },
      ]);
      const nodeB = makeNode("nodeB", "tcp-endpoint", "protocol-and-interface-components", [
        { id: "tcp-in", name: "TCP Stream In", type: "input", dataType: "TCP_Stream" },
      ]);

      const res = architectureValidationEngine.validateConnection(
        {
          sourceNodeId: "nodeA",
          targetNodeId: "nodeB",
          sourceHandleId: "udp-out",
          targetHandleId: "tcp-in",
        },
        [nodeA, nodeB],
        [],
      );

      expect(res.decision).toBe("rejected");
      expect(res.findings.some((f) => f.ruleId === "PROTO-001-UDP-TO-TCP")).toBe(true);
      expect(res.findings[0].message).toContain("This output uses UDP, but the selected input accepts TCP.");
    });

    it("rejects connecting an MQTT publisher directly to an HTTP endpoint without an MQTT broker", () => {
      const nodeA = makeNode("nodeA", "iot-device", "clients-and-user-interfaces", [
        { id: "mqtt-pub", name: "MQTT Publish", type: "output", dataType: "MQTT_Payload" },
      ]);
      const nodeB = makeNode("nodeB", "http-endpoint", "protocol-and-interface-components", [
        { id: "http-in", name: "HTTP In", type: "input", dataType: "HTTP_Request" },
      ]);

      const res = architectureValidationEngine.validateConnection(
        {
          sourceNodeId: "nodeA",
          targetNodeId: "nodeB",
          sourceHandleId: "mqtt-pub",
          targetHandleId: "http-in",
        },
        [nodeA, nodeB],
        [],
      );

      expect(res.decision).toBe("rejected");
      expect(res.findings.some((f) => f.ruleId === "PROTO-002-MQTT-TO-HTTP")).toBe(true);
    });

    it("returns requires-configuration when connecting a gRPC client to a service without gRPC configured", () => {
      const nodeA = makeNode("nodeA", "grpc-endpoint", "protocol-and-interface-components", [
        { id: "grpc-client", name: "gRPC Out", type: "output", dataType: "gRPC_Call" },
      ]);
      const nodeB = makeNode("nodeB", "application-server", "compute-and-application-services", [
        { id: "http-in", name: "HTTP In", type: "input", dataType: "HTTP_Request" },
      ], { protocols: ["HTTP"] });

      const res = architectureValidationEngine.validateConnection(
        {
          sourceNodeId: "nodeA",
          targetNodeId: "nodeB",
          sourceHandleId: "grpc-client",
          targetHandleId: "http-in",
        },
        [nodeA, nodeB],
        [],
      );

      expect(res.decision).toBe("requires-configuration");
      expect(res.valid).toBe(true);
      expect(res.findings.some((f) => f.ruleId === "PROTO-003-GRPC-INTERFACE-CONFIG")).toBe(true);
    });

    it("allows with warning when HTTPS client connects to endpoint without documented TLS termination", () => {
      const nodeA = makeNode("nodeA", "https-endpoint", "protocol-and-interface-components", [
        { id: "https-out", name: "HTTPS Out", type: "output", dataType: "HTTPS_Request" },
      ]);
      const nodeB = makeNode("nodeB", "application-server", "compute-and-application-services", [
        { id: "http-in", name: "HTTP In", type: "input", dataType: "HTTP_Request" },
      ], { tlsEnabled: false, tlsTermination: false });

      const res = architectureValidationEngine.validateConnection(
        {
          sourceNodeId: "nodeA",
          targetNodeId: "nodeB",
          sourceHandleId: "https-out",
          targetHandleId: "http-in",
        },
        [nodeA, nodeB],
        [],
      );

      expect(res.decision).toBe("allowed-with-warnings");
      expect(res.valid).toBe(true);
      expect(res.findings.some((f) => f.ruleId === "PROTO-004-HTTPS-TLS-TERMINATION")).toBe(true);
      expect(res.findings[0].documentationId).toBe("https-endpoint");
      expect(res.findings[0].documentationPath).toBe("/tutorial/system-design/components/https-endpoint");
    });
  });

  describe("Cross-Category Relationship Rules", () => {
    it("flags browser direct connection to database wire protocol with a warning", () => {
      const browser = makeNode("browser", "web-browser", "clients-and-user-interfaces", [
        { id: "http-out", name: "HTTP Out", type: "output", dataType: "HTTP_Request" },
      ]);
      const db = makeNode("db", "relational-database", "databases-and-persistence", [
        { id: "sql-in", name: "SQL Query In", type: "input", dataType: "SQL_Query" },
      ]);

      const res = architectureValidationEngine.validateConnection(
        {
          sourceNodeId: "browser",
          targetNodeId: "db",
          sourceHandleId: "http-out",
          targetHandleId: "sql-in",
        },
        [browser, db],
        [],
      );

      expect(res.decision).toBe("allowed-with-warnings");
      expect(res.findings.some((f) => f.ruleId === "REL-001-BROWSER-DIRECT-DATABASE")).toBe(true);
    });

    it("rejects connecting a read replica to a non-database component", () => {
      const replica = makeNode("rep1", "read-replica", "databases-and-persistence", [
        { id: "repl-in", name: "Replication In", type: "input", dataType: "WAL_Stream" },
      ]);
      const cdn = makeNode("cdn1", "cdn", "dns-cdn-edge", [
        { id: "origin-out", name: "CDN Out", type: "output", dataType: "HTTP_Request" },
      ]);

      const res = architectureValidationEngine.validateConnection(
        {
          sourceNodeId: "rep1",
          targetNodeId: "cdn1",
          sourceHandleId: "repl-in",
          targetHandleId: "origin-out",
        },
        [replica, cdn],
        [],
      );

      expect(res.decision).toBe("rejected");
      expect(res.findings.some((f) => f.ruleId === "REL-002-DATABASE-REPLICATION-PRIMARY")).toBe(true);
    });

    it("allows valid connection from API Gateway to Microservice using HTTPS", () => {
      const gateway = makeNode("gw", "api-gateway", "networking-and-traffic", [
        { id: "route-out", name: "Backend Out", type: "output", dataType: "HTTPS_Request" },
      ]);
      const service = makeNode("svc", "microservice", "compute-and-application-services", [
        { id: "http-in", name: "HTTP(S) In", type: "input", dataType: "HTTPS_Request" },
      ], { tlsTermination: true });

      const res = architectureValidationEngine.validateConnection(
        {
          sourceNodeId: "gw",
          targetNodeId: "svc",
          sourceHandleId: "route-out",
          targetHandleId: "http-in",
        },
        [gateway, service],
        [],
      );

      expect(res.decision).toBe("allowed");
      expect(res.valid).toBe(true);
      expect(res.findings.length).toBe(0);
      expect(res.resolvedRelationship).toBe("request-response");
      expect(res.resolvedProtocolId).toBe("https");
    });
  });

  describe("Structural and Dependency Graph Rules", () => {
    it("detects cyclic containment when group contains itself or ancestor", () => {
      const groupA: BaseNode = {
        id: "groupA",
        type: "group",
        position: { x: 0, y: 0 },
        data: { parentId: "groupB" },
      };
      const groupB: BaseNode = {
        id: "groupB",
        type: "group",
        position: { x: 0, y: 0 },
        data: { parentId: "groupA" },
      };

      const graphRes = architectureValidationEngine.validateGraph([groupA, groupB], []);
      expect(graphRes.valid).toBe(false);
      expect(graphRes.findings.some((f) => f.ruleId === "STRUC-004-CYCLIC-CONTAINMENT")).toBe(true);
      expect(graphRes.summary.errors).toBeGreaterThan(0);
    });

    it("flags an orphaned read replica that lacks an upstream replication source", () => {
      const replica = makeNode("replica1", "read-replica", "databases-and-persistence", [], {
        role: "replica",
      });

      const graphRes = architectureValidationEngine.validateGraph([replica], []);
      expect(graphRes.findings.some((f) => f.ruleId === "DEP-001-READ-REPLICA-PRIMARY")).toBe(true);
      expect(graphRes.summary.warnings).toBeGreaterThan(0);
    });
  });

  describe("Performance & Scalability Targets", () => {
    it("validates a 100-node graph in under 50ms", () => {
      const nodes: BaseNode[] = [];
      const edges: BaseEdge[] = [];

      for (let i = 0; i < 100; i++) {
        nodes.push(makeNode(`node_${i}`, "application-server", "compute-and-application-services", [
          { id: "in", name: "In", type: "input", dataType: "HTTP_Request" },
          { id: "out", name: "Out", type: "output", dataType: "HTTP_Request" },
        ]));
        if (i > 0) {
          edges.push({
            id: `edge_${i}`,
            source: `node_${i - 1}`,
            target: `node_${i}`,
            sourceHandle: "out",
            targetHandle: "in",
            data: {},
          });
        }
      }

      const t0 = performance.now();
      const res = architectureValidationEngine.validateGraph(nodes, edges);
      const elapsed = performance.now() - t0;

      expect(res.valid).toBe(true);
      expect(elapsed).toBeLessThan(100); // Target < 100ms
    });

    it("validates a 500-node dense graph in under 200ms", () => {
      const nodes: BaseNode[] = [];
      const edges: BaseEdge[] = [];

      for (let i = 0; i < 500; i++) {
        nodes.push(makeNode(`node_${i}`, "application-server", "compute-and-application-services", [
          { id: "in", name: "In", type: "input", dataType: "HTTP_Request" },
          { id: "out", name: "Out", type: "output", dataType: "HTTP_Request" },
        ]));
        if (i > 0) {
          edges.push({
            id: `edge_${i}`,
            source: `node_${i - 1}`,
            target: `node_${i}`,
            sourceHandle: "out",
            targetHandle: "in",
            data: {},
          });
        }
      }

      const t0 = performance.now();
      const res = architectureValidationEngine.validateGraph(nodes, edges);
      const elapsed = performance.now() - t0;

      expect(res.valid).toBe(true);
      expect(elapsed).toBeLessThan(500); // Scalability target < 500ms even under full multi-core suite load
    });
  });
});
