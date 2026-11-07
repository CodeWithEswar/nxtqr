import { describe, it, expect } from "vitest";
import {
  HexColorSchema,
  UserThemePreferencesSchema,
  LoginSchema,
  CreateWorkspaceSchema,
  QueueMessageEnvelopeSchema,
} from "./index";

describe("Validation Schemas — Core Contracts", () => {
  it("validates 3 and 6 digit hex colors strictly", () => {
    expect(HexColorSchema.safeParse("#FFF").success).toBe(true);
    expect(HexColorSchema.safeParse("#579DFF").success).toBe(true);
    expect(HexColorSchema.safeParse("579DFF").success).toBe(false); // missing #
    expect(HexColorSchema.safeParse("#GGGGGG").success).toBe(false); // non-hex
    expect(HexColorSchema.safeParse("#12345").success).toBe(false); // invalid length
  });

  it("validates user theme preferences defaults", () => {
    const parsed = UserThemePreferencesSchema.parse({});
    expect(parsed.themeMode).toBe("dark");
    expect(parsed.accentPreset).toBe("monochrome");
    expect(parsed.customHex).toBeNull();
    expect(parsed.reducedMotion).toBe(false);
  });

  it("validates login inputs", () => {
    expect(
      LoginSchema.safeParse({ email: "valid@nxtqr.com", password: "securepassword123" }).success,
    ).toBe(true);

    expect(LoginSchema.safeParse({ email: "invalid-email", password: "short" }).success).toBe(
      false,
    );
  });

  it("enforces URL-safe lowercase slugs for workspaces", () => {
    expect(
      CreateWorkspaceSchema.safeParse({
        name: "Test Studio",
        slug: "test-studio",
      }).success,
    ).toBe(true);

    expect(
      CreateWorkspaceSchema.safeParse({
        name: "Test Studio",
        slug: "Test Studio!",
      }).success,
    ).toBe(false);
  });

  it("validates typed queue message envelopes", () => {
    const validMessage = {
      version: "1.0.0",
      eventId: "evt_123",
      jobId: "job_456",
      timestamp: new Date().toISOString(),
      payload: { action: "run_simulation" },
      correlationId: "nxt_corr_789",
    };

    expect(QueueMessageEnvelopeSchema.safeParse(validMessage).success).toBe(true);

    const invalidMessage = {
      eventId: "evt_123",
      // missing jobId, timestamp, correlationId
    };
    expect(QueueMessageEnvelopeSchema.safeParse(invalidMessage).success).toBe(false);
  });
});
