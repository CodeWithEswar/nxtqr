import { describe, it, expect } from "vitest";
import { cn, formatBytes, slugify, invariant, truncateMiddle } from "./index";

describe("Shared Platform Utilities", () => {
  it("merges tailwind class names properly with conflict resolution", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("bg-black text-white", false && "hidden", "rounded-md")).toBe(
      "bg-black text-white rounded-md",
    );
  });

  it("formats bytes accurately", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
  });

  it("slugifies strings into URL-safe formats", () => {
    expect(slugify("System Design Visualizer")).toBe("system-design-visualizer");
    expect(slugify("  AI & Agents Studio 2026! ")).toBe("ai-agents-studio-2026");
  });

  it("truncates long hashes or strings in the middle", () => {
    const longString = "0123456789abcdefghijklmnopqrstuvwxyz";
    const truncated = truncateMiddle(longString, 16);
    expect(truncated).toContain("...");
    expect(truncated.length).toBeLessThanOrEqual(16);
  });

  it("enforces invariants", () => {
    expect(() => invariant(true, "Condition met")).not.toThrow();
    expect(() => invariant(false, "Invariant failure")).toThrow(
      "[NXTQR Invariant Violation] Invariant failure",
    );
  });
});
