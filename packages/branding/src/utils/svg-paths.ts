import {
  BRAND_CONSTANTS,
  ICON_TILE,
  LOGO_GEOMETRY,
  type LogoColorMode,
} from "../tokens/branding-tokens";
import { WORDMARK_TYPOGRAPHY } from "../tokens/typography-fallback";

export interface SvgOptions {
  width?: number;
  height?: number;
  colorMode?: LogoColorMode;
  showFraming?: boolean;
  background?: string | null;
  includeWordmark?: boolean;
}

export function getLogoMarkup(fill = "#FFFFFF", showFraming = true): string {
  const { aperturePath, cornerFraming } = LOGO_GEOMETRY;
  const frame = showFraming
    ? `<path d="${cornerFraming.combinedPath}" fill="none" stroke="${cornerFraming.color}" stroke-width="${cornerFraming.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
    : "";

  return `${frame}<path d="${aperturePath}" fill="${fill}" fill-rule="evenodd"/>`;
}

export function generateSvgMarkup({
  includeWordmark = false,
  width = includeWordmark ? 380 : 128,
  height = includeWordmark ? 96 : 128,
  colorMode = "monochrome",
  showFraming = true,
  background = null,
}: SvgOptions = {}): string {
  const fill =
    colorMode === "current" ? "currentColor" : colorMode === "inverse" ? "#000000" : "#FFFFFF";
  const viewBox = includeWordmark
    ? "0 0 380 96"
    : showFraming
      ? LOGO_GEOMETRY.viewBox
      : LOGO_GEOMETRY.compactViewBox;
  const bg = background ? `<rect width="100%" height="100%" fill="${background}"/>` : "";
  const mark = getLogoMarkup(fill, showFraming);
  const { fallbackStack, fontWeight, letterSpacing, subtitle } = WORDMARK_TYPOGRAPHY;
  const artwork = includeWordmark
    ? `<g transform="scale(0.75)">${mark}</g>
  <text x="104" y="53" font-family="${fallbackStack}" font-size="40" font-weight="${fontWeight}" letter-spacing="${letterSpacing}" fill="${fill}">${BRAND_CONSTANTS.name}</text>
  <text x="106" y="72" font-family="${subtitle.fontFamily}" font-size="9" font-weight="500" letter-spacing="${subtitle.letterSpacing}" fill="${colorMode === "inverse" ? "#555555" : "#A3A3A3"}">${BRAND_CONSTANTS.category.toUpperCase()}</text>`
    : mark;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">
  ${bg}${artwork}
</svg>\n`;
}

export function generateAppIconTileSvg({
  size = 256,
  type = "black",
  opaque = false,
}: {
  size?: number;
  type?: "hero" | "black" | "white";
  opaque?: boolean;
} = {}): string {
  const inverse = type === "white";
  const framed = type === "hero";
  const viewBox = framed ? LOGO_GEOMETRY.viewBox : LOGO_GEOMETRY.compactViewBox;
  const { x, y, size: tileSize, radius } = ICON_TILE;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">
  <rect x="${x}" y="${y}" width="${tileSize}" height="${tileSize}" rx="${opaque ? 0 : radius}" fill="${inverse ? "#FFFFFF" : "#000000"}"/>
  ${getLogoMarkup(inverse ? "#000000" : "#FFFFFF", framed)}
</svg>\n`;
}
