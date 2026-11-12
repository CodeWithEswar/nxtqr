import { z } from "zod";

// ========================
// Enumerations & Primitives
// ========================

export const SecurityZoneIdSchema = z.enum([
  "public",
  "edge",
  "application",
  "internal_services",
  "data",
  "administrative",
  "restricted",
]);
export type SecurityZoneId = z.infer<typeof SecurityZoneIdSchema>;

export const TrustBoundaryTypeSchema = z.enum([
  "public_edge",
  "edge_app",
  "app_data",
  "service_service",
  "tenant_tenant",
  "admin_app",
  "region_region",
  "external_internal",
]);
export type TrustBoundaryType = z.infer<typeof TrustBoundaryTypeSchema>;

export const PrincipalTypeSchema = z.enum([
  "end_user",
  "administrator",
  "service_account",
  "workload_identity",
  "background_worker",
  "external_integration",
  "unknown_principal",
]);
export type PrincipalType = z.infer<typeof PrincipalTypeSchema>;

export const AuthModelKindSchema = z.enum([
  "session",
  "api_key",
  "oauth2_access_token",
  "oidc_identity",
  "workload_identity",
  "mtls_client_identity",
]);
export type AuthModelKind = z.infer<typeof AuthModelKindSchema>;

export type AuthenticationState =
  | "UNAUTHENTICATED"
  | "CREDENTIAL_PRESENTED"
  | "VALIDATING"
  | "AUTHENTICATED"
  | "REJECTED"
  | "EXPIRED"
  | "REVOKED";

export type CertificateLifecycleState =
  | "valid"
  | "expiring"
  | "expired"
  | "revoked"
  | "untrusted_issuer"
  | "identity_mismatch";

export const DataClassificationSchema = z.enum([
  "public",
  "internal",
  "confidential",
  "restricted",
]);
export type DataClassification = z.infer<typeof DataClassificationSchema>;

export const StrideCategorySchema = z.enum([
  "spoofing",
  "tampering",
  "repudiation",
  "information_disclosure",
  "denial_of_service",
  "elevation_of_privilege",
]);
export type StrideCategory = z.infer<typeof StrideCategorySchema>;

export const TransportSecurityModeSchema = z.enum([
  "plaintext",
  "tls",
  "mtls",
]);
export type TransportSecurityMode = z.infer<typeof TransportSecurityModeSchema>;

export const PolicyCombiningStrategySchema = z.enum([
  "deny_overrides",
  "permit_overrides",
  "first_applicable",
  "all_required",
]);
export type PolicyCombiningStrategy = z.infer<
  typeof PolicyCombiningStrategySchema
>;

export const ZeroTrustViewModeSchema = z.enum(["investigation", "explanation"]);
export type ZeroTrustViewMode = z.infer<typeof ZeroTrustViewModeSchema>;

// ========================
// Policy Expression AST (No eval)
// ========================

export type AttributeRef = {
  namespace: "principal" | "resource" | "environment" | "action";
  key: string;
};

export type LiteralValue = string | number | boolean;

export type PolicyExpression =
  | { kind: "equals"; left: AttributeRef; right: LiteralValue }
  | { kind: "in"; value: AttributeRef; values: LiteralValue[] }
  | { kind: "and"; expressions: PolicyExpression[] }
  | { kind: "or"; expressions: PolicyExpression[] }
  | { kind: "not"; expression: PolicyExpression };

const AttributeRefSchema: z.ZodType<AttributeRef> = z.object({
  namespace: z.enum(["principal", "resource", "environment", "action"]),
  key: z.string().min(1),
});

const LiteralValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const PolicyExpressionSchema: z.ZodType<PolicyExpression> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("equals"),
      left: AttributeRefSchema,
      right: LiteralValueSchema,
    }),
    z.object({
      kind: z.literal("in"),
      value: AttributeRefSchema,
      values: z.array(LiteralValueSchema),
    }),
    z.object({
      kind: z.literal("and"),
      expressions: z.array(PolicyExpressionSchema),
    }),
    z.object({
      kind: z.literal("or"),
      expressions: z.array(PolicyExpressionSchema),
    }),
    z.object({
      kind: z.literal("not"),
      expression: PolicyExpressionSchema,
    }),
  ])
);

// ========================
// Scenario Config Schemas
// ========================

