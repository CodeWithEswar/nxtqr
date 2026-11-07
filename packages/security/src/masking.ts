const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "apikey",
  "api_key",
  "accesstoken",
  "refreshtoken",
]);

/**
 * Recursively redacts sensitive values from objects before logging or serializing.
 */
export function maskSensitiveData(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      result[key] = maskSensitiveData(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}
