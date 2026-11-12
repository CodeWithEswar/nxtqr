import type { BaseExecutionEvent } from "../domain/execution-event";
import type {
  GatewaySecurityRoute,
  SecurityDecision,
  Principal,
} from "./security-schemas";

// ============================================================================
// 1. Gateway Route Events
// ============================================================================

export interface GatewayRouteEvaluationStartedEvent extends BaseExecutionEvent {
  type: "gateway.route.evaluation.started";
  gatewayNodeId: string;
  path: string;
  method: string;
  candidateRoutesCount: number;
}

export interface GatewayRouteCandidateCheckedEvent extends BaseExecutionEvent {
  type: "gateway.route.candidate.checked";
  gatewayNodeId: string;
  routeId: string;
  pattern: string;
  matched: boolean;
  rejectionReason?: string;
}

export interface GatewayRouteSelectedEvent extends BaseExecutionEvent {
  type: "gateway.route.selected";
  gatewayNodeId: string;
  route: GatewaySecurityRoute;
  targetNodeId: string;
  pathParams: Record<string, string>;
}

export interface GatewayRouteNotFoundEvent extends BaseExecutionEvent {
  type: "gateway.route.not_found";
  gatewayNodeId: string;
  path: string;
  method: string;
}

// ============================================================================
// 2. WAF Events
// ============================================================================

export interface WafEvaluationStartedEvent extends BaseExecutionEvent {
  type: "waf.evaluation.started";
  componentId: string;
  rulesCount: number;
}

export interface WafRuleMatchedEvent extends BaseExecutionEvent {
  type: "waf.rule.matched";
  componentId: string;
  ruleId: string;
  ruleName: string;
  action: "allow" | "block" | "challenge";
  matchField?: string;
  patternMatched: string;
}

export interface WafAllowedEvent extends BaseExecutionEvent {
  type: "waf.allowed";
  componentId: string;
  ruleId?: string;
}

export interface WafBlockedEvent extends BaseExecutionEvent {
  type: "waf.blocked";
  componentId: string;
  ruleId: string;
  reason: string;
}

export interface WafChallengeRequiredEvent extends BaseExecutionEvent {
  type: "waf.challenge.required";
  componentId: string;
  ruleId: string;
  challengeType: "simulated_pow" | "managed_challenge";
}

// ============================================================================
// 3. Security Rate Limiting Events
// ============================================================================

export interface SecurityRateLimitEvaluatedEvent extends BaseExecutionEvent {
  type: "security.ratelimit.evaluated";
  componentId: string;
  identityKey: string;
  remainingTokens: number;
  capacity: number;
}

export interface SecurityRateLimitAllowedEvent extends BaseExecutionEvent {
  type: "security.ratelimit.allowed";
  componentId: string;
  identityKey: string;
  consumed: number;
}

export interface SecurityRateLimitRejectedEvent extends BaseExecutionEvent {
  type: "security.ratelimit.rejected";
  componentId: string;
  identityKey: string;
  retryAfterSec: number;
}

// ============================================================================
// 4. Authentication & Token Events (JWT & API Key)
// ============================================================================

export interface AuthStartedEvent extends BaseExecutionEvent {
  type: "auth.started";
  componentId: string;
  authMethod: string;
}

export interface AuthCredentialsMissingEvent extends BaseExecutionEvent {
  type: "auth.credentials.missing";
  componentId: string;
  expectedScheme: string;
}

export interface AuthCredentialsValidatedEvent extends BaseExecutionEvent {
  type: "auth.credentials.validated";
  componentId: string;
  principalId: string;
}

export interface AuthCredentialsRejectedEvent extends BaseExecutionEvent {
  type: "auth.credentials.rejected";
  componentId: string;
  reason: string;
}

export interface AuthSucceededEvent extends BaseExecutionEvent {
  type: "auth.succeeded";
  componentId: string;
  principal: Principal;
}

export interface AuthFailedEvent extends BaseExecutionEvent {
  type: "auth.failed";
  componentId: string;
  reasonCode: string;
  httpStatus: number;
}

