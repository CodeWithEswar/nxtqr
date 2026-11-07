/**
 * NXTQR Brand Identity Tokens & Mathematical Geometry Constants
 *
 * Strict vector parameters for the geometric N monogram, precision corner framing,
 * brand positioning, and typography rules.
 */

export const BRAND_CONSTANTS = {
  name: "NXTQR",
  category: "Interactive Visual Engineering Studio",
  tagline: "Design. Visualize. Simulate. Understand.",
  description:
    "A professional workspace for designing, visualizing, simulating, and understanding complex engineering systems.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://nxtqr.dev",
} as const;

export const LOGO_GEOMETRY = {
  viewBox: "0 0 128 128",
  width: 128,
  height: 128,
  center: { x: 64, y: 64 },

  // 4 Corner Brackets (viewBox: 0 0 128 128)
  cornerFraming: {
    strokeWidth: 3.5,
    radius: 6, // Matches standard rounded-md (6px / 0.375rem)
    armLength: 18,
    paths: {
      topLeft: "M 18 36 L 18 24 A 6 6 0 0 1 24 18 L 36 18",
      topRight: "M 92 18 L 104 18 A 6 6 0 0 1 110 24 L 110 36",
      bottomRight: "M 110 92 L 110 104 A 6 6 0 0 1 104 110 L 92 110",
      bottomLeft: "M 36 110 L 24 110 A 6 6 0 0 1 18 104 L 18 92",
    },
    combinedPath:
      "M 18 36 L 18 24 A 6 6 0 0 1 24 18 L 36 18 M 92 18 L 104 18 A 6 6 0 0 1 110 24 L 110 36 M 110 92 L 110 104 A 6 6 0 0 1 104 110 L 92 110 M 36 110 L 24 110 A 6 6 0 0 1 18 104 L 18 92",
  },

  // Geometric N Monogram
  monogram: {
    bounds: {
      left: 34,
      right: 94,
      top: 30,
      bottom: 98,
      width: 60,
      height: 68,
    },
    // Main continuous precision N ribbon
    bodyPath:
      "M 40 98 C 36.5 98 34 95.5 34 92 L 34 42 C 34 35 39 30 46 30 C 51 30 55.5 33 58 37.5 L 76 68.5 C 77.8 71.5 80.5 73 83.5 73 C 87 73 89.5 70.5 89.5 67 L 89.5 36 C 89.5 32.7 92.2 30 95.5 30 C 98.8 30 101.5 32.7 101.5 36 L 101.5 86 C 101.5 93 96.5 98 89.5 98 C 84.5 98 80 95 77.5 90.5 L 59.5 59.5 C 57.7 56.5 55 55 52 55 C 48.5 55 46 57.5 46 61 L 46 92 C 46 95.3 43.3 98 40 98 Z",
    // Dimensional facet undercuts for subtle relief without glassmorphism
    facetUnderPath:
      "M 34 92 C 34 95.3 36.7 98 40 98 C 43.3 98 46 95.3 46 92 L 46 52 L 34 64 Z M 89.5 36 C 89.5 32.7 92.2 30 95.5 30 C 98.8 30 101.5 32.7 101.5 36 L 101.5 76 L 89.5 64 Z",
    // Directed Execution Beam along center diagonal axis
    executionLine: {
      x1: 26,
      y1: 64,
      x2: 102,
      y2: 64,
      node: { cx: 64, cy: 64, r: 3.5 },
      path: "M 26 64 L 102 64",
    },
    diagonalTracePath: "M 40 40 L 88 88",
  },
} as const;

export type LogoVariant = "full" | "symbol" | "minimal" | "wordmark" | "stacked";
export type LogoColorMode = "current" | "monochrome" | "inverse" | "accent";
