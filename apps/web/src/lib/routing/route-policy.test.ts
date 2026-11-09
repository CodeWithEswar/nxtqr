import { describe, it, expect } from "vitest";
import {
  isProtectedRoute,
  isPublicRoute,
  validateSafeRedirect,
} from "./route-policy";

describe("NXTQR Route Access Policy & Defense-in-Depth", () => {
  describe("Route Access Classification", () => {
    it("classifies core studio workspace routes as authenticated", () => {
      expect(isProtectedRoute("/workspace")).toBe(true);
      expect(isProtectedRoute("/workspace/projects")).toBe(true);
      expect(isProtectedRoute("/workspace/visualizers")).toBe(true);
      expect(isProtectedRoute("/projects")).toBe(true);
      expect(isProtectedRoute("/projects/1234-uuid")).toBe(true);
      expect(isProtectedRoute("/settings")).toBe(true);
      expect(isProtectedRoute("/settings/theme")).toBe(true);
      expect(isProtectedRoute("/visualizers/flow")).toBe(true);
    });

    it("classifies public documentation, legal, and login as public", () => {
      expect(isPublicRoute("/login")).toBe(true);
      expect(isPublicRoute("/terms")).toBe(true);
      expect(isPublicRoute("/privacy")).toBe(true);
      expect(isPublicRoute("/docs")).toBe(true);
      expect(isPublicRoute("/docs/getting-started")).toBe(true);
      expect(isPublicRoute("/verify")).toBe(true);
      expect(isPublicRoute("/verify/scrollbar")).toBe(true);
      expect(isPublicRoute("/api/health")).toBe(true);
    });

    it("does not classify public routes as protected", () => {
      expect(isProtectedRoute("/login")).toBe(false);
      expect(isProtectedRoute("/terms")).toBe(false);
      expect(isProtectedRoute("/privacy")).toBe(false);
      expect(isProtectedRoute("/docs")).toBe(false);
    });
  });

  describe("validateSafeRedirect (Open Redirect Prevention)", () => {
    it("allows valid internal relative paths", () => {
      expect(validateSafeRedirect("/workspace")).toBe("/workspace");
      expect(validateSafeRedirect("/workspace/projects")).toBe("/workspace/projects");
      expect(validateSafeRedirect("/settings?tab=general")).toBe("/settings?tab=general");
      expect(validateSafeRedirect("/docs#installation")).toBe("/docs#installation");
    });

    it("rejects external domains and protocol-relative URLs", () => {
      expect(validateSafeRedirect("https://attacker.com")).toBe("/workspace");
      expect(validateSafeRedirect("http://evil.com/workspace")).toBe("/workspace");
      expect(validateSafeRedirect("//attacker.com")).toBe("/workspace");
      expect(validateSafeRedirect("/\\attacker.com")).toBe("/workspace");
    });

    it("rejects malicious javascript, data, or file schemes", () => {
      expect(validateSafeRedirect("javascript:alert(1)")).toBe("/workspace");
      expect(validateSafeRedirect("data:text/html,<script>")).toBe("/workspace");
      expect(validateSafeRedirect("file:///etc/passwd")).toBe("/workspace");
    });

    it("rejects CRLF and control character injections", () => {
      expect(validateSafeRedirect("/workspace\r\nSet-Cookie: evil=1")).toBe("/workspace");
      expect(validateSafeRedirect("/workspace\x00evil")).toBe("/workspace");
    });

    it("uses custom fallback when specified", () => {
      expect(validateSafeRedirect(null, "/custom-fallback")).toBe("/custom-fallback");
      expect(validateSafeRedirect("", "/custom-fallback")).toBe("/custom-fallback");
      expect(validateSafeRedirect("//evil.com", "/login")).toBe("/login");
    });
  });
});
