import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const AnalyticsEngineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Analytics Engine",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#C4B5FD" : "#A3A3A3";
  const strokeAccent = isColored ? "#DDD6FE" : "#E5E5E5";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillCore = isColored ? "#5B21B6" : "#262626";

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
      {/* Outer Analytical Processing Frame */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Analytical Coordinate Grid Lines */}
      <line x1="8" y1="23" x2="24" y2="23" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
      <line x1="8" y1="8" x2="8" y2="23" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />

      {/* Analytical Aggregation Histogram Columns */}
      <rect x="10" y="17" width="2.8" height="6" rx="0.6" fill={fillCore} stroke={strokeColor} strokeWidth="0.9" />
      <rect x="14.5" y="13" width="2.8" height="10" rx="0.6" fill={fillCore} stroke={strokeColor} strokeWidth="0.9" />
      <rect x="19" y="10" width="2.8" height="13" rx="0.6" fill={fillCore} stroke={strokeColor} strokeWidth="0.9" />

      {/* Ascending Trend Line & Regression Nodes */}
      <path
        d="M11 16L16 12L21 8L25 6"
        stroke={strokeAccent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="16" r="1.3" fill="#FFFFFF" />
      <circle cx="16" cy="12" r="1.3" fill="#FFFFFF" />
      <circle cx="21" cy="8" r="1.3" fill="#FFFFFF" />
      <circle cx="25" cy="6" r="1.3" fill={strokeAccent} />

      {/* Central Sigma / Computation Accent badge at Top Right */}
      <path
        d="M23 18H26.5L24.5 20L26.5 22H23"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

