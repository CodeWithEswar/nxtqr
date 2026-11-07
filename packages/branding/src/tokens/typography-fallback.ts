/**
 * NXTQR Wordmark Typography & Fallback Architecture
 *
 * Strict specifications for the NXTQR brand wordmark across primary and fallback
 * rendering environments.
 */

export const WORDMARK_TYPOGRAPHY = {
  // Primary font family
  primaryFont: "Geist Sans",
  variable: "var(--font-geist-sans)",

  // Strict fallback stack (prevents metric shift or letter reflow)
  fallbackStack: [
    "Geist Sans",
    "-apple-system",
    "BlinkMacSystemFont",
    "'Segoe UI'",
    "Roboto",
    "'Helvetica Neue'",
    "Arial",
    "sans-serif",
    "system-ui",
  ].join(", "),

  // Font metrics & styling
  fontWeight: 700,
  letterSpacing: "-0.04em", // Precise optical tracking for geometric impact
  textTransform: "uppercase",
  lineHeight: 1.0,

  // Optical kerning pairs for custom letter pairs
  kerningRules: {
    "N-X": "-0.02em", // Tight connection between N terminal and X arm
    "X-T": "-0.04em", // T crossbar overhang compensation
    "T-Q": "-0.05em", // Optical clearance under T right arm into Q bowl
    "Q-R": "-0.03em", // Q diagonal tail clearance to R left stem
  },

  // Category & Subtitle typography
  subtitle: {
    fontFamily: [
      "Geist Mono",
      "ui-monospace",
      "SFMono-Regular",
      "Menlo",
      "Monaco",
      "Consolas",
      "monospace",
    ].join(", "),
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontSize: "0.625rem", // 10px
  },

  // Tagline typography
  tagline: {
    fontFamily: ["Geist Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"].join(", "),
    fontWeight: 400,
    letterSpacing: "-0.01em",
  },
} as const;
