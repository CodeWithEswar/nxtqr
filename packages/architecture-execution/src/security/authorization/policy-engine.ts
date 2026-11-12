import type {
  AuthorizationPolicy,
  AuthorizationResult,
  Principal,
  ResourceContext,
  AttributeCondition,
} from "../security-schemas";

export class PolicyEngine {
  /**
   * Evaluates authorization for an authenticated or anonymous principal against a target resource.
   */
  public static evaluateAuthorization(
    policy: AuthorizationPolicy,
    principal: Principal | null,
    resource: ResourceContext
  ): AuthorizationResult {
    const evaluations: AuthorizationResult["evaluations"] = [];

    // Anonymous request check
    if (!principal || !principal.isAuthenticated) {
      return {
        decision: "deny",
        explanation: "Unauthenticated principal cannot access protected resource.",
        denialReasonCode: "UNAUTHENTICATED",
        evaluations: [
          {
            ruleId: "auth_guard",
            type: "rbac",
            outcome: "deny",
            explanation: "Principal is not authenticated.",
          },
        ],
      };
    }

    // 1. Tenant Isolation Check (if configured)
    if (policy.tenantIsolation?.enforceTenantBoundary) {
      const resourceTenant = resource.tenantId;
      const principalTenant = principal.tenantId;

      if (resourceTenant && principalTenant && resourceTenant !== principalTenant) {
        evaluations.push({
          ruleId: "tenant_boundary",
          type: "tenant",
          outcome: "deny",
          explanation: `Cross-tenant isolation violation: Principal from tenant '${principalTenant}' attempted access to resource belonging to tenant '${resourceTenant}'.`,
        });

        return {
          decision: "deny",
          evaluations,
          explanation: `Access denied by tenant isolation boundary (${principalTenant} != ${resourceTenant}).`,
          denialReasonCode: "TENANT_MISMATCH",
        };
      } else {
        evaluations.push({
          ruleId: "tenant_boundary",
          type: "tenant",
          outcome: "permit",
          explanation: `Tenant boundary satisfied (Tenant: ${principalTenant || "shared"}).`,
        });
      }
    }

    // 2. Resource Ownership Check (if configured)
    if (policy.ownershipRule?.requireOwnerMatch) {
      const isOwner = resource.ownerId === principal.id;
      const outcome = isOwner ? "permit" : "deny";
      evaluations.push({
        ruleId: "ownership_policy",
        type: "ownership",
        outcome,
        explanation: isOwner
          ? `Principal '${principal.id}' is verified owner of '${resource.resourceId}'.`
          : `Ownership check failed: Principal '${principal.id}' is not owner of resource '${resource.resourceId}' (Owner: '${resource.ownerId || "system"}').`,
      });

      if (!isOwner && policy.combiningAlgorithm === "deny_overrides") {
        return {
          decision: "deny",
          evaluations,
          explanation: "Access denied: Principal does not own this resource.",
          denialReasonCode: "OWNERSHIP_REQUIRED",
        };
      }
    }

    // 3. RBAC Evaluation
    for (const rbac of policy.rbacRules) {
      if (rbac.resourceType === "*" || rbac.resourceType === resource.resourceType) {
        const hasRole = principal.roles.includes(rbac.role);
        if (hasRole) {
          const actionAllowed = rbac.allowedActions.includes("*") || rbac.allowedActions.includes(resource.action);
          const outcome = actionAllowed ? "permit" : "deny";

          evaluations.push({
            ruleId: `rbac_${rbac.role}_${rbac.resourceType}`,
            type: "rbac",
            outcome,
            explanation: actionAllowed
              ? `RBAC Role '${rbac.role}' permits action '${resource.action}' on '${rbac.resourceType}'.`
              : `RBAC Role '${rbac.role}' does NOT grant action '${resource.action}' on '${rbac.resourceType}' (Allowed: [${rbac.allowedActions.join(", ")}]).`,
          });
        }
      }
    }

    // 4. ABAC Evaluation
    for (const abac of policy.abacRules) {
      if (abac.action === "*" || abac.action === resource.action) {
        if (abac.resourceType === "*" || abac.resourceType === resource.resourceType) {
          const conditionsMatch = abac.conditions.every((c) =>
            this.evaluateAttributeCondition(c, principal, resource)
          );

          if (conditionsMatch) {
            evaluations.push({
              ruleId: abac.id,
              type: "abac",
              outcome: abac.effect,
              explanation: `ABAC rule '${abac.name}' matched all ${abac.conditions.length} conditions -> Effect: ${abac.effect.toUpperCase()}.`,
            });
          }
        }
      }
    }

    // 5. Apply Policy Combining Algorithm
    let decision: "permit" | "deny" = policy.defaultDecision;
    let matchedRuleId: string | undefined;

    const permits = evaluations.filter((e) => e.outcome === "permit");
    const denies = evaluations.filter((e) => e.outcome === "deny");

    if (policy.combiningAlgorithm === "deny_overrides") {
      if (denies.length > 0) {
        decision = "deny";
        matchedRuleId = denies[0].ruleId;
      } else if (permits.length > 0) {
        decision = "permit";
        matchedRuleId = permits[0].ruleId;
      }
    } else if (policy.combiningAlgorithm === "permit_overrides") {
      if (permits.length > 0) {
        decision = "permit";
        matchedRuleId = permits[0].ruleId;
      } else if (denies.length > 0) {
        decision = "deny";
        matchedRuleId = denies[0].ruleId;
      }
    } else if (policy.combiningAlgorithm === "first_applicable") {
      const applicable = evaluations.find((e) => e.outcome !== "not_applicable");
      if (applicable) {
        decision = applicable.outcome as "permit" | "deny";
        matchedRuleId = applicable.ruleId;
      }
    }

    const explanation =
      decision === "permit"
        ? `Access granted by authorization engine (${permits.length} permits, 0 active denies).`
        : `Access denied by policy '${matchedRuleId || "default_deny"}' (${denies.length} active denies).`;

    return {
      decision,
      matchedRuleId,
      evaluations,
      explanation,
      denialReasonCode: decision === "deny" ? (denies[0]?.ruleId || "DEFAULT_DENY") : undefined,
    };
  }

  private static evaluateAttributeCondition(
    cond: AttributeCondition,
    principal: Principal,
    resource: ResourceContext
  ): boolean {
    const val = this.resolveAttributePath(cond.attribute, principal, resource);

    switch (cond.operator) {
      case "equals":
        return val === cond.value;
      case "not_equals":
        return val !== cond.value;
      case "in":
        return Array.isArray(cond.value) && cond.value.includes(val);
      case "contains":
        return Array.isArray(val) && val.includes(cond.value);
      case "greater_than":
        return typeof val === "number" && typeof cond.value === "number" && val > cond.value;
      case "less_than":
        return typeof val === "number" && typeof cond.value === "number" && val < cond.value;
      default:
        return false;
    }
  }

  private static resolveAttributePath(
    path: string,
    principal: Principal,
    resource: ResourceContext
  ): unknown {
    if (path.startsWith("principal.attributes.")) {
      const key = path.replace("principal.attributes.", "");
      return principal.attributes[key];
    }
    if (path === "principal.tenantId") return principal.tenantId;
    if (path === "principal.id") return principal.id;
    if (path === "resource.tenantId") return resource.tenantId;
    if (path === "resource.ownerId") return resource.ownerId;
    if (path === "resource.sensitivityLevel") return resource.sensitivityLevel;
    if (path === "resource.resourceType") return resource.resourceType;
    return undefined;
  }
}
