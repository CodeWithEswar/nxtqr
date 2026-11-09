import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EventBusIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Event Bus",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillFoundation = isColored ? "#2E1065" : "#1A1A1A";
  const strokeAccent = isColored ? "#DDD6FE" : "#E5E5E5";
  const fillNode = isColored ? "#4C1D95" : "#262626";

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
      {/* Central High-Capacity Event Bus Backbone */}
      <rect
        x="3"
        y="13"
        width="26"
        height="6"
        rx="2"
        fill={fillFoundation}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />

      {/* Internal Transmission Track / Event Pulse Wave */}
      <path
        d="M6 16h6l1.5-2 2 4 1.5-2h9"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top Connected Service Nodes (Producers/Subscribers) */}
      {/* Top Left Node */}
      <path
        d="M9 13V8.5"
        stroke={strokeViolet}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="9" cy="6.5" r="2.5" fill={fillNode} stroke={strokeAccent} strokeWidth="1.2" />

      {/* Top Center-Right Node */}
      <path
        d="M23 13V8.5"
        stroke={strokeViolet}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="23" cy="6.5" r="2.5" fill={fillNode} stroke={strokeViolet} strokeWidth="1.2" />

      {/* Bottom Connected Service Nodes */}
      {/* Bottom Mid-Left Node */}
      <path
        d="M13 19v4.5"
        stroke={strokeViolet}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="13" cy="25.5" r="2.5" fill={fillNode} stroke={strokeViolet} strokeWidth="1.2" />

      {/* Bottom Right Node */}
      <path
        d="M20 19v4.5"
        stroke={strokeViolet}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="25.5" r="2.5" fill={fillNode} stroke={strokeAccent} strokeWidth="1.2" />

      {/* Directional Signal Chevron on Bus */}
      <path
        d="M26.5 14.5l1.5 1.5-1.5 1.5"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

