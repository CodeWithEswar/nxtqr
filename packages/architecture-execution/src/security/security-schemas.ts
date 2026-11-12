import type { HttpMethod } from "../schemas/execution.schemas";

// ============================================================================
// 1. HTTP & Request Types
// ============================================================================

export type SecurityHttpMethod = HttpMethod | "OPTIONS" | "HEAD";

export interface SecurityRequest {
  id: string;
  method: SecurityHttpMethod;
  path: string;
  headers: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
  clientIp: string;
  origin?: string;
  sourceAddressFixture: string;
  correlationId: string;
  resourceContext?: ResourceContext;
}

export interface ResourceContext {
  resourceId: string;
  resourceType: string;
  action: string;
  ownerId?: string;
  tenantId?: string;
  sensitivityLevel?: "public" | "internal" | "confidential" | "restricted";
}

// ============================================================================
// 2. Gateway Route Definitions
// ============================================================================

export type RouteMatchType = "exact" | "prefix" | "parameterized";

export interface GatewaySecurityRoute {
  id: string;
  pathPattern: string;
  matchType: RouteMatchType;
  methods: (SecurityHttpMethod | "*")[];
  targetNodeId: string;
  priority: number;
  requiredAuth: "none" | "jwt" | "apikey" | "oauth" | "mtls";
  requiredRoles?: string[];
  requiredPermissions?: string[];
  corsEnabled?: boolean;
}

export interface RouteMatchResult {
  matched: boolean;
  route?: GatewaySecurityRoute;
  pathParams: Record<string, string>;
  evaluatedCandidatesCount: number;
  rejectedReasons: { routeId: string; reason: string }[];
}

// ============================================================================
// 3. Middleware Pipeline
// ============================================================================

export type MiddlewareType =
  | "waf"
  | "cors"
  | "rate_limiting"
  | "authentication"
  | "authorization"
  | "service_identity"
  | "mtls";

export interface MiddlewareStageConfig {
  id: string;
  type: MiddlewareType;
  name: string;
  enabled: boolean;
  order: number;
}

export interface SecurityDecision {
  id: string;
  middlewareId: string;
  middlewareType: MiddlewareType;
  outcome: "allow" | "deny" | "challenge";
  reasonCode: string;
  explanation: string;
  atMs: number;
  httpStatusSuggested?: number;
  evidence?: Record<string, unknown>;
}

// ============================================================================
// 4. Authentication: Principal, JWT, API Key
// ============================================================================

export interface Principal {
  id: string;
  isAuthenticated: boolean;
  authMethod: "anonymous" | "jwt" | "apikey" | "oauth" | "mtls";
  roles: string[];
  permissions: string[];
  attributes: Record<string, unknown>;
  tenantId?: string;
  scopes?: string[];
  tokenIssuer?: string;
}

export interface JwtValidationScenario {
  tokenPresent: boolean;
  rawTokenPreview?: string;
  structureValid: boolean;
  signatureValid: boolean; // Explicit modeled input, not live crypto
  algorithmAllowed: boolean;
  expectedIssuer: string;
  actualIssuer: string;
  expectedAudience: string;
  actualAudience: string;
  issuedAtMs?: number;
  expiresAtMs?: number;
  notBeforeMs?: number;
  claims: Record<string, unknown>;
  subject?: string;
}

export interface ApiKeyValidationScenario {
  keyPresent: boolean;
  keyHeaderName: string;
  keyValuePreview?: string;
  isValid: boolean;
  isRevoked: boolean;
  expiresAtMs?: number;
  allowedScopes?: string[];
  associatedPrincipalId?: string;
}

// ============================================================================
// 5. Authorization: RBAC, ABAC, Resource Ownership, Tenant Isolation
// ============================================================================

export type PolicyCombiningAlgorithm = "deny_overrides" | "permit_overrides" | "first_applicable";

export interface RbacRule {
  role: string;
  resourceType: string;
  allowedActions: string[];
}

export interface AttributeCondition {
  attribute: string; // e.g. "principal.attributes.department" or "resource.tenantId"
  operator: "equals" | "not_equals" | "in" | "greater_than" | "less_than" | "contains";
  value: unknown;
}

export interface AbacRule {
  id: string;
  name: string;
  description: string;
  effect: "permit" | "deny";
  action: string;
  resourceType: string;
  conditions: AttributeCondition[];
}

export interface OwnershipRuleConfig {
  requireOwnerMatch: boolean;
  ownerField: string; // e.g. "ownerId"
  principalField: string; // e.g. "id"
}

export interface TenantIsolationConfig {
  enforceTenantBoundary: boolean;
  tenantField: string;
}

export interface AuthorizationPolicy {
  combiningAlgorithm: PolicyCombiningAlgorithm;
  defaultDecision: "permit" | "deny";
  rbacRules: RbacRule[];
  abacRules: AbacRule[];
  ownershipRule?: OwnershipRuleConfig;
  tenantIsolation?: TenantIsolationConfig;
}

export interface AuthorizationResult {
  decision: "permit" | "deny" | "indeterminate";
  matchedRuleId?: string;
  evaluations: {
    ruleId: string;
    type: "rbac" | "abac" | "ownership" | "tenant";
    outcome: "permit" | "deny" | "not_applicable";
    explanation: string;
  }[];
  explanation: string;
  denialReasonCode?: string;
}

// ============================================================================
// 6. WAF (Web Application Firewall) Rules
// ============================================================================

export type WafAction = "allow" | "block" | "challenge";

export type WafConditionType =
  | "ip_cidr"
  | "path_pattern"
  | "method_restriction"
  | "header_match"
  | "suspicious_payload"
  | "payload_size_limit";

