import { describe, it, expect } from "vitest";
import {
  AuthFlowStateSchema,
  AppErrorCodeSchema,
  AuthAttemptSchema,
  AuthCallbackMessageSchema,
} from "../schemas/auth.schema";
import { formatAuthError, AppError } from "../lib/auth-errors";
import { calculateCenteredPopupCoordinates } from "../lib/popup-window";

describe("NXTQR Phase 03: Authentication Core & Security", () => {
  describe("Auth State Machine Schemas", () => {
    it("validates all legal authentication states", () => {
      const validStates = [
        "idle",
        "preparing",
        "popup_open",
        "awaiting_provider",
        "processing_callback",
        "verifying_session",
        "success",
        "cancelled",
        "failed",
        "timeout",
        "blocked",
      ];

      for (const st of validStates) {
        expect(AuthFlowStateSchema.parse(st)).toBe(st);
      }
    });

    it("rejects invalid state values", () => {
      expect(() => AuthFlowStateSchema.parse("authenticated_unverified")).toThrow();
      expect(() => AuthFlowStateSchema.parse("random_string")).toThrow();
    });

    it("validates application error codes", () => {
      const validCodes = [
        "AUTH_CANCELLED",
        "AUTH_POPUP_BLOCKED",
        "AUTH_TIMEOUT",
        "AUTH_PROVIDER_ERROR",
        "AUTH_SESSION_EXPIRED",
        "NETWORK_UNAVAILABLE",
        "VALIDATION_ERROR",
        "PERMISSION_DENIED",
        "RESOURCE_NOT_FOUND",
        "RESOURCE_CONFLICT",
        "RATE_LIMITED",
        "SERVICE_UNAVAILABLE",
        "UNKNOWN_ERROR",
      ];

      for (const code of validCodes) {
        expect(AppErrorCodeSchema.parse(code)).toBe(code);
      }
    });

    it("validates auth attempt payload structure", () => {
      const attempt = {
        attemptId: "123e4567-e89b-12d3-a456-426614174000",
        createdAt: Date.now(),
        targetUrl: "/workspace",
        mode: "popup" as const,
      };

      const parsed = AuthAttemptSchema.parse(attempt);
      expect(parsed.mode).toBe("popup");
      expect(parsed.targetUrl).toBe("/workspace");
    });

    it("validates secure postMessage callback payload", () => {
      const validMsg = {
        type: "NXTQR_AUTH_SUCCESS" as const,
        attemptId: "123e4567-e89b-12d3-a456-426614174000",
      };
      expect(AuthCallbackMessageSchema.parse(validMsg).type).toBe("NXTQR_AUTH_SUCCESS");

      // Verify no tokens in schema
      const invalidMsg = {
        type: "NXTQR_AUTH_SUCCESS",
        access_token: "secret_token_123",
      };
      const parsed = AuthCallbackMessageSchema.parse(invalidMsg);
      expect((parsed as any).access_token).toBeUndefined();
    });
  });

  describe("Error Classification & Masking", () => {
    it("formats known AppError into safe user-facing message", () => {
      const err = new AppError("AUTH_POPUP_BLOCKED", "Popup blocked by browser");
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe("AUTH_POPUP_BLOCKED");
      expect(formatted.title).toContain("Popup Blocked");
      expect(formatted.recoverable).toBe(true);
      expect(formatted.retryActionTitle).toBe("Continue via Redirect");
    });

    it("formats cancellation into a smooth non-alarming message", () => {
      const err = new AppError("AUTH_CANCELLED", "User closed window");
      const formatted = formatAuthError(err);

      expect(formatted.code).toBe("AUTH_CANCELLED");
      expect(formatted.title).toBe("Sign-in Cancelled");
      expect(formatted.recoverable).toBe(true);
    });

    it("maps raw error strings to safe categorized errors without leaking details", () => {
      const rawError = new Error("Connection refused to database postgresql://admin:secret@host/db");
      const formatted = formatAuthError(rawError);

      expect(formatted.code).toBe("UNKNOWN_ERROR");
      expect(formatted.message).not.toContain("secret");
      expect(formatted.message).not.toContain("postgresql");
    });
  });

  describe("Popup Window Math & Positioning", () => {
    it("calculates centered coordinates on screen", () => {
      const coords = calculateCenteredPopupCoordinates(500, 620);
      expect(coords.width).toBe(500);
      expect(coords.height).toBe(620);
      expect(coords.left).toBeGreaterThanOrEqual(0);
      expect(coords.top).toBeGreaterThanOrEqual(0);
    });
  });
});

