import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const RelationalDatabaseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Relational Database",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const fillFoundation = isColored ? "#064E3B" : "#1A1A1A";
  const strokeAccent = isColored ? "#6EE7B7" : "#D4D4D4";
  const fillTable = isColored ? "#022C22" : "#262626";
  const strokeGrid = isColored ? "#10B981" : "#737373";
  const fillDot = isColored ? "#A7F3D0" : "#E5E5E5";

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
      {/* Upper Disk / Cylinder Top Cap */}
      <ellipse
        cx="16"
        cy="7.5"
        rx="10.5"
        ry="3.5"
        fill={fillFoundation}
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Main Cylinder Body Walls */}
      <path
        d="M5.5 7.5v15c0 1.93 4.7 3.5 10.5 3.5s10.5-1.57 10.5-3.5v-15"
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Internal Tier Separator Ring */}
      <path
        d="M5.5 13.5c0 1.93 4.7 3.5 10.5 3.5s10.5-1.57 10.5-3.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* Structured Relational Table / Grid Motif Overlay */}
      <rect
        x="10.5"
        y="16.5"
        width="11"
        height="8"
        rx="1.5"
        fill={fillTable}
        stroke={strokeGreen}
        strokeWidth="1.2"
      />
      {/* Table Header and Column Grid Traces */}
      <path
        d="M10.5 19.5h11M16 19.5v5"
        stroke={strokeGrid}
        strokeWidth="1.1"
      />
      <circle cx="13" cy="18" r="0.8" fill={fillDot} />
      <circle cx="18.5" cy="18" r="0.8" fill={fillDot} />
    </svg>
  );
};

