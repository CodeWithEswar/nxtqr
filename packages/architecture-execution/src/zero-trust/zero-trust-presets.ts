import type { ZeroTrustScenario } from "./zero-trust-schemas";

export interface ZeroTrustPresetMeta {
  id: ZeroTrustPresetId;
  label: string;
  description: string;
  category:
    | "zero_trust"
    | "identity_auth"
    | "authorization_network"
    | "threats_mitigation";
}

export type ZeroTrustPresetId =
  | "zt_baseline"
  | "internal_network_not_trusted"
  | "valid_identity_denied_permission"
  | "expired_access_token"
  | "revoked_access_token"
  | "incorrect_token_audience"
  | "untrusted_issuer"
  | "missing_authorization_scope"
  | "overprivileged_service_role"
  | "cross_tenant_access_attempt"
  | "service_to_service_mtls"
  | "expired_workload_certificate"
  | "untrusted_certificate_issuer"
  | "missing_network_segmentation"
  | "default_deny_network_policy"
  | "egress_restriction"
  | "secret_rotation"
  | "stale_secret_consumer"
  | "synthetic_credential_compromise"
  | "credential_revocation"
  | "lateral_movement_risk"
  | "privilege_escalation_risk"
  | "public_admin_interface"
  | "data_classification_boundary"
  | "unprotected_transport_segment"
  | "stride_threat_model"
  | "defense_in_depth"
  | "security_control_failure"
  | "synthetic_dos"
  | "rate_limit_mitigation"
  | "attack_path_containment"
  | "blast_radius_reduction"
  | "security_incident_investigation"
  | "mitigation_verification"
  | "before_after_posture";