export interface JwtEvaluationStartedEvent extends BaseExecutionEvent {
  type: "jwt.evaluation.started";
  componentId: string;
  tokenPreview?: string;
}

export interface JwtStepValidatedEvent extends BaseExecutionEvent {
  type: "jwt.step.validated";
  componentId: string;
  stepName: string;
  detail: string;
}

export interface JwtStepFailedEvent extends BaseExecutionEvent {
  type: "jwt.step.failed";
  componentId: string;
  stepName: string;
  failureReason: string;
}

export interface ApiKeyLookupStartedEvent extends BaseExecutionEvent {
  type: "apikey.lookup.started";
  componentId: string;
  headerName: string;
}

export interface ApiKeyValidatedEvent extends BaseExecutionEvent {
  type: "apikey.validated";
  componentId: string;
  keyPrefix: string;
}

export interface ApiKeyRejectedEvent extends BaseExecutionEvent {
  type: "apikey.rejected";
  componentId: string;
  reason: string;
}

// ============================================================================
// 5. OAuth 2.0 & OIDC Events
// ============================================================================

export interface OAuthAuthorizationStartedEvent extends BaseExecutionEvent {
  type: "oauth.authorization.started";
  flow: string;
  clientId: string;
  scopes: string[];
}

export interface OAuthAuthorizationGrantedEvent extends BaseExecutionEvent {
  type: "oauth.authorization.granted";
  codeIssued: string;
  stateMatched: boolean;
}

export interface OAuthAuthorizationDeniedEvent extends BaseExecutionEvent {
  type: "oauth.authorization.denied";
  reason: string;
}

export interface OAuthCodeIssuedEvent extends BaseExecutionEvent {
  type: "oauth.code.issued";
  code: string;
  redirectUri: string;
}

export interface OAuthTokenRequestedEvent extends BaseExecutionEvent {
  type: "oauth.token.requested";
  codeProvided: boolean;
  pkceVerified: boolean;
}

export interface OAuthTokenIssuedEvent extends BaseExecutionEvent {
  type: "oauth.token.issued";
  tokenType: string;
  expiresInSec: number;
}

export interface OAuthTokenRejectedEvent extends BaseExecutionEvent {
  type: "oauth.token.rejected";
  reason: string;
}

export interface OidcIdTokenValidatedEvent extends BaseExecutionEvent {
  type: "oidc.idtoken.validated";
  subject: string;
  issuer: string;
}

// ============================================================================
// 6. Authorization Events (RBAC / ABAC / Tenancy)
// ============================================================================

export interface AuthorizationStartedEvent extends BaseExecutionEvent {
  type: "authorization.started";
  componentId: string;
  principalId: string;
  resourceId: string;
  action: string;
}

export interface AuthorizationPolicyEvaluatedEvent extends BaseExecutionEvent {
  type: "authorization.policy.evaluated";
  componentId: string;
  ruleId: string;
  policyType: "rbac" | "abac" | "ownership" | "tenant";
  outcome: "permit" | "deny" | "not_applicable";
  rationale: string;
}

export interface AuthorizationPermittedEvent extends BaseExecutionEvent {
  type: "authorization.permitted";
  componentId: string;
  principalId: string;
  grantedByRuleId?: string;
}

export interface AuthorizationDeniedEvent extends BaseExecutionEvent {
  type: "authorization.denied";
  componentId: string;
  principalId: string;
  denialCode: string;
  reason: string;
}

export interface AuthorizationIndeterminateEvent extends BaseExecutionEvent {
  type: "authorization.indeterminate";
  componentId: string;
  reason: string;
}

// ============================================================================
// 7. CORS & mTLS Events
// ============================================================================

export interface CorsPreflightStartedEvent extends BaseExecutionEvent {
  type: "cors.preflight.started";
  origin: string;
  requestedMethod: string;
}

export interface CorsOriginEvaluatedEvent extends BaseExecutionEvent {
  type: "cors.origin.evaluated";
  origin: string;
  isAllowed: boolean;
}

