import { describe, it, expect } from "vitest";
import {
  TERMS_CONFIG,
  PRIVACY_CONFIG,
  type LegalDocumentConfig,
} from "../config/legal-documents";

describe("Legal Document Configurations", () => {
  const configs: LegalDocumentConfig[] = [TERMS_CONFIG, PRIVACY_CONFIG];

  it("defines standard metadata across all documents", () => {
    for (const doc of configs) {
      expect(doc.title).toBeTruthy();
      expect(doc.shortTitle).toBeTruthy();
      expect(doc.version).toMatch(/^v\d+\.\d+\.\d+$/);
      expect(doc.effectiveDate).toContain("2026");
      expect(doc.lastUpdated).toContain("2026");
      expect(doc.description).toBeTruthy();
      expect(doc.canonicalPath.startsWith("/")).toBe(true);
      expect(doc.sections.length).toBeGreaterThan(5);
    }
  });

  it("ensures unique, valid section slugs and sequential numbering", () => {
    for (const doc of configs) {
      const seenIds = new Set<string>();
      const seenNumbers = new Set<string>();

      doc.sections.forEach((sec, idx) => {
        expect(sec.id).toMatch(/^[a-z0-9-]+$/);
        expect(seenIds.has(sec.id)).toBe(false);
        seenIds.add(sec.id);

        expect(sec.number).toBe(String(idx + 1).padStart(2, "0"));
        seenNumbers.add(sec.number);

        expect(sec.title.trim()).toBeTruthy();
      });
    }
  });

  it("includes critical ownership and isolation sections in Terms", () => {
    const ids = TERMS_CONFIG.sections.map((s) => s.id);
    expect(ids).toContain("overview");
    expect(ids).toContain("acceptable-use");
    expect(ids).toContain("user-content");
    expect(ids).toContain("platform-ip");
    expect(ids).toContain("disclaimers");
    expect(ids).toContain("governing-law");
  });

  it("includes critical security, RLS, and OAuth sections in Privacy", () => {
    const ids = PRIVACY_CONFIG.sections.map((s) => s.id);
    expect(ids).toContain("google-auth");
    expect(ids).toContain("project-storage");
    expect(ids).toContain("cookies-sessions");
    expect(ids).toContain("security-safeguards");
    expect(ids).toContain("user-rights");
    expect(ids).toContain("retention-deletion");
  });
});

