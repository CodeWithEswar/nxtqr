import type { BaseExecutionEvent } from "../domain/execution-event";
import type {
  AuthenticationState,
  StrideCategory,
} from "./zero-trust-schemas";

export interface ZtIdentityPresentedEvent extends BaseExecutionEvent {
  type: "security.identity.presented";
  principalId: string;
  issuerId: string;
  tokenId?: string;
}

export interface ZtIdentityVerifiedEvent extends BaseExecutionEvent {
  type: "security.identity.verified";
  principalId: string;
  authState: AuthenticationState;
}

export interface ZtIdentityRejectedEvent extends BaseExecutionEvent {
  type: "security.identity.rejected";
  principalId: string;
  authState: AuthenticationState;
  reason: string;
}

export interface ZtTokenExpiredEvent extends BaseExecutionEvent {
  type: "security.token.expired";
  tokenId: string;
  subjectId: string;
  expiresAtMs: number;
}

export interface ZtTokenRevokedEvent extends BaseExecutionEvent {
  type: "security.token.revoked";
  tokenId: string;
  subjectId: string;
}

export interface ZtAuthorizationEvaluatedEvent extends BaseExecutionEvent {
  type: "security.authorization.evaluated";
  requestId: string;
  principalId: string;
  resourceId: string;
  action: string;
  matchedPolicyIds: string[];
}

export interface ZtAuthorizationAllowedEvent extends BaseExecutionEvent {
  type: "security.authorization.allowed";
  requestId: string;
  principalId: string;
  resourceId: string;
  action: string;
}

export interface ZtAuthorizationDeniedEvent extends BaseExecutionEvent {
  type: "security.authorization.denied";
  requestId: string;
  principalId: string;
  resourceId: string;
  action: string;
  reason: string;
}

export interface ZtNetworkPolicyEvaluatedEvent extends BaseExecutionEvent {
  type: "security.network_policy.evaluated";
  requestId: string;
  sourceNodeId: string;
  destNodeId: string;
  allowed: boolean;
  policyId?: string;
}

export interface ZtTransportEvaluatedEvent extends BaseExecutionEvent {
  type: "security.transport.evaluated";
  requestId: string;
  sourceNodeId: string;
  destNodeId: string;
  mode: "plaintext" | "tls" | "mtls";
  verified: boolean;
}

export interface ZtTrustBoundaryCrossedEvent extends BaseExecutionEvent {
  type: "security.trust_boundary.crossed";
  requestId: string;
  boundaryId: string;
  boundaryName: string;
  allowed: boolean;
}

export interface ZtControlEvaluatedEvent extends BaseExecutionEvent {
  type: "security.control.evaluated";
  controlId: string;
  result: "blocked_threat" | "passed_check" | "failed_or_missing" | "not_triggered";
}

export interface ZtControlBlockedEvent extends BaseExecutionEvent {
  type: "security.control.blocked";
  controlId: string;
  threatId: string;
  stepId: string;
  targetNodeId: string;
}

export interface ZtThreatActivatedEvent extends BaseExecutionEvent {
  type: "security.threat.activated";
  threatId: string;
  category: StrideCategory;
  principalId: string;
}

export interface ZtAttackPathStepEvaluatedEvent extends BaseExecutionEvent {
  type: "security.attack_path.step_evaluated";
  threatId: string;
  stepId: string;
  sourceNodeId: string;
  targetNodeId: string;
  outcome: "blocked" | "possible" | "completed_in_simulation";
}

export interface ZtCredentialCompromisedEvent extends BaseExecutionEvent {
  type: "security.credential.compromised";
  principalId: string;
  tokenId?: string;
}

export interface ZtBlastRadiusUpdatedEvent extends BaseExecutionEvent {
  type: "security.blast_radius.updated";
  directCount: number;
  conditionalCount: number;
  blockedCount: number;
}

export interface ZtSecurityIncidentDetectedEvent extends BaseExecutionEvent {
  type: "security.incident.detected";
  incidentId: string;
  severity: "sev1" | "sev2" | "sev3";
}

export interface ZtSecurityMitigationAppliedEvent extends BaseExecutionEvent {
  type: "security.mitigation.applied";
  mitigationId: string;
  action: string;
  targetId: string;
}

export interface ZtSecurityIncidentResolvedEvent extends BaseExecutionEvent {
  type: "security.incident.resolved";
  incidentId: string;
}

export type ZeroTrustExecutionEvent =
  | ZtIdentityPresentedEvent
  | ZtIdentityVerifiedEvent
  | ZtIdentityRejectedEvent
  | ZtTokenExpiredEvent
  | ZtTokenRevokedEvent
  | ZtAuthorizationEvaluatedEvent
  | ZtAuthorizationAllowedEvent
  | ZtAuthorizationDeniedEvent
  | ZtNetworkPolicyEvaluatedEvent
  | ZtTransportEvaluatedEvent
  | ZtTrustBoundaryCrossedEvent
  | ZtControlEvaluatedEvent
  | ZtControlBlockedEvent
  | ZtThreatActivatedEvent
  | ZtAttackPathStepEvaluatedEvent
  | ZtCredentialCompromisedEvent
  | ZtBlastRadiusUpdatedEvent
  | ZtSecurityIncidentDetectedEvent
  | ZtSecurityMitigationAppliedEvent
  | ZtSecurityIncidentResolvedEvent;

