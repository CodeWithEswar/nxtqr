import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const InferenceCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Inference Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#F59E0B" : "#A3A3A3";
  const strokeAccent = isColored ? "#FBBF24" : "#E5E5E5";
  const fillCache = isColored ? "#451A03" : "#141414";
  const fillCore = isColored ? "#78350F" : "#262626";
  const accentHit = isColored ? "#10B981" : "#FFFFFF";

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
      {/* Outer Cache Ring / Memory Shell */}
      <circle
        cx="16"
        cy="16"
        r="13"
        fill={fillCache}
        stroke={strokeColor}
        strokeWidth="1.2"
      />

      {/* Internal Fast-Access Circular Segments */}
      <circle cx="16" cy="16" r="9" fill={fillCore} stroke={strokeAccent} strokeWidth="1" strokeDasharray="3 2" />

      {/* Central Fast Lightning Symbol */}
      <path
        d="M17 9L11 17H16L15 23L21 15H16L17 9Z"
        fill={strokeAccent}
        stroke={strokeColor}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Hit / Similarity Threshold Indicator (Top-Right Badge) */}
      <circle cx="24" cy="8" r="4" fill={fillCache} stroke={accentHit} strokeWidth="1.2" />
      <path d="M22.5 8L23.5 9L25.5 7" stroke={accentHit} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Radius Distance Rays / Cosine Match Radii */}
      <line x1="16" y1="3" x2="16" y2="5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="29" y1="16" x2="27" y2="16" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="29" x2="16" y2="27" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="3" y1="16" x2="5" y2="16" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

