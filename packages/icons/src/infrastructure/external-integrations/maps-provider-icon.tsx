import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MapsProviderIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Maps Provider",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#2DD4BF" : "#A3A3A3";
  const strokeAccent = isColored ? "#99F6E4" : "#D4D4D4";
  const fillFoundation = isColored ? "#042F2E" : "#141414";
  const fillSurface = isColored ? "#134E4A" : "#1F1F1F";

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
      {/* Outer Geographic Service Boundary */}
      <rect
        x="3"
        y="4"
        width="26"
        height="24"
        rx="4"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2.5 1.5"
      />

      {/* Tri-fold Map Grid Polygon */}
      <path
        d="M6 10L12 8L19 11L25 8V21L19 23L12 20L6 23V10Z"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <line x1="12" y1="8" x2="12" y2="20" stroke={strokeColor} strokeWidth="1" strokeDasharray="1.5 1.5" />
      <line x1="19" y1="11" x2="19" y2="23" stroke={strokeColor} strokeWidth="1" strokeDasharray="1.5 1.5" />

      {/* Precision Location Pin Marker */}
      <path
        d="M15.5 10C14.1 10 13 11.1 13 12.5C13 14.5 15.5 17.5 15.5 17.5C15.5 17.5 18 14.5 18 12.5C18 11.1 16.9 10 15.5 10Z"
        fill={fillFoundation}
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="15.5" cy="12.5" r="1" fill={strokeAccent} />
    </svg>
  );
};

MapsProviderIcon.displayName = "MapsProviderIcon";
