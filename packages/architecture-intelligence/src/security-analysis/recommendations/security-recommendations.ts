import type { HealthRecommendation } from "../../contracts/health.types";

export interface SecurityRemediation {
  id: string;
  title: string;
  category: string;
  summary: string;
  actionableStep: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  suggestedComponentTypes?: string[];
  documentationId?: string;
}

export const SECURITY_RECOMMENDATIONS_CATALOG: Record<string, SecurityRemediation> = {
  "REC-SEC-AUTH-001": {
    id: "REC-SEC-AUTH-001",
    title: "Enforce Ingress Authentication or Declare Explicit Anonymous Policy",
    category: "authentication",
    summary:
      "Public-facing APIs and services must have an explicit authentication requirement modeled, or be deliberately classified for anonymous access.",
    actionableStep:
      "Connect the ingress gateway or application to an Authentication Service, OAuth/OIDC Provider, or set isAnonymousAllowed: true in component metadata.",
    effort: "medium",
    impact: "high",
    suggestedComponentTypes: ["authentication-service", "oauth-provider", "openid-connect-provider", "api-key-service"],
    documentationId: "sec-auth-ingress",
  },
  "REC-SEC-AUTHZ-001": {
    id: "REC-SEC-AUTHZ-001",
    title: "Model Policy-Based Authorization for Privileged and Protected Endpoints",
    category: "authorization",
    summary:
      "Authentication proves caller identity, but authorization verifies that identity has permission to perform the requested operation.",
    actionableStep:
      "Integrate an Authorization Service or Policy Engine (e.g. OPA/Permit/Casbin) with your service or API Gateway to enforce RBAC/ABAC guardrails.",
    effort: "medium",
    impact: "high",
    suggestedComponentTypes: ["authorization-service", "policy-engine"],
    documentationId: "sec-authz-policy",
  },
  "REC-SEC-TLS-001": {
    id: "REC-SEC-TLS-001",
    title: "Upgrade Perimeter and Cross-Boundary Connections to Encrypted Protocols",
    category: "transport-security",
    summary:
      "Plaintext transport (HTTP, unencrypted TCP) over public networks or cross-trust boundaries exposes payloads to interception and tampering.",
    actionableStep:
      "Enforce TLS (HTTPS, WSS, gRPC over TLS, or mutual TLS) across all ingress traffic and network boundary crossings.",
    effort: "low",
    impact: "high",
    suggestedComponentTypes: ["web-application-firewall", "reverse-proxy", "api-gateway"],
    documentationId: "sec-transport-encryption",
  },
  "REC-SEC-TLS-002": {
    id: "REC-SEC-TLS-002",
    title: "Enable Transport Encryption for Database and Storage Ingress",
    category: "transport-security",
    summary:
      "Database and persistence connections carrying operational data should require in-transit TLS encryption to prevent eavesdropping.",
    actionableStep:
      "Configure TLS/SSL connection enforcement (sslmode=require or verify-full) on the persistence node and client connection strings.",
    effort: "low",
    impact: "high",
    suggestedComponentTypes: ["relational-database", "nosql-database", "object-storage"],
    documentationId: "sec-database-tls",
  },
  "REC-SEC-EXP-001": {
    id: "REC-SEC-EXP-001",
    title: "Isolate Data Persistence Behind Application Tiers or Private Gateways",
    category: "public-exposure",
    summary:
      "Direct internet routing to relational, NoSQL, or cache databases creates severe exposure to brute force, denial of service, and direct exploit attempts.",
    actionableStep:
      "Remove direct public ingress to databases; route client traffic through an API Gateway, Web Server, or Application Service inside a private subnet.",
    effort: "medium",
    impact: "high",
    suggestedComponentTypes: ["api-gateway", "reverse-proxy", "compute-instance"],
    documentationId: "sec-database-isolation",
  },
  "REC-SEC-EXP-002": {
    id: "REC-SEC-EXP-002",
    title: "Restrict Administrative Interfaces with Perimeter Segmentation and Bastion Access",
    category: "public-exposure",
    summary:
      "Administrative consoles, control planes, and management ports should not be openly accessible from the public internet.",
    actionableStep:
      "Place management interfaces inside a private network or behind a Zero-Trust Network Access (ZTNA) / VPN boundary with strict MFA.",
    effort: "medium",
    impact: "high",
    suggestedComponentTypes: ["network-boundary", "trust-boundary", "authentication-service"],
    documentationId: "sec-admin-isolation",
  },
  "REC-SEC-SEC-001": {
    id: "REC-SEC-SEC-001",
    title: "Model Centralized Secrets Management and Vault-Backed Credential Rotation",
    category: "secrets-management",
    summary:
      "Databases, third-party payment gateways, and backend services require credentials; these should be sourced from a Secrets Manager or KMS rather than static environment variables.",
    actionableStep:
      "Add a Secrets Manager or Key Management Service component and model credential injection or dynamic retrieval paths.",
    effort: "low",
    impact: "medium",
    suggestedComponentTypes: ["secrets-manager", "key-management-service"],
    documentationId: "sec-secrets-vault",
  },
  "REC-SEC-NET-001": {
    id: "REC-SEC-NET-001",
    title: "Segment Multi-Tier Architecture into DMZ, Application, and Data Subnets",
    category: "network-segmentation",
    summary:
      "Placing frontend clients, application servers, and persistence layers in an unsegmented flat network magnifies lateral movement risk during a compromise.",
    actionableStep:
      "Deploy Network Boundaries (VPCs/Subnets) isolating DMZ ingress, private application compute, and high-security database layers.",
    effort: "medium",
    impact: "high",
    suggestedComponentTypes: ["network-boundary", "system-boundary", "web-application-firewall"],
    documentationId: "sec-network-segmentation",
  },
  "REC-SEC-DATA-001": {
    id: "REC-SEC-DATA-001",
    title: "Apply Tokenization, Field-Level Encryption, or Masking to Sensitive Data Crossings",
    category: "sensitive-data",
    summary:
      "Confidential or restricted data (PII, PCI, PHI) crossing trust boundaries must have explicit cryptographic protection and data minimization.",
    actionableStep:
      "Introduce field-level encryption or tokenization services before transmitting sensitive records across untrusted or third-party boundaries.",
    effort: "high",
    impact: "high",
    suggestedComponentTypes: ["key-management-service", "token-service"],
    documentationId: "sec-data-tokenization",
  },
  "REC-SEC-DATA-002": {
    id: "REC-SEC-DATA-002",
    title: "Ensure Data Sanitization and Redaction in Logging & Analytics Pipelines",
    category: "sensitive-data",
    summary:
      "Sensitive payload fields streamed to logging aggregators or analytics warehouses risk accidental disclosure without data masking controls.",
    actionableStep:
      "Model a redaction or log-scrubbing filter before telemetry feeds leave application compute nodes.",
    effort: "low",
    impact: "medium",
    suggestedComponentTypes: ["observability-service", "data-pipeline"],
    documentationId: "sec-log-redaction",
  },
  "REC-SEC-API-001": {
    id: "REC-SEC-API-001",
    title: "Implement Ingress Rate Limiting and WAF Request Inspection",
    category: "api-security",
    summary:
      "Public APIs without rate limiters or DDoS protection are vulnerable to denial of service, resource exhaustion, and automated credential stuffing.",
    actionableStep:
      "Deploy a Rate Limiter, Web Application Firewall (WAF), or configure rate limiting on the API Gateway ingress node.",
    effort: "low",
    impact: "high",
    suggestedComponentTypes: ["rate-limiter", "web-application-firewall", "ddos-protection"],
    documentationId: "sec-rate-limiting",
  },
  "REC-SEC-EXT-001": {
    id: "REC-SEC-EXT-001",
    title: "Verify Cryptographic Signatures and Enforce Idempotency on Inbound Webhooks",
    category: "third-party-integration",
    summary:
      "External webhooks (e.g. Stripe, GitHub, Twilio) can be spoofed or replayed if inbound HTTP requests are not verified with HMAC signatures.",
    actionableStep:
      "Model signature verification at the webhook intake handler and use unique idempotency keys with replay deduplication windows.",
    effort: "low",
    impact: "high",
    suggestedComponentTypes: ["api-gateway", "authentication-service"],
    documentationId: "sec-webhook-verification",
  },
};

export function getSecurityRemediation(id: string): SecurityRemediation | undefined {
  return SECURITY_RECOMMENDATIONS_CATALOG[id];
}

export function toHealthRecommendation(rec: SecurityRemediation): HealthRecommendation {
  return {
    id: rec.id,
    title: rec.title,
    description: rec.summary,
    dimension: "security",
    effort: rec.effort,
    impact: rec.impact,
    actionableStep: rec.actionableStep,
    suggestedComponentTypes: rec.suggestedComponentTypes,
  };
}