export interface WafCondition {
  type: WafConditionType;
  field?: string;
  operator: "equals" | "contains" | "regex_match" | "cidr_match" | "greater_than";
  pattern: string | number;
}

export interface WafRule {
  id: string;
  name: string;
  priority: number; // Lowest number = highest priority
  enabled: boolean;
  condition: WafCondition;
  action: WafAction;
  description: string;
}

export interface WafPolicy {
  rules: WafRule[];
  defaultAction: WafAction;
}

export interface WafEvaluationResult {
  action: WafAction;
  matchedRule?: WafRule;
  explanation: string;
}

// ============================================================================
// 7. Rate Limiting, CORS & Service Security (mTLS)
// ============================================================================

export interface RateLimitSecurityPolicy {
  enabled: boolean;
  algorithm: "token_bucket" | "fixed_window";
  capacity: number;
  refillRatePerSec: number;
  limitByKey: "client_ip" | "api_key" | "principal_id" | "route";
  retryAfterSec?: number;
}

export interface CorsPolicy {
  enabled: boolean;
  allowedOrigins: string[];
  allowedMethods: SecurityHttpMethod[];
  allowedHeaders: string[];
  allowCredentials: boolean;
  maxAgeSec: number;
}

export interface CorsEvaluationResult {
  allowed: boolean;
  isPreflight: boolean;
  originEvaluated?: string;
  explanation: string;
}

export interface ClientCertScenario {
  certPresent: boolean;
  subjectCommonName?: string;
  issuerCommonName?: string;
  spiffeId?: string;
  isValid: boolean;
  isExpired: boolean;
  isIssuerTrusted: boolean;
}

export interface MtlsSecurityPolicy {
  enabled: boolean;
  requireClientCert: boolean;
  trustedCAs: string[];
  allowedSpiffeIds?: string[];
  clientCertScenario?: ClientCertScenario;
}

export interface MtlsEvaluationResult {
  handshakeSuccess: boolean;
  clientVerified: boolean;
  spiffeIdVerified: boolean;
  explanation: string;
}

// ============================================================================
// 8. OAuth 2.0 / OIDC Flow Simulation
// ============================================================================

export type OAuthFlowType = "authorization_code_pkce" | "client_credentials";

export interface OAuthScenarioConfig {
  flowType: OAuthFlowType;
  clientId: string;
  clientSecretConfigured?: boolean;
  redirectUri: string;
  scopes: string[];
  usePkce: boolean;
  pkceCodeChallenge?: string;
  pkceCodeVerifier?: string;
  stateParameter?: string;
  authorizationGranted: boolean;
  tokenEndpointResponse?: {
    accessToken: string;
    idToken?: string;
    tokenType: "Bearer";
    expiresInSec: number;
    scopes: string[];
  };
}

export interface OAuthStepOutcome {
  step: "authorization_request" | "consent" | "code_exchange" | "token_verification" | "resource_access";
  succeeded: boolean;
  explanation: string;
  timestampMs: number;
}

// ============================================================================
// 9. Trust Boundary Definition
// ============================================================================

export type TrustBoundaryLevel = "public" | "dmz_gateway" | "internal_service_mesh" | "restricted_data";

export interface TrustBoundaryDefinition {
  id: string;
  name: string;
  level: TrustBoundaryLevel;
  enclosedNodeIds: string[];
  requiredIngressChecks: MiddlewareType[];
}

// ============================================================================
// 10. Security Response & Overall Scenario
// ============================================================================

export interface SecurityResponse {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  generatedBy: "gateway" | "waf" | "rate_limiter" | "auth" | "authorization" | "cors" | "mtls" | "backend";
  explanation: string;
}

export interface SecurityMetrics {
  totalRequests: number;
  allowedRequests: number;
  deniedRequests: number;
  authenticationFailures: number;
  authorizationDenials: number;
  wafBlocks: number;
  rateLimitRejections: number;
  corsViolations: number;
  mtlsFailures: number;
  backendRequestsPrevented: number;
  simulatedSecurityOverheadMs: number;
}

export interface ModeledSecurityRuntimeState {
  activeRequest: SecurityRequest;
  selectedRoute: GatewaySecurityRoute | null;
  principal: Principal | null;
  pipelineDecisions: SecurityDecision[];
  finalDecision: "allow" | "deny" | "challenge";
  finalResponse: SecurityResponse;
  reachedBackend: boolean;
  metrics: SecurityMetrics;
}

export interface SecurityScenarioLimits {
  maxEvents: number;
  maxVirtualDurationMs: number;
  maxPolicyEvaluations: number;
}

export interface AuthenticationPolicy {
  allowAnonymous: boolean;
  requiredMethod?: "jwt" | "apikey" | "oauth" | "mtls";
}

export interface SecurityScenario {
  version: 1;
  id: string;
  title: string;
  description: string;
  entryNodeId: string;
  targetServiceNodeId: string;
  request: SecurityRequest;
  routes: GatewaySecurityRoute[];
  pipeline: MiddlewareStageConfig[];
  authPolicy?: AuthenticationPolicy;
  jwtScenario?: JwtValidationScenario;
  apiKeyScenario?: ApiKeyValidationScenario;
  authzPolicy?: AuthorizationPolicy;
  wafPolicy?: WafPolicy;
  rateLimitPolicy?: RateLimitSecurityPolicy;
  corsPolicy?: CorsPolicy;
  mtlsPolicy?: MtlsSecurityPolicy;
  oauthScenario?: OAuthScenarioConfig;
  trustBoundaries?: TrustBoundaryDefinition[];
  limits: SecurityScenarioLimits;
}
