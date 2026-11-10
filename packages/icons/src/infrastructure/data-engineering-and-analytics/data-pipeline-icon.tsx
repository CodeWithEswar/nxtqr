import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DataPipelineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Data Pipeline",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#34D399" : "#A3A3A3";
  const strokeAccent = isColored ? "#6EE7B7" : "#E5E5E5";
  const fillFoundation = isColored ? "#022C22" : "#141414";
  const fillStage = isColored ? "#065F46" : "#262626";

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
      {/* Upper Pipeline Rail */}
      <path
        d="M3 12H29"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Lower Pipeline Rail */}
      <path
        d="M3 20H29"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Stage 1: Ingestion Chamber */}
      <rect
        x="4"
        y="9"
        width="6"
        height="14"
        rx="2"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      <circle cx="7" cy="16" r="1.5" fill={strokeAccent} />

      {/* Inter-stage flow pulses */}
      <path d="M10 16H13M12 14.5L13.5 16L12 17.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Stage 2: Processing & Filter Gate */}
      <rect
        x="13"
        y="8"
        width="6"
        height="16"
        rx="2"
        fill={fillStage}
        stroke={strokeColor}
        strokeWidth="1.4"
      />
      {/* Active Stage Valve / Dial */}
      <circle cx="16" cy="16" r="2" fill={fillFoundation} stroke={strokeAccent} strokeWidth="1.2" />
      <line x1="16" y1="14" x2="16" y2="18" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />

      {/* Inter-stage flow pulses */}
      <path d="M19 16H22M21 14.5L22.5 16L21 17.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Stage 3: Sink & Egress Chamber */}
      <rect
        x="22"
        y="9"
        width="6"
        height="14"
        rx="2"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      <circle cx="25" cy="16" r="1.5" fill={strokeAccent} />

      {/* Top and Bottom Pipe Flange Connectors */}
      <rect x="7" y="11" width="2" height="10" rx="0.5" fill={strokeAccent} opacity="0.4" />
      <rect x="23" y="11" width="2" height="10" rx="0.5" fill={strokeAccent} opacity="0.4" />
    </svg>
  );
};

