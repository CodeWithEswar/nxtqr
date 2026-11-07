import { LOGO_GEOMETRY, BRAND_CONSTANTS } from "../tokens/branding-tokens";
import { WORDMARK_TYPOGRAPHY } from "../tokens/typography-fallback";

export interface SvgOptions {
  width?: number;
  height?: number;
  colorMode?: "current" | "monochrome" | "inverse" | "accent";
  showFraming?: boolean;
  accentColor?: string;
  background?: string | null;
  includeWordmark?: boolean;
  wordmarkColor?: string;
  className?: string;
}

/**
 * Deterministically constructs clean SVG markup for server-side rasterization (Sharp)
 * or static SVG export.
 */
export function generateSvgMarkup(options: SvgOptions = {}): string {
  const {
    width = 128,
    height = 128,
    colorMode = "monochrome",
    showFraming = true,
    accentColor = "#FF0000",
    background = null,
    includeWordmark = false,
  } = options;

  let fgColor = "#FFFFFF";
  let bracketColor = "#A3A3A3";
  let facetOpacity = "0.35";
  let traceColor = accentColor;
  let bgRect = "";

  if (colorMode === "inverse") {
    fgColor = "#000000";
    bracketColor = "#525252";
    facetOpacity = "0.15";
    traceColor = accentColor === "#FF0000" ? "#FF0000" : accentColor;
    if (background !== null) {
      bgRect = `<rect width="${width}" height="${height}" fill="${background || "#FFFFFF"}"/>`;
    }
  } else if (colorMode === "accent") {
    fgColor = "#FFFFFF";
    bracketColor = "#A3A3A3";
    facetOpacity = "0.35";
    traceColor = accentColor;
    if (background !== null) {
      bgRect = `<rect width="${width}" height="${height}" fill="${background || "#000000"}"/>`;
    }
  } else if (colorMode === "monochrome") {
    fgColor = "#FFFFFF";
    bracketColor = "#A3A3A3";
    facetOpacity = "0.35";
    traceColor = "#FFFFFF";
    if (background !== null) {
      bgRect = `<rect width="${width}" height="${height}" fill="${background || "#000000"}"/>`;
    }
  } else {
    // Current
    fgColor = "currentColor";
    bracketColor = "currentColor";
    traceColor = "currentColor";
  }

  const framingMarkup = showFraming
    ? `<path d="${LOGO_GEOMETRY.cornerFraming.combinedPath}" stroke="${bracketColor}" stroke-width="${LOGO_GEOMETRY.cornerFraming.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9" />`
    : "";

  if (includeWordmark) {
    // Horizontal Lockup ViewBox: 0 0 380 96
    return `<svg width="${width}" height="${height}" viewBox="0 0 380 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${bgRect}
      <g transform="translate(4, -16)">
        ${framingMarkup}
        <path d="${LOGO_GEOMETRY.monogram.facetUnderPath}" fill="${fgColor}" opacity="${facetOpacity}" />
        <path d="${LOGO_GEOMETRY.monogram.bodyPath}" fill="${fgColor}" />
        <line x1="${LOGO_GEOMETRY.monogram.executionLine.x1}" y1="${LOGO_GEOMETRY.monogram.executionLine.y1}" x2="${LOGO_GEOMETRY.monogram.executionLine.x2}" y2="${LOGO_GEOMETRY.monogram.executionLine.y2}" stroke="${traceColor}" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="${LOGO_GEOMETRY.monogram.executionLine.node.cx}" cy="${LOGO_GEOMETRY.monogram.executionLine.node.cy}" r="${LOGO_GEOMETRY.monogram.executionLine.node.r}" fill="${traceColor}" />
      </g>
      <text x="144" y="56" font-family="${WORDMARK_TYPOGRAPHY.fallbackStack}" font-size="44" font-weight="${WORDMARK_TYPOGRAPHY.fontWeight}" letter-spacing="${WORDMARK_TYPOGRAPHY.letterSpacing}" fill="${fgColor}">
        ${BRAND_CONSTANTS.name}
      </text>
      <text x="146" y="78" font-family="${WORDMARK_TYPOGRAPHY.subtitle.fontFamily}" font-size="9" font-weight="500" letter-spacing="${WORDMARK_TYPOGRAPHY.subtitle.letterSpacing}" fill="${bracketColor}">
        ${BRAND_CONSTANTS.category.toUpperCase()}
      </text>
    </svg>`;
  }

  // Symbol ViewBox: 0 0 128 128
  return `<svg width="${width}" height="${height}" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${bgRect}
    ${framingMarkup}
    <path d="${LOGO_GEOMETRY.monogram.facetUnderPath}" fill="${fgColor}" opacity="${facetOpacity}" />
    <path d="${LOGO_GEOMETRY.monogram.bodyPath}" fill="${fgColor}" />
    <line x1="${LOGO_GEOMETRY.monogram.executionLine.x1}" y1="${LOGO_GEOMETRY.monogram.executionLine.y1}" x2="${LOGO_GEOMETRY.monogram.executionLine.x2}" y2="${LOGO_GEOMETRY.monogram.executionLine.y2}" stroke="${traceColor}" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="${LOGO_GEOMETRY.monogram.executionLine.node.cx}" cy="${LOGO_GEOMETRY.monogram.executionLine.node.cy}" r="${LOGO_GEOMETRY.monogram.executionLine.node.r}" fill="${traceColor}" />
  </svg>`;
}

