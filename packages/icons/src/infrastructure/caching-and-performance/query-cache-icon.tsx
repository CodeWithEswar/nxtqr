import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const QueryCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Query Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeTeal = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillFoundation = isColored ? "#134E4A" : "#1A1A1A";
  const strokeAccent = isColored ? "#99F6E4" : "#E5E5E5";
  const strokeSubtle = isColored ? "#0D9488" : "#737373";
  const fillVault = isColored ? "#115E59" : "#262626";

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
      {/* Underlying Query Cache Disk / Table Slice */}
      <rect
        x="5"
        y="5"
        width="22"
        height="22"
        rx="2"
        fill={fillFoundation}
        stroke={strokeTeal}
        strokeWidth="1.5"
      />

      {/* SQL / Query Input Banner */}
      <rect
        x="7.5"
        y="7.5"
        width="17"
        height="6.5"
        rx="1"
        fill={fillVault}
        stroke={strokeSubtle}
        strokeWidth="1.1"
      />

      {/* Query Terminal Prompt ">_" */}
      <path
        d="M10 9.25l2.25 1.5-2.25 1.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="14" y1="12.25" x2="16.5" y2="12.25" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Cached Query Hash Rows */}
      <line x1="7.5" y1="17.5" x2="19.5" y2="17.5" stroke={strokeSubtle} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7.5" y1="21.5" x2="16.5" y2="21.5" stroke={strokeSubtle} strokeWidth="1.2" strokeLinecap="round" />

      {/* Fast Result-Hit Verified Badge (Bottom-Right) */}
      <circle cx="21.5" cy="21" r="3.75" fill={fillFoundation} stroke={strokeTeal} strokeWidth="1.2" />
      <path
        d="M19.75 21l1.25 1.25 2.5-2.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
