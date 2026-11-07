import { LOGO_GEOMETRY, BRAND_CONSTANTS } from "../tokens/branding-tokens";
import { WORDMARK_TYPOGRAPHY } from "../tokens/typography-fallback";

export interface SvgOptions {
  width?: number;
  height?: number;
  colorMode?: "current" | "monochrome" | "inverse" | "accent";
  showFraming?: boolean;
  accentColor?: string;
  hasLaser?: boolean;
  background?: string | null;
  includeWordmark?: boolean;
  wordmarkColor?: string;
  className?: string;
}

/**
 * Returns self-contained SVG defs containing liquid chrome gradients and optical flare shaders.
 */
export function getSvgGradients(accentColor = "#FF0000", isInverse = false): string {
  if (isInverse) {
    return `
      <linearGradient id="nxtqrChromeLeft" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#3A3A3A" />
        <stop offset="60%" stop-color="#1A1A1A" />
        <stop offset="100%" stop-color="#4A4A4A" />
      </linearGradient>
      <linearGradient id="nxtqrInnerShadow" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#666666" />
        <stop offset="100%" stop-color="#222222" />
      </linearGradient>
      <linearGradient id="nxtqrChromeDiag" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E1E1E" />
        <stop offset="45%" stop-color="#383838" />
        <stop offset="70%" stop-color="#141414" />
        <stop offset="100%" stop-color="#2B2B2B" />
      </linearGradient>
      <linearGradient id="nxtqrChromeRight" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#2A2A2A" />
        <stop offset="60%" stop-color="#111111" />
        <stop offset="100%" stop-color="#333333" />
      </linearGradient>
      <linearGradient id="nxtqrLaserStreak" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0" />
        <stop offset="25%" stop-color="${accentColor}" stop-opacity="0.85" />
        <stop offset="48%" stop-color="#FFFFFF" stop-opacity="1" />
        <stop offset="52%" stop-color="#FFFFFF" stop-opacity="1" />
        <stop offset="75%" stop-color="${accentColor}" stop-opacity="0.85" />
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
      </linearGradient>
      <radialGradient id="nxtqrFlareCore" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
        <stop offset="20%" stop-color="${accentColor}" stop-opacity="0.95" />
        <stop offset="55%" stop-color="${accentColor}" stop-opacity="0.3" />
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
      </radialGradient>
    `;
  }

  return `
    <linearGradient id="nxtqrChromeLeft" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#909090" />
      <stop offset="25%" stop-color="#D0D0D0" />
      <stop offset="60%" stop-color="#FFFFFF" />
      <stop offset="90%" stop-color="#E0E0E0" />
      <stop offset="100%" stop-color="#A5A5A5" />
    </linearGradient>

    <linearGradient id="nxtqrInnerShadow" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#555555" />
      <stop offset="50%" stop-color="#282828" />
      <stop offset="100%" stop-color="#606060" />
    </linearGradient>

    <linearGradient id="nxtqrChromeDiag" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="18%" stop-color="#EDEDED" />
      <stop offset="45%" stop-color="#C2C2C2" />
      <stop offset="70%" stop-color="#EAEAEA" />
      <stop offset="88%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#B8B8B8" />
    </linearGradient>

    <linearGradient id="nxtqrChromeRight" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#8A8A8A" />
      <stop offset="35%" stop-color="#E2E2E2" />
      <stop offset="70%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#B0B0B0" />
    </linearGradient>

    <linearGradient id="nxtqrLaserStreak" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0" />
      <stop offset="20%" stop-color="${accentColor}" stop-opacity="0.85" />
      <stop offset="42%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="58%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="80%" stop-color="${accentColor}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
    </linearGradient>

    <radialGradient id="nxtqrFlareCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="20%" stop-color="${accentColor}" stop-opacity="0.95" />
      <stop offset="55%" stop-color="${accentColor}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
    </radialGradient>
  `;
}

/**
 * Returns the exact monogram vector elements.
 */
