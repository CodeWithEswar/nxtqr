import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  securityAnalysisEngine,
  SecurityAnalysisEngine,
} from "../index";

describe("Security Architecture Analysis Engine (Phase 05.3.5)", () => {
  it("detects unmodeled ingress authentication (SEC-AUTH-001) for public ingress", () => {
    const nodes: BaseNode[] = [
      {
        id: "client-1",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "web-browser",
          label: "Web Browser",
          exposure: "public",
        },
      },
      {
        id: "api-gw",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: {
          componentType: "api-gateway",
          label: "Public API Gateway",
          exposure: "public",
          isAnonymousAllowed: false,
          requiresAuth: true,
        },
      },
    ];

    const edges: BaseEdge[] = [
      {
        id: "e1",
        source: "client-1",
        target: "api-gw",
        data: { protocol: "https", encryptionInTransit: true },
      },
    ];

    const report = securityAnalysisEngine.analyzeGraph(nodes, edges);
    const authFinding = report.findings.find((f) => f.ruleId === "SEC-AUTH-001");
    expect(authFinding).toBeDefined();
    expect(authFinding?.affectedNodeIds).toContain("api-gw");
    expect(authFinding?.strideCategory).toBe("spoofing");
  });

  it("does not report SEC-AUTH-001 when anonymous access is explicitly allowed or auth service is bound", () => {
    const nodes: BaseNode[] = [
      {
        id: "client-1",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "web-browser",
          label: "Web Browser",
          exposure: "public",
        },
      },
      {
        id: "static-cdn",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: {
          componentType: "content-delivery-network",
          label: "Static Assets CDN",
          exposure: "public",
          isAnonymousAllowed: true,
        },
      },
      {
        id: "api-gw",
        type: "infrastructure",
        position: { x: 200, y: 200 },
        data: {
          componentType: "api-gateway",
          label: "Secured API Gateway",
          exposure: "public",
        },
      },
      {
        id: "auth-svc",
        type: "infrastructure",
        position: { x: 400, y: 200 },
        data: {
          componentType: "authentication-service",
          label: "Central Identity Service",
        },
      },
    ];

    const edges: BaseEdge[] = [
      {
        id: "e1",
        source: "client-1",
        target: "static-cdn",
        data: { protocol: "https", encryptionInTransit: true },
      },
      {
        id: "e2",
        source: "client-1",
        target: "api-gw",
        data: { protocol: "https", encryptionInTransit: true },
      },
      {
        id: "e3",
        source: "auth-svc",
        target: "api-gw",
        data: { protocol: "grpc/tls", encryptionInTransit: true },
      },
    ];

    const report = new SecurityAnalysisEngine().analyzeGraph(nodes, edges);
    const cdnFinding = report.findings.find(
      (f) => f.ruleId === "SEC-AUTH-001" && f.affectedNodeIds.includes("static-cdn")
    );
    expect(cdnFinding).toBeUndefined();

    const gwFinding = report.findings.find(
      (f) => f.ruleId === "SEC-AUTH-001" && f.affectedNodeIds.includes("api-gw")
    );
    expect(gwFinding).toBeUndefined();
  });

  it("detects missing authorization policy on privileged administrative interface (SEC-AUTHZ-001)", () => {
    const nodes: BaseNode[] = [
      {
        id: "admin-console",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "compute-instance",
          label: "Admin Management Console",
          isAdministrative: true,
          exposure: "internal",
        },
      },
    ];

    const report = new SecurityAnalysisEngine().analyzeGraph(nodes, []);
    const authzFinding = report.findings.find((f) => f.ruleId === "SEC-AUTHZ-001");
    expect(authzFinding).toBeDefined();
    expect(authzFinding?.strideCategory).toBe("elevation-of-privilege");
  });

  it("detects plaintext protocol crossing trust boundary (SEC-TLS-001)", () => {
    const nodes: BaseNode[] = [
      {
        id: "boundary-1",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "trust-boundary",
          boundaryName: "Perimeter DMZ",
          threatModelZone: "perimeter",
        },
      },
      {
        id: "client-app",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "web-browser",
          label: "Web Browser",
          trustLevel: "untrusted-public",
          boundaryId: "boundary-1",
        },
      },
      {
        id: "internal-api",
        type: "infrastructure",
        position: { x: 300, y: 0 },
        data: {
          componentType: "compute-instance",
          label: "Core API",
          trustLevel: "internal-workload",
        },
      },
    ];

    const edges: BaseEdge[] = [
      {
        id: "e-plain",
        source: "client-app",
        target: "internal-api",
        data: {
          protocol: "http",
          encryptionInTransit: false,
        },
      },
    ];

    const report = new SecurityAnalysisEngine().analyzeGraph(nodes, edges);
    const tlsFinding = report.findings.find((f) => f.ruleId === "SEC-TLS-001");
    expect(tlsFinding).toBeDefined();
    expect(tlsFinding?.affectedEdgeIds).toContain("e-plain");
  });

  it("detects direct public ingress to databases (SEC-EXP-001) and unsegmented access (SEC-NET-001)", () => {
    const nodes: BaseNode[] = [
      {
        id: "browser",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "web-browser",
          label: "Web Browser",
          exposure: "public",
        },
      },
      {
        id: "prod-db",
        type: "infrastructure",
        position: { x: 300, y: 0 },
        data: {
          componentType: "relational-database",
          label: "Production PostgreSQL",
          publiclyAccessible: true,
          exposure: "public",
        },
      },
    ];

    const edges: BaseEdge[] = [
      {
        id: "e-direct-db",
        source: "browser",
        target: "prod-db",
        data: { protocol: "postgres", encryptionInTransit: false },
      },
    ];

    const report = new SecurityAnalysisEngine().analyzeGraph(nodes, edges);
    const expFinding = report.findings.find((f) => f.ruleId === "SEC-EXP-001");
    const netFinding = report.findings.find((f) => f.ruleId === "SEC-NET-001");
    const dbTlsFinding = report.findings.find((f) => f.ruleId === "SEC-TLS-002");

    expect(expFinding).toBeDefined();
    expect(expFinding?.severity).toBe("critical");

    expect(netFinding).toBeDefined();
    expect(netFinding?.severity).toBe("critical");

    expect(dbTlsFinding).toBeDefined();
  });

  it("detects unmodeled secrets management for credential-dependent components (SEC-SEC-001)", () => {
    const nodes: BaseNode[] = [
      {
        id: "payment-gw",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "payment-gateway",
          label: "Stripe Payment Gateway",
          usesSecrets: true,
        },
      },
    ];

    const report = new SecurityAnalysisEngine().analyzeGraph(nodes, []);
    const secFinding = report.findings.find((f) => f.ruleId === "SEC-SEC-001");
    expect(secFinding).toBeDefined();
    expect(secFinding?.recommendationIds).toContain("REC-SEC-SEC-001");
  });

  it("detects sensitive data flow issues (SEC-DATA-001, SEC-DATA-002, SEC-DATA-003)", () => {
    const nodes: BaseNode[] = [
      {
        id: "billing-svc",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "compute-instance",
          label: "Billing Service",
          dataSensitivity: "confidential",
        },
      },
      {
        id: "analytics-warehouse",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: {
          componentType: "data-analytics-warehouse",
          label: "Global Analytics Warehouse",
        },
      },
      {
        id: "ext-partner",
        type: "infrastructure",
        position: { x: 200, y: 200 },
        data: {
          componentType: "external-dependency",
          label: "Credit Scoring Bureau",
        },
      },
    ];

    const edges: BaseEdge[] = [
      {
        id: "e-telemetry",
        source: "billing-svc",
        target: "analytics-warehouse",
        data: { encryptionInTransit: true, redacted: false },
      },
      {
        id: "e-ext",
        source: "billing-svc",
        target: "ext-partner",
        data: { encryptionInTransit: true, tokenized: false },
      },
    ];

    const report = new SecurityAnalysisEngine().analyzeGraph(nodes, edges);
    const telemetryFinding = report.findings.find((f) => f.ruleId === "SEC-DATA-003");
    const thirdPartyFinding = report.findings.find((f) => f.ruleId === "SEC-DATA-002");

    expect(telemetryFinding).toBeDefined();
    expect(thirdPartyFinding).toBeDefined();
  });

  it("detects unverified webhook signature verification (SEC-EXT-001)", () => {
    const nodes: BaseNode[] = [
      {
        id: "stripe-webhook",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "compute-instance",
          label: "Stripe Webhook Receiver",
          isWebhookHandler: true,
          verifiesSignature: false,
        },
      },
    ];

    const report = new SecurityAnalysisEngine().analyzeGraph(nodes, []);
    const extFinding = report.findings.find((f) => f.ruleId === "SEC-EXT-001");
    expect(extFinding).toBeDefined();
    expect(extFinding?.strideCategory).toBe("tampering");
  });

  it("correctly caches and returns incremental reports when graph hash is unchanged", () => {
    const engine = new SecurityAnalysisEngine();
    const nodes: BaseNode[] = [
      {
        id: "n1",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: { componentType: "static-website", label: "Docs Site", isAnonymousAllowed: true },
      },
    ];

    const report1 = engine.analyzeGraph(nodes, []);
    const report2 = engine.analyzeGraph(nodes, []);

    expect(report1).toBe(report2); // Same cached instance reference
    expect(report1.summary.totalFindings).toBe(0);
  });
});
