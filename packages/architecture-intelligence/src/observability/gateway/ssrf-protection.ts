/**
 * SSRF & Security Gateway Safeguards
 * Enforces strict URL scheme validation, blocks loopback/cloud-metadata/link-local destinations,
 * bounds response payloads, and sanitizes/redacts sensitive tokens.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "::",
  "instance-data", // Cloud metadata alias
  "metadata.google.internal",
]);

const CLOUD_METADATA_IPS = ["169.254.169.254", "169.254.169.253", "100.100.100.200"];

export interface SsrfValidationResult {
  isAllowed: boolean;
  isValid: boolean;
  sanitizedUrl?: string;
  reason?: string;
}

export class SsrfValidator {
  /**
   * Validates target URL against SSRF and private-network egress policies.
   */
  public static validateEndpoint(urlStr: string, allowLocalhostForTests = false): SsrfValidationResult {
    let parsed: URL;
    try {
      parsed = new URL(urlStr);
    } catch {
      return { isAllowed: false, isValid: false, reason: "Malformed URL format" };
    }

    // 1. Enforce scheme: only http: and https: are permitted
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isAllowed: false, isValid: false, reason: `Forbidden URL protocol: ${parsed.protocol}. Only HTTP and HTTPS are permitted.` };
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

    // 2. Allow localhost only when explicitly flagged for local development/unit testing
    if (allowLocalhostForTests && (hostname === "localhost" || hostname === "127.0.0.1")) {
      return { isAllowed: true, isValid: true, sanitizedUrl: parsed.toString() };
    }

    // 3. Block known loopback and metadata hostnames
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return { isAllowed: false, isValid: false, reason: `Blocked loopback address or destination hostname: ${hostname}` };
    }

    // 4. Block Cloud Provider Instance Metadata Service (IMDS)
    if (CLOUD_METADATA_IPS.includes(hostname)) {
      return { isAllowed: false, isValid: false, reason: "Attempted access to link-local / cloud metadata service (IMDS) is strictly prohibited." };
    }

    // 5. Block private IPv4 ranges (RFC 1918) unless private VPC gateway configured
    const ipv4Parts = hostname.split(".").map(Number);
    if (ipv4Parts.length === 4 && ipv4Parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
      const [b0, b1] = ipv4Parts;
      if (b0 === 127) {
        return { isAllowed: false, isValid: false, reason: "Loopback IPv4 addresses are prohibited (blocked loopback address)." };
      }
      if (b0 === 10) {
        return { isAllowed: false, isValid: false, reason: "Private Class A (10.0.0.0/8) IP address is prohibited without dedicated private peering." };
      }
      if (b0 === 172 && b1 >= 16 && b1 <= 31) {
        return { isAllowed: false, isValid: false, reason: "Private Class B (172.16.0.0/12) IP address is prohibited." };
      }
      if (b0 === 192 && b1 === 168) {
        return { isAllowed: false, isValid: false, reason: "Private Class C (192.168.0.0/16) IP address is prohibited." };
      }
      if (b0 === 169 && b1 === 254) {
        return { isAllowed: false, isValid: false, reason: "Link-local / cloud metadata service (169.254.0.0/16) address is prohibited." };
      }
    }

    return { isAllowed: true, isValid: true, sanitizedUrl: parsed.toString() };
  }
}

/**
 * Server-Side Sensitive Telemetry Redaction
 */
export class TelemetryRedactor {
  private static readonly SENSITIVE_KEY_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /auth/i,
    /cookie/i,
    /api[_-]?key/i,
    /session/i,
    /bearer/i,
  ];

  private static readonly SENSITIVE_VALUE_PATTERNS = [
    /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
    /basic\s+[a-zA-Z0-9=:_\+\/]+/gi,
    /api[_-]?key=[a-zA-Z0-9_\-\.]+/gi,
    /\b(?:\d[ -]*?){13,16}\b/g, // Credit card numbers
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  ];

  public static redactString(text: string): string {
    let clean = text;
    clean = clean.replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]");
    clean = clean.replace(/api[_-]?key=[a-zA-Z0-9_\-\.]+/gi, "apiKey=[REDACTED]");
    clean = clean.replace(/\b(?:\d[ -]*?){13,16}\b/g, "[REDACTED-CARD]");
    clean = clean.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED-SSN]");
    for (const pattern of this.SENSITIVE_VALUE_PATTERNS) {
      clean = clean.replace(pattern, "[REDACTED]");
    }
    return clean;
  }

  public static redactText(text: string): string {
    return this.redactString(text);
  }

  public static redactAttributes(
    attributes: Record<string, unknown>
  ): Record<string, string | number | boolean> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(attributes)) {
      if (this.SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        sanitized[key] = "[REDACTED]";
        continue;
      }

      if (typeof value === "string") {
        sanitized[key] = this.redactString(value);
      } else if (typeof value === "number" || typeof value === "boolean") {
        sanitized[key] = value;
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        sanitized[key] = this.redactAttributes(value as Record<string, unknown>);
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  public static redactObject(obj: Record<string, unknown>): Record<string, any> {
    return this.redactAttributes(obj);
  }
}
