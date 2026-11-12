import type {
  AuthenticationState,
  CertificateLifecycleState,
  CertificateMetadata,
  SecurityIdentityConfig,
  SecurityResourceConfig,
  SimulatedToken,
} from "../zero-trust-schemas";

const AUTH_STRENGTH_RANK = {
  none: 0,
  low: 1,
  standard: 2,
  strong: 3,
} as const;

export interface AuthEvaluationResult {
  authenticated: boolean;
  authState: AuthenticationState;
  token?: SimulatedToken;
  certificate?: CertificateMetadata;
  certLifecycle: CertificateLifecycleState;
  scopes: string[];
  reason: string;
}

export function computeCertificateLifecycle(
  cert: CertificateMetadata | undefined,
  nowMs: number
): CertificateLifecycleState {
  if (!cert) return "identity_mismatch";
  if (cert.revoked) return "revoked";
  if (!cert.trustedIssuer) return "untrusted_issuer";
  if (cert.identityMismatch) return "identity_mismatch";
  if (nowMs >= cert.expiresAtMs) return "expired";
  if (cert.expiresAtMs - nowMs <= 150) return "expiring";
  return "valid";
}

export function evaluatePrincipalAuthentication(
  identity: SecurityIdentityConfig,
  resource: SecurityResourceConfig,
  tokens: Record<string, SimulatedToken>,
  certificates: Record<string, CertificateMetadata>,
  nowMs: number
): AuthEvaluationResult {
  const token = identity.tokenId ? tokens[identity.tokenId] : undefined;
  const cert = identity.certificateId
    ? certificates[identity.certificateId]
    : undefined;
  const certLifecycle = cert
    ? computeCertificateLifecycle(cert, nowMs)
    : "valid";

  // 1. Unknown or unauthenticated principal
  if (
    identity.principalType === "unknown_principal" ||
    (!token && !cert && resource.requiredAuthStrength !== "none")
  ) {
    return {
      authenticated: false,
      authState: "UNAUTHENTICATED",
      token,
      certificate: cert,
      certLifecycle,
      scopes: [],
      reason: `Principal '${identity.id}' is unauthenticated (no valid simulated credential presented).`,
    };
  }

  // 2. Authentication strength check
  if (
    AUTH_STRENGTH_RANK[identity.authStrength] <
    AUTH_STRENGTH_RANK[resource.requiredAuthStrength]
  ) {
    return {
      authenticated: false,
      authState: "REJECTED",
      token,
      certificate: cert,
      certLifecycle,
      scopes: token?.scopes ?? [],
      reason: `Authentication strength '${identity.authStrength}' is below required '${resource.requiredAuthStrength}' for '${resource.id}'.`,
    };
  }

  // 3. Session idle timeout check
  if (
    identity.sessionIdleTimeoutMs !== undefined &&
    identity.lastActivityAtMs !== undefined &&
    nowMs - identity.lastActivityAtMs > identity.sessionIdleTimeoutMs
  ) {
    return {
      authenticated: false,
      authState: "EXPIRED",
      token,
      certificate: cert,
      certLifecycle,
      scopes: [],
      reason: `Session expired after idle timeout (${identity.sessionIdleTimeoutMs}ms).`,
    };
  }

  // 4. Token metadata validation (modeled properties, not real cryptography)
  if (token) {
    if (token.revoked) {
      return {
        authenticated: false,
        authState: "REVOKED",
        token,
        certificate: cert,
        certLifecycle,
        scopes: [],
        reason: `Simulated token '${token.id}' was revoked and cannot authenticate '${identity.id}'.`,
      };
    }
    if (nowMs >= token.expiresAtMs) {
      return {
        authenticated: false,
        authState: "EXPIRED",
        token,
        certificate: cert,
        certLifecycle,
        scopes: [],
        reason: `Simulated token '${token.id}' expired at ${token.expiresAtMs}ms (current ${nowMs}ms).`,
      };
    }
    if (!token.simulatedSignatureValid) {
      return {
        authenticated: false,
        authState: "REJECTED",
        token,
        certificate: cert,
        certLifecycle,
        scopes: [],
        reason: `Simulated signature validity check failed on token '${token.id}'.`,
      };
    }
    if (!resource.trustedIssuers.includes(token.issuerId)) {
      return {
        authenticated: false,
        authState: "REJECTED",
        token,
        certificate: cert,
        certLifecycle,
        scopes: [],
        reason: `Untrusted token issuer '${token.issuerId}' rejected by '${resource.id}'.`,
      };
    }
    const audienceMatch = token.audience.some((aud) =>
      resource.expectedAudiences.includes(aud)
    );
    if (resource.expectedAudiences.length > 0 && !audienceMatch) {
      return {
        authenticated: false,
        authState: "REJECTED",
        token,
        certificate: cert,
        certLifecycle,
        scopes: [],
        reason: `Token audience [${token.audience.join(", ")}] does not match expected [${resource.expectedAudiences.join(", ")}].`,
      };
    }
  } else if (!resource.trustedIssuers.includes(identity.issuerId)) {
    return {
      authenticated: false,
      authState: "REJECTED",
      certificate: cert,
      certLifecycle,
      scopes: [],
      reason: `Untrusted identity issuer '${identity.issuerId}' rejected by '${resource.id}'.`,
    };
  }

  // 5. Workload mTLS client certificate check if presented
  if (cert && certLifecycle !== "valid" && certLifecycle !== "expiring") {
    return {
      authenticated: false,
      authState: certLifecycle === "revoked" ? "REVOKED" : certLifecycle === "expired" ? "EXPIRED" : "REJECTED",
      token,
      certificate: cert,
      certLifecycle,
      scopes: token?.scopes ?? [],
      reason: `Workload certificate '${cert.id}' lifecycle state is '${certLifecycle}'.`,
    };
  }

  return {
    authenticated: true,
    authState: "AUTHENTICATED",
    token,
    certificate: cert,
    certLifecycle,
    scopes: token?.scopes ?? [],
    reason: `Identity '${identity.id}' cryptographically verified in simulation (${token ? token.authModel : "workload_identity"}).`,
  };
}

