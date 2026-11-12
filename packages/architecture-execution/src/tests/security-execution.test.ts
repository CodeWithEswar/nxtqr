import { describe, it, expect } from "vitest";
import {
  SecurityExecutionEngine,
  createSecurityPresetScenario,
  SECURITY_PRESET_METADATA,
  SecurityRouteResolver,
  JwtSimulator,
  ApiKeySimulator,
  PolicyEngine,
  WafEngine,
  CorsSimulator,
  MtlsSimulator,
  OAuthSimulator,
  type SecurityScenarioPresetId,
} from "../index";

describe("NXTQR Phase 05.4.8 — Interactive Security Execution Engine", () => {
  describe("1. Gateway Routing Resolution", () => {
    const routes = [
      {
        id: "r_exact",
        pathPattern: "/health",
        matchType: "exact" as const,
        methods: ["GET" as const],
        targetNodeId: "health_service",
        priority: 1,
        requiredAuth: "none" as const,
      },
      {
        id: "r_param",
        pathPattern: "/orders/:id",
        matchType: "parameterized" as const,
        methods: ["GET" as const, "DELETE" as const],
        targetNodeId: "order_service",
        priority: 2,
        requiredAuth: "jwt" as const,
      },
      {
        id: "r_prefix",
        pathPattern: "/api/v1",
        matchType: "prefix" as const,
        methods: ["*" as const],
        targetNodeId: "api_service",
        priority: 3,
        requiredAuth: "apikey" as const,
      },
    ];

    it("matches exact route correctly", () => {
      const res = SecurityRouteResolver.matchRoute(routes, "/health", "GET");
      expect(res.matched).toBe(true);
      expect(res.route?.id).toBe("r_exact");
    });

    it("extracts path parameters in parameterized route", () => {
      const res = SecurityRouteResolver.matchRoute(routes, "/orders/42", "GET");
      expect(res.matched).toBe(true);
      expect(res.route?.id).toBe("r_param");
      expect(res.pathParams).toEqual({ id: "42" });
    });

    it("matches prefix route", () => {
      const res = SecurityRouteResolver.matchRoute(routes, "/api/v1/users/profile", "POST");
      expect(res.matched).toBe(true);
      expect(res.route?.id).toBe("r_prefix");
    });

    it("returns unmatched when method is not allowed", () => {
      const res = SecurityRouteResolver.matchRoute(routes, "/health", "POST");
      expect(res.matched).toBe(false);
      expect(res.rejectedReasons.some((r) => r.reason.includes("Method 'POST'"))).toBe(true);
    });

    it("returns unmatched when path does not match any route", () => {
      const res = SecurityRouteResolver.matchRoute(routes, "/unknown/path", "GET");
      expect(res.matched).toBe(false);
    });
  });

  describe("2. Authentication Middleware (JWT, API Key, OAuth)", () => {
    it("JwtSimulator: Validates valid active JWT token and produces principal", () => {
      const res = JwtSimulator.validateToken(
        {
          tokenPresent: true,
          structureValid: true,
          signatureValid: true,
          algorithmAllowed: true,
          expectedIssuer: "https://auth.nxtqr.com",
          actualIssuer: "https://auth.nxtqr.com",
          expectedAudience: "https://api.nxtqr.com",
          actualAudience: "https://api.nxtqr.com",
          expiresAtMs: 1000,
          claims: { sub: "usr_alice", roles: ["user"], tenant_id: "tenant_1" },
        },
        500
      );

      expect(res.valid).toBe(true);
      expect(res.principal?.id).toBe("usr_alice");
      expect(res.principal?.roles).toEqual(["user"]);
      expect(res.principal?.tenantId).toBe("tenant_1");
    });

    it("JwtSimulator: Rejects expired token in virtual time", () => {
      const res = JwtSimulator.validateToken(
        {
          tokenPresent: true,
          structureValid: true,
          signatureValid: true,
          algorithmAllowed: true,
          expectedIssuer: "https://auth.nxtqr.com",
          actualIssuer: "https://auth.nxtqr.com",
          expectedAudience: "https://api.nxtqr.com",
          actualAudience: "https://api.nxtqr.com",
          expiresAtMs: 100, // Expired at t=100
          claims: { sub: "usr_bob" },
        },
        150 // Clock at t=150
      );

      expect(res.valid).toBe(false);
      expect(res.failureReasonCode).toBe("TOKEN_EXPIRED");
    });

    it("JwtSimulator: Rejects invalid signature", () => {
      const res = JwtSimulator.validateToken(
        {
          tokenPresent: true,
          structureValid: true,
          signatureValid: false,
          algorithmAllowed: true,
          expectedIssuer: "https://auth.nxtqr.com",
          actualIssuer: "https://auth.nxtqr.com",
          expectedAudience: "https://api.nxtqr.com",
          actualAudience: "https://api.nxtqr.com",
          claims: { sub: "usr_charlie" },
        },
        100
      );

      expect(res.valid).toBe(false);
      expect(res.failureReasonCode).toBe("INVALID_SIGNATURE");
    });

    it("ApiKeySimulator: Validates valid active API key", () => {
      const res = ApiKeySimulator.validateKey(
        {
          keyPresent: true,
          keyHeaderName: "x-api-key",
          isValid: true,
          isRevoked: false,
          associatedPrincipalId: "principal_client_1",
          allowedScopes: ["read", "write"],
        },
        100
      );

      expect(res.valid).toBe(true);
      expect(res.principal?.id).toBe("principal_client_1");
      expect(res.principal?.authMethod).toBe("apikey");
    });

    it("ApiKeySimulator: Rejects missing or revoked API key", () => {
      const missing = ApiKeySimulator.validateKey(
        { keyPresent: false, keyHeaderName: "x-api-key", isValid: false, isRevoked: false },
        100
      );
      expect(missing.valid).toBe(false);
      expect(missing.failureReasonCode).toBe("API_KEY_MISSING");

      const revoked = ApiKeySimulator.validateKey(
        { keyPresent: true, keyHeaderName: "x-api-key", isValid: true, isRevoked: true },
        100
      );
      expect(revoked.valid).toBe(false);
      expect(revoked.failureReasonCode).toBe("API_KEY_REVOKED");
    });

    it("OAuthSimulator: Simulates Authorization Code with PKCE", () => {
      const res = OAuthSimulator.simulateFlow(
        {
          flowType: "authorization_code_pkce",
          clientId: "portal_client",
          redirectUri: "https://app.nxtqr.com/cb",
          scopes: ["orders:read"],
          usePkce: true,
          authorizationGranted: true,
        },
        100
      );

      expect(res.success).toBe(true);
      expect(res.steps.length).toBe(5);
      expect(res.principal?.authMethod).toBe("oauth");
    });
  });

  describe("3. Authorization & Policy Engine (RBAC, ABAC, Ownership, Tenancy)", () => {
    it("RBAC: Permits action when role matches", () => {
      const res = PolicyEngine.evaluateAuthorization(
        {
          combiningAlgorithm: "deny_overrides",
          defaultDecision: "deny",
          rbacRules: [{ role: "editor", resourceType: "documents", allowedActions: ["read", "write"] }],
          abacRules: [],
        },
        {
          id: "usr_alice",
          isAuthenticated: true,
          authMethod: "jwt",
          roles: ["editor"],
          permissions: [],
          attributes: {},
        },
        { resourceId: "doc_1", resourceType: "documents", action: "write" }
      );

      expect(res.decision).toBe("permit");
    });

    it("RBAC: Denies action when role lacks required action permission", () => {
      const res = PolicyEngine.evaluateAuthorization(
        {
          combiningAlgorithm: "deny_overrides",
          defaultDecision: "deny",
          rbacRules: [{ role: "viewer", resourceType: "documents", allowedActions: ["read"] }],
          abacRules: [],
        },
        {
          id: "usr_bob",
          isAuthenticated: true,
          authMethod: "jwt",
          roles: ["viewer"],
          permissions: [],
          attributes: {},
        },
        { resourceId: "doc_1", resourceType: "documents", action: "delete" }
      );

      expect(res.decision).toBe("deny");
    });

    it("Tenant Isolation: Denies cross-tenant resource access", () => {
      const res = PolicyEngine.evaluateAuthorization(
        {
          combiningAlgorithm: "deny_overrides",
          defaultDecision: "deny",
          rbacRules: [{ role: "admin", resourceType: "*", allowedActions: ["*"] }],
          abacRules: [],
          tenantIsolation: { enforceTenantBoundary: true, tenantField: "tenantId" },
        },
        {
          id: "usr_admin",
          isAuthenticated: true,
          authMethod: "jwt",
          roles: ["admin"],
          permissions: ["*"],
          attributes: {},
          tenantId: "tenant_alpha",
        },
        { resourceId: "orders_99", resourceType: "orders", action: "read", tenantId: "tenant_beta" }
      );

      expect(res.decision).toBe("deny");
      expect(res.denialReasonCode).toBe("TENANT_MISMATCH");
    });
  });

  describe("4. Protection Mechanisms (WAF, CORS, mTLS)", () => {
    it("WafEngine: Blocks SQL injection pattern in payload", () => {
      const res = WafEngine.evaluateRequest(
        {
          defaultAction: "allow",
          rules: [
            {
              id: "rule_sqli",
              name: "Block SQLi",
              priority: 1,
              enabled: true,
              condition: { type: "suspicious_payload", operator: "contains", pattern: "sql_injection" },
              action: "block",
              description: "SQLi block",
            },
          ],
        },
        {
          id: "req_1",
          method: "POST",
          path: "/api/search",
          headers: {},
          body: { query: "admin' OR '1'='1" },
          clientIp: "10.0.0.1",
          sourceAddressFixture: "public",
          correlationId: "c_1",
        }
      );

      expect(res.action).toBe("block");
      expect(res.matchedRule?.id).toBe("rule_sqli");
    });

    it("CorsSimulator: Rejects unallowed origin", () => {
      const res = CorsSimulator.evaluateCors(
        {
          enabled: true,
          allowedOrigins: ["https://trusted.nxtqr.com"],
          allowedMethods: ["GET", "POST"],
          allowedHeaders: ["authorization"],
          allowCredentials: true,
          maxAgeSec: 3600,
        },
        {
          id: "req_cors",
          method: "GET",
          path: "/api/data",
          headers: { origin: "https://untrusted.com" },
          origin: "https://untrusted.com",
          clientIp: "1.2.3.4",
          sourceAddressFixture: "public",
          correlationId: "c_2",
        }
      );

      expect(res.allowed).toBe(false);
    });

    it("MtlsSimulator: Verifies client certificate and rejects expired certificate", () => {
      const valid = MtlsSimulator.evaluateHandshake(
        {
          enabled: true,
          requireClientCert: true,
          trustedCAs: ["Root CA"],
          clientCertScenario: {
            certPresent: true,
            isValid: true,
            isExpired: false,
            isIssuerTrusted: true,
            subjectCommonName: "client_service",
          },
        },
        100
      );
      expect(valid.handshakeSuccess).toBe(true);
      expect(valid.clientVerified).toBe(true);

      const expired = MtlsSimulator.evaluateHandshake(
        {
          enabled: true,
          requireClientCert: true,
          trustedCAs: ["Root CA"],
          clientCertScenario: {
            certPresent: true,
            isValid: true,
            isExpired: true,
            isIssuerTrusted: true,
          },
        },
        100
      );
      expect(expired.handshakeSuccess).toBe(false);
    });
  });

  describe("5. Full Security Engine Simulation Across Presets", () => {
    it("Executes public_endpoint scenario allowing access without credentials", () => {
      const sc = createSecurityPresetScenario("public_endpoint");
      const trace = SecurityExecutionEngine.executeScenario(sc);

      expect(trace.outcome).toBe("success");
      const respEvt = trace.events.find((e) => e.type === "security.response.generated");
      expect(respEvt?.statusCode).toBe(200);
      expect(respEvt?.reachedBackend).toBe(true);
    });

    it("Executes protected_valid_jwt scenario allowing access to backend", () => {
      const sc = createSecurityPresetScenario("protected_valid_jwt");
      const trace = SecurityExecutionEngine.executeScenario(sc);

      expect(trace.outcome).toBe("success");
      const authSucc = trace.events.find((e) => e.type === "auth.succeeded");
      expect(authSucc).toBeDefined();

      const lastFrame = trace.frames[trace.frames.length - 1];
      expect(lastFrame.metrics?.securityMetrics?.allowed).toBe(1);
      expect(lastFrame.runtimeState?.securityState?.reachedBackend).toBe(true);
    });

    it("Executes expired_jwt scenario generating HTTP 401 and preventing backend call", () => {
      const sc = createSecurityPresetScenario("expired_jwt");
      const trace = SecurityExecutionEngine.executeScenario(sc);

      expect(trace.outcome).toBe("failure");
      const authFail = trace.events.find((e) => e.type === "auth.failed");
      expect(authFail?.httpStatus).toBe(401);

      const lastFrame = trace.frames[trace.frames.length - 1];
      expect(lastFrame.runtimeState?.securityState?.finalResponse.statusCode).toBe(401);
      expect(lastFrame.runtimeState?.securityState?.reachedBackend).toBe(false);
      expect(lastFrame.metrics?.securityMetrics?.backendPrevented).toBe(1);
    });

    it("Executes rbac_denial scenario generating HTTP 403 Forbidden", () => {
      const sc = createSecurityPresetScenario("rbac_denial");
      const trace = SecurityExecutionEngine.executeScenario(sc);

      expect(trace.outcome).toBe("failure");
      const authzDeny = trace.events.find((e) => e.type === "authorization.denied");
      expect(authzDeny).toBeDefined();

      const lastFrame = trace.frames[trace.frames.length - 1];
      expect(lastFrame.runtimeState?.securityState?.finalResponse.statusCode).toBe(403);
    });

    it("Executes waf_sql_injection_block scenario blocking malicious query", () => {
      const sc = createSecurityPresetScenario("waf_sql_injection_block");
      const trace = SecurityExecutionEngine.executeScenario(sc);

      expect(trace.outcome).toBe("failure");
      const wafBlock = trace.events.find((e) => e.type === "waf.blocked");
      expect(wafBlock).toBeDefined();
    });

    it("Executes rate_limit_rejection scenario generating HTTP 429 Too Many Requests", () => {
      const sc = createSecurityPresetScenario("rate_limit_rejection");
      const trace = SecurityExecutionEngine.executeScenario(sc);

      expect(trace.outcome).toBe("failure");
      const rlRej = trace.events.find((e) => e.type === "security.ratelimit.rejected");
      expect(rlRej).toBeDefined();

      const lastFrame = trace.frames[trace.frames.length - 1];
      expect(lastFrame.runtimeState?.securityState?.finalResponse.statusCode).toBe(429);
    });

    it("Validates all 16 presets load valid scenarios and execute deterministically", () => {
      const presetIds = Object.keys(SECURITY_PRESET_METADATA) as SecurityScenarioPresetId[];
      expect(presetIds.length).toBe(16);

      for (const presetId of presetIds) {
        const scenario = createSecurityPresetScenario(presetId);
        expect(scenario.id).toBe(presetId);
        expect(scenario.routes.length).toBeGreaterThan(0);

        const trace = SecurityExecutionEngine.executeScenario(scenario);
        expect(trace.events.length).toBeGreaterThan(0);
        expect(trace.frames.length).toBeGreaterThan(0);
        expect(trace.frames[0].runtimeState?.securityState).toBeDefined();
      }
    });
  });
});
