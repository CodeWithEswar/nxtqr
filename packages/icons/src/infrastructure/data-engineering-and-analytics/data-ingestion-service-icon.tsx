import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DataIngestionServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Data Ingestion Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#FBBF24" : "#A3A3A3";
  const strokeAccent = isColored ? "#FCD34D" : "#E5E5E5";
  const fillFoundation = isColored ? "#451A03" : "#141414";
  const fillFunnel = isColored ? "#78350F" : "#262626";

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
      {/* 1. Multiple Source Streams entering from left and top */}
      {/* Stream 1 (Top-Left diagonal) */}
      <circle cx="4" cy="7" r="1.5" fill={strokeAccent} />
      <path d="M5.5 8L10 12" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Stream 2 (Middle-Left direct) */}
      <circle cx="4" cy="16" r="1.5" fill={strokeAccent} />
      <path d="M5.5 16H10" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Stream 3 (Bottom-Left diagonal) */}
      <circle cx="4" cy="25" r="1.5" fill={strokeAccent} />
      <path d="M5.5 24L10 20" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* 2. Central Ingestion Funnel Hopper & Batch Buffer Chamber */}
      <path
        d="M10 6L16 11V21L10 26V6Z"
        fill={fillFunnel}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Buffer Chamber Enclosure */}
      <rect
        x="16"
        y="10"
        width="9"
        height="12"
        rx="2"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Internal Buffer Queue Indicators */}
      <line x1="18.5" y1="13" x2="22.5" y2="13" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18.5" y1="16" x2="22.5" y2="16" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18.5" y1="19" x2="22.5" y2="19" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* 3. Regulated Downstream Delivery Pipe */}
      <path d="M25 16H29" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M27 13.5L29.5 16L27 18.5" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