export const ZERO_TRUST_PRESET_METADATA: ZeroTrustPresetMeta[] = [
  {
    id: "zt_baseline",
    label: "Zero Trust Baseline",
    description: "Verified Checkout workload identity accesses Orders API under least privilege and strict mTLS.",
    category: "zero_trust",
  },
  {
    id: "internal_network_not_trusted",
    label: "Internal Network Not Trusted",
    description: "Caller inside internal_services zone still denied when lacking explicit policy & scopes.",
    category: "zero_trust",
  },
  {
    id: "valid_identity_denied_permission",
    label: "Valid Identity, Denied Permission",
    description: "Authentication succeeds, but least-privilege RBAC denies unauthorized write action.",
    category: "zero_trust",
  },
  {
    id: "expired_access_token",
    label: "Expired Access Token",
    description: "Simulated OAuth2 token passed expiration timestamp and transitions to EXPIRED state.",
    category: "identity_auth",
  },
  {
    id: "revoked_access_token",
    label: "Revoked Access Token",
    description: "Previously valid token is explicitly revoked and immediately rejected.",
    category: "identity_auth",
  },
  {
    id: "incorrect_token_audience",
    label: "Incorrect Token Audience",
    description: "Token scoped for billing-api is rejected by orders-api due to audience mismatch.",
    category: "identity_auth",
  },
  {
    id: "untrusted_issuer",
    label: "Untrusted Issuer",
    description: "Token issued by external unapproved IdP is rejected by resource trust policy.",
    category: "identity_auth",
  },
  {
    id: "missing_authorization_scope",
    label: "Missing Authorization Scope",
    description: "Authenticated principal holds orders:read only; orders:write action is denied.",
    category: "identity_auth",
  },
  {
    id: "overprivileged_service_role",
    label: "Overprivileged Service Role",
    description: "Service with wildcard permission exposes restricted DB in blast-radius check.",
    category: "authorization_network",
  },
  {
    id: "cross_tenant_access_attempt",
    label: "Cross-Tenant Access Attempt",
    description: "Tenant Alpha principal attempts cross-tenant read of Tenant Beta records and is denied.",
    category: "authorization_network",
  },
  {
    id: "service_to_service_mtls",
    label: "Service-to-Service mTLS",
    description: "Mutual TLS with SPIFFE workload identities authenticates both services.",
    category: "identity_auth",
  },
  {
    id: "expired_workload_certificate",
    label: "Expired Workload Certificate",
    description: "Expired X.509 client certificate fails mutual TLS transport verification.",
    category: "identity_auth",
  },
  {
    id: "untrusted_certificate_issuer",
    label: "Untrusted Certificate Issuer",
    description: "Self-signed or unknown CA certificate fails mTLS root trust validation.",
    category: "identity_auth",
  },
  {
    id: "missing_network_segmentation",
    label: "Missing Network Segmentation",
    description: "Flat permissive network permits unsegmented reachability across zones until restricted.",
    category: "authorization_network",
  },
  {
    id: "default_deny_network_policy",
    label: "Default-Deny Network Policy",
    description: "Strict ingress segmentation blocks unpermitted cross-zone service paths.",
    category: "authorization_network",
  },
  {
    id: "egress_restriction",
    label: "Egress Restriction (SSRF Risk)",
    description: "Strict outbound allowlist blocks SSRF-style unexpected internal destination access.",
    category: "authorization_network",
  },
  {
    id: "secret_rotation",
    label: "Secret Rotation",
    description: "Simulated secret version rotates safely with old version revocation.",
    category: "identity_auth",
  },
  {
    id: "stale_secret_consumer",
    label: "Stale Secret Consumer",
    description: "Consumer using unrotated v1 secret fails after rotation boundary.",
    category: "identity_auth",
  },
  {
    id: "synthetic_credential_compromise",
    label: "Synthetic Credential Compromise",
    description: "Compromised credential triggers blast-radius recalculation across reachable assets.",
    category: "threats_mitigation",
  },
  {
    id: "credential_revocation",
    label: "Credential Revocation Mitigation",
    description: "Revoking compromised token closes access paths and resolves active exposure.",
    category: "threats_mitigation",
  },
  {
    id: "lateral_movement_risk",
    label: "Lateral Movement Risk",
    description: "Abstract compromise models multi-hop service reachability across missing boundaries.",
    category: "threats_mitigation",
  },
  {
    id: "privilege_escalation_risk",
    label: "Privilege Escalation Risk",
    description: "Overprivileged workload role enables transition toward restricted storage asset.",
    category: "threats_mitigation",
  },
  {
    id: "public_admin_interface",
    label: "Publicly Reachable Admin Interface",
    description: "Admin portal exposed in public zone flagged in attack-surface analysis until isolated.",
    category: "authorization_network",
  },
  {
    id: "data_classification_boundary",
    label: "Data Classification Boundary",
    description: "Restricted data protected by classification-aware ABAC condition.",
    category: "authorization_network",
  },
  {
    id: "unprotected_transport_segment",
    label: "Unprotected Transport Segment",
    description: "Plaintext HTTP segment generates transport finding and encryption boundary caveat.",
    category: "authorization_network",
  },
  {
    id: "stride_threat_model",
    label: "STRIDE Threat Model",
    description: "Multi-category STRIDE evaluation across spoofing, tampering, and information disclosure.",
    category: "threats_mitigation",
  },
  {
    id: "defense_in_depth",
    label: "Defense in Depth",
    description: "Layered Gateway Auth, Network Policy, RBAC, and mTLS stop an attack step.",
    category: "zero_trust",
  },
  {
    id: "security_control_failure",
    label: "Security Control Failure",
    description: "Misconfigured segmentation control allows attack step until re-enabled.",
    category: "threats_mitigation",
  },
  {
    id: "synthetic_dos",
    label: "Synthetic Denial of Service",
    description: "High-rate synthetic flood against public gateway without rate limiting control.",
    category: "threats_mitigation",
  },
  {
    id: "rate_limit_mitigation",
    label: "Rate-Limit Mitigation",
    description: "Enabling rate limiting and WAF filtering contains synthetic DoS threat.",
    category: "threats_mitigation",
  },
  {
    id: "attack_path_containment",
    label: "Attack-Path Containment",
    description: "Mid-path segmentation blocks lateral step and halts downstream attack progression.",
    category: "threats_mitigation",
  },
  {
    id: "blast_radius_reduction",
    label: "Blast-Radius Reduction",
    description: "Reducing wildcard permissions shrinks compromised reachability to 0 sensitive assets.",
    category: "threats_mitigation",
  },
  {
    id: "security_incident_investigation",
    label: "Security Incident Investigation",
    description: "Investigation mode shows only observable denials and anomalies before ground truth.",
    category: "threats_mitigation",
  },
  {
    id: "mitigation_verification",
    label: "Mitigation Verification",
    description: "Applies mitigation mid-timeline and verifies post-mitigation request denials and containment.",
    category: "threats_mitigation",
  },
  {
    id: "before_after_posture",
    label: "Before/After Posture Comparison",
    description: "Baseline permissive exposure vs hardened Zero Trust defensive controls.",
    category: "zero_trust",
  },
];

