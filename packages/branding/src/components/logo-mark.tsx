import type { FC, SVGProps } from "react";
import { cn } from "@nxtqr/utils";
import { LOGO_GEOMETRY } from "../tokens/branding-tokens";
import type { LogoColorMode } from "../tokens/branding-tokens";
import { getSvgGradients } from "../utils/svg-paths";

export interface LogoMarkProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number | string;
  variant?: "symbol" | "minimal";
  colorMode?: LogoColorMode;
  accentColor?: string;
  hasLaser?: boolean;
  className?: string;
  title?: string;
  "aria-label"?: string;
}

/**
 * LogoMark renders the exact 3D chrome faceted N monogram + precision corner brackets.
 */
export const LogoMark: FC<LogoMarkProps> = ({
  size = 32,
  variant = "symbol",
  colorMode = "accent",
  accentColor = "var(--accent, #FF0000)",
  hasLaser = true,
  className,
  title,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHiddenProp,
  role: roleProp,
  ...props
}) => {
  const showFraming = variant === "symbol";
  const hasLabel = Boolean(ariaLabel || title);
  const isHidden = ariaHiddenProp ?? !hasLabel;
  const role = roleProp ?? (isHidden ? "presentation" : "img");
  const isInverse = colorMode === "inverse";
  const m = LOGO_GEOMETRY.monogram;

  let bracketStroke = isInverse ? "#0A0A0A" : "#FFFFFF";
  let bracketOpacity = isInverse ? 1 : 0.95;

  if (colorMode === "monochrome") {
    bracketStroke = "#FFFFFF";
    bracketOpacity = 0.9;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={LOGO_GEOMETRY.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={role}
      aria-label={ariaLabel || title}
      aria-hidden={isHidden}
      className={cn("shrink-0 select-none", className)}
      {...props}
    >
      {title && <title>{title}</title>}
      <defs
        dangerouslySetInnerHTML={{
          __html: getSvgGradients(accentColor, isInverse),
        }}
      />

      {/* Precision Corner Framing */}
      {showFraming && (
        <path
          d={LOGO_GEOMETRY.cornerFraming.combinedPath}
          stroke={bracketStroke}
          strokeWidth={LOGO_GEOMETRY.cornerFraming.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={bracketOpacity}
        />
      )}

      {/* Exact 3D Liquid Chrome Monogram */}
      <g className="nxtqr-exact-monogram">
        {/* Left Pillar */}
        <path d={m.leftPillarPath} fill="url(#nxtqrChromeLeft)" />
        {/* Inner Shadow Facet */}
        <path d={m.innerShadowPath} fill="url(#nxtqrInnerShadow)" />
        {/* Main Sweeping Diagonal Ribbon */}
        <path d={m.mainRibbonPath} fill="url(#nxtqrChromeDiag)" />
        {/* Right Vertical Pillar Surface */}
        <path d={m.rightPillarPath} fill="url(#nxtqrChromeRight)" />
        {/* Specular Highlights */}
        <path d={m.highlightTopPath} fill="#FFFFFF" opacity={0.8} />
        <path d={m.highlightBottomPath} fill="#FFFFFF" opacity={0.45} />

        {hasLaser && (
          <>
            {/* Signature Horizontal Laser Flare */}
            <line
              x1={m.laserBeam.x1 - 2}
              y1={m.laserBeam.y1}
              x2={m.laserBeam.x2 + 2}
              y2={m.laserBeam.y2}
              stroke={accentColor}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={0.35}
            />
            <line
              x1={m.laserBeam.x1}
              y1={m.laserBeam.y1}
              x2={m.laserBeam.x2}
              y2={m.laserBeam.y2}
              stroke="url(#nxtqrLaserStreak)"
              strokeWidth={m.laserBeam.strokeWidth}
              strokeLinecap="round"
            />
            <circle
              cx={m.laserBeam.hotspot.cx}
              cy={m.laserBeam.hotspot.cy}
              r={m.laserBeam.flareRadius}
              fill="url(#nxtqrFlareCore)"
            />
            <ellipse
              cx={m.laserBeam.hotspot.cx}
              cy={m.laserBeam.hotspot.cy}
              rx={m.laserBeam.hotspot.rx}
              ry={m.laserBeam.hotspot.ry}
              fill="#FFFFFF"
              opacity={1}
            />
          </>
        )}
      </g>
    </svg>
  );
};

LogoMark.displayName = "LogoMark";
