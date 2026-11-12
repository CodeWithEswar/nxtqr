import type {
  AccessRequestEventConfig,
  AttributeRef,
  AuthorizationConfig,
  CertificateMetadata,
  LiteralValue,
  NetworkPolicyConfig,
  PolicyEvaluationStep,
  PolicyExpression,
  SecurityIdentityConfig,
  SecurityResourceConfig,
  SimulatedToken,
  TrustBoundaryConfig,
  ZtAccessDecision,
} from "../zero-trust-schemas";
import { evaluatePrincipalAuthentication } from "../authentication/identity-auth-engine";

export interface EvalContext {
  identity: SecurityIdentityConfig;
  resource: SecurityResourceConfig;
  action: string;
  environment: Record<string, LiteralValue>;
}

function resolveAttr(
  ref: AttributeRef,
  ctx: EvalContext
): LiteralValue | undefined {
  if (ref.namespace === "principal") {
    if (ref.key === "id") return ctx.identity.id;
    if (ref.key === "tenantId") return ctx.identity.tenantId;
    if (ref.key === "zoneId") return ctx.identity.zoneId;
    if (ref.key === "principalType") return ctx.identity.principalType;
    return ctx.identity.attributes[ref.key];
  }
  if (ref.namespace === "resource") {
    if (ref.key === "id") return ctx.resource.id;
    if (ref.key === "tenantId") return ctx.resource.tenantId;
    if (ref.key === "zoneId") return ctx.resource.zoneId;
    if (ref.key === "classification") return ctx.resource.classification;
    if (ref.key === "ownerPrincipalId") return ctx.resource.ownerPrincipalId;
    return undefined;
  }
  if (ref.namespace === "action") {
    if (ref.key === "name") return ctx.action;
    return undefined;
  }
  return ctx.environment[ref.key];
}

export function evaluatePolicyExpression(
  expr: PolicyExpression,
  ctx: EvalContext
): "true" | "false" | "indeterminate" {
  switch (expr.kind) {
    case "equals": {
      const val = resolveAttr(expr.left, ctx);
      if (val === undefined) return "indeterminate";
      return val === expr.right ? "true" : "false";
    }
    case "in": {
      const val = resolveAttr(expr.value, ctx);
      if (val === undefined) return "indeterminate";
      return expr.values.includes(val) ? "true" : "false";
    }
    case "and": {
      let hasIndeterminate = false;
      for (const child of expr.expressions) {
        const res = evaluatePolicyExpression(child, ctx);
        if (res === "false") return "false";
        if (res === "indeterminate") hasIndeterminate = true;
      }
      return hasIndeterminate ? "indeterminate" : "true";
    }
    case "or": {
      let hasIndeterminate = false;
      for (const child of expr.expressions) {
        const res = evaluatePolicyExpression(child, ctx);
        if (res === "true") return "true";
        if (res === "indeterminate") hasIndeterminate = true;
      }
      return hasIndeterminate ? "indeterminate" : "false";
    }
    case "not": {
      const res = evaluatePolicyExpression(expr.expression, ctx);
      if (res === "indeterminate") return "indeterminate";
      return res === "true" ? "false" : "true";
    }
  }
}

function wildcardMatch(patterns: string[], value: string): boolean {
  return patterns.some((p) => {
    if (p === "*") return true;
    if (p.endsWith("*")) return value.startsWith(p.slice(0, -1));
    return p === value;
  });
}

