import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ManagedCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Managed Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#FB923C" : "#A3A3A3";
  const strokeAccent = isColored ? "#FED7AA" : "#D4D4D4";
  const fillFoundation = isColored ? "#431407" : "#141414";
  const fillSurface = isColored ? "#7C2D12" : "#1F1F1F";

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
      {/* High-Speed Cache Memory Cylinder */}
      {/* Base Layer */}
      <path
        d="M6 19C6 21 10.5 22.5 16 22.5C21.5 22.5 26 21 26 19V22C26 24 21.5 25.5 16 25.5C10.5 25.5 6 24 6 22V19Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      {/* Middle Layer */}
      <path
        d="M6 13.5C6 15.5 10.5 17 16 17C21.5 17 26 15.5 26 13.5V16.5C26 18.5 21.5 20 16 20C10.5 20 6 18.5 6 16.5V13.5Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      {/* Top Cap */}
      <ellipse
        cx="16"
        cy="9.5"
        rx="10"
        ry="4"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Sub-Millisecond Speed Lightning Bolt */}
      <path
        d="M17 5L12 12.5H16L15 17.5L20 10H16L17 5Z"
        fill={strokeAccent}
        stroke={strokeColor}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Managed Replication Loop Dots (Left & Right) */}
      <circle cx="9" cy="18" r="1" fill={strokeAccent} />
      <circle cx="23" cy="18" r="1" fill={strokeAccent} />
    </svg>
  );
};

