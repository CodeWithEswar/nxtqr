import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const InMemoryDatabaseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "In-Memory Database",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeOrange = isColored ? "#FB923C" : "#A3A3A3";
  const fillFoundation = isColored ? "#431407" : "#1A1A1A";
  const strokeAccent = isColored ? "#FED7AA" : "#D4D4D4";
  const strokePins = isColored ? "#F97316" : "#737373";
  const fillChip = isColored ? "#7C2D12" : "#262626";
  const fillLed = isColored ? "#FFEDD5" : "#E5E5E5";

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
      {/* Top Database Disk Ellipse */}
      <ellipse
        cx="16"
        cy="6"
        rx="10"
        ry="3.2"
        fill={fillFoundation}
        stroke={strokeOrange}
        strokeWidth="1.5"
      />

      {/* Database Chassis */}
      <path
        d="M6 6v18c0 1.77 4.48 3.2 10 3.2s10-1.43 10-3.2v-18"
        stroke={strokeOrange}
        strokeWidth="1.5"
      />

      {/* Middle Stratum */}
      <path
        d="M6 11.5c0 1.77 4.48 3.2 10 3.2s10-1.43 10-3.2"
        stroke={strokePins}
        strokeWidth="1.2"
      />

      {/* RAM / Volatile Memory Semiconductor Silicon Chip */}
      <rect
        x="9.5"
        y="14.5"
        width="13"
        height="10"
        rx="1.5"
        fill={fillChip}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* Dual Inline Memory Bus Pins (Top & Bottom Leads) */}
      <path
        d="M11.5 13v1.5M14 13v1.5M18 13v1.5M20.5 13v1.5M11.5 24.5V26M14 24.5V26M18 24.5V26M20.5 24.5V26"
        stroke={strokePins}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Ultra-Fast Cache Flash Dot */}
      <circle cx="16" cy="19.5" r="1.5" fill={fillLed} />
    </svg>
  );
};

