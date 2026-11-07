import type { FC, SVGProps } from "react";
import { cn } from "@nxtqr/utils";
import { LOGO_GEOMETRY, type LogoColorMode } from "../tokens/branding-tokens";

export interface AnimatedLogoProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number | string;
  variant?: "symbol" | "minimal";
  colorMode?: LogoColorMode;
  mode?: "entrance" | "loading" | "interactive";
  showFraming?: boolean;
  className?: string;
  title?: string;
  "aria-label"?: string;
}

/**
 * AnimatedLogo component with pure CSS/SVG keyframe choreography.
 * Supports entrance animation, loading state, hover micro-interactions,
 * and strictly honors prefers-reduced-motion.
 */
export const AnimatedLogo: FC<AnimatedLogoProps> = ({
  size = 48,
  variant = "symbol",
  colorMode = "current",
  mode = "entrance",
  showFraming: customShowFraming,
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

  let fgClass = "fill-foreground";
  let bracketClass = "stroke-muted-foreground";
  let traceClass = "stroke-accent fill-accent";

  if (colorMode === "monochrome") {
    fgClass = "fill-white";
    bracketClass = "stroke-white/80";
    traceClass = "stroke-white fill-white";
  } else if (colorMode === "inverse") {
    fgClass = "fill-black";
    bracketClass = "stroke-black/70";
    traceClass = "stroke-black fill-black";
  }

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
                animation: nxtqrBracketDraw 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              .nxtqr-anim-body {
                opacity: 0;
                transform-origin: 64px 64px;
                transform: scale(0.96);
                animation: nxtqrBodyReveal 600ms cubic-bezier(0.16, 1, 0.3, 1) 250ms forwards;
              }
              .nxtqr-anim-pulse {
                stroke-dasharray: 80;
                stroke-dashoffset: 80;
                animation: nxtqrTracePulse 700ms cubic-bezier(0.16, 1, 0.3, 1) 500ms forwards;
              }
              .nxtqr-anim-node {
                opacity: 0;
                animation: nxtqrNodeFlash 400ms ease-out 750ms forwards;
              }

              /* Loading Mode (gentle loop along the execution trace) */
              .nxtqr-anim-loading-trace {
                stroke-dasharray: 20 60;
                animation: nxtqrLoadingLoop 1400ms linear infinite;
              }
              .nxtqr-anim-loading-node {
                animation: nxtqrLoadingNode 1400ms ease-in-out infinite;
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
            @keyframes nxtqrNodeFlash {
              0% { opacity: 0; transform: scale(0.6); }
              60% { opacity: 1; transform: scale(1.3); }
              100% { opacity: 1; transform: scale(1); }
            }
            @keyframes nxtqrLoadingLoop {
              0% { stroke-dashoffset: 80; }
              100% { stroke-dashoffset: -80; }
            }
            @keyframes nxtqrLoadingNode {
              0%, 100% { transform: scale(0.85); opacity: 0.6; }
              50% { transform: scale(1.25); opacity: 1; }
            }
          `}</style>
        </defs>

        {title && <title>{title}</title>}

        {/* Precision Corner Brackets */}
        {showFraming && (
          <path
            d={LOGO_GEOMETRY.cornerFraming.combinedPath}
            className={cn(bracketClass, mode === "entrance" && "nxtqr-anim-brackets")}
            strokeWidth={LOGO_GEOMETRY.cornerFraming.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Monogram Geometry */}
        <g className={mode === "entrance" ? "nxtqr-anim-body" : undefined}>
          {/* Facet Undercut */}
          <path d={LOGO_GEOMETRY.monogram.facetUnderPath} className={fgClass} opacity={0.35} />

          {/* Main Continuous N Ribbon */}
          <path d={LOGO_GEOMETRY.monogram.bodyPath} className={fgClass} />
        </g>

        {/* Directed Execution Laser Beam */}
        <line
          x1={LOGO_GEOMETRY.monogram.executionLine.x1}
          y1={LOGO_GEOMETRY.monogram.executionLine.y1}
          x2={LOGO_GEOMETRY.monogram.executionLine.x2}
          y2={LOGO_GEOMETRY.monogram.executionLine.y2}
          className={cn(
            traceClass,
            mode === "entrance" && "nxtqr-anim-pulse",
            mode === "loading" && "nxtqr-anim-loading-trace",
            "group-hover/logo:opacity-100 transition-opacity duration-200",
          )}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Execution Node */}
        <circle
          cx={LOGO_GEOMETRY.monogram.executionLine.node.cx}
          cy={LOGO_GEOMETRY.monogram.executionLine.node.cy}
          r={LOGO_GEOMETRY.monogram.executionLine.node.r}
          className={cn(
            traceClass,
            mode === "entrance" && "nxtqr-anim-node",
            mode === "loading" && "nxtqr-anim-loading-node",
            "origin-center transition-transform duration-200 group-hover/logo:scale-125",
          )}
        />
      </svg>
    </div>
  );
};

AnimatedLogo.displayName = "AnimatedLogo";
