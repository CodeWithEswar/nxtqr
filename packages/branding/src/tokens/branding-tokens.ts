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
  compactViewBox: "12 12 104 104",
  width: 128,
  height: 128,
  center: { x: 64, y: 64 },
  cornerFraming: {
    radius: 6,
    strokeWidth: 3.5,
    color: "#404040",
    combinedPath:
      "M 18 38 V 24 A 6 6 0 0 1 24 18 H 38 M 90 18 H 104 A 6 6 0 0 1 110 24 V 38 M 110 90 V 104 A 6 6 0 0 1 104 110 H 90 M 38 110 H 24 A 6 6 0 0 1 18 104 V 90",
  },
  // A 45° channel joins the two terminals in the viewport's negative space.
  aperturePath:
    "M 26 54 Q 26 52 28 50 L 50 28 Q 52 26 54 26 H 98 Q 102 26 102 30 V 74 Q 102 76 100 78 L 78 100 Q 76 102 74 102 H 30 Q 26 102 26 98 Z M 39 67 Q 39 65 41 65 H 55 L 65 55 V 41 Q 65 39 67 39 H 87 Q 89 39 89 41 V 61 Q 89 63 87 63 H 73 L 63 73 V 87 Q 63 89 61 89 H 41 Q 39 89 39 87 Z",
} as const;

export const ICON_TILE = { x: 12, y: 12, size: 104, radius: 6 } as const;

export type LogoVariant = "full" | "symbol" | "minimal" | "wordmark" | "stacked";
export type LogoColorMode = "current" | "monochrome" | "inverse";
