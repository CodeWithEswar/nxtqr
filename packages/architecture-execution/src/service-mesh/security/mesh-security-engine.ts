import type {
  MeshSecurityConfig,
  MeshServiceDefinition,
  MeshServiceInstanceRuntimeState,
} from "../service-mesh-schemas";

function matchesPattern(pattern: string, value: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith("*")) {
    return value.startsWith(pattern.slice(0, -1));
  }
  return pattern === value;
}

export class MeshSecurityEngine {
  public static evaluateSecurity(
    requestId: string,
    atMs: number,
    sourceService: MeshServiceDefinition,
    destService: MeshServiceDefinition,
    sourceInstance: MeshServiceInstanceRuntimeState | undefined,
    destInstance: MeshServiceInstanceRuntimeState,
    operation: string,
    security: MeshSecurityConfig,
    emit: (evt: Record<string, unknown>) => void
  ): { allowed: boolean; mtlsFailed: boolean; authDenied: boolean; latencyMs: number; reason: string } {
    let latencyMs = 0;

    // 1. Modeled mTLS Handshake
    if (security.mtlsMode !== "disabled") {
      emit({
        type: "mesh.mtls.handshake.started",
        atMs,
        durationMs: security.handshakeLatencyMs,
        requestId,
        clientIdentity: sourceService.identity,
        serverIdentity: destService.identity,
        explanation: `Initiating modeled ${security.mtlsMode} mTLS handshake (${sourceService.identity} -> ${destService.identity}).`,
      });
      latencyMs += security.handshakeLatencyMs;

      const clientCertOk = sourceInstance ? sourceInstance.certificateValid : true;
      const serverCertOk = destInstance.certificateValid;
      const domainMatch =
        sourceService.identity.includes(security.trustDomain) &&
        destService.identity.includes(security.trustDomain);

      if ((!clientCertOk || !serverCertOk || !domainMatch) && security.mtlsMode === "strict") {
        const reason = !clientCertOk
          ? `Source certificate invalid for ${sourceService.identity}`
          : !serverCertOk
            ? `Destination certificate invalid/expired for ${destService.identity}`
            : `SPIFFE trust domain mismatch (expected ${security.trustDomain})`;
        emit({
          type: "mesh.mtls.handshake.failed",
          atMs: atMs + latencyMs,
          durationMs: 2,
          requestId,
          clientIdentity: sourceService.identity,
          serverIdentity: destService.identity,
          reason,
          explanation: `mTLS handshake FAILED: ${reason}.`,
        });
        return {
          allowed: false,
          mtlsFailed: true,
          authDenied: false,
          latencyMs,
          reason,
        };
      }

      emit({
        type: "mesh.mtls.handshake.completed",
        atMs: atMs + latencyMs,
        durationMs: 1,
        requestId,
        clientIdentity: sourceService.identity,
        serverIdentity: destService.identity,
        explanation: `mTLS verified peer SPIFFE identity "${sourceService.identity}" -> "${destService.identity}".`,
      });
    }

    // 2. Authorization Policy Evaluation
    emit({
      type: "mesh.authorization.started",
      atMs: atMs + latencyMs,
      durationMs: 1,
      requestId,
      sourceIdentity: sourceService.identity,
      destinationServiceId: destService.id,
      operation,
      explanation: `Evaluating mesh authorization policy for ${sourceService.identity} -> ${destService.id} (${operation}).`,
    });
    latencyMs += 1;

    const matchingRules = security.authorizationRules.filter(
      (r) =>
        r.destinationServiceId === destService.id &&
        matchesPattern(r.sourceIdentityPattern, sourceService.identity) &&
        matchesPattern(r.operationPattern, operation) &&
        (!r.namespace || r.namespace === destService.namespace)
    );

    const denyRule = matchingRules.find((r) => r.effect === "deny");
    if (denyRule) {
      const reason = `Authorization DENIED by rule "${denyRule.id}" for "${sourceService.identity}" calling "${destService.id}" (${operation}).`;
      emit({
        type: "mesh.authorization.denied",
        atMs: atMs + latencyMs,
        durationMs: 1,
        requestId,
        ruleId: denyRule.id,
        reason,
        explanation: reason,
      });
      return {
        allowed: false,
        mtlsFailed: false,
        authDenied: true,
        latencyMs,
        reason,
      };
    }

    const allowRule = matchingRules.find((r) => r.effect === "allow");
    const isAllowed = allowRule ? true : security.defaultAllow;
    if (!isAllowed) {
      const reason = `Authorization DENIED (default deny, no matching allow policy for "${sourceService.identity}").`;
      emit({
        type: "mesh.authorization.denied",
        atMs: atMs + latencyMs,
        durationMs: 1,
        requestId,
        ruleId: "default-deny",
        reason,
        explanation: reason,
      });
      return {
        allowed: false,
        mtlsFailed: false,
        authDenied: true,
        latencyMs,
        reason,
      };
    }

    emit({
      type: "mesh.authorization.allowed",
      atMs: atMs + latencyMs,
      durationMs: 1,
      requestId,
      ruleId: allowRule?.id ?? "default-allow",
      explanation: `Authorization ALLOWED by "${allowRule?.id ?? "default-allow"}" for ${operation}.`,
    });

    return {
      allowed: true,
      mtlsFailed: false,
      authDenied: false,
      latencyMs,
      reason: "Authorized",
    };
  }
}

