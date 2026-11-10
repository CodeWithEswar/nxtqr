import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ReleaseManagerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Release Manager",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#34D399" : "#A3A3A3";
  const strokeAccent = isColored ? "#6EE7B7" : "#D4D4D4";
  const fillFoundation = isColored ? "#064E3B" : "#141414";
  const fillSurface = isColored ? "#065F46" : "#1F1F1F";

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
      {/* Release Highway Frame / Staging Runway */}
      <rect
        x="4"
        y="8"
        width="24"
        height="16"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Semantic Release Version Header Flag (`v2.0` badge on top) */}
      <rect
        x="10"
        y="4"
        width="12"
        height="6"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      <line x1="13" y1="7" x2="19" y2="7" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Progressive Release Milestone Gates (Alpha -> Beta -> GA) */}
      {/* Gate 1: Alpha Complete */}
      <circle cx="9" cy="16" r="2.5" fill={fillSurface} stroke={strokeColor} strokeWidth="1.2" />
      <path d="M8 16L8.8 17L10.2 15.2" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />

      {/* Connecting Milestone Rail */}
      <line x1="11.5" y1="16" x2="14" y2="16" stroke={strokeColor} strokeWidth="1.2" />

      {/* Gate 2: Staging Canary Verification */}
      <circle cx="16" cy="16" r="2.5" fill={fillSurface} stroke={strokeColor} strokeWidth="1.2" />
      <path d="M15 16L15.8 17L17.2 15.2" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />

      {/* Connecting Milestone Rail */}
      <line x1="18.5" y1="16" x2="21" y2="16" stroke={strokeColor} strokeWidth="1.2" />

      {/* Gate 3: Production Release Active Gate */}
      <circle cx="23" cy="16" r="2.5" fill={isColored ? "#34D399" : "#FFFFFF"} stroke={strokeColor} strokeWidth="1.2" />
      <circle cx="23" cy="16" r="1" fill={isColored ? "#064E3B" : "#141414"} />

      {/* Rollback Safeguard Return Curve (Bottom) */}
      <path
        d="M23 20C23 22 19 22 16 22H9"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeDasharray="2 1"
        strokeLinecap="round"
      />
      <path d="M10.5 20.5L9 22L10.5 23.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

