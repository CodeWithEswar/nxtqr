/**
 * NXTQR Brand Identity Tokens & Mathematical Geometry Constants
 *
 * Exact vector parameters for the geometric N monogram, precision corner framing,
 * liquid chrome gradients, and brand positioning.
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

  // Precision Viewfinder Corner Brackets
  cornerFraming: {
    strokeWidth: 4.5,
    radius: 7, // High-DPI corner curve
    armLength: 18,
    paths: {
      topLeft: "M 18 38 L 18 25 A 7 7 0 0 1 25 18 L 38 18",
      topRight: "M 90 18 L 103 18 A 7 7 0 0 1 110 25 L 110 38",
      bottomRight: "M 110 90 L 110 103 A 7 7 0 0 1 103 110 L 90 110",
      bottomLeft: "M 38 110 L 25 110 A 7 7 0 0 1 18 103 L 18 90",
    },
    combinedPath:
      "M 18 38 L 18 25 A 7 7 0 0 1 25 18 L 38 18 M 90 18 L 103 18 A 7 7 0 0 1 110 25 L 110 38 M 110 90 L 110 103 A 7 7 0 0 1 103 110 L 90 110 M 38 110 L 25 110 A 7 7 0 0 1 18 103 L 18 90",
  },

  // The Exact 3D Folded Ribbon N Monogram
  monogram: {
    bounds: {
      left: 29,
      right: 98,
      top: 24,
      bottom: 94,
      width: 69,
      height: 70,
    },
    // 1. Left Vertical Pillar (Straight outer edge at x=29, flared foot)
    leftPillarPath:
      "M 31 94 C 29 93.5 28 90.5 29 86 L 29 36 C 29 28.5 35 23.5 42.5 24 C 45 24.2 47.5 25.2 49.5 27 L 44 48 L 44 86 C 44 91 38 95 31 94 Z",
    // 2. Inner Shadow Facet (Dimensional fold plane between left pillar and diagonal)
    innerShadowPath: "M 44 48 L 49.5 27 C 52 28.5 54 31 54 34.5 L 54 62 L 44 76 Z",
    // 3. Main Sweeping Diagonal Ribbon (Liquid Chrome Front Surface)
    mainRibbonPath:
      "M 42.5 24 C 36 24.5 31.5 29.5 31 36 C 30.8 40 33 44 36.5 47.5 L 68 85 C 72 89.5 77.5 92 83 92 C 87.5 92 92 89.5 95 85.5 C 97 82.5 98 79 98 75 L 98 34 C 98 28.5 93.5 24.5 88 25 C 83.5 25.5 80 29 80 34 L 80 72 C 80 75.5 78 78 74.5 78.5 C 71.5 79 69 77.5 67 75 L 42 44 C 38 39 39 31 44 26.5 C 43.5 25.5 43 24.5 42.5 24 Z",
    // 4. Right Vertical Pillar Surface (Straight outer edge at x=98)
    rightPillarPath:
      "M 80 34 C 80 29 83.5 25.5 88 25 C 93.5 24.5 98 28.5 98 34 L 98 75 C 98 79 97 82.5 95 85.5 L 83 92 L 80 34 Z",
    // 5. Specular Highlight Ribbons
    highlightTopPath: "M 42.5 24 C 45 24.2 47.5 25.2 49.5 27 L 44 40 C 41 35 40 30 42.5 24 Z",
    highlightBottomPath:
      "M 67 75 L 42 44 C 44 42 46.5 41 49 42.5 L 73 72.5 C 71 74 69 74.5 67 75 Z",

    // 6. Signature Horizontal Laser Beam & Flare
    laserBeam: {
      x1: 16,
      y1: 64,
      x2: 112,
      y2: 64,
      strokeWidth: 2.5,
      flareRadius: 22,
      hotspot: { cx: 64, cy: 64, rx: 10, ry: 2.5 },
    },
  },
} as const;

export type LogoVariant = "full" | "symbol" | "minimal" | "wordmark" | "stacked";
export type LogoColorMode = "current" | "monochrome" | "inverse" | "accent";
