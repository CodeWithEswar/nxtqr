import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ExternalRestApiIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "External REST API",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#38BDF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#BAE6FD" : "#D4D4D4";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const fillSurface = isColored ? "#0C4A6E" : "#1F1F1F";
  const arrowColor = isColored ? "#38BDF8" : "#E5E5E5";

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? "presentation" : "img"}
      {...props}
    >
      {!decorative && title && <title>{title}</title>}
      {/* Outer External Perimeter Frame (Dashed indicating third-party boundary) */}
      <rect
        x="3"
        y="4"
        width="26"
        height="24"
        rx="4"
        fill={fillFoundation}
        stroke={strokeBoundary}
        strokeWidth="1.2"
        strokeDasharray="2.5 1.5"
      />

      {/* Internal REST Service Container */}
      <rect
        x="7"
        y="8"
        width="18"
        height="16"
        rx="2.5"
        fill={fillSurface}
        stroke={strokeBoundary}
        strokeWidth="1.1"
      />

      {/* HTTP Request Arrow (Right-bound) */}
      <path
        d="M10 13H18M18 13L15.5 11M18 13L15.5 15"
        stroke={arrowColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* HTTP Response Arrow (Left-bound) */}
      <path
        d="M22 19H14M14 19L16.5 17M14 19L16.5 21"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Resource Endpoint Indicator Dots */}
      <circle cx="10" cy="19" r="1" fill={arrowColor} />
      <circle cx="22" cy="13" r="1" fill={strokeAccent} />
    </svg>
  );
};

ExternalRestApiIcon.displayName = "ExternalRestApiIcon";

