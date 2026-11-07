import type { FC, SVGProps } from "react";
import { cn } from "@nxtqr/utils";
import { LOGO_GEOMETRY, type LogoColorMode } from "../tokens/branding-tokens";
import { getSvgGradients } from "../utils/svg-paths";

export interface AnimatedLogoProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number | string;
  variant?: "symbol" | "minimal";
  colorMode?: LogoColorMode;
  mode?: "entrance" | "loading" | "interactive";
  showFraming?: boolean;
  accentColor?: string;
  className?: string;
  title?: string;
  "aria-label"?: string;
}

/**
 * AnimatedLogo component with pure CSS/SVG keyframe choreography.
 * Animates the exact liquid chrome N monogram and horizontal laser flare.
 */
export const AnimatedLogo: FC<AnimatedLogoProps> = ({
  size = 48,
  variant = "symbol",
  colorMode = "accent",
  mode = "entrance",
  showFraming: customShowFraming,
  accentColor = "var(--accent, #FF0000)",
  className,
  title,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHiddenProp,
  role: roleProp,
  ...props
}) => {
  const showFraming = customShowFraming ?? variant === "symbol";
  const hasLabel = Boolean(ariaLabel || title);
  const isHidden = ariaHiddenProp ?? !hasLabel;
  const role = roleProp ?? (isHidden ? "presentation" : "img");
  const isInverse = colorMode === "inverse";
  const m = LOGO_GEOMETRY.monogram;

  const bracketStroke = isInverse ? "#0A0A0A" : "#FFFFFF";

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width={size}
        height={size}
        viewBox={LOGO_GEOMETRY.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role={role}
        aria-label={ariaLabel || title}
        aria-hidden={isHidden}
        className={cn(
          "shrink-0 select-none group/logo transition-transform duration-200",
          className,
        )}
        {...props}
      >
        <defs>
          <style>{`
            @media (prefers-reduced-motion: no-preference) {
              /* Entrance animation choreography (~950ms total) */
              .nxtqr-anim-brackets {
                stroke-dasharray: 80;
                stroke-dashoffset: 80;
                animation: nxtqrBracketDraw 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              .nxtqr-anim-body {
                opacity: 0;
                transform-origin: 64px 64px;
                transform: scale(0.96);
                animation: nxtqrBodyReveal 550ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards;
              }
              .nxtqr-anim-pulse {
                stroke-dasharray: 100;
                stroke-dashoffset: 100;
                animation: nxtqrTracePulse 600ms cubic-bezier(0.16, 1, 0.3, 1) 400ms forwards;
              }
              .nxtqr-anim-flare {
                opacity: 0;
                transform-origin: 64px 64px;
                animation: nxtqrFlareBurst 500ms ease-out 650ms forwards;
              }

              /* Loading Mode (Gentle cyclic pulse along laser core) */
              .nxtqr-anim-loading-laser {
                animation: nxtqrLoadingLaser 1400ms ease-in-out infinite;
              }
              .nxtqr-anim-loading-flare {
                transform-origin: 64px 64px;
                animation: nxtqrLoadingFlare 1400ms ease-in-out infinite;
              }
            }

            @keyframes nxtqrBracketDraw {
              to { stroke-dashoffset: 0; }
            }
            @keyframes nxtqrBodyReveal {
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes nxtqrTracePulse {
              to { stroke-dashoffset: 0; }
            }
            @keyframes nxtqrFlareBurst {
              0% { opacity: 0; transform: scale(0.5); }
              60% { opacity: 1; transform: scale(1.3); }
              100% { opacity: 1; transform: scale(1); }
            }
            @keyframes nxtqrLoadingLaser {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            @keyframes nxtqrLoadingFlare {
              0%, 100% { transform: scale(0.85); opacity: 0.5; }
              50% { transform: scale(1.25); opacity: 1; }
            }
          `}</style>
          <g
            dangerouslySetInnerHTML={{
              __html: getSvgGradients(accentColor, isInverse),
            }}
          />
        </defs>

        {title && <title>{title}</title>}

        {/* Precision Corner Brackets */}
        {showFraming && (
          <path
            d={LOGO_GEOMETRY.cornerFraming.combinedPath}
            stroke={bracketStroke}
            strokeWidth={LOGO_GEOMETRY.cornerFraming.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(mode === "entrance" && "nxtqr-anim-brackets")}
            opacity={0.95}
          />
        )}

        {/* Exact Chrome Monogram Geometry */}
        <g className={cn(mode === "entrance" && "nxtqr-anim-body")}>
          <path d={m.leftPillarPath} fill="url(#nxtqrChromeLeft)" />
          <path d={m.innerShadowPath} fill="url(#nxtqrInnerShadow)" />
          <path d={m.mainRibbonPath} fill="url(#nxtqrChromeDiag)" />
          <path d={m.rightPillarPath} fill="url(#nxtqrChromeRight)" />
          <path d={m.highlightTopPath} fill="#FFFFFF" opacity={0.8} />
          <path d={m.highlightBottomPath} fill="#FFFFFF" opacity={0.45} />
        </g>

        {/* Laser Beam & Lens Flare */}
        <g className={cn(mode === "loading" && "nxtqr-anim-loading-laser")}>
          <line
            x1={m.laserBeam.x1 - 2}
            y1={m.laserBeam.y1}
            x2={m.laserBeam.x2 + 2}
            y2={m.laserBeam.y2}
            stroke={accentColor}
            strokeWidth={7}
            strokeLinecap="round"
            opacity={0.35}
            className={cn(mode === "entrance" && "nxtqr-anim-pulse")}
          />
          <line
            x1={m.laserBeam.x1}
            y1={m.laserBeam.y1}
            x2={m.laserBeam.x2}
            y2={m.laserBeam.y2}
            stroke="url(#nxtqrLaserStreak)"
            strokeWidth={m.laserBeam.strokeWidth}
            strokeLinecap="round"
            className={cn(mode === "entrance" && "nxtqr-anim-pulse")}
          />
        </g>

        {/* Flare Core */}
        <g
          className={cn(
            mode === "entrance" && "nxtqr-anim-flare",
            mode === "loading" && "nxtqr-anim-loading-flare",
            "group-hover/logo:scale-125 transition-transform duration-200",
          )}
        >
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
        </g>
      </svg>
    </div>
  );
};

AnimatedLogo.displayName = "AnimatedLogo";
