import type {
  SecurityScenario,
  GatewaySecurityRoute,
  MiddlewareStageConfig,
} from "./security-schemas";

export type SecurityScenarioPresetId =
  | "public_endpoint"
  | "protected_valid_jwt"
  | "expired_jwt"
  | "invalid_jwt_signature"
  | "wrong_jwt_audience"
  | "missing_api_key"
  | "rbac_denial"
  | "abac_denial"
  | "tenant_isolation_denial"
  | "waf_sql_injection_block"
  | "rate_limit_rejection"
  | "oauth_pkce_flow"
  | "oauth_client_credentials"
  | "cors_preflight_denial"
  | "mtls_handshake_success"
  | "mtls_cert_expired";

export interface SecurityPresetMetadata {
  id: SecurityScenarioPresetId;
  title: string;
  category: "Authentication & Identity" | "Authorization & Tenancy" | "Boundary & Protection" | "Protocols & Service Mesh";
  description: string;
}

export const SECURITY_PRESET_METADATA: Record<SecurityScenarioPresetId, SecurityPresetMetadata> = {
  public_endpoint: {
    id: "public_endpoint",
    title: "Public Endpoint (Unauthenticated)",
    category: "Authentication & Identity",
    description: "Evaluates public route (GET /health) without authentication requirements; request reaches backend seamlessly.",
  },
  protected_valid_jwt: {
    id: "protected_valid_jwt",
    title: "Protected Endpoint (Valid JWT)",
    category: "Authentication & Identity",
    description: "Evaluates 10-step JWT claims and modeled signature verification; principal authenticated and authorized.",
  },
  expired_jwt: {
    id: "expired_jwt",
    title: "Expired JWT Token",
    category: "Authentication & Identity",
    description: "Token expired at virtual time 100ms (clock at 150ms). Gateway rejects with HTTP 401 Unauthorized.",
  },
  invalid_jwt_signature: {
    id: "invalid_jwt_signature",
    title: "Invalid JWT Signature (Tampered)",
    category: "Authentication & Identity",
    description: "Signature mismatch against IdP JWKS public key. Authentication fails with 401 before reaching backend.",
  },
  wrong_jwt_audience: {
    id: "wrong_jwt_audience",
    title: "Wrong Token Audience (aud Mismatch)",
    category: "Authentication & Identity",
    description: "JWT audience is issued for another service, preventing cross-service token replay attacks.",
  },
  missing_api_key: {
    id: "missing_api_key",
    title: "Missing API Key",
    category: "Authentication & Identity",
    description: "Protected route requires 'x-api-key' header; request arrives without credentials and fails fast with 401.",
  },
  rbac_denial: {
    id: "rbac_denial",
    title: "RBAC Permission Denial (Viewer DELETE)",
    category: "Authorization & Tenancy",
    description: "Principal has 'viewer' role; attempts DELETE /api/documents/42. RBAC policy denies action with HTTP 403.",
  },
  abac_denial: {
    id: "abac_denial",
    title: "ABAC Attribute Restriction Denial",
    category: "Authorization & Tenancy",
    description: "ABAC policy requires department == 'engineering'; principal has 'marketing'. Request denied with 403.",
  },
  tenant_isolation_denial: {
    id: "tenant_isolation_denial",
    title: "Cross-Tenant Access Boundary Violation",
    category: "Authorization & Tenancy",
    description: "Principal belongs to tenant_alpha; attempts access to tenant_beta document. Tenant isolation boundary denies.",
  },
  waf_sql_injection_block: {
    id: "waf_sql_injection_block",
    title: "WAF SQL Injection Block",
    category: "Boundary & Protection",
    description: "Request body contains '' OR '1'='1' payload. High-priority WAF rule triggers immediate 403 block.",
  },
  rate_limit_rejection: {
    id: "rate_limit_rejection",
    title: "Rate Limit Quota Exhaustion (HTTP 429)",
    category: "Boundary & Protection",
    description: "Token bucket capacity exhausted (0 tokens). Gateway returns 429 with Retry-After header; backend spared.",
  },
  oauth_pkce_flow: {
    id: "oauth_pkce_flow",
    title: "OAuth 2.0 Authorization Code + PKCE",
    category: "Protocols & Service Mesh",
    description: "Visualizes full browser redirect, PKCE code challenge, authorization code exchange, and token validation.",
  },
  oauth_client_credentials: {
    id: "oauth_client_credentials",
    title: "OAuth 2.0 Client Credentials (M2M)",
    category: "Protocols & Service Mesh",
    description: "Service-to-service machine authentication directly obtaining access token to query protected backend.",
  },
  cors_preflight_denial: {
    id: "cors_preflight_denial",
    title: "CORS Origin Preflight Denial",
    category: "Boundary & Protection",
    description: "Origin 'https://malicious-site.com' not permitted by CORS allowlist; preflight rejected with 403.",
  },
  mtls_handshake_success: {
    id: "mtls_handshake_success",
    title: "Mutual TLS (mTLS) Handshake Success",
    category: "Protocols & Service Mesh",
    description: "Client X.509 certificate verified against trusted root CA and authorized SPIFFE mesh identity.",
  },
  mtls_cert_expired: {
    id: "mtls_cert_expired",
    title: "mTLS Expired Client Certificate Failure",
    category: "Protocols & Service Mesh",
    description: "Client presents expired certificate. Handshake aborted immediately before application payload processing.",
  },
};