export function getMonogramMarkup(accentColor = "#FF0000", hasLaser = true): string {
  const m = LOGO_GEOMETRY.monogram;

  return `
    <g class="nxtqr-exact-monogram">
      <path d="${m.leftPillarPath}" fill="url(#nxtqrChromeLeft)" />
      <path d="${m.innerShadowPath}" fill="url(#nxtqrInnerShadow)" />
      <path d="${m.mainRibbonPath}" fill="url(#nxtqrChromeDiag)" />
      <path d="${m.rightPillarPath}" fill="url(#nxtqrChromeRight)" />
      <path d="${m.highlightTopPath}" fill="#FFFFFF" opacity="0.8" />
      <path d="${m.highlightBottomPath}" fill="#FFFFFF" opacity="0.45" />
      ${
        hasLaser
          ? `
        <line x1="${m.laserBeam.x1 - 2}" y1="${m.laserBeam.y1}" x2="${m.laserBeam.x2 + 2}" y2="${m.laserBeam.y2}" stroke="${accentColor}" stroke-width="7" stroke-linecap="round" opacity="0.35" />
        <line x1="${m.laserBeam.x1}" y1="${m.laserBeam.y1}" x2="${m.laserBeam.x2}" y2="${m.laserBeam.y2}" stroke="url(#nxtqrLaserStreak)" stroke-width="${m.laserBeam.strokeWidth}" stroke-linecap="round" />
        <circle cx="${m.laserBeam.hotspot.cx}" cy="${m.laserBeam.hotspot.cy}" r="${m.laserBeam.flareRadius}" fill="url(#nxtqrFlareCore)" />
        <ellipse cx="${m.laserBeam.hotspot.cx}" cy="${m.laserBeam.hotspot.cy}" rx="${m.laserBeam.hotspot.rx}" ry="${m.laserBeam.hotspot.ry}" fill="#FFFFFF" opacity="1" />
      `
          : ""
      }
    </g>
  `;
}

/**
 * Deterministically constructs clean SVG markup for server-side rasterization (Sharp)
 * or static SVG export.
 */
