import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EltPipelineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "ELT Pipeline",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#A78BFA" : "#A3A3A3";
  const strokeAccent = isColored ? "#C4B5FD" : "#E5E5E5";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillLoad = isColored ? "#4C1D95" : "#262626";

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
      {/* 1. Extract Stage: Source Cylinder */}
      <path
        d="M3 11C3 9.9 4.8 9 7 9C9.2 9 11 9.9 11 11V21C11 22.1 9.2 23 7 23C4.8 23 3 22.1 3 21V11Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <ellipse cx="7" cy="11" rx="4" ry="2" fill={fillLoad} stroke={strokeColor} strokeWidth="1.2" />

      {/* Direct Load Pipe / Conduit from Source straight into Destination */}
      <path d="M11 16H15.5" stroke={strokeAccent} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 13.5L16.5 16L14 18.5" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

      {/* 2. Load & Transform Destination Container: Massive Lakehouse/Warehouse with internal computation */}
      <rect
        x="17"
        y="7"
        width="13"
        height="18"
        rx="2.5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Container header tier */}
      <line x1="17" y1="11" x2="30" y2="11" stroke={strokeColor} strokeWidth="1" />

      {/* In-Destination Transformation Core (Spark / dbt SQL Engine symbol) */}
      <circle cx="23.5" cy="18" r="4" fill={fillLoad} stroke={strokeAccent} strokeWidth="1.2" />
      {/* Inner transformation sparkle / query delta */}
      <path
        d="M23.5 15.5V20.5M21 18H26"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Diagonal execution pulses */}
      <circle cx="23.5" cy="18" r="1.2" fill="#FFFFFF" />
    </svg>
  );
};