export const SimulatedTokenSchema = z.object({
  id: z.string().min(1),
  authModel: AuthModelKindSchema.default("oauth2_access_token"),
  issuerId: z.string().min(1),
  subjectId: z.string().min(1),
  audience: z.array(z.string()).default(["orders-api"]),
  issuedAtMs: z.number().min(0).default(0),
  expiresAtMs: z.number().min(0).default(5000),
  scopes: z.array(z.string()).default([]),
  revoked: z.boolean().default(false),
  revokedAtMs: z.number().min(0).optional(),
  simulatedSignatureValid: z.boolean().default(true),
  compromised: z.boolean().default(false),
  compromisedAtMs: z.number().min(0).optional(),
});
export type SimulatedToken = z.infer<typeof SimulatedTokenSchema>;

export const CertificateMetadataSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  spiffeId: z.string().default("spiffe://nxtqr.internal/ns/prod/sa/default"),
  issuerId: z.string().default("ca-nxtqr-root"),
  trustedIssuer: z.boolean().default(true),
  issuedAtMs: z.number().min(0).default(0),
  expiresAtMs: z.number().min(0).default(5000),
  revoked: z.boolean().default(false),
  revokedAtMs: z.number().min(0).optional(),
  identityMismatch: z.boolean().default(false),
});
export type CertificateMetadata = z.infer<typeof CertificateMetadataSchema>;

export const SecretReferenceSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  ownerId: z.string().min(1),
  allowedConsumerIds: z.array(z.string()).default([]),
  version: z.number().int().min(1).default(1),
  rotationState: z
    .enum(["current", "rotating", "rotated", "stale_consumer", "expired"])
    .default("current"),
  expiresAtMs: z.number().min(0).default(5000),
  revoked: z.boolean().default(false),
  exposedInSimulation: z.boolean().default(false),
});
export type SecretReferenceMetadata = z.infer<typeof SecretReferenceSchema>;

export const SecurityIdentityConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  principalType: PrincipalTypeSchema.default("workload_identity"),
  zoneId: SecurityZoneIdSchema.default("application"),
  issuerId: z.string().default("idp-nxtqr"),
  tenantId: z.string().default("tenant-alpha"),
  roles: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  tokenId: z.string().optional(),
  certificateId: z.string().optional(),
  authStrength: z.enum(["none", "low", "standard", "strong"]).default("strong"),
  sessionIdleTimeoutMs: z.number().min(0).optional(),
  lastActivityAtMs: z.number().min(0).optional(),
  compromised: z.boolean().default(false),
  compromisedAtMs: z.number().min(0).optional(),
});
export type SecurityIdentityConfig = z.infer<
  typeof SecurityIdentityConfigSchema
>;

export const SecurityResourceConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  kind: z
    .enum([
      "client",
      "api_gateway",
      "service",
      "service_mesh",
      "database",
      "cache",
      "queue",
      "object_storage",
      "identity_provider",
      "secrets_store",
      "admin_interface",
    ])
    .default("service"),
  zoneId: SecurityZoneIdSchema.default("application"),
  tenantId: z.string().default("tenant-alpha"),
  classification: DataClassificationSchema.default("internal"),
  customClassificationTag: z.string().optional(),
  publiclyReachable: z.boolean().default(false),
  acceptedActions: z.array(z.string()).default(["read", "write"]),
  requiredScopes: z.array(z.string()).default([]),
  requiredAuthStrength: z.enum(["none", "low", "standard", "strong"]).default("standard"),
  trustedIssuers: z.array(z.string()).default(["idp-nxtqr"]),
  expectedAudiences: z.array(z.string()).default(["orders-api"]),
  transportSecurity: TransportSecurityModeSchema.default("mtls"),
  encryptedAtRest: z.boolean().default(true),
  processedInPlaintext: z.boolean().default(true),
  ownerPrincipalId: z.string().optional(),
});
export type SecurityResourceConfig = z.infer<
  typeof SecurityResourceConfigSchema
>;

export const TrustBoundaryConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: TrustBoundaryTypeSchema,
  fromZoneId: SecurityZoneIdSchema,
  toZoneId: SecurityZoneIdSchema,
  protectedResourceIds: z.array(z.string()).default([]),
  requiredControlIds: z.array(z.string()).default([]),
  enforceStrictCrossing: z.boolean().default(true),
});
export type TrustBoundaryConfig = z.infer<typeof TrustBoundaryConfigSchema>;

