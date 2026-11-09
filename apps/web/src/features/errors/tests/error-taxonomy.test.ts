import { describe, it, expect } from "vitest";
import { ERROR_DISPLAY_REGISTRY, type AppErrorCode } from "../config/error-taxonomy";

describe("NXTQR Error Taxonomy & User Safety Architecture", () => {
  const codes: AppErrorCode[] = [
    "INVALID_ROUTE",
    "RESOURCE_NOT_FOUND",
    "PROJECT_UNAVAILABLE",
    "PERMISSION_DENIED",
    "UNAUTHENTICATED",
    "SESSION_EXPIRED",
    "SERVICE_UNAVAILABLE",
    "NETWORK_UNAVAILABLE",
    "RATE_LIMITED",
    "PROJECT_LOAD_FAILED",
    "PROJECT_SAVE_FAILED",
    "UNEXPECTED_ERROR",
  ];

  it("registers valid display configurations for all defined error codes", () => {
    for (const code of codes) {
      const config = ERROR_DISPLAY_REGISTRY[code];
      expect(config).toBeDefined();
      expect(config.title.length).toBeGreaterThan(0);
      expect(config.description.length).toBeGreaterThan(0);
      expect(config.primaryActionLabel.length).toBeGreaterThan(0);
    }
  });

  it("masks private project existence with identical 404 response", () => {
    const config = ERROR_DISPLAY_REGISTRY.PROJECT_UNAVAILABLE;
    expect(config.httpStatus).toBe(404);
    expect(config.title).toBe("Project unavailable");
    expect(config.description).toBe("This project doesn't exist or you no longer have access to it.");
    expect(config.description).not.toContain("owner");
    expect(config.description).not.toContain("permission");
  });

  it("never includes raw internal stack keywords or secrets in messages", () => {
    for (const code of codes) {
      const config = ERROR_DISPLAY_REGISTRY[code];
      expect(config.description).not.toMatch(/database|sql|postgres|stack|error_code|anon_key|jwt/i);
    }
  });
});
