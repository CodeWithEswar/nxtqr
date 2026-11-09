import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EventStreamIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Event Stream",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeTeal = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillFoundation = isColored ? "#134E4A" : "#1A1A1A";
  const strokeAccent = isColored ? "#99F6E4" : "#E5E5E5";
  const fillSegment = isColored ? "#0F766E" : "#262626";

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
      {/* Top Stream Rail / Partition Lane 1 */}
      <path
        d="M3 9.5h23a3 3 0 0 1 3 3v0"
        stroke={strokeTeal}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Partition 1 Event Blocks */}
      <rect
        x="4"
        y="6.5"
        width="5"
        height="6"
        rx="1"
        fill={fillSegment}
        stroke={strokeTeal}
        strokeWidth="1.1"
      />
      <rect
        x="11"
        y="6.5"
        width="5"
        height="6"
        rx="1"
        fill={fillFoundation}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <rect
        x="18"
        y="6.5"
        width="5"
        height="6"
        rx="1"
        fill={fillSegment}
        stroke={strokeTeal}
        strokeWidth="1.1"
      />

      {/* Middle Stream Waves / Temporal Flow Lines */}
      <path
        d="M2 16c4-2 7 2 11 0s7-2 11 0 4 1 6 0"
        stroke={strokeAccent}
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Bottom Stream Rail / Partition Lane 2 */}
      <path
        d="M3 22.5h23a3 3 0 0 0 3-3v0"
        stroke={strokeTeal}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Partition 2 Event Blocks */}
      <rect
        x="7"
        y="19.5"
        width="5"
        height="6"
        rx="1"
        fill={fillFoundation}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <rect
        x="14"
        y="19.5"
        width="5"
        height="6"
        rx="1"
        fill={fillSegment}
        stroke={strokeTeal}
        strokeWidth="1.1"
      />
      <rect
        x="21"
        y="19.5"
        width="5"
        height="6"
        rx="1"
        fill={fillFoundation}
        stroke={strokeTeal}
        strokeWidth="1.1"
      />

      {/* Directional Velocity Arrows */}
      <path
        d="M26.5 14.5L28.5 16l-2 1.5"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