export const RbacRoleConfigSchema = z.object({
  role: z.string().min(1),
  permissions: z.array(z.string()).default([]),
});

export const AuthorizationRuleConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  effect: z.enum(["allow", "deny"]),
  priority: z.number().int().default(100),
  principals: z.array(z.string()).default(["*"]),
  roles: z.array(z.string()).default([]),
  resources: z.array(z.string()).default(["*"]),
  actions: z.array(z.string()).default(["*"]),
  requiredScopes: z.array(z.string()).default([]),
  condition: PolicyExpressionSchema.optional(),
  requireInputKeys: z.array(z.string()).default([]),
});
export type AuthorizationRuleConfig = z.infer<
  typeof AuthorizationRuleConfigSchema
>;

export const AuthorizationConfigSchema = z.object({
  combiningStrategy: PolicyCombiningStrategySchema.default("deny_overrides"),
  defaultEffect: z.enum(["deny", "allow"]).default("deny"),
  enforceTenantIsolation: z.boolean().default(true),
  internalNetworkImpliesTrust: z.boolean().default(false),
  roles: z.array(RbacRoleConfigSchema).default([]),
  rules: z.array(AuthorizationRuleConfigSchema).default([]),
});
export type AuthorizationConfig = z.infer<typeof AuthorizationConfigSchema>;

export const NetworkPolicyConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  sourceZoneId: SecurityZoneIdSchema.optional(),
  sourceNodeId: z.string().optional(),
  destZoneId: SecurityZoneIdSchema.optional(),
  destNodeId: z.string().optional(),
  protocol: z.enum(["HTTP", "HTTPS", "gRPC", "TCP", "SQL", "ANY"]).default("HTTPS"),
  port: z.number().int().min(1).max(65535).default(443),
  direction: z.enum(["ingress", "egress"]).default("ingress"),
  effect: z.enum(["allow", "deny"]).default("allow"),
  requireMtls: z.boolean().default(false),
});
export type NetworkPolicyConfig = z.infer<typeof NetworkPolicyConfigSchema>;

export const SecurityControlConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  kind: z.enum([
    "authentication",
    "authorization",
    "mtls",
    "network_segmentation",
    "egress_restriction",
    "least_privilege",
    "secret_rotation",
    "token_revocation",
    "rate_limiting",
    "waf_filtering",
    "audit_logging",
    "resource_isolation",
  ]),
  state: z
    .enum(["enabled", "disabled", "misconfigured", "unavailable"])
    .default("enabled"),
  protectedAssetIds: z.array(z.string()).default([]),
  mitigatesCategories: z.array(StrideCategorySchema).default([]),
  blocksConditions: z.array(z.string()).default([]),
});
export type SecurityControlConfig = z.infer<typeof SecurityControlConfigSchema>;

export const AttackStepConfigSchema = z.object({
  id: z.string().min(1),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  action: z.string().default("read"),
  requiredConditions: z.array(z.string()).default([]),
  evaluatedControlIds: z.array(z.string()).default([]),
  explanation: z.string(),
});

export const ThreatScenarioConfigSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  category: StrideCategorySchema,
  atMs: z.number().min(0).default(100),
  principalId: z.string().min(1),
  assetIds: z.array(z.string()).default([]),
  entryPointIds: z.array(z.string()).default([]),
  requiredConditions: z.array(z.string()).default([]),
  controlIds: z.array(z.string()).default([]),
  likelihood: z.enum(["low", "medium", "high"]).default("medium"),
  impact: z.enum(["low", "medium", "high", "critical"]).default("high"),
  steps: z.array(AttackStepConfigSchema).default([]),
});
export type ThreatScenarioConfig = z.infer<typeof ThreatScenarioConfigSchema>;

export const AccessRequestEventConfigSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().min(0),
  principalId: z.string().min(1),
  sourceNodeId: z.string().min(1),
  resourceId: z.string().min(1),
  action: z.string().default("read"),
  protocol: z.enum(["HTTP", "HTTPS", "gRPC", "TCP", "SQL", "ANY"]).default("HTTPS"),
  port: z.number().int().default(443),
  expectedAllowed: z.boolean().default(true),
  environmentAttributes: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
  description: z.string().default("Simulated access evaluation"),
});
export type AccessRequestEventConfig = z.infer<
  typeof AccessRequestEventConfigSchema
>;

