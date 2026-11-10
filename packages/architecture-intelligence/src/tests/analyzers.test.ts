import { describe, it, expect } from "vitest";
import { architectureHealthEngine } from "../core/assessment-engine";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

describe("Architecture Analyzers", () => {
  it("flags single points of failure (REL-SPOF-001) on non-redundant cut vertices", () => {
    const nodes: BaseNode[] = [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "gateway", type: "api-gateway", position: { x: 100, y: 0 }, data: { replicas: 1, highAvailability: false } },
      { id: "service", type: "container-service", position: { x: 200, y: 0 }, data: {} },
    ];
    const edges: BaseEdge[] = [
      { id: "e1", source: "client", target: "gateway" },
      { id: "e2", source: "gateway", target: "service" },
    ];

    const report = architectureHealthEngine.assessGraph(nodes, edges);
    const relFindings = report.dimensions.reliability.findings;
    const spof = relFindings.find((f) => f.ruleId === "REL-SPOF-001" && f.affectedNodeIds.includes("gateway"));

    expect(spof).toBeDefined();
    expect(spof?.severity).toBe("high");
    expect(spof?.title).toContain("Single Point of Failure");
  });

  it("detects direct client-to-database exposure (SEC-EXPOSE-001)", () => {
    const nodes: BaseNode[] = [
      { id: "browser", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "db", type: "relational-database", position: { x: 200, y: 0 }, data: {} },
    ];
    const edges: BaseEdge[] = [
      { id: "e_leak", source: "browser", target: "db" },
    ];

    const report = architectureHealthEngine.assessGraph(nodes, edges);
    const secFindings = report.dimensions.security.findings;
    const exposure = secFindings.find((f) => f.ruleId === "SEC-EXPOSE-001");

    expect(exposure).toBeDefined();
    expect(exposure?.severity).toBe("critical");
  });

  it("detects plaintext HTTP ingress protocols (SEC-UNENC-001)", () => {
    const nodes: BaseNode[] = [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "api", type: "api-gateway", position: { x: 200, y: 0 }, data: {} },
    ];
    const edges: BaseEdge[] = [
      { id: "e_http", source: "client", target: "api", data: { protocol: "HTTP" } },
    ];

    const report = architectureHealthEngine.assessGraph(nodes, edges);
    const secFindings = report.dimensions.security.findings;
    const plaintext = secFindings.find((f) => f.ruleId === "SEC-UNENC-001");

    expect(plaintext).toBeDefined();
    expect(plaintext?.severity).toBe("high");
  });

  it("detects circular service dependencies (MAINT-CYCLE-001)", () => {
    const nodes: BaseNode[] = [
      { id: "orders", type: "container-service", position: { x: 0, y: 0 }, data: {} },
      { id: "payments", type: "container-service", position: { x: 100, y: 0 }, data: {} },
    ];
    const edges: BaseEdge[] = [
      { id: "e1", source: "orders", target: "payments" },
      { id: "e2", source: "payments", target: "orders" },
    ];

    const report = architectureHealthEngine.assessGraph(nodes, edges);
    const maintFindings = report.dimensions.maintainability.findings;
    const cycle = maintFindings.find((f) => f.ruleId === "MAINT-CYCLE-001");

    expect(cycle).toBeDefined();
    expect(cycle?.severity).toBe("high");
  });

  it("flags missing centralized observability in multi-service graph (OPS-OBS-001)", () => {
    const nodes: BaseNode[] = [
      { id: "s1", type: "container-service", position: { x: 0, y: 0 }, data: {} },
      { id: "s2", type: "container-service", position: { x: 100, y: 0 }, data: {} },
      { id: "s3", type: "container-service", position: { x: 200, y: 0 }, data: {} },
    ];
    const edges: BaseEdge[] = [];

    const report = architectureHealthEngine.assessGraph(nodes, edges);
    const opsFindings = report.dimensions.operations.findings;
    const obs = opsFindings.find((f) => f.ruleId === "OPS-OBS-001");

    expect(obs).toBeDefined();
  });
});
