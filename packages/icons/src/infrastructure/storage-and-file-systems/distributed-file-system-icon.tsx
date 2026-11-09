import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DistributedFileSystemIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Distributed File System",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeTeal = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillDeep = isColored ? "#0F766E" : "#262626";
  const fillFoundation = isColored ? "#042F2E" : "#141414";
  const strokeAccent = isColored ? "#99F6E4" : "#E5E5E5";
  const fillNode = isColored ? "#115E59" : "#1F1F1F";

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
      {/* Central Mesh Coordination Interconnect Lines */}
      <path
        d="M16 8L7.5 22M16 8L24.5 22M7.5 22H24.5"
        stroke={strokeTeal}
        strokeWidth="1.2"
        strokeDasharray="2 1.5"
        strokeOpacity={isColored ? 0.7 : 0.4}
      />

      {/* Distributed Consensus / Metadata Hub (Center Ring) */}
      <circle
        cx="16"
        cy="17"
        r="2.5"
        fill={fillDeep}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      <circle cx="16" cy="17" r="1" fill={strokeTeal} />

      {/* Node 1: Master / Coordinator Storage Node (Top) */}
      <g transform="translate(16, 8)">
        <rect
          x="-5.5"
          y="-5"
          width="11"
          height="8.5"
          rx="1.5"
          fill={fillNode}
          stroke={strokeAccent}
          strokeWidth="1.3"
        />
        {/* Drive activity slot */}
        <line x1="-3" y1="-1" x2="3" y2="-1" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
        <circle cx="3" cy="-3" r="0.75" fill={strokeTeal} />
      </g>

      {/* Node 2: Worker Storage Node A (Bottom Left) */}
      <g transform="translate(7.5, 22.5)">
        <rect
          x="-5"
          y="-4"
          width="10"
          height="8"
          rx="1.5"
          fill={fillFoundation}
          stroke={strokeTeal}
          strokeWidth="1.3"
        />
        <line x1="-2.5" y1="0" x2="2.5" y2="0" stroke={strokeTeal} strokeWidth="1" strokeLinecap="round" />
        <circle cx="2.5" cy="-2" r="0.75" fill={strokeAccent} />
      </g>

      {/* Node 3: Worker Storage Node B (Bottom Right) */}
      <g transform="translate(24.5, 22.5)">
        <rect
          x="-5"
          y="-4"
          width="10"
          height="8"
          rx="1.5"
          fill={fillFoundation}
          stroke={strokeTeal}
          strokeWidth="1.3"
        />
        <line x1="-2.5" y1="0" x2="2.5" y2="0" stroke={strokeTeal} strokeWidth="1" strokeLinecap="round" />
        <circle cx="2.5" cy="-2" r="0.75" fill={strokeAccent} />
      </g>
    </svg>
  );
};
