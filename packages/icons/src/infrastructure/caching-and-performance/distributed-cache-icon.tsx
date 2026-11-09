import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DistributedCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Distributed Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillFoundation = isColored ? "#4C1D95" : "#1A1A1A";
  const strokeAccent = isColored ? "#DDD6FE" : "#E5E5E5";
  const strokeSubtle = isColored ? "#7C3AED" : "#737373";
  const fillNode = isColored ? "#5B21B6" : "#262626";

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
      {/* Consistent Hashing Ring / Network Backbone */}
      <circle
        cx="16"
        cy="17"
        r="9"
        stroke={strokeSubtle}
        strokeWidth="1.2"
        strokeDasharray="2.5 2"
      />

      {/* Inter-Node Synchronization Ray Lines */}
      <line x1="16" y1="8" x2="8.5" y2="21" stroke={strokeSubtle} strokeWidth="1" />
      <line x1="16" y1="8" x2="23.5" y2="21" stroke={strokeSubtle} strokeWidth="1" />
      <line x1="8.5" y1="21" x2="23.5" y2="21" stroke={strokeSubtle} strokeWidth="1" />

      {/* Center Coherence Synchronization Hub */}
      <circle cx="16" cy="16.5" r="1.75" fill={strokeAccent} />

      {/* Node 1: Top Primary Shard */}
      <rect
        x="12"
        y="4"
        width="8"
        height="7.5"
        rx="1.5"
        fill={fillFoundation}
        stroke={strokeViolet}
        strokeWidth="1.4"
      />
      <line x1="14" y1="7.5" x2="18" y2="7.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Node 2: Bottom-Left Shard */}
      <rect
        x="4.5"
        y="17"
        width="8"
        height="7.5"
        rx="1.5"
        fill={fillNode}
        stroke={strokeViolet}
        strokeWidth="1.4"
      />
      <line x1="6.5" y1="20.5" x2="10.5" y2="20.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Node 3: Bottom-Right Shard */}
      <rect
        x="19.5"
        y="17"
        width="8"
        height="7.5"
        rx="1.5"
        fill={fillNode}
        stroke={strokeViolet}
        strokeWidth="1.4"
      />
      <line x1="21.5" y1="20.5" x2="25.5" y2="20.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};