export function evaluateZeroTrustAccessRequest(params: {
  request: AccessRequestEventConfig;
  identity: SecurityIdentityConfig;
  sourceResource?: SecurityResourceConfig;
  resource: SecurityResourceConfig;
  tokens: Record<string, SimulatedToken>;
  certificates: Record<string, CertificateMetadata>;
  authorization: AuthorizationConfig;
  networkPolicies: NetworkPolicyConfig[];
  defaultNetworkDeny: boolean;
  trustBoundaries: TrustBoundaryConfig[];
}): ZtAccessDecision {
  const {
    request,
    identity,
    sourceResource,
    resource,
    tokens,
    certificates,
    authorization,
    networkPolicies,
    defaultNetworkDeny,
    trustBoundaries,
  } = params;

  const steps: PolicyEvaluationStep[] = [];
  const reasons: string[] = [];
  const matchedPolicyIds: string[] = [];

  // Crossed boundaries
  const srcZone = sourceResource?.zoneId ?? identity.zoneId;
  const crossedBoundaries = trustBoundaries.filter(
    (b) =>
      (b.fromZoneId === srcZone && b.toZoneId === resource.zoneId) ||
      (b.toZoneId === srcZone && b.fromZoneId === resource.zoneId) ||
      b.protectedResourceIds.includes(resource.id)
  );
  const boundaryCrossings = crossedBoundaries.map((b) => b.id);

  // 1. Identity Verification
  const auth = evaluatePrincipalAuthentication(
    identity,
    resource,
    tokens,
    certificates,
    request.atMs
  );
  steps.push({
    stage: "identity_verification",
    passed: auth.authenticated,
    detail: auth.reason,
  });
  if (!auth.authenticated) {
    reasons.push(auth.reason);
  }

  // 2. Workload / Context verification (check compromise state & internal network rule)
  const internalSource =
    srcZone === "internal_services" ||
    srcZone === "application" ||
    srcZone === "data";
  const workloadContextOk = !identity.compromised;
  steps.push({
    stage: "workload_context",
    passed: workloadContextOk,
    detail: identity.compromised
      ? `Principal '${identity.id}' is marked compromised in simulation.`
      : internalSource
        ? "Request originates from internal zone; Zero Trust enforces full policy verification without implicit network trust."
        : "Workload/principal context checked.",
  });
  if (!workloadContextOk) {
    reasons.push(`Principal '${identity.id}' credential is compromised.`);
  }

  // 3. Resource Authorization (RBAC + ABAC + Tenant Isolation + Combining Strategy)
  let authzEffect: "allow" | "deny" | "indeterminate" = "deny";
  const effectivePermissions = new Set<string>(identity.permissions);
  for (const rName of identity.roles) {
    const roleDef = authorization.roles.find((r) => r.role === rName);
    if (roleDef) {
      for (const perm of roleDef.permissions) effectivePermissions.add(perm);
    }
  }

  if (!auth.authenticated) {
    authzEffect = "deny";
    steps.push({
      stage: "resource_authorization",
      passed: false,
      detail: "Denied authorization because identity verification failed.",
    });
  } else if (
    authorization.enforceTenantIsolation &&
    identity.tenantId !== resource.tenantId
  ) {
    authzEffect = "deny";
    reasons.push(
      `Cross-tenant isolation denied '${identity.tenantId}' access to '${resource.tenantId}' resource '${resource.id}'.`
    );
    steps.push({
      stage: "resource_authorization",
      passed: false,
      ruleId: "tenant_isolation",
      detail: reasons[reasons.length - 1]!,
    });
  } else {
    // Check required scopes on resource
    const missingScopes = resource.requiredScopes.filter(
      (s) => !auth.scopes.includes(s)
    );
    if (missingScopes.length > 0) {
      authzEffect = "deny";
      const msg = `Missing required scopes [${missingScopes.join(", ")}] for '${resource.id}'.`;
      reasons.push(msg);
      steps.push({
        stage: "resource_authorization",
        passed: false,
        ruleId: "required_scopes",
        detail: msg,
      });
    } else {
      const ctx: EvalContext = {
        identity,
        resource,
        action: request.action,
        environment: request.environmentAttributes,
      };
      const sortedRules = [...authorization.rules].sort(
        (a, b) => a.priority - b.priority
      );

      let allowMatched = false;
      let denyMatched = false;
      let indeterminateHit = false;
      let firstApplicable: "allow" | "deny" | "indeterminate" | null = null;
      let allRequiredFailed = false;

      for (const rule of sortedRules) {
        const principalOk =
          wildcardMatch(rule.principals, identity.id) ||
          (rule.roles.length > 0 &&
            rule.roles.some((r) => identity.roles.includes(r)));
        const resourceOk = wildcardMatch(rule.resources, resource.id);
        const actionOk = wildcardMatch(rule.actions, request.action);
        if (!principalOk || !resourceOk || !actionOk) continue;

        // Check missing inputs declared by rule
        const missingInput = rule.requireInputKeys.find(
          (k) =>
            ctx.environment[k] === undefined &&
            identity.attributes[k] === undefined
        );
        if (missingInput) {
          indeterminateHit = true;
          matchedPolicyIds.push(rule.id);
          reasons.push(
            `Rule '${rule.id}' indeterminate: missing required attribute '${missingInput}'.`
          );
          if (firstApplicable === null) firstApplicable = "indeterminate";
          continue;
        }

        // Scope check on rule
        if (
          rule.requiredScopes.length > 0 &&
          !rule.requiredScopes.every((s) => auth.scopes.includes(s))
        ) {
          continue;
        }

        // ABAC condition AST
        if (rule.condition) {
          const condOutcome = evaluatePolicyExpression(rule.condition, ctx);
          if (condOutcome === "indeterminate") {
            indeterminateHit = true;
            matchedPolicyIds.push(rule.id);
            reasons.push(
              `Rule '${rule.id}' indeterminate while evaluating ABAC condition.`
            );
            if (firstApplicable === null) firstApplicable = "indeterminate";
            continue;
          }
          if (condOutcome === "false") continue;
        }

        matchedPolicyIds.push(rule.id);
        if (rule.effect === "deny") {
          denyMatched = true;
          if (firstApplicable === null) firstApplicable = "deny";
          reasons.push(`Explicit deny rule '${rule.name}' (${rule.id}) matched.`);
        } else {
          // Verify least-privilege RBAC permission if roles/permissions exist
          const requiredPerm = `${resource.id}:${request.action}`;
          const wildcardPerm = `${resource.id}:*`;
          const actionOnlyPerm = `*:${request.action}`;
          const hasPerm =
            effectivePermissions.size === 0 ||
            effectivePermissions.has("*") ||
            effectivePermissions.has(requiredPerm) ||
            effectivePermissions.has(wildcardPerm) ||
            effectivePermissions.has(actionOnlyPerm) ||
            effectivePermissions.has(request.action);
          if (hasPerm) {
            allowMatched = true;
            if (firstApplicable === null) firstApplicable = "allow";
          } else {
            allRequiredFailed = true;
            reasons.push(
              `Identity '${identity.id}' lacks RBAC permission '${requiredPerm}' despite matching policy '${rule.id}'.`
            );
          }
        }
      }

      if (indeterminateHit && !denyMatched) {
        authzEffect = "indeterminate";
      } else {
        switch (authorization.combiningStrategy) {
          case "deny_overrides":
            authzEffect = denyMatched
              ? "deny"
              : allowMatched
                ? "allow"
                : authorization.defaultEffect;
            break;
          case "permit_overrides":
            authzEffect = allowMatched
              ? "allow"
              : denyMatched
                ? "deny"
                : authorization.defaultEffect;
            break;
          case "first_applicable":
            authzEffect = firstApplicable ?? authorization.defaultEffect;
            break;
          case "all_required":
            authzEffect =
              allowMatched && !denyMatched && !allRequiredFailed
                ? "allow"
                : "deny";
            break;
        }
      }

      if (authzEffect === "deny" && matchedPolicyIds.length === 0) {
        reasons.push(
          `Default ${authorization.defaultEffect}: no matching allow policy for '${identity.id}' -> '${resource.id}:${request.action}'.`
        );
      }

      steps.push({
        stage: "resource_authorization",
        passed: authzEffect === "allow",
        indeterminate: authzEffect === "indeterminate",
        ruleId: matchedPolicyIds[0],
        detail:
          authzEffect === "allow"
            ? `Authorization allowed (${matchedPolicyIds.join(", ") || "policy"}).`
            : reasons[reasons.length - 1] ?? "Denied by authorization policy.",
      });
    }
  }

  // 4. Network Segmentation Evaluation
  let netAllowed = !defaultNetworkDeny;
  let matchedNetPolicy: NetworkPolicyConfig | undefined;
  const matchingNetPolicies = networkPolicies.filter((p) => {
    const srcMatch =
      (!p.sourceZoneId || p.sourceZoneId === srcZone) &&
      (!p.sourceNodeId || p.sourceNodeId === request.sourceNodeId);
    const dstMatch =
      (!p.destZoneId || p.destZoneId === resource.zoneId) &&
      (!p.destNodeId || p.destNodeId === resource.id);
    const protoMatch = p.protocol === "ANY" || p.protocol === request.protocol;
    return srcMatch && dstMatch && protoMatch;
  });
  const denyNet = matchingNetPolicies.find((p) => p.effect === "deny");
  const allowNet = matchingNetPolicies.find((p) => p.effect === "allow");
  if (denyNet) {
    netAllowed = false;
    matchedNetPolicy = denyNet;
  } else if (allowNet) {
    netAllowed = true;
    matchedNetPolicy = allowNet;
  }

  const netDetail = netAllowed
    ? matchedNetPolicy
      ? `Network path allowed by '${matchedNetPolicy.name}' (${request.protocol}:${request.port}).`
      : `Network path permitted (permissive baseline ${srcZone} -> ${resource.zoneId}).`
    : matchedNetPolicy
      ? `Network path blocked by deny policy '${matchedNetPolicy.name}'.`
      : `Default-deny network segmentation blocked unpermitted flow (${srcZone} -> ${resource.zoneId}).`;
  if (!netAllowed) reasons.push(netDetail);

  steps.push({
    stage: "network_policy",
    passed: netAllowed,
    ruleId: matchedNetPolicy?.id,
    detail: netDetail,
  });

  // 5. Transport Security Evaluation
  let transportOk = true;
  let transportDetail = `Transport mode '${resource.transportSecurity}' satisfied.`;
  if (resource.transportSecurity === "mtls") {
    const cert = auth.certificate;
    const certOk =
      cert !== undefined &&
      (auth.certLifecycle === "valid" || auth.certLifecycle === "expiring");
    const protoSecure =
      request.protocol === "HTTPS" || request.protocol === "gRPC";
    if (!certOk) {
      transportOk = false;
      transportDetail = cert
        ? `mTLS failed: client certificate '${cert.id}' is '${auth.certLifecycle}'.`
        : "mTLS failed: destination requires mutual TLS but caller presented no workload certificate.";
    } else if (!protoSecure) {
      transportOk = false;
      transportDetail = `mTLS failed: unencrypted protocol '${request.protocol}' cannot carry mTLS.`;
    }
  } else if (resource.transportSecurity === "tls") {
    if (request.protocol === "HTTP") {
      transportOk = false;
      transportDetail =
        "TLS required: plaintext HTTP rejected across encrypted transport boundary.";
    }
  } else {
    transportDetail =
      "Plaintext transport active (unprotected transit segment; data visible on wire in simulation).";
  }

  if (!transportOk) reasons.push(transportDetail);
  steps.push({
    stage: "transport_security",
    passed: transportOk,
    detail: transportDetail,
  });

  // Final Zero Trust Effect
  let finalEffect: "allow" | "deny" | "indeterminate";
  if (authzEffect === "indeterminate" && auth.authenticated && netAllowed && transportOk) {
    finalEffect = "indeterminate";
  } else if (
    auth.authenticated &&
    authzEffect === "allow" &&
    netAllowed &&
    transportOk
  ) {
    finalEffect = "allow";
  } else if (
    authorization.internalNetworkImpliesTrust &&
    internalSource &&
    netAllowed
  ) {
    // Explicit misconfiguration demonstration mode only
    finalEffect = "allow";
    reasons.push(
      "WARNING: Overly permissive internalNetworkImpliesTrust setting bypassed Zero Trust authorization."
    );
  } else {
    finalEffect = "deny";
  }

  return {
    requestId: request.id,
    principalId: identity.id,
    sourceNodeId: request.sourceNodeId,
    resourceId: resource.id,
    action: request.action,
    effect: finalEffect,
    authState: auth.authState,
    matchedPolicyIds,
    steps,
    reasons:
      reasons.length > 0
        ? reasons
        : [
            "All Zero Trust checks passed (Identity Verified, Least-Privilege Authorized, Segmented, Encrypted).",
          ],
    evaluatedAtMs: request.atMs,
    boundaryCrossings,
  };
}