export interface CorsPreflightAllowedEvent extends BaseExecutionEvent {
  type: "cors.preflight.allowed";
  origin: string;
}

export interface CorsPreflightDeniedEvent extends BaseExecutionEvent {
  type: "cors.preflight.denied";
  origin: string;
  reason: string;
}

export interface MtlsHandshakeStartedEvent extends BaseExecutionEvent {
  type: "mtls.handshake.started";
  serverNodeId: string;
  clientNodeId?: string;
}

export interface MtlsServerVerifiedEvent extends BaseExecutionEvent {
  type: "mtls.server.verified";
  serverNodeId: string;
}

export interface MtlsClientVerifiedEvent extends BaseExecutionEvent {
  type: "mtls.client.verified";
  clientNodeId?: string;
  spiffeId?: string;
}

export interface MtlsHandshakeFailedEvent extends BaseExecutionEvent {
  type: "mtls.handshake.failed";
  reason: string;
}

export interface MtlsHandshakeCompletedEvent extends BaseExecutionEvent {
  type: "mtls.handshake.completed";
  tlsVersion: string;
  cipherSuite: string;
}

export interface ServiceIdentityVerifiedEvent extends BaseExecutionEvent {
  type: "service.identity.verified";
  callerServiceId: string;
  destinationServiceId: string;
}

export interface ServiceIdentityRejectedEvent extends BaseExecutionEvent {
  type: "service.identity.rejected";
  callerServiceId: string;
  destinationServiceId: string;
  reason: string;
}

// ============================================================================
// 8. Security Response Generated Event
// ============================================================================

export interface SecurityResponseGeneratedEvent extends BaseExecutionEvent {
  type: "security.response.generated";
  statusCode: number;
  statusText: string;
  generatedBy: string;
  reachedBackend: boolean;
  securityDecision: SecurityDecision;
}

// ============================================================================
// Union of all SecurityExecutionEvent
// ============================================================================

export type SecurityExecutionEvent =
  | GatewayRouteEvaluationStartedEvent
  | GatewayRouteCandidateCheckedEvent
  | GatewayRouteSelectedEvent
  | GatewayRouteNotFoundEvent
  | WafEvaluationStartedEvent
  | WafRuleMatchedEvent
  | WafAllowedEvent
  | WafBlockedEvent
  | WafChallengeRequiredEvent
  | SecurityRateLimitEvaluatedEvent
  | SecurityRateLimitAllowedEvent
  | SecurityRateLimitRejectedEvent
  | AuthStartedEvent
  | AuthCredentialsMissingEvent
  | AuthCredentialsValidatedEvent
  | AuthCredentialsRejectedEvent
  | AuthSucceededEvent
  | AuthFailedEvent
  | JwtEvaluationStartedEvent
  | JwtStepValidatedEvent
  | JwtStepFailedEvent
  | ApiKeyLookupStartedEvent
  | ApiKeyValidatedEvent
  | ApiKeyRejectedEvent
  | OAuthAuthorizationStartedEvent
  | OAuthAuthorizationGrantedEvent
  | OAuthAuthorizationDeniedEvent
  | OAuthCodeIssuedEvent
  | OAuthTokenRequestedEvent
  | OAuthTokenIssuedEvent
  | OAuthTokenRejectedEvent
  | OidcIdTokenValidatedEvent
  | AuthorizationStartedEvent
  | AuthorizationPolicyEvaluatedEvent
  | AuthorizationPermittedEvent
  | AuthorizationDeniedEvent
  | AuthorizationIndeterminateEvent
  | CorsPreflightStartedEvent
  | CorsOriginEvaluatedEvent
  | CorsPreflightAllowedEvent
  | CorsPreflightDeniedEvent
  | MtlsHandshakeStartedEvent
  | MtlsServerVerifiedEvent
  | MtlsClientVerifiedEvent
  | MtlsHandshakeFailedEvent
  | MtlsHandshakeCompletedEvent
  | ServiceIdentityVerifiedEvent
  | ServiceIdentityRejectedEvent
  | SecurityResponseGeneratedEvent;
