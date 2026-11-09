import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MemcachedCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Memcached Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const fillFoundation = isColored ? "#78350F" : "#1A1A1A";
  const strokeAccent = isColored ? "#FEF3C7" : "#E5E5E5";
  const strokeSubtle = isColored ? "#F59E0B" : "#737373";
  const fillCell = isColored ? "#92400E" : "#262626";

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
      {/* Outer Memory Chassis / Slab Allocator Housing */}
      <rect
        x="5"
        y="6"
        width="22"
        height="20"
        rx="2"
        fill={fillFoundation}
        stroke={strokeAmber}
        strokeWidth="1.5"
      />

      {/* Internal Slab Division Rail */}
      <line
        x1="5"
        y1="13"
        x2="27"
        y2="13"
        stroke={strokeSubtle}
        strokeWidth="1.2"
      />

      {/* Memory Hash Buckets / Cells (Top Row) */}
      <rect
        x="7.5"
        y="8.5"
        width="4.5"
        height="3"
        rx="0.8"
        fill={fillCell}
        stroke={strokeAmber}
        strokeWidth="1"
      />
      <rect
        x="13.75"
        y="8.5"
        width="4.5"
        height="3"
        rx="0.8"
        fill={fillCell}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      <rect
        x="20"
        y="8.5"
        width="4.5"
        height="3"
        rx="0.8"
        fill={fillCell}
        stroke={strokeAmber}
        strokeWidth="1"
      />

      {/* Bottom Key-Value Array Slots */}
      <rect
        x="7.5"
        y="15.5"
        width="7.5"
        height="8"
        rx="1"
        fill={fillCell}
        stroke={strokeSubtle}
        strokeWidth="1.1"
      />
      <rect
        x="17"
        y="15.5"
        width="7.5"
        height="8"
        rx="1"
        fill={fillCell}
        stroke={strokeAmber}
        strokeWidth="1.1"
      />

      {/* High-speed Read/Write In-Memory Pulsing Nodes */}
      <circle cx="11.25" cy="19.5" r="1.2" fill={strokeAccent} />
      <circle cx="20.75" cy="19.5" r="1.2" fill={strokeAccent} />

      {/* Top Bus Terminal Pins */}
      <path
        d="M9 4v2M16 4v2M23 4v2"
        stroke={strokeAmber}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