export function generateSvgMarkup(options: SvgOptions = {}): string {
  const {
    width = 128,
    height = 128,
    colorMode = "accent",
    showFraming = true,
    accentColor = "#FF0000",
    hasLaser = true,
    background = null,
    includeWordmark = false,
  } = options;

  const isInverse = colorMode === "inverse";
  const bracketColor = isInverse ? "#0A0A0A" : "#FFFFFF";
  let bgRect = "";

  if (background !== null) {
    bgRect = `<rect width="${width}" height="${height}" fill="${background}"/>`;
  }

  const framingMarkup = showFraming
    ? `<path d="${LOGO_GEOMETRY.cornerFraming.combinedPath}" stroke="${bracketColor}" stroke-width="${LOGO_GEOMETRY.cornerFraming.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${isInverse ? 1 : 0.95}" />`
    : "";

  if (includeWordmark) {
    const fgText = isInverse ? "#000000" : "#FFFFFF";
    const subText = isInverse ? "#555555" : "#A3A3A3";

    return `<svg width="${width}" height="${height}" viewBox="0 0 380 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${getSvgGradients(accentColor, isInverse)}
      </defs>
      ${bgRect}
      <g transform="translate(4, -16)">
        ${framingMarkup}
        ${getMonogramMarkup(accentColor, hasLaser)}
      </g>
      <text x="144" y="56" font-family="${WORDMARK_TYPOGRAPHY.fallbackStack}" font-size="44" font-weight="${WORDMARK_TYPOGRAPHY.fontWeight}" letter-spacing="${WORDMARK_TYPOGRAPHY.letterSpacing}" fill="${fgText}">
        ${BRAND_CONSTANTS.name}
      </text>
      <text x="146" y="78" font-family="${WORDMARK_TYPOGRAPHY.subtitle.fontFamily}" font-size="9" font-weight="500" letter-spacing="${WORDMARK_TYPOGRAPHY.subtitle.letterSpacing}" fill="${subText}">
        ${BRAND_CONSTANTS.category.toUpperCase()}
      </text>
    </svg>`;
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${getSvgGradients(accentColor, isInverse)}
    </defs>
    ${bgRect}
    ${framingMarkup}
    ${getMonogramMarkup(accentColor, hasLaser)}
  </svg>`;
}

/**
 * Constructs the signature Squircle App Icon Tile (matching the reference image).
 */
export function generateAppIconTileSvg(
  options: {
    size?: number;
    type?: "hero" | "black" | "white" | "red";
    accentColor?: string;
  } = {},
): string {
  const { size = 256, type = "hero", accentColor = "#FF0000" } = options;

  if (type === "hero") {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${getSvgGradients(accentColor, false)}
          <radialGradient id="squircleBody" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#161616" />
            <stop offset="55%" stop-color="#0A0A0A" />
            <stop offset="100%" stop-color="#010101" />
          </radialGradient>
          <linearGradient id="heroTileLaser" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0" />
            <stop offset="25%" stop-color="${accentColor}" stop-opacity="0.85" />
            <stop offset="47%" stop-color="#FFFFFF" stop-opacity="1" />
            <stop offset="53%" stop-color="#FFFFFF" stop-opacity="1" />
            <stop offset="75%" stop-color="${accentColor}" stop-opacity="0.85" />
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
          </linearGradient>
          <radialGradient id="heroTileFlare" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
            <stop offset="20%" stop-color="${accentColor}" stop-opacity="0.95" />
            <stop offset="55%" stop-color="${accentColor}" stop-opacity="0.3" />
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- Ambient Rings -->
        <rect width="256" height="256" fill="#000000" />
        <circle cx="128" cy="128" r="122" stroke="#161616" stroke-width="1.2" fill="none" opacity="0.6" />
        <circle cx="128" cy="128" r="106" stroke="#222222" stroke-width="1.2" fill="none" opacity="0.6" />

        <!-- Illuminated Glass Rim Light -->
        <rect x="24" y="24" width="208" height="208" rx="46" fill="none" stroke="#FFFFFF" stroke-width="2.5" opacity="0.22" />
        <rect x="26" y="26" width="204" height="204" rx="44" fill="url(#squircleBody)" stroke="#282828" stroke-width="1.5" />
        <rect x="28" y="28" width="200" height="200" rx="42" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.08" />

        <g transform="translate(42.5, 42.5) scale(1.336)">
          <path d="${LOGO_GEOMETRY.cornerFraming.combinedPath}" stroke="#FFFFFF" stroke-width="${LOGO_GEOMETRY.cornerFraming.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.95" />
          ${getMonogramMarkup(accentColor, false)}
        </g>

        <!-- Signature Full Laser Across Entire Icon -->
        <line x1="28" y1="128" x2="228" y2="128" stroke="${accentColor}" stroke-width="10" stroke-linecap="round" opacity="0.28" />
        <line x1="32" y1="128" x2="224" y2="128" stroke="url(#heroTileLaser)" stroke-width="3" stroke-linecap="round" />
        <circle cx="128" cy="128" r="30" fill="url(#heroTileFlare)" />
        <ellipse cx="128" cy="128" rx="14" ry="3.5" fill="#FFFFFF" opacity="1" />
      </svg>
    `;
  }

  let bg = "#0A0A0A";
  let border = "#262626";
  let bracketsColor = "#FFFFFF";
  const isInverse = type === "white";

  if (type === "white") {
    bg = "#FFFFFF";
    border = "#E5E5E5";
    bracketsColor = "#0A0A0A";
  } else if (type === "red") {
    bg = accentColor;
    border = "#CC0000";
    bracketsColor = "#FFFFFF";
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${getSvgGradients(accentColor, isInverse)}
      </defs>
      <rect x="16" y="16" width="224" height="224" rx="48" fill="${bg}" stroke="${border}" stroke-width="2" />
      <g transform="translate(32, 32) scale(1.5)">
        <path d="${LOGO_GEOMETRY.cornerFraming.combinedPath}" stroke="${bracketsColor}" stroke-width="${LOGO_GEOMETRY.cornerFraming.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        ${getMonogramMarkup(accentColor, true)}
      </g>
    </svg>
  `;
}