function buildBaseZeroTrustScenario(id: ZeroTrustPresetId): ZeroTrustScenario {
  const meta =
    ZERO_TRUST_PRESET_METADATA.find((p) => p.id === id) ??
    ZERO_TRUST_PRESET_METADATA[0]!;

  return {
    version: 1,
    id: `zt_${id}`,
    presetId: id,
    label: meta.label,
    architectureRevisionId: "rev_001",
    seed: 101,
    viewMode: "investigation",
    defaultNetworkDeny: false,
    identities: [
      {
        id: "checkout-svc",
        label: "Checkout Service",
        principalType: "workload_identity",
        zoneId: "application",
        issuerId: "idp-nxtqr",
        tenantId: "tenant-alpha",
        roles: ["order-reader"],
        permissions: ["orders-api:read"],
        attributes: { env: "prod", tier: "standard" },
        tokenId: "tok_checkout",
        certificateId: "cert_checkout",
        authStrength: "strong",
        compromised: false,
      },
      {
        id: "analytics-worker",
        label: "Analytics Worker",
        principalType: "background_worker",
        zoneId: "internal_services",
        issuerId: "idp-nxtqr",
        tenantId: "tenant-alpha",
        roles: ["metrics-reader"],
        permissions: ["metrics:read"],
        attributes: { env: "prod" },
        tokenId: "tok_worker",
        certificateId: "cert_worker",
        authStrength: "standard",
        compromised: false,
      },
      {
        id: "tenant-beta-client",
        label: "Tenant Beta Client",
        principalType: "end_user",
        zoneId: "public",
        issuerId: "idp-nxtqr",
        tenantId: "tenant-beta",
        roles: ["order-reader"],
        permissions: ["orders-api:read"],
        attributes: {},
        tokenId: "tok_beta",
        authStrength: "strong",
        compromised: false,
      },
    ],
    tokens: [
      {
        id: "tok_checkout",
        authModel: "oauth2_access_token",
        issuerId: "idp-nxtqr",
        subjectId: "checkout-svc",
        audience: ["orders-api", "payments-api"],
        issuedAtMs: 0,
        expiresAtMs: 5000,
        scopes: ["orders:read"],
        revoked: false,
        simulatedSignatureValid: true,
        compromised: false,
      },
      {
        id: "tok_worker",
        authModel: "workload_identity",
        issuerId: "idp-nxtqr",
        subjectId: "analytics-worker",
        audience: ["metrics-api"],
        issuedAtMs: 0,
        expiresAtMs: 5000,
        scopes: ["metrics:read"],
        revoked: false,
        simulatedSignatureValid: true,
        compromised: false,
      },
      {
        id: "tok_beta",
        authModel: "oidc_identity",
        issuerId: "idp-nxtqr",
        subjectId: "tenant-beta-client",
        audience: ["orders-api"],
        issuedAtMs: 0,
        expiresAtMs: 5000,
        scopes: ["orders:read"],
        revoked: false,
        simulatedSignatureValid: true,
        compromised: false,
      },
    ],
    certificates: [
      {
        id: "cert_checkout",
        subjectId: "checkout-svc",
        spiffeId: "spiffe://nxtqr.internal/ns/prod/sa/checkout",
        issuerId: "ca-nxtqr-root",
        trustedIssuer: true,
        issuedAtMs: 0,
        expiresAtMs: 5000,
        revoked: false,
        identityMismatch: false,
      },
      {
        id: "cert_worker",
        subjectId: "analytics-worker",
        spiffeId: "spiffe://nxtqr.internal/ns/prod/sa/analytics",
        issuerId: "ca-nxtqr-root",
        trustedIssuer: true,
        issuedAtMs: 0,
        expiresAtMs: 5000,
        revoked: false,
        identityMismatch: false,
      },
    ],
    secrets: [
      {
        id: "sec_orders_db",
        name: "orders-db-dsn",
        ownerId: "orders-db",
        allowedConsumerIds: ["orders-api"],
        version: 1,
        rotationState: "current",
        expiresAtMs: 5000,
        revoked: false,
        exposedInSimulation: false,
      },
    ],
    resources: [
      {
        id: "api-gateway",
        label: "API Gateway",
        kind: "api_gateway",
        zoneId: "edge",
        tenantId: "tenant-alpha",
        classification: "internal",
        publiclyReachable: true,
        acceptedActions: ["read", "write"],
        requiredScopes: [],
        requiredAuthStrength: "standard",
        trustedIssuers: ["idp-nxtqr"],
        expectedAudiences: ["api-gateway", "orders-api"],
        transportSecurity: "tls",
        encryptedAtRest: true,
        processedInPlaintext: true,
      },
      {
        id: "orders-api",
        label: "Orders API",
        kind: "service",
        zoneId: "application",
        tenantId: "tenant-alpha",
        classification: "confidential",
        publiclyReachable: false,
        acceptedActions: ["read", "write"],
        requiredScopes: ["orders:read"],
        requiredAuthStrength: "standard",
        trustedIssuers: ["idp-nxtqr"],
        expectedAudiences: ["orders-api"],
        transportSecurity: "mtls",
        encryptedAtRest: true,
        processedInPlaintext: true,
      },
      {
        id: "orders-db",
        label: "Orders Database",
        kind: "database",
        zoneId: "data",
        tenantId: "tenant-alpha",
        classification: "restricted",
        publiclyReachable: false,
        acceptedActions: ["read", "write", "admin"],
        requiredScopes: ["orders:read"],
        requiredAuthStrength: "strong",
        trustedIssuers: ["idp-nxtqr"],
        expectedAudiences: ["orders-api", "orders-db"],
        transportSecurity: "mtls",
        encryptedAtRest: true,
        processedInPlaintext: true,
      },
      {
        id: "admin-portal",
        label: "Admin Portal",
        kind: "admin_interface",
        zoneId: "administrative",
        tenantId: "tenant-alpha",
        classification: "restricted",
        publiclyReachable: false,
        acceptedActions: ["admin", "read"],
        requiredScopes: ["admin:all"],
        requiredAuthStrength: "strong",
        trustedIssuers: ["idp-nxtqr"],
        expectedAudiences: ["admin-portal"],
        transportSecurity: "mtls",
        encryptedAtRest: true,
        processedInPlaintext: true,
      },
    ],
    trustBoundaries: [
      {
        id: "tb_edge_app",
        name: "Edge -> Application Boundary",
        type: "edge_app",
        fromZoneId: "edge",
        toZoneId: "application",
        protectedResourceIds: ["orders-api"],
        requiredControlIds: ["ctrl_auth", "ctrl_authz", "ctrl_mtls"],
        enforceStrictCrossing: true,
      },
      {
        id: "tb_app_data",
        name: "Application -> Data Boundary",
        type: "app_data",
        fromZoneId: "application",
        toZoneId: "data",
        protectedResourceIds: ["orders-db"],
        requiredControlIds: ["ctrl_authz", "ctrl_netseg"],
        enforceStrictCrossing: true,
      },
    ],
    authorization: {
      combiningStrategy: "deny_overrides",
      defaultEffect: "deny",
      enforceTenantIsolation: true,
      internalNetworkImpliesTrust: false,
      roles: [
        { role: "order-reader", permissions: ["orders-api:read"] },
        {
          role: "overprivileged-service",
          permissions: ["orders-api:*", "orders-db:*", "admin-portal:*"],
        },
      ],
      rules: [
        {
          id: "pol_checkout_read_orders",
          name: "Least-privilege checkout read on orders-api",
          effect: "allow",
          priority: 10,
          principals: ["checkout-svc"],
          roles: ["order-reader"],
          resources: ["orders-api"],
          actions: ["read"],
          requiredScopes: ["orders:read"],
          requireInputKeys: [],
        },
      ],
    },
    networkPolicies: [
      {
        id: "np_app_to_app",
        name: "Allow Application zone HTTPS to Orders API",
        sourceZoneId: "application",
        destNodeId: "orders-api",
        protocol: "HTTPS",
        port: 443,
        direction: "ingress",
        effect: "allow",
        requireMtls: true,
      },
    ],
    controls: [
      {
        id: "ctrl_auth",
        name: "Zero Trust Identity Verification",
        kind: "authentication",
        state: "enabled",
        protectedAssetIds: ["orders-api", "orders-db", "admin-portal"],
        mitigatesCategories: ["spoofing"],
        blocksConditions: [],
      },
      {
        id: "ctrl_authz",
        name: "Least-Privilege Authorization",
        kind: "least_privilege",
        state: "enabled",
        protectedAssetIds: ["orders-api", "orders-db", "admin-portal"],
        mitigatesCategories: ["elevation_of_privilege"],
        blocksConditions: ["overprivileged_role"],
      },
      {
        id: "ctrl_mtls",
        name: "Workload mTLS",
        kind: "mtls",
        state: "enabled",
        protectedAssetIds: ["orders-api", "orders-db"],
        mitigatesCategories: ["spoofing", "tampering"],
        blocksConditions: ["unprotected_transport"],
      },
      {
        id: "ctrl_netseg",
        name: "Network Segmentation",
        kind: "network_segmentation",
        state: "enabled",
        protectedAssetIds: ["orders-db", "admin-portal"],
        mitigatesCategories: ["information_disclosure", "elevation_of_privilege"],
        blocksConditions: ["missing_network_segmentation"],
      },
    ],
    threats: [],
    requests: [
      {
        id: "req_1",
        atMs: 80,
        principalId: "checkout-svc",
        sourceNodeId: "checkout-svc",
        resourceId: "orders-api",
        action: "read",
        protocol: "HTTPS",
        port: 443,
        expectedAllowed: true,
        environmentAttributes: {},
        description: "Checkout service calls Orders API with verified workload identity",
      },
    ],
    mitigations: [],
    limits: {
      maxIdentities: 100,
      maxResources: 100,
      maxThreats: 25,
      maxAttackSteps: 50,
      maxEvents: 2000,
      maxVirtualDurationMs: 5000,
    },
  };
}

