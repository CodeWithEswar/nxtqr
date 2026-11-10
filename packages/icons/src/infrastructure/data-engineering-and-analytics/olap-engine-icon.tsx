import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const OlapEngineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "OLAP Engine",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#818CF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#A5B4FC" : "#E5E5E5";
  const fillFoundation = isColored ? "#1E1B4B" : "#141414";
  const fillFaceLeft = isColored ? "#312E81" : "#1F1F1F";
  const fillFaceRight = isColored ? "#3730A3" : "#292929";

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
      {/* 1. Multidimensional Isometric Data Cube */}
      {/* Top Face (Dimensions X & Y) */}
      <polygon
        points="16,4 27,10 16,16 5,10"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Top Face Grid Dividers */}
      <line x1="10.5" y1="7" x2="21.5" y2="13" stroke={strokeColor} strokeWidth="0.9" />
      <line x1="21.5" y1="7" x2="10.5" y2="13" stroke={strokeColor} strokeWidth="0.9" />

      {/* Left Face (Dimensions Y & Z) */}
      <polygon
        points="5,10 16,16 16,28 5,22"
        fill={fillFaceLeft}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Left Face Grid Dividers */}
      <line x1="5" y1="16" x2="16" y2="22" stroke={strokeColor} strokeWidth="0.9" />
      <line x1="10.5" y1="13" x2="10.5" y2="25" stroke={strokeColor} strokeWidth="0.9" />

      {/* Right Face (Dimensions X & Z) */}
      <polygon
        points="16,16 27,10 27,22 16,28"
        fill={fillFaceRight}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Right Face Grid Dividers */}
      <line x1="16" y1="22" x2="27" y2="16" stroke={strokeColor} strokeWidth="0.9" />
      <line x1="21.5" y1="13" x2="21.5" y2="25" stroke={strokeColor} strokeWidth="0.9" />

      {/* 2. Analytical Drill-Down / Slice Indicator (Highlighted Sub-Cube) */}
      <polygon
        points="16,16 21.5,13 21.5,19 16,22"
        fill={strokeAccent}
        opacity="0.85"
      />
      <circle cx="16" cy="16" r="1.5" fill="#FFFFFF" />
    </svg>
  );
};
