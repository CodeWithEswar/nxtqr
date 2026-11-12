import type {
  CorsPolicy,
  CorsEvaluationResult,
  SecurityRequest,
} from "../security-schemas";

export class CorsSimulator {
  public static evaluateCors(
    policy: CorsPolicy,
    request: SecurityRequest
  ): CorsEvaluationResult {
    if (!policy.enabled) {
      return {
        allowed: true,
        isPreflight: request.method === "OPTIONS",
        explanation: "CORS enforcement is disabled for this route.",
      };
    }

    const origin = request.origin || request.headers["origin"];
    const isPreflight = request.method === "OPTIONS";

    if (!origin) {
      // Same-origin or non-browser client
      return {
        allowed: true,
        isPreflight,
        explanation: "No Origin header present; request treated as same-origin or non-browser client.",
      };
    }

    // Check Origin allowlist
    const originAllowed = policy.allowedOrigins.includes("*") || policy.allowedOrigins.includes(origin);
    if (!originAllowed) {
      return {
        allowed: false,
        isPreflight,
        originEvaluated: origin,
        explanation: `CORS policy violation: Origin '${origin}' is not in allowed origins allowlist [${policy.allowedOrigins.join(", ")}].`,
      };
    }

    // For preflight, check method
    if (isPreflight) {
      const requestedMethod = request.headers["access-control-request-method"] as any || "GET";
      const methodAllowed = policy.allowedMethods.includes(requestedMethod);
      if (!methodAllowed) {
        return {
          allowed: false,
          isPreflight,
          originEvaluated: origin,
          explanation: `CORS preflight rejected: Method '${requestedMethod}' is not permitted by Access-Control-Allow-Methods.`,
        };
      }
    }

    return {
      allowed: true,
      isPreflight,
      originEvaluated: origin,
      explanation: `CORS check passed for origin '${origin}' (${isPreflight ? "Preflight allowed" : "Simple request allowed"}).`,
    };
  }
}