export function createZeroTrustPresetScenario(
  presetId: ZeroTrustPresetId
): ZeroTrustScenario {
  const s = buildBaseZeroTrustScenario(presetId);

  switch (presetId) {
    case "zt_baseline":
    case "service_to_service_mtls":
      return s;

    case "internal_network_not_trusted":
      s.requests = [
        {
          id: "req_internal_no_authz",
          atMs: 80,
          principalId: "analytics-worker",
          sourceNodeId: "analytics-worker",
          resourceId: "orders-api",
          action: "write",
          protocol: "HTTPS",
          port: 443,
          expectedAllowed: false,
          environmentAttributes: {},
          description: "Internal worker calls Orders API write without permission or audience",
        },
      ];
      return s;

    case "valid_identity_denied_permission":
      s.requests = [
        {
          id: "req_valid_id_denied_write",
          atMs: 80,
          principalId: "checkout-svc",
          sourceNodeId: "checkout-svc",
          resourceId: "orders-api",
          action: "write",
          protocol: "HTTPS",
          port: 443,
          expectedAllowed: false,
          environmentAttributes: {},
          description: "Valid identity requests disallowed write action",
        },
      ];
      return s;

    case "expired_access_token":
      s.tokens[0]!.expiresAtMs = 50;
      s.requests[0]!.atMs = 100;
      s.requests[0]!.expectedAllowed = false;
      return s;

    case "revoked_access_token":
      s.tokens[0]!.revoked = true;
      s.requests[0]!.expectedAllowed = false;
      return s;

    case "incorrect_token_audience":
      s.tokens[0]!.audience = ["billing-api"];
      s.requests[0]!.expectedAllowed = false;
      return s;

    case "untrusted_issuer":
      s.tokens[0]!.issuerId = "untrusted-external-idp";
      s.requests[0]!.expectedAllowed = false;
      return s;

    case "missing_authorization_scope":
      s.resources[1]!.requiredScopes = ["orders:write"];
      s.requests[0]!.expectedAllowed = false;
      return s;

    case "overprivileged_service_role":
    case "privilege_escalation_risk":
      s.identities[0]!.roles = ["overprivileged-service"];
      s.identities[0]!.permissions = ["*"];
      s.identities[0]!.compromised = true;
      s.identities[0]!.compromisedAtMs = 40;
      s.controls = s.controls.map((c) =>
        c.kind === "least_privilege" ? { ...c, state: "disabled" } : c
      );
      s.authorization.rules.push({
        id: "pol_wildcard_admin",
        name: "Overprivileged wildcard allow",
        effect: "allow",
        priority: 5,
        principals: ["checkout-svc"],
        roles: [],
        resources: ["*"],
        actions: ["*"],
        requiredScopes: [],
        requireInputKeys: [],
      });
      s.threats = [
        {
          id: "th_priv_esc",
          title: "Privilege escalation via overprivileged workload role",
          category: "elevation_of_privilege",
          atMs: 120,
          principalId: "checkout-svc",
          assetIds: ["orders-db", "admin-portal"],
          entryPointIds: ["checkout-svc"],
          requiredConditions: ["identity_compromised", "overprivileged_role"],
          controlIds: ["ctrl_authz"],
          likelihood: "high",
          impact: "critical",
          steps: [
            {
              id: "st_1",
              sourceNodeId: "checkout-svc",
              targetNodeId: "orders-db",
              action: "admin",
              requiredConditions: ["overprivileged_role"],
              evaluatedControlIds: ["ctrl_authz"],
              explanation: "Overprivileged wildcard role reaches restricted database in simulation.",
            },
          ],
        },
      ];
      return s;

    case "cross_tenant_access_attempt":
      s.authorization.rules.push({
        id: "pol_read_orders_any_tenant_if_unchecked",
        name: "Tenant Alpha orders read",
        effect: "allow",
        priority: 10,
        principals: ["*"],
        roles: ["order-reader"],
        resources: ["orders-api"],
        actions: ["read"],
        requiredScopes: ["orders:read"],
        requireInputKeys: [],
      });
      s.requests = [
        {
          id: "req_cross_tenant",
          atMs: 90,
          principalId: "tenant-beta-client",
          sourceNodeId: "api-gateway",
          resourceId: "orders-api",
          action: "read",
          protocol: "HTTPS",
          port: 443,
          expectedAllowed: false,
          environmentAttributes: {},
          description: "Tenant Beta principal attempts to read Tenant Alpha orders-api",
        },
      ];
      return s;

    case "expired_workload_certificate":
      s.certificates[0]!.expiresAtMs = 50;
      s.requests[0]!.atMs = 100;
      s.requests[0]!.expectedAllowed = false;
      return s;

    case "untrusted_certificate_issuer":
      s.certificates[0]!.trustedIssuer = false;
      s.certificates[0]!.issuerId = "rogue-self-signed-ca";
      s.requests[0]!.expectedAllowed = false;
      return s;

    case "missing_network_segmentation":
      s.defaultNetworkDeny = false;
      s.controls = s.controls.map((c) =>
        c.kind === "network_segmentation" ? { ...c, state: "disabled" } : c
      );
      s.threats = [
        {
          id: "th_flat_net",
          title: "Unsegmented cross-zone reachability",
          category: "information_disclosure",
          atMs: 100,
          principalId: "analytics-worker",
          assetIds: ["orders-db"],
          entryPointIds: ["analytics-worker"],
          requiredConditions: ["missing_network_segmentation"],
          controlIds: ["ctrl_netseg"],
          likelihood: "high",
          impact: "high",
          steps: [
            {
              id: "st_flat_1",
              sourceNodeId: "analytics-worker",
              targetNodeId: "orders-db",
              action: "read",
              requiredConditions: ["missing_network_segmentation"],
              evaluatedControlIds: ["ctrl_netseg"],
              explanation: "Flat network permits direct path from worker to data zone.",
            },
          ],
        },
      ];
      return s;

    case "default_deny_network_policy":
      s.defaultNetworkDeny = true;
      s.networkPolicies = [];
      s.requests[0]!.expectedAllowed = false;
      return s;

    case "egress_restriction":
      s.controls.push({
        id: "ctrl_egress",
        name: "Strict Outbound Egress Allowlist",
        kind: "egress_restriction",
        state: "enabled",
        protectedAssetIds: ["orders-db"],
        mitigatesCategories: ["information_disclosure"],
        blocksConditions: ["missing_egress_restriction"],
      });
      s.threats = [
        {
          id: "th_ssrf_abstract",
          title: "Abstract SSRF Outbound Request Attempt",
          category: "information_disclosure",
          atMs: 110,
          principalId: "checkout-svc",
          assetIds: ["orders-db"],
          entryPointIds: ["checkout-svc"],
          requiredConditions: ["resource_reachable"],
          controlIds: ["ctrl_egress"],
          likelihood: "medium",
          impact: "high",
          steps: [
            {
              id: "st_ssrf_1",
              sourceNodeId: "checkout-svc",
              targetNodeId: "orders-db",
              action: "read",
              requiredConditions: ["missing_egress_restriction"],
              evaluatedControlIds: ["ctrl_egress"],
              explanation: "Blocked by outbound egress destination allowlist.",
            },
          ],
        },
      ];
      return s;

    case "secret_rotation":
      s.mitigations = [
        {
          id: "mit_rot_sec",
          atMs: 140,
          action: "rotate_secret",
          targetId: "sec_orders_db",
          description: "Rotate orders-db-dsn to version 2 and invalidate stale consumers",
        },
      ];
      return s;

    case "stale_secret_consumer":
      s.secrets[0]!.rotationState = "stale_consumer";
      s.secrets[0]!.exposedInSimulation = true;
      s.threats = [
        {
          id: "th_stale_secret",
          title: "Stale Secret Consumer Risk",
          category: "information_disclosure",
          atMs: 100,
          principalId: "checkout-svc",
          assetIds: ["orders-db"],
          entryPointIds: ["checkout-svc"],
          requiredConditions: ["stale_secret_consumer"],
          controlIds: ["ctrl_netseg"],
          likelihood: "medium",
          impact: "high",
          steps: [
            {
              id: "st_sec_1",
              sourceNodeId: "checkout-svc",
              targetNodeId: "orders-db",
              action: "read",
              requiredConditions: ["stale_secret_consumer"],
              evaluatedControlIds: [],
              explanation: "Unrotated secret consumer retains outdated secret reference.",
            },
          ],
        },
      ];
      return s;

    case "synthetic_credential_compromise":
      s.identities[0]!.compromised = true;
      s.identities[0]!.compromisedAtMs = 50;
      s.threats = [
        {
          id: "th_comp_cred",
          title: "Compromised Checkout Workload Token",
          category: "spoofing",
          atMs: 100,
          principalId: "checkout-svc",
          assetIds: ["orders-api"],
          entryPointIds: ["checkout-svc"],
          requiredConditions: ["identity_compromised", "credential_valid"],
          controlIds: [],
          likelihood: "high",
          impact: "critical",
          steps: [
            {
              id: "st_cred_1",
              sourceNodeId: "checkout-svc",
              targetNodeId: "orders-api",
              action: "read",
              requiredConditions: ["identity_compromised", "credential_valid"],
              evaluatedControlIds: [],
              explanation: "Compromised valid token provides modeled read reachability to Orders API.",
            },
          ],
        },
      ];
      return s;

    case "credential_revocation":
    case "mitigation_verification":
      s.identities[0]!.compromised = true;
      s.identities[0]!.compromisedAtMs = 40;
      s.threats = [
        {
          id: "th_rev_mit",
          title: "Compromised Token Before Revocation",
          category: "spoofing",
          atMs: 80,
          principalId: "checkout-svc",
          assetIds: ["orders-api"],
          entryPointIds: ["checkout-svc"],
          requiredConditions: ["identity_compromised", "credential_valid"],
          controlIds: [],
          likelihood: "high",
          impact: "high",
          steps: [
            {
              id: "st_rev_1",
              sourceNodeId: "checkout-svc",
              targetNodeId: "orders-api",
              action: "read",
              requiredConditions: ["credential_valid"],
              evaluatedControlIds: [],
              explanation: "Access open before revocation.",
            },
          ],
        },
      ];
      s.mitigations = [
        {
          id: "mit_revoke_1",
          atMs: 180,
          action: "revoke_credential",
          targetId: "checkout-svc",
          description: "Revoke compromised checkout-svc token and terminate access path",
        },
      ];
      s.requests.push({
        id: "req_post_revoke",
        atMs: 240,
        principalId: "checkout-svc",
        sourceNodeId: "checkout-svc",
        resourceId: "orders-api",
        action: "read",
        protocol: "HTTPS",
        port: 443,
        expectedAllowed: false,
        environmentAttributes: {},
        description: "Verify request is denied immediately after credential revocation",
      });
      return s;

    case "lateral_movement_risk":
    case "attack_path_containment":
    case "defense_in_depth": {
      const contained =
        presetId === "attack_path_containment" || presetId === "defense_in_depth";
      s.identities[0]!.compromised = true;
      s.identities[0]!.compromisedAtMs = 40;
      if (!contained) {
        s.controls = s.controls.map((c) =>
          c.kind === "network_segmentation" ? { ...c, state: "disabled" } : c
        );
      }
      s.threats = [
        {
          id: "th_lat_move",
          title: "Multi-Hop Lateral Movement Path",
          category: "elevation_of_privilege",
          atMs: 100,
          principalId: "checkout-svc",
          assetIds: ["orders-api", "orders-db"],
          entryPointIds: ["checkout-svc"],
          requiredConditions: ["identity_compromised"],
          controlIds: ["ctrl_netseg"],
          likelihood: "high",
          impact: "critical",
          steps: [
            {
              id: "st_lat_1",
              sourceNodeId: "checkout-svc",
              targetNodeId: "orders-api",
              action: "read",
              requiredConditions: ["identity_compromised"],
              evaluatedControlIds: [],
              explanation: "Step 1 reaches Orders API via compromised service token.",
            },
            {
              id: "st_lat_2",
              sourceNodeId: "orders-api",
              targetNodeId: "orders-db",
              action: "read",
              requiredConditions: contained ? ["missing_network_segmentation"] : ["resource_reachable"],
              evaluatedControlIds: ["ctrl_netseg"],
              explanation: contained
                ? "Network segmentation contains transition at Data zone boundary."
                : "Missing segmentation allows step 2 into Orders Database.",
            },
          ],
        },
      ];
      return s;
    }

    case "public_admin_interface":
      s.resources[3]!.publiclyReachable = true;
      s.resources[3]!.zoneId = "public";
      s.threats = [
        {
          id: "th_pub_admin",
          title: "Publicly Reachable Admin Portal",
          category: "elevation_of_privilege",
          atMs: 90,
          principalId: "tenant-beta-client",
          assetIds: ["admin-portal"],
          entryPointIds: ["admin-portal"],
          requiredConditions: ["public_endpoint_exposed"],
          controlIds: [],
          likelihood: "high",
          impact: "critical",
          steps: [
            {
              id: "st_admin_1",
              sourceNodeId: "api-gateway",
              targetNodeId: "admin-portal",
              action: "admin",
              requiredConditions: ["public_endpoint_exposed"],
              evaluatedControlIds: [],
              explanation: "Administrative endpoint exposed in public zone.",
            },
          ],
        },
      ];
      return s;

    case "data_classification_boundary":
      s.authorization.rules = [
        {
          id: "pol_abac_classification",
          name: "Allow read only on non-restricted unless admin clearance",
          effect: "allow",
          priority: 5,
          principals: ["checkout-svc"],
          roles: [],
          resources: ["orders-db"],
          actions: ["read"],
          requiredScopes: ["orders:read"],
          condition: {
            kind: "and",
            expressions: [
              {
                kind: "equals",
                left: { namespace: "resource", key: "classification" },
                right: "restricted",
              },
              {
                kind: "equals",
                left: { namespace: "principal", key: "tier" },
                right: "cleared",
              },
            ],
          },
          requireInputKeys: [],
        },
      ];
      s.requests = [
        {
          id: "req_abac_denied",
          atMs: 90,
          principalId: "checkout-svc",
          sourceNodeId: "checkout-svc",
          resourceId: "orders-db",
          action: "read",
          protocol: "HTTPS",
          port: 443,
          expectedAllowed: false,
          environmentAttributes: {},
          description: "ABAC classification check denies standard tier access to restricted data",
        },
      ];
      return s;

    case "unprotected_transport_segment":
      s.resources[1]!.transportSecurity = "plaintext";
      s.controls = s.controls.map((c) =>
        c.kind === "mtls" ? { ...c, state: "disabled" } : c
      );
      s.threats = [
        {
          id: "th_plaintext",
          title: "Unencrypted Transit Across Application Boundary",
          category: "information_disclosure",
          atMs: 90,
          principalId: "checkout-svc",
          assetIds: ["orders-api"],
          entryPointIds: ["checkout-svc"],
          requiredConditions: ["unprotected_transport"],
          controlIds: ["ctrl_mtls"],
          likelihood: "high",
          impact: "high",
          steps: [
            {
              id: "st_pt_1",
              sourceNodeId: "checkout-svc",
              targetNodeId: "orders-api",
              action: "read",
              requiredConditions: ["unprotected_transport"],
              evaluatedControlIds: ["ctrl_mtls"],
              explanation: "Plaintext segment allows modeled payload observation in transit.",
            },
          ],
        },
      ];
      return s;

    case "stride_threat_model":
    case "before_after_posture":
      s.identities[0]!.compromised = presetId === "before_after_posture";
      s.resources[1]!.transportSecurity = "plaintext";
      s.controls = s.controls.map((c) =>
        c.kind === "mtls" || c.kind === "network_segmentation"
          ? { ...c, state: "misconfigured" }
          : c
      );
      s.threats = [
        {
          id: "th_stride_tamper",
          title: "Tampering on Plaintext Service Link",
          category: "tampering",
          atMs: 90,
          principalId: "checkout-svc",
          assetIds: ["orders-api"],
          entryPointIds: ["checkout-svc"],
          requiredConditions: ["unprotected_transport"],
          controlIds: ["ctrl_mtls"],
          likelihood: "medium",
          impact: "high",
          steps: [
            {
              id: "st_str_1",
              sourceNodeId: "checkout-svc",
              targetNodeId: "orders-api",
              action: "write",
              requiredConditions: ["unprotected_transport"],
              evaluatedControlIds: ["ctrl_mtls"],
              explanation: "Misconfigured mTLS fails to protect integrity in transit.",
            },
          ],
        },
      ];
      if (presetId === "before_after_posture") {
        s.mitigations = [
          {
            id: "mit_harden_mtls",
            atMs: 180,
            action: "require_mtls",
            targetId: "orders-api",
            description: "Enforce strict mTLS on Orders API",
          },
          {
            id: "mit_harden_seg",
            atMs: 200,
            action: "enable_network_restriction",
            targetId: "orders-db",
            description: "Enable default-deny segmentation on Orders DB",
          },
        ];
      }
      return s;

    case "security_control_failure":
      s.controls = s.controls.map((c) =>
        c.kind === "network_segmentation" ? { ...c, state: "misconfigured" } : c
      );
      s.threats = [
        {
          id: "th_ctrl_fail",
          title: "Control Misconfiguration Exposure",
          category: "repudiation",
          atMs: 100,
          principalId: "analytics-worker",
          assetIds: ["orders-db"],
          entryPointIds: ["analytics-worker"],
          requiredConditions: ["control_misconfigured"],
          controlIds: ["ctrl_netseg"],
          likelihood: "medium",
          impact: "high",
          steps: [
            {
              id: "st_cf_1",
              sourceNodeId: "analytics-worker",
              targetNodeId: "orders-db",
              action: "read",
              requiredConditions: ["control_misconfigured"],
              evaluatedControlIds: [],
              explanation: "Misconfigured control allowed unintended path.",
            },
          ],
        },
      ];
      return s;

    case "synthetic_dos":
    case "rate_limit_mitigation":
      s.controls.push({
        id: "ctrl_rl",
        name: "API Gateway Rate Limiter",
        kind: "rate_limiting",
        state: presetId === "rate_limit_mitigation" ? "enabled" : "disabled",
        protectedAssetIds: ["api-gateway"],
        mitigatesCategories: ["denial_of_service"],
        blocksConditions: ["missing_rate_limit"],
      });
      s.threats = [
        {
          id: "th_dos",
          title: "Synthetic Request Flood on API Gateway",
          category: "denial_of_service",
          atMs: 100,
          principalId: "tenant-beta-client",
          assetIds: ["api-gateway"],
          entryPointIds: ["api-gateway"],
          requiredConditions: ["resource_reachable"],
          controlIds: ["ctrl_rl"],
          likelihood: "high",
          impact: "high",
          steps: [
            {
              id: "st_dos_1",
              sourceNodeId: "tenant-beta-client",
              targetNodeId: "api-gateway",
              action: "read",
              requiredConditions: ["missing_rate_limit"],
              evaluatedControlIds: ["ctrl_rl"],
              explanation:
                presetId === "rate_limit_mitigation"
                  ? "Rate limiting sheds synthetic excess flood."
                  : "Unprotected edge saturates under synthetic flood.",
            },
          ],
        },
      ];
      return s;

    case "blast_radius_reduction":
      s.identities[0]!.permissions = ["*"];
      s.identities[0]!.compromised = true;
      s.identities[0]!.compromisedAtMs = 40;
      s.authorization.rules.push({
        id: "pol_broad",
        name: "Broad wildcard policy prior to least privilege",
        effect: "allow",
        priority: 5,
        principals: ["checkout-svc"],
        roles: [],
        resources: ["*"],
        actions: ["*"],
        requiredScopes: [],
        requireInputKeys: [],
      });
      s.mitigations = [
        {
          id: "mit_lp_1",
          atMs: 160,
          action: "reduce_role_permissions",
          targetId: "checkout-svc",
          description: "Restrict checkout-svc permissions to orders-api:read and isolate wildcard access",
        },
        {
          id: "mit_deny_db",
          atMs: 170,
          action: "restrict_resource_access",
          targetId: "orders-db",
          description: "Deny unauthorized direct database access",
        },
      ];
      return s;

    case "security_incident_investigation":
      s.viewMode = "investigation";
      s.identities[0]!.compromised = true;
      s.identities[0]!.compromisedAtMs = 40;
      s.requests.push({
        id: "req_anom",
        atMs: 100,
        principalId: "checkout-svc",
        sourceNodeId: "checkout-svc",
        resourceId: "orders-api",
        action: "read",
        protocol: "HTTPS",
        port: 443,
        expectedAllowed: false,
        environmentAttributes: {},
        description: "Compromised workload identity rejected during verification",
      });
      return s;
  }
}