export function createSecurityPresetScenario(
  presetId: SecurityScenarioPresetId,
  gatewayNodeId = "api_gateway",
  targetServiceNodeId = "order_service"
): SecurityScenario {
  const meta = SECURITY_PRESET_METADATA[presetId];

  const defaultRoutes: GatewaySecurityRoute[] = [
    {
      id: "route_health",
      pathPattern: "/health",
      matchType: "exact",
      methods: ["GET"],
      targetNodeId: targetServiceNodeId,
      priority: 1,
      requiredAuth: "none",
    },
    {
      id: "route_orders",
      pathPattern: "/api/orders/:id",
      matchType: "parameterized",
      methods: ["GET", "POST", "DELETE"],
      targetNodeId: targetServiceNodeId,
      priority: 2,
      requiredAuth: "jwt",
      requiredRoles: ["user", "admin"],
      requiredPermissions: ["orders:read"],
    },
    {
      id: "route_documents",
      pathPattern: "/api/documents/:id",
      matchType: "parameterized",
      methods: ["GET", "POST", "DELETE"],
      targetNodeId: targetServiceNodeId,
      priority: 3,
      requiredAuth: "jwt",
      requiredRoles: ["viewer", "editor", "admin"],
    },
    {
      id: "route_api_keys",
      pathPattern: "/api/v1/data",
      matchType: "prefix",
      methods: ["GET", "POST"],
      targetNodeId: targetServiceNodeId,
      priority: 4,
      requiredAuth: "apikey",
    },
  ];

  const defaultPipeline: MiddlewareStageConfig[] = [
    { id: "mw_waf", type: "waf", name: "Web Application Firewall (WAF)", enabled: true, order: 1 },
    { id: "mw_cors", type: "cors", name: "CORS Policy Enforcement", enabled: true, order: 2 },
    { id: "mw_rate_limiting", type: "rate_limiting", name: "Rate Limiter (Token Bucket)", enabled: true, order: 3 },
    { id: "mw_auth", type: "authentication", name: "Authentication Middleware", enabled: true, order: 4 },
    { id: "mw_authz", type: "authorization", name: "Authorization & Policy Engine", enabled: true, order: 5 },
    { id: "mw_mtls", type: "mtls", name: "Mutual TLS Service Identity", enabled: false, order: 6 },
  ];

  const baseScenario: SecurityScenario = {
    version: 1,
    id: presetId,
    title: meta.title,
    description: meta.description,
    entryNodeId: gatewayNodeId,
    targetServiceNodeId,
    request: {
      id: "req_sec_01",
      method: "GET",
      path: "/api/orders/42",
      headers: {
        authorization: "Bearer eyJhbGciOiJSUzI1NiIsIn...",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      clientIp: "192.168.1.100",
      sourceAddressFixture: "corp-client-subnet",
      correlationId: "corr_sec_999",
      resourceContext: {
        resourceId: "orders_42",
        resourceType: "orders",
        action: "read",
        ownerId: "usr_alice",
        tenantId: "tenant_alpha",
      },
    },
    routes: defaultRoutes,
    pipeline: defaultPipeline,
    jwtScenario: {
      tokenPresent: true,
      rawTokenPreview: "eyJhbGciOiJSUzI1NiIsIn...",
      structureValid: true,
      signatureValid: true,
      algorithmAllowed: true,
      expectedIssuer: "https://auth.nxtqr.com",
      actualIssuer: "https://auth.nxtqr.com",
      expectedAudience: "https://api.nxtqr.com",
      actualAudience: "https://api.nxtqr.com",
      expiresAtMs: 60000,
      claims: {
        sub: "usr_alice",
        roles: ["user", "viewer"],
        tenant_id: "tenant_alpha",
        scope: "orders:read orders:write",
      },
    },
    authzPolicy: {
      combiningAlgorithm: "deny_overrides",
      defaultDecision: "deny",
      rbacRules: [
        { role: "admin", resourceType: "*", allowedActions: ["*"] },
        { role: "editor", resourceType: "*", allowedActions: ["read", "write"] },
        { role: "user", resourceType: "orders", allowedActions: ["read", "write"] },
        { role: "viewer", resourceType: "*", allowedActions: ["read"] },
      ],
      abacRules: [],
      ownershipRule: {
        requireOwnerMatch: false,
        ownerField: "ownerId",
        principalField: "id",
      },
      tenantIsolation: {
        enforceTenantBoundary: true,
        tenantField: "tenantId",
      },
    },
    wafPolicy: {
      defaultAction: "allow",
      rules: [
        {
          id: "waf_sqli",
          name: "SQL Injection Block Rule",
          priority: 1,
          enabled: true,
          condition: {
            type: "suspicious_payload",
            operator: "contains",
            pattern: "sql_injection",
          },
          action: "block",
          description: "Blocks SQL injection patterns such as ' OR '1'='1 and UNION SELECT.",
        },
      ],
    },
    rateLimitPolicy: {
      enabled: true,
      algorithm: "token_bucket",
      capacity: 100,
      refillRatePerSec: 50,
      limitByKey: "client_ip",
      retryAfterSec: 30,
    },
    corsPolicy: {
      enabled: true,
      allowedOrigins: ["https://app.nxtqr.com", "https://studio.nxtqr.com"],
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["authorization", "content-type", "x-api-key"],
      allowCredentials: true,
      maxAgeSec: 86400,
    },
    limits: {
      maxEvents: 2000,
      maxVirtualDurationMs: 30000,
      maxPolicyEvaluations: 100,
    },
  };

  // Configure Scenario Specializations
  switch (presetId) {
    case "public_endpoint":
      baseScenario.request.path = "/health";
      baseScenario.request.headers = {};
      baseScenario.jwtScenario = undefined;
      break;

    case "protected_valid_jwt":
      // Uses defaults with valid token
      break;

    case "expired_jwt":
      baseScenario.jwtScenario!.expiresAtMs = 0; // Expired in the past at t=0
      break;

    case "invalid_jwt_signature":
      baseScenario.jwtScenario!.signatureValid = false;
      break;

    case "wrong_jwt_audience":
      baseScenario.jwtScenario!.actualAudience = "https://auth.thirdparty.com";
      break;

    case "missing_api_key":
      baseScenario.request.path = "/api/v1/data";
      baseScenario.routes[3].requiredAuth = "apikey";
      baseScenario.request.headers = {};
      baseScenario.apiKeyScenario = {
        keyPresent: false,
        keyHeaderName: "x-api-key",
        isValid: false,
        isRevoked: false,
      };
      break;

    case "rbac_denial":
      baseScenario.request.method = "DELETE";
      baseScenario.request.path = "/api/documents/42";
      baseScenario.request.resourceContext = {
        resourceId: "doc_42",
        resourceType: "documents",
        action: "delete",
        ownerId: "usr_alice",
        tenantId: "tenant_alpha",
      };
      baseScenario.jwtScenario!.claims.roles = ["viewer"]; // Viewer cannot delete
      break;

    case "abac_denial":
      baseScenario.request.path = "/api/orders/42";
      baseScenario.jwtScenario!.claims.department = "marketing";
      baseScenario.authzPolicy!.abacRules = [
        {
          id: "abac_eng_dept",
          name: "Engineering Department Only",
          description: "Orders API restricted to engineering personnel.",
          effect: "deny",
          action: "*",
          resourceType: "orders",
          conditions: [
            {
              attribute: "principal.attributes.department",
              operator: "not_equals",
              value: "engineering",
            },
          ],
        },
      ];
      break;

    case "tenant_isolation_denial":
      baseScenario.request.path = "/api/orders/42";
      baseScenario.jwtScenario!.claims.tenant_id = "tenant_alpha";
      baseScenario.request.resourceContext!.tenantId = "tenant_beta"; // Cross-tenant!
      break;

    case "waf_sql_injection_block":
      baseScenario.request.path = "/api/orders/42";
      baseScenario.request.method = "POST";
      baseScenario.request.body = {
        filter: "id' OR '1'='1",
      };
      break;

    case "rate_limit_rejection":
      baseScenario.rateLimitPolicy!.capacity = 0; // Exhausted bucket!
      break;

    case "oauth_pkce_flow":
      baseScenario.routes[1].requiredAuth = "oauth";
      baseScenario.oauthScenario = {
        flowType: "authorization_code_pkce",
        clientId: "client_portal_app",
        redirectUri: "https://app.nxtqr.com/callback",
        scopes: ["orders:read", "profile"],
        usePkce: true,
        pkceCodeChallenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
        pkceCodeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
        authorizationGranted: true,
        tokenEndpointResponse: {
          accessToken: "nxt_pkce_access_token_jwt",
          idToken: "nxt_pkce_id_token_jwt",
          tokenType: "Bearer",
          expiresInSec: 3600,
          scopes: ["orders:read", "profile"],
        },
      };
      break;

    case "oauth_client_credentials":
      baseScenario.routes[1].requiredAuth = "oauth";
      baseScenario.oauthScenario = {
        flowType: "client_credentials",
        clientId: "service_invoice_daemon",
        clientSecretConfigured: true,
        redirectUri: "internal://services/invoices",
        scopes: ["invoices:sync", "orders:read"],
        usePkce: false,
        authorizationGranted: true,
        tokenEndpointResponse: {
          accessToken: "nxt_m2m_access_token_jwt",
          tokenType: "Bearer",
          expiresInSec: 7200,
          scopes: ["invoices:sync", "orders:read"],
        },
      };
      break;

    case "cors_preflight_denial":
      baseScenario.request.method = "OPTIONS";
      baseScenario.request.origin = "https://malicious-site.com";
      baseScenario.request.headers = {
        origin: "https://malicious-site.com",
        "access-control-request-method": "DELETE",
      };
      break;

    case "mtls_handshake_success":
      baseScenario.pipeline.find((p) => p.type === "mtls")!.enabled = true;
      baseScenario.mtlsPolicy = {
        enabled: true,
        requireClientCert: true,
        trustedCAs: ["NXTQR Root CA v1"],
        allowedSpiffeIds: ["spiffe://nxtqr.mesh/ns/prod/sa/order-caller"],
        clientCertScenario: {
          certPresent: true,
          subjectCommonName: "order-caller.mesh.nxtqr.internal",
          issuerCommonName: "NXTQR Root CA v1",
          spiffeId: "spiffe://nxtqr.mesh/ns/prod/sa/order-caller",
          isValid: true,
          isExpired: false,
          isIssuerTrusted: true,
        },
      };
      break;

    case "mtls_cert_expired":
      baseScenario.pipeline.find((p) => p.type === "mtls")!.enabled = true;
      baseScenario.mtlsPolicy = {
        enabled: true,
        requireClientCert: true,
        trustedCAs: ["NXTQR Root CA v1"],
        clientCertScenario: {
          certPresent: true,
          subjectCommonName: "expired-service.mesh.nxtqr.internal",
          issuerCommonName: "NXTQR Root CA v1",
          isValid: true,
          isExpired: true, // Expired cert!
          isIssuerTrusted: true,
        },
      };
      break;

    default:
      break;
  }

  return baseScenario;
}
