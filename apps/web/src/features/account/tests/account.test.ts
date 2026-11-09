import { describe, it, expect } from "vitest";
import { getInitials } from "../components/user-avatar";

describe("NXTQR User Account & Identity Architecture", () => {
  describe("getInitials Avatar Fallback", () => {
    it("generates two-letter initials from full name", () => {
      expect(getInitials("Satya Nadella")).toBe("SN");
      expect(getInitials("Linus Torvalds")).toBe("LT");
      expect(getInitials("Ada Lovelace")).toBe("AL");
    });

    it("handles single-word names and handles trimming", () => {
      expect(getInitials("Antigravity")).toBe("AN");
      expect(getInitials("  NXTQR  ")).toBe("NX");
    });

    it("handles multi-word names by taking first and last initials", () => {
      expect(getInitials("Guido van Rossum")).toBe("GR");
      expect(getInitials("Martin Fowler Junior")).toBe("MJ");
    });

    it("returns safe default 'SE' for null, empty, or undefined names", () => {
      expect(getInitials(null)).toBe("SE");
      expect(getInitials("")).toBe("SE");
      expect(getInitials(undefined)).toBe("SE");
      expect(getInitials("   ")).toBe("SE");
    });
  });

  describe("Identity Precedence Logic", () => {
    function resolveDisplayName(profile: {
      displayName?: string | null;
      userMetadataName?: string | null;
      email?: string | null;
    }): string {
      return (
        profile.displayName?.trim() ||
        profile.userMetadataName?.trim() ||
        profile.email?.split("@")[0] ||
        "Studio Engineer"
      );
    }

    it("prioritizes user-edited profile display name over all others", () => {
      const resolved = resolveDisplayName({
        displayName: "Chief Architect",
        userMetadataName: "Google Provider Name",
        email: "architect@nxtqr.dev",
      });
      expect(resolved).toBe("Chief Architect");
    });

    it("falls back to provider metadata when profile display name is missing", () => {
      const resolved = resolveDisplayName({
        displayName: null,
        userMetadataName: "Google Provider Name",
        email: "architect@nxtqr.dev",
      });
      expect(resolved).toBe("Google Provider Name");
    });

    it("falls back to email prefix when provider metadata is missing", () => {
      const resolved = resolveDisplayName({
        displayName: null,
        userMetadataName: null,
        email: "developer@example.com",
      });
      expect(resolved).toBe("developer");
    });

    it("falls back to safe 'Studio Engineer' default when all fields are empty", () => {
      const resolved = resolveDisplayName({
        displayName: null,
        userMetadataName: null,
        email: null,
      });
      expect(resolved).toBe("Studio Engineer");
    });
  });
});

