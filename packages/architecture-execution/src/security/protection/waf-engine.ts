import type {
  WafPolicy,
  WafEvaluationResult,
  SecurityRequest,
} from "../security-schemas";

export class WafEngine {
  /**
   * Evaluates an incoming security request against configured WAF rules in priority order.
   */
  public static evaluateRequest(
    policy: WafPolicy,
    request: SecurityRequest
  ): WafEvaluationResult {
    // Sort rules by priority ascending (1 = highest priority)
    const activeRules = policy.rules
      .filter((r) => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of activeRules) {
      const isMatch = this.evaluateCondition(rule.condition, request);
      if (isMatch) {
        let explanation = "";
        if (rule.action === "block") {
          explanation = `WAF blocked request: matched rule '${rule.name}' (Priority ${rule.priority}). ${rule.description}`;
        } else if (rule.action === "challenge") {
          explanation = `WAF challenged request: matched rule '${rule.name}'. Proof-of-work or managed challenge required.`;
        } else {
          explanation = `WAF explicitly allowed request: matched allowlist rule '${rule.name}'.`;
        }

        return {
          action: rule.action,
          matchedRule: rule,
          explanation,
        };
      }
    }

    return {
      action: policy.defaultAction,
      explanation: "WAF evaluated all rules: no malicious or blocking patterns detected.",
    };
  }

  private static evaluateCondition(
    condition: import("../security-schemas").WafCondition,
    request: SecurityRequest
  ): boolean {
    switch (condition.type) {
      case "suspicious_payload": {
        const bodyStr = typeof request.body === "object" ? JSON.stringify(request.body) : String(request.body || "");
        const target = `${request.path} ${bodyStr}`.toLowerCase();
        const pattern = String(condition.pattern).toLowerCase();

        // Check SQL injection / XSS patterns
        if (pattern === "sql_injection") {
          return (
            target.includes("' or '1'='1") ||
            target.includes("union select") ||
            target.includes("drop table") ||
            target.includes("--")
          );
        }
        if (pattern === "xss") {
          return target.includes("<script") || target.includes("javascript:") || target.includes("onerror=");
        }
        return target.includes(pattern);
      }

      case "path_pattern": {
        const pattern = String(condition.pattern);
        if (condition.operator === "equals") return request.path === pattern;
        if (condition.operator === "contains") return request.path.includes(pattern);
        if (condition.operator === "regex_match") return new RegExp(pattern).test(request.path);
        return false;
      }

      case "ip_cidr": {
        const pattern = String(condition.pattern);
        if (pattern === request.clientIp) return true;
        if (pattern.endsWith("/24")) {
          const prefix = pattern.split(".").slice(0, 3).join(".");
          return request.clientIp.startsWith(prefix);
        }
        return false;
      }

      case "payload_size_limit": {
        const bodyStr = typeof request.body === "object" ? JSON.stringify(request.body) : String(request.body || "");
        const sizeBytes = new TextEncoder().encode(bodyStr).length;
        const limitBytes = Number(condition.pattern);
        return sizeBytes > limitBytes;
      }

      case "method_restriction": {
        return request.method === condition.pattern;
      }

      case "header_match": {
        const headerKey = (condition.field || "").toLowerCase();
        const headerVal = request.headers[headerKey] || "";
        return headerVal.includes(String(condition.pattern));
      }

      default:
        return false;
    }
  }
}
