import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CloudRegionIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Cloud Region",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#38BDF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#BAE6FD" : "#D4D4D4";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const fillSurface = isColored ? "#0C4A6E" : "#1F1F1F";

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
      {/* Outer Geographic Boundary Ring */}
      <circle
        cx="16"
        cy="16"
        r="11"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeDasharray="2.5 1.5"
      />

      {/* Central Cloud Infrastructure Core */}
      <path
        d="M11 18.5C9.6 18.5 8.5 17.4 8.5 16C8.5 14.8 9.4 13.8 10.6 13.6C11 11.6 12.8 10 15 10C17.3 10 19.2 11.7 19.5 14C20.8 14.2 21.8 15.3 21.8 16.7C21.8 18.2 20.6 19.5 19.1 19.5H11.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Multi-AZ Satellite Nodes on Geographic Boundary */}
      {/* AZ-A Satellite (Top Right) */}
      <circle cx="23.5" cy="8.5" r="2.2" fill={fillSurface} stroke={strokeColor} strokeWidth="1.2" />
      <circle cx="23.5" cy="8.5" r="0.8" fill={strokeAccent} />

      {/* AZ-B Satellite (Bottom Right) */}
      <circle cx="23.5" cy="23.5" r="2.2" fill={fillSurface} stroke={strokeColor} strokeWidth="1.2" />
      <circle cx="23.5" cy="23.5" r="0.8" fill={strokeAccent} />

      {/* AZ-C Satellite (Bottom Left) */}
      <circle cx="8.5" cy="23.5" r="2.2" fill={fillSurface} stroke={strokeColor} strokeWidth="1.2" />
      <circle cx="8.5" cy="23.5" r="0.8" fill={strokeAccent} />

      {/* Regional Synchronous Link Rays */}
      <line x1="16" y1="12" x2="22" y2="9.5" stroke={strokeColor} strokeWidth="0.9" strokeDasharray="1 1" />
      <line x1="18.5" y1="17.5" x2="22" y2="22" stroke={strokeColor} strokeWidth="0.9" strokeDasharray="1 1" />
      <line x1="11" y1="18.5" x2="9.5" y2="22" stroke={strokeColor} strokeWidth="0.9" strokeDasharray="1 1" />
    </svg>
  );
};
