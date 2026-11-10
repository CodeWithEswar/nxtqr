import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ArtifactRegistryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Artifact Registry",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#A78BFA" : "#A3A3A3";
  const strokeAccent = isColored ? "#DDD6FE" : "#D4D4D4";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillSurface = isColored ? "#4C1D95" : "#1F1F1F";

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
      {/* Archive Package Container (Isometric Parcel) */}
      {/* Top Lid */}
      <polygon
        points="16,4 27,9.5 16,15 5,9.5"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Package Sealing Tape */}
      <line x1="16" y1="4" x2="16" y2="15" stroke={strokeAccent} strokeWidth="1" />

      {/* Left Wall */}
      <polygon
        points="5,9.5 16,15 16,27 5,21.5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Right Wall */}
      <polygon
        points="16,15 27,9.5 27,21.5 16,27"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Semantic Versioning Tag Badge (Floating Front Plate) */}
      <rect
        x="9"
        y="18"
        width="14"
        height="8"
        rx="1.5"
        fill={fillFoundation}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      {/* Version Hash Symbol Lines (v1.2.0 metadata) */}
      <line x1="12" y1="21" x2="16" y2="21" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <circle cx="19" cy="21" r="1" fill={isColored ? "#A78BFA" : "#D4D4D4"} />
      <line x1="12" y1="23.5" x2="20" y2="23.5" stroke={strokeColor} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
};

