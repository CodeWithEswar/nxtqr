import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DataWarehouseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Data Warehouse",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeIndigo = isColored ? "#818CF8" : "#A3A3A3";
  const fillFoundation = isColored ? "#1E1B4B" : "#1A1A1A";
  const strokeAccent = isColored ? "#C7D2FE" : "#D4D4D4";
  const strokeColumn = isColored ? "#6366F1" : "#737373";
  const fillBlock = isColored ? "#312E81" : "#262626";
  const fillDot = isColored ? "#EEF2FF" : "#E5E5E5";

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
      {/* Top Warehouse Analytical Tier (Hexagonal / Cubic Perspective Roof) */}
      <path
        d="M16 3l10.5 5.5v3L16 6 5.5 11.5v-3L16 3z"
        fill={fillFoundation}
        stroke={strokeIndigo}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Main Analytical Warehouse Columnar Silo Enclosure */}
      <rect
        x="5.5"
        y="10.5"
        width="21"
        height="16"
        rx="2"
        fill={fillFoundation}
        stroke={strokeIndigo}
        strokeWidth="1.5"
      />

      {/* Analytical Fact & Dimension Columnar Partitions (4 Verticals) */}
      <rect x="7.5" y="12.5" width="4" height="12" rx="1" fill={fillBlock} stroke={strokeColumn} strokeWidth="1" />
      <rect x="12" y="12.5" width="4" height="12" rx="1" fill={fillBlock} stroke={strokeColumn} strokeWidth="1" />
      <rect x="16.5" y="12.5" width="4" height="12" rx="1" fill={fillBlock} stroke={strokeColumn} strokeWidth="1" />
      <rect x="21" y="12.5" width="4" height="12" rx="1" fill={fillBlock} stroke={strokeColumn} strokeWidth="1" />

      {/* High-Performance Vectorized Query Horizon Line */}
      <path d="M5.5 18h21" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Data Cubes / Columnar Checkpoint Dots */}
      <circle cx="9.5" cy="15" r="0.75" fill={fillDot} />
      <circle cx="14" cy="15" r="0.75" fill={fillDot} />
      <circle cx="18.5" cy="15" r="0.75" fill={fillDot} />
      <circle cx="23" cy="15" r="0.75" fill={fillDot} />
    </svg>
  );
};