export const SecurityMitigationActionSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().min(0),
  action: z.enum([
    "revoke_credential",
    "reduce_role_permissions",
    "enable_network_restriction",
    "require_mtls",
    "enable_egress_restriction",
    "restrict_resource_access",
    "rotate_secret",
    "enable_rate_limiting",
    "isolate_workload",
    "enforce_default_deny",
  ]),
  targetId: z.string().min(1),
  description: z.string(),
});
export type SecurityMitigationAction = z.infer<
  typeof SecurityMitigationActionSchema
>;

export const ZeroTrustScenarioSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  presetId: z.string().optional(),
  label: z.string().default("Zero Trust Security Scenario"),
  architectureRevisionId: z.string().default("rev_001"),
  seed: z.number().int().default(42),
  viewMode: ZeroTrustViewModeSchema.default("investigation"),
  defaultNetworkDeny: z.boolean().default(false),
  identities: z.array(SecurityIdentityConfigSchema).min(1),
  tokens: z.array(SimulatedTokenSchema).default([]),
  certificates: z.array(CertificateMetadataSchema).default([]),
  secrets: z.array(SecretReferenceSchema).default([]),
  resources: z.array(SecurityResourceConfigSchema).min(1),
  trustBoundaries: z.array(TrustBoundaryConfigSchema).default([]),
  authorization: AuthorizationConfigSchema,
  networkPolicies: z.array(NetworkPolicyConfigSchema).default([]),
  controls: z.array(SecurityControlConfigSchema).default([]),
  threats: z.array(ThreatScenarioConfigSchema).default([]),
  requests: z.array(AccessRequestEventConfigSchema).default([]),
  mitigations: z.array(SecurityMitigationActionSchema).default([]),
  limits: z.object({
    maxIdentities: z.number().int().min(1).max(500).default(100),
    maxResources: z.number().int().min(1).max(500).default(100),
    maxThreats: z.number().int().min(0).max(100).default(25),
    maxAttackSteps: z.number().int().min(1).max(200).default(50),
    maxEvents: z.number().int().min(10).max(10000).default(2000),
    maxVirtualDurationMs: z.number().min(50).max(30000).default(5000),
  }),
});
export type ZeroTrustScenario = z.infer<typeof ZeroTrustScenarioSchema>;

// ========================
// Runtime Domain Models
// ========================

export interface PolicyEvaluationStep {
  stage:
    | "identity_verification"
    | "workload_context"
    | "resource_authorization"
    | "network_policy"
    | "transport_security";
  passed: boolean;
  indeterminate?: boolean;
  ruleId?: string;
  detail: string;
}

export interface ZtAccessDecision {
  requestId: string;
  principalId: string;
  sourceNodeId: string;
  resourceId: string;
  action: string;
  effect: "allow" | "deny" | "indeterminate";
  authState: AuthenticationState;
  matchedPolicyIds: string[];
  steps: PolicyEvaluationStep[];
  reasons: string[];
  evaluatedAtMs: number;
  boundaryCrossings: string[];
}

export interface TrustBoundaryRuntime {
  id: string;
  name: string;
  type: TrustBoundaryType;
  fromZoneId: SecurityZoneId;
  toZoneId: SecurityZoneId;
  protectedResourceIds: string[];
  requiredControlIds: string[];
  crossingCount: number;
  blockedCrossings: number;
  violatedCount: number;
  policyState: "enforced" | "partial" | "violated";
}

export interface AbstractAttackStep {
  id: string;
  threatId: string;
  sourceNodeId: string;
  targetNodeId: string;
  requiredConditions: string[];
  evaluatedControlIds: string[];
  outcome: "blocked" | "possible" | "completed_in_simulation";
  explanation: string;
}

export interface AttackPathRuntime {
  threatId: string;
  title: string;
  category: StrideCategory;
  steps: AbstractAttackStep[];
  blockedByControlId?: string;
  reachedTargetIds: string[];
  status: "contained" | "partial_exposure" | "completed_in_simulation";
}

export interface ControlEvaluationResult {
  controlId: string;
  name: string;
  kind: SecurityControlConfig["kind"];
  state: SecurityControlConfig["state"];
  protectedAssets: string[];
  applicableThreatIds: string[];
  result: "blocked_threat" | "passed_check" | "failed_or_missing" | "not_triggered";
  blocksCount: number;
  reason: string;
}

