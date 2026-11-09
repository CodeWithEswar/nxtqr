import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const StreamProcessorIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Stream Processor",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeTeal = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillEngine = isColored ? "#134E4A" : "#1A1A1A";
  const strokeAccent = isColored ? "#99F6E4" : "#E5E5E5";
  const fillStream = isColored ? "#0F766E" : "#262626";

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
      {/* Central Stateful Processing Core (Hexagonal Transformer) */}
      <polygon
        points="16,6 23,10 23,22 16,26 9,22 9,10"
        fill={fillEngine}
        stroke={strokeTeal}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Internal Windowing / Stateful Matrix */}
      <circle cx="16" cy="16" r="3" fill={fillStream} stroke={strokeAccent} strokeWidth="1.2" />
      <path
        d="M16 11v2M16 19v2M11.5 13.5l1.8 1M18.7 17.5l1.8 1"
        stroke={strokeTeal}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Incoming Continuous Stream (Left Pipes & Flow Blocks) */}
      <path
        d="M2.5 13.5H9M2.5 18.5H9"
        stroke={strokeTeal}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect
        x="3.5"
        y="14.5"
        width="3.5"
        height="3"
        rx="0.8"
        fill={strokeAccent}
      />

      {/* Outgoing Processed Stream (Right Pipes & Formed Events) */}
      <path
        d="M23 13.5h6.5M23 18.5h6.5"
        stroke={strokeTeal}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect
        x="24.5"
        y="14.5"
        width="4.5"
        height="3"
        rx="0.8"
        fill={fillStream}
        stroke={strokeAccent}
        strokeWidth="1"
      />

      {/* Outbound Forward Velocity Arrowhead */}
      <path
        d="M28.5 14.5L30 16l-1.5 1.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

