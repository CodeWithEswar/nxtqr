import type { FC, SVGProps } from "react";
import { cn } from "@nxtqr/utils";
import { LOGO_GEOMETRY } from "../tokens/branding-tokens";
import type { LogoColorMode } from "../tokens/branding-tokens";

export interface LogoMarkProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number | string;
  variant?: "symbol" | "minimal";
  colorMode?: LogoColorMode;
  className?: string;
  title?: string;
  "aria-label"?: string;
}

/**
 * Lightweight, zero-runtime-dependency LogoMark component.
 * Ideal for dense UI surfaces, headers, collapsed navigation, and tables.
 */
export const LogoMark: FC<LogoMarkProps> = ({
  size = 32,
  variant = "symbol",
  colorMode = "current",
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

  // Determine styling based on colorMode
  let fgClass = "fill-foreground";
  let bracketClass = "stroke-muted-foreground";
  let facetOpacity = 0.35;
  let traceClass = "stroke-accent fill-accent";

  if (colorMode === "monochrome") {
    fgClass = "fill-white";
    bracketClass = "stroke-white/80";
    facetOpacity = 0.35;
    traceClass = "stroke-white fill-white";
  } else if (colorMode === "inverse") {
    fgClass = "fill-black";
    bracketClass = "stroke-black/70";
    facetOpacity = 0.2;
    traceClass = "stroke-black fill-black";
  } else if (colorMode === "accent") {
    fgClass = "fill-foreground";
    bracketClass = "stroke-muted-foreground";
    facetOpacity = 0.35;
    traceClass = "stroke-accent fill-accent";
  } else {
    // Current
    fgClass = "fill-current";
    bracketClass = "stroke-current opacity-80";
    facetOpacity = 0.3;
    traceClass = "stroke-accent fill-accent";
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

      {/* Precision Corner Framing */}
      {showFraming && (
        <path
          d={LOGO_GEOMETRY.cornerFraming.combinedPath}
          className={bracketClass}
          strokeWidth={LOGO_GEOMETRY.cornerFraming.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Facet Undercut */}
      <path d={LOGO_GEOMETRY.monogram.facetUnderPath} className={fgClass} opacity={facetOpacity} />

      {/* Main Continuous N Ribbon */}
      <path d={LOGO_GEOMETRY.monogram.bodyPath} className={fgClass} />

      {/* Directed Execution Laser Beam */}
      <line
        x1={LOGO_GEOMETRY.monogram.executionLine.x1}
        y1={LOGO_GEOMETRY.monogram.executionLine.y1}
        x2={LOGO_GEOMETRY.monogram.executionLine.x2}
        y2={LOGO_GEOMETRY.monogram.executionLine.y2}
        className={traceClass}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle
        cx={LOGO_GEOMETRY.monogram.executionLine.node.cx}
        cy={LOGO_GEOMETRY.monogram.executionLine.node.cy}
        r={LOGO_GEOMETRY.monogram.executionLine.node.r}
        className={traceClass}
      />
    </svg>
  );
};

LogoMark.displayName = "LogoMark";
