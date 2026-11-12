import type {
  GatewaySecurityRoute,
  RouteMatchResult,
  SecurityHttpMethod,
} from "../security-schemas";

export class SecurityRouteResolver {
  /**
   * Matches an incoming HTTP request path and method against configured gateway routes.
   * Routes are evaluated in priority order (lowest number = highest priority).
   */
  public static matchRoute(
    routes: GatewaySecurityRoute[],
    requestPath: string,
    requestMethod: SecurityHttpMethod
  ): RouteMatchResult {
    // Sort routes by priority ascending (1 is higher priority than 10)
    const sorted = [...routes].sort((a, b) => a.priority - b.priority);
    const rejectedReasons: { routeId: string; reason: string }[] = [];
    let evaluatedCount = 0;

    for (const route of sorted) {
      evaluatedCount++;

      // 1. Check Method compatibility
      const methodAllowed =
        route.methods.includes("*") || route.methods.includes(requestMethod);
      if (!methodAllowed) {
        rejectedReasons.push({
          routeId: route.id,
          reason: `Method '${requestMethod}' is not permitted by route allowlist [${route.methods.join(", ")}]`,
        });
        continue;
      }

      // 2. Check Path Matching
      const matchOutcome = this.evaluatePath(route.pathPattern, requestPath, route.matchType);
      if (!matchOutcome.matched) {
        rejectedReasons.push({
          routeId: route.id,
          reason: `Path '${requestPath}' did not match pattern '${route.pathPattern}' (${route.matchType})`,
        });
        continue;
      }

      // Matched successfully!
      return {
        matched: true,
        route,
        pathParams: matchOutcome.params,
        evaluatedCandidatesCount: evaluatedCount,
        rejectedReasons,
      };
    }

    // No matching route found
    return {
      matched: false,
      pathParams: {},
      evaluatedCandidatesCount: evaluatedCount,
      rejectedReasons,
    };
  }

  /**
   * Evaluates path matching based on exact, prefix, or parameterized syntax (/orders/:id).
   */
  public static evaluatePath(
    pattern: string,
    path: string,
    matchType: "exact" | "prefix" | "parameterized"
  ): { matched: boolean; params: Record<string, string> } {
    const normPattern = pattern.endsWith("/") && pattern.length > 1 ? pattern.slice(0, -1) : pattern;
    const normPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;

    if (matchType === "exact") {
      return {
        matched: normPattern === normPath,
        params: {},
      };
    }

    if (matchType === "prefix") {
      const isMatch = normPath.startsWith(normPattern);
      return {
        matched: isMatch,
        params: {},
      };
    }

    if (matchType === "parameterized") {
      const patternParts = normPattern.split("/").filter(Boolean);
      const pathParts = normPath.split("/").filter(Boolean);

      if (patternParts.length !== pathParts.length) {
        return { matched: false, params: {} };
      }

      const params: Record<string, string> = {};
      for (let i = 0; i < patternParts.length; i++) {
        const pSeg = patternParts[i];
        const rSeg = pathParts[i];

        if (pSeg.startsWith(":")) {
          const paramName = pSeg.slice(1);
          params[paramName] = rSeg;
        } else if (pSeg !== rSeg) {
          return { matched: false, params: {} };
        }
      }

      return { matched: true, params };
    }

    return { matched: false, params: {} };
  }
}