export interface ZtBlastRadiusReport {
  compromisedPrincipalIds: string[];
  directAccessResourceIds: string[];
  conditionalAccessResourceIds: string[];
  blockedResourceIds: string[];
  unknownAccessResourceIds: string[];
  sensitiveAssetsExposed: string[];
}

export interface RiskMatrixEntry {
  threatId: string;
  title: string;
  category: StrideCategory;
  assetIds: string[];
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high" | "critical";
  existingControls: string[];
  residualRisk: "low" | "medium" | "high" | "critical";
  recommendedMitigation: string;
}

export interface SecurityFinding {
  id: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  category: StrideCategory | "policy_gap" | "credential_risk" | "transport_gap";
  title: string;
  evidenceSummary: string;
  affectedAssetIds: string[];
  mitigated: boolean;
}

export interface SecurityEvidenceItem {
  id: string;
  atMs: number;
  source:
    | "access_denied"
    | "auth_failure"
    | "policy_change"
    | "credential_revocation"
    | "unexpected_reachability"
    | "boundary_violation"
    | "control_failure"
    | "threat_transition";
  summary: string;
  resourceId?: string;
  principalId?: string;
}

export interface SecurityIncidentRuntime {
  id: string;
  title: string;
  severity: "sev1" | "sev2" | "sev3";
  status: "detected" | "investigating" | "mitigating" | "resolved";
  detectedAtMs: number;
  mitigatedAtMs?: number;
  resolvedAtMs?: number;
  affectedResourceIds: string[];
  evidence: SecurityEvidenceItem[];
  hypotheses: Array<{
    id: string;
    rank: number;
    description: string;
    status: "candidate" | "supported" | "verified";
  }>;
  timeline: Array<{ atMs: number; kind: string; summary: string }>;
  mitigationsApplied: Array<{
    id: string;
    atMs: number;
    action: string;
    targetId: string;
    description: string;
  }>;
}

export interface ThreatModelReport {
  scenarioId: string;
  title: string;
  assetCount: number;
  boundaryCount: number;
  threatCount: number;
  findingsSummary: string;
  mitigationSummary: string;
  caveats: string[];
}

export interface SecurityPostureMetrics {
  allowedRequests: number;
  deniedRequests: number;
  indeterminateRequests: number;
  authenticationFailures: number;
  authorizationFailures: number;
  networkDenials: number;
  transportFailures: number;
  trustBoundaryCrossings: number;
  policyViolations: number;
  reachableResourcesCount: number;
  blockedAttackSteps: number;
  completedAttackSteps: number;
  simulatedCompromisedResources: number;
  controlEffectivenessPct: number;
  residualRiskScore: number;
}

export interface ZtInvariantReport {
  allPassed: boolean;
  defaultDenyEnforcedOk: boolean;
  expiredCredentialsRejectedOk: boolean;
  revokedCredentialsRejectedOk: boolean;
  invalidAudiencesRejectedOk: boolean;
  crossTenantIsolationOk: boolean;
  networkPoliciesConsistentOk: boolean;
  attackPrerequisitesRespectedOk: boolean;
  blockedStepsDoNotGrantAccessOk: boolean;
  blastRadiusConsistentOk: boolean;
  groundTruthSeparatedOk: boolean;
  violations: string[];
}

export interface ModeledZeroTrustRuntimeState {
  virtualTimeMs: number;
  viewMode: ZeroTrustViewMode;
  identities: Record<
    string,
    SecurityIdentityConfig & {
      authState: AuthenticationState;
      certLifecycle?: CertificateLifecycleState;
      accessibleResourceIds: string[];
    }
  >;
  tokens: Record<string, SimulatedToken>;
  certificates: Record<
    string,
    CertificateMetadata & { lifecycleState: CertificateLifecycleState }
  >;
  secrets: Record<string, SecretReferenceMetadata>;
  resources: Record<string, SecurityResourceConfig>;
  trustBoundaries: TrustBoundaryRuntime[];
  accessDecisions: ZtAccessDecision[];
  attackPaths: AttackPathRuntime[];
  controls: ControlEvaluationResult[];
  blastRadius: ZtBlastRadiusReport;
  riskMatrix: RiskMatrixEntry[];
  findings: SecurityFinding[];
  incidents: SecurityIncidentRuntime[];
  report?: ThreatModelReport;
  caveats: string[];
  invariants: ZtInvariantReport;
  metrics: SecurityPostureMetrics;
}
