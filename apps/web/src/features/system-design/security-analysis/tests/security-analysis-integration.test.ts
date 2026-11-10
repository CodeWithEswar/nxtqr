import { describe, it, expect, beforeEach } from "vitest";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import { securityAnalysisEngine } from "@nxtqr/architecture-intelligence";
import type { BaseNode, BaseEdge } from "@/features/graph-engine/schemas/graph.schema";

describe("Security Architecture Analysis - Store & Engine Integration", () => {
  beforeEach(() => {
    useGraphEditorStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      isSecurityOpen: false,
      securityPanelWidth: 380,
    });
  });

  it("toggles and updates security analysis panel state in graph editor store", () => {
    expect(useGraphEditorStore.getState().isSecurityOpen).toBe(false);

    useGraphEditorStore.getState().toggleSecurity();
    expect(useGraphEditorStore.getState().isSecurityOpen).toBe(true);

    useGraphEditorStore.getState().setSecurityOpen(false);
    expect(useGraphEditorStore.getState().isSecurityOpen).toBe(false);

    useGraphEditorStore.getState().setSecurityPanelWidth(450);
    expect(useGraphEditorStore.getState().securityPanelWidth).toBe(450);
  });

  it("analyzes graph elements loaded into graph editor store and generates security findings", () => {
    const client: BaseNode = {
      id: "browser_1",
      type: "infrastructure",
      position: { x: 0, y: 0 },
      data: {
        componentType: "web-browser",
        label: "Client Browser",
        exposure: "public",
      },
    };

    const publicDb: BaseNode = {
      id: "db_unshielded",
      type: "infrastructure",
      position: { x: 300, y: 0 },
      data: {
        componentType: "relational-database",
        label: "Direct Database",
        exposure: "public",
        publiclyAccessible: true,
      },
    };

    const edge: BaseEdge = {
      id: "e_leak",
      source: "browser_1",
      target: "db_unshielded",
      data: { protocol: "postgres", encryptionInTransit: false },
    };

    useGraphEditorStore.setState({ nodes: [client, publicDb], edges: [edge] });

    const nodes = useGraphEditorStore.getState().nodes;
    const edges = useGraphEditorStore.getState().edges;

    const report = securityAnalysisEngine.analyzeGraph(nodes, edges);

    expect(report.findings.length).toBeGreaterThanOrEqual(2);
    expect(report.summary.criticalCount).toBeGreaterThanOrEqual(1);

    const exposedDbFinding = report.findings.find((f) => f.ruleId === "SEC-EXP-001");
    expect(exposedDbFinding).toBeDefined();
    expect(exposedDbFinding?.affectedNodeIds).toContain("db_unshielded");

    const netFinding = report.findings.find((f) => f.ruleId === "SEC-NET-001");
    expect(netFinding).toBeDefined();
    expect(netFinding?.affectedEdgeIds).toContain("e_leak");
  });

  it("verifies clean security report for zero-trust hardened topology", () => {
    const client: BaseNode = {
      id: "client",
      type: "infrastructure",
      position: { x: 0, y: 0 },
      data: { componentType: "web-browser", label: "Client", exposure: "public" },
    };
    const waf: BaseNode = {
      id: "waf",
      type: "infrastructure",
      position: { x: 100, y: 0 },
      data: { componentType: "web-application-firewall", label: "WAF", exposure: "public" },
    };
    const rateLimiter: BaseNode = {
      id: "rate_limit",
      type: "infrastructure",
      position: { x: 200, y: 0 },
      data: { componentType: "rate-limiter", label: "Rate Limiter" },
    };
    const apiGw: BaseNode = {
      id: "api_gw",
      type: "infrastructure",
      position: { x: 300, y: 0 },
      data: { componentType: "api-gateway", label: "API Gateway", exposure: "public", enforcesTls: true },
    };
    const authSvc: BaseNode = {
      id: "auth_svc",
      type: "infrastructure",
      position: { x: 300, y: -100 },
      data: { componentType: "authentication-service", label: "Auth Provider" },
    };
    const appSvc: BaseNode = {
      id: "app_svc",
      type: "infrastructure",
      position: { x: 450, y: 0 },
      data: { componentType: "compute-instance", label: "App", exposure: "internal", enforcesTls: true },
    };
    const kmsVault: BaseNode = {
      id: "kms",
      type: "infrastructure",
      position: { x: 450, y: 100 },
      data: { componentType: "key-management-service", label: "KMS" },
    };
    const secureDb: BaseNode = {
      id: "secure_db",
      type: "infrastructure",
      position: { x: 600, y: 0 },
      data: { componentType: "relational-database", label: "Private DB", exposure: "private", enforcesTls: true },
    };

    const edges: BaseEdge[] = [
      { id: "e1", source: "client", target: "waf", data: { protocol: "https", encryptionInTransit: true } },
      { id: "e2", source: "waf", target: "rate_limit", data: { protocol: "https", encryptionInTransit: true } },
      { id: "e3", source: "rate_limit", target: "api_gw", data: { protocol: "https", encryptionInTransit: true } },
      { id: "e4", source: "auth_svc", target: "api_gw", data: { protocol: "grpc/tls", encryptionInTransit: true } },
      { id: "e5", source: "api_gw", target: "app_svc", data: { protocol: "grpc/tls", encryptionInTransit: true } },
      { id: "e6", source: "kms", target: "app_svc", data: { protocol: "grpc/tls", encryptionInTransit: true } },
      { id: "e7", source: "app_svc", target: "secure_db", data: { protocol: "postgres", encryptionInTransit: true } },
    ];

    useGraphEditorStore.setState({
      nodes: [client, waf, rateLimiter, apiGw, authSvc, appSvc, kmsVault, secureDb],
      edges,
    });

    const report = securityAnalysisEngine.analyzeGraph(
      useGraphEditorStore.getState().nodes,
      useGraphEditorStore.getState().edges
    );

    expect(report.summary.criticalCount).toBe(0);
    expect(report.summary.highCount).toBe(0);
  });
});
