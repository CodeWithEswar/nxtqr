import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const PresenceServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Presence Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#818CF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#A5B4FC" : "#D4D4D4";
  const fillFoundation = isColored ? "#1E1B4B" : "#141414";
  const fillSurface = isColored ? "#3730A3" : "#1F1F1F";

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
      {/* Central Presence State Aggregation Hub */}
      <circle
        cx="16"
        cy="16"
        r="5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Heartbeat Pulse in Central Hub */}
      <path
        d="M13 16H14.5L15.5 14L16.5 18L17.5 16H19"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* User Endpoint 1: Top (Online Status - Emerald) */}
      <circle cx="16" cy="5" r="3" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      <circle cx="18.5" cy="3" r="1.5" fill={isColored ? "#34D399" : "#FFFFFF"} stroke="#000000" strokeWidth="0.5" />
      <line x1="16" y1="8" x2="16" y2="11" stroke={strokeColor} strokeWidth="1" strokeDasharray="1.5 1" />

      {/* User Endpoint 2: Bottom-Left (Away / Idle Status - Amber) */}
      <circle cx="6" cy="24" r="3" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      <circle cx="8.5" cy="22" r="1.5" fill={isColored ? "#FBBF24" : "#A3A3A3"} stroke="#000000" strokeWidth="0.5" />
      <line x1="8.5" y1="21.5" x2="12" y2="18.5" stroke={strokeColor} strokeWidth="1" strokeDasharray="1.5 1" />

      {/* User Endpoint 3: Bottom-Right (Offline / Disconnected Status - Gray) */}
      <circle cx="26" cy="24" r="3" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      <circle cx="28.5" cy="22" r="1.5" fill={isColored ? "#64748B" : "#525252"} stroke="#000000" strokeWidth="0.5" />
      <line x1="23.5" y1="21.5" x2="20" y2="18.5" stroke={strokeColor} strokeWidth="1" strokeDasharray="1.5 1" />
    </svg>
  );
};

