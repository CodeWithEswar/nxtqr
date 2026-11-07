import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  assertPayloadSize,
  PayloadTooLargeError,
  InMemoryRateLimiter,
  maskSensitiveData,
} from "./index";

describe("Security Engineering Utilities", () => {
  it("sanitizes dangerous XSS payloads", () => {
    const dangerous = '<script>alert("xss")</script>hello world';
    expect(sanitizeString(dangerous)).toBe("hello world");

    const jsUri = "javascript:alert(1)";
    expect(sanitizeString(jsUri)).toBe("");
  });

  it("enforces payload size limits", () => {
    const smallPayload = "test data";
    expect(() => assertPayloadSize(smallPayload, 1024)).not.toThrow();

    const largePayload = "a".repeat(2000);
    expect(() => assertPayloadSize(largePayload, 1000)).toThrow(PayloadTooLargeError);
  });

  it("handles rate limiting properly with token depletion", () => {
    const limiter = new InMemoryRateLimiter({
      maxRequests: 3,
      windowMs: 5000,
    });

    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(false);

    // Other IPs are unaffected
    expect(limiter.check("ip-2").allowed).toBe(true);
  });

  it("redacts sensitive authentication tokens and passwords from objects", () => {
    const sensitive = {
      user: "engineer",
      password: "supersecretpassword",
      authorization: "Bearer eyJhbGciOi...",
      apiKey: "secret_live_key",
      nested: {
        token: "tok_123",
        safeData: "public_value",
      },
    };

    const masked = maskSensitiveData(sensitive) as Record<string, unknown>;
    expect(masked.password).toBe("[REDACTED]");
    expect(masked.authorization).toBe("[REDACTED]");
    expect(masked.apiKey).toBe("[REDACTED]");
    expect((masked.nested as Record<string, unknown>).token).toBe("[REDACTED]");
    expect((masked.nested as Record<string, unknown>).safeData).toBe("public_value");
  });
});
