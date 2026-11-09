import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ContentRepositoryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Content Repository",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeEmerald = isColored ? "#10B981" : "#A3A3A3";
  const fillDeep = isColored ? "#047857" : "#262626";
  const fillFoundation = isColored ? "#064E3B" : "#141414";
  const strokeAccent = isColored ? "#A7F3D0" : "#E5E5E5";
  const fillAsset = isColored ? "#059669" : "#1F1F1F";

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
      {/* Outer Content Repository Chassis / Cabinet */}
      <rect
        x="4"
        y="5"
        width="24"
        height="22"
        rx="2.5"
        fill={fillFoundation}
        stroke={strokeEmerald}
        strokeWidth="1.5"
      />

      {/* Metadata / Version Index Header Bar */}
      <path
        d="M4 10H28"
        stroke={strokeEmerald}
        strokeWidth="1.2"
        strokeOpacity={isColored ? 0.7 : 0.4}
      />
      <circle cx="7.5" cy="7.5" r="1" fill={strokeAccent} />
      <rect x="11" y="6.75" width="8" height="1.5" rx="0.5" fill={strokeAccent} />
      {/* Search / Index Magnifier Motif in Header */}
      <circle cx="23" cy="7.5" r="1.2" stroke={strokeAccent} strokeWidth="0.8" />
      <line x1="24" y1="8.5" x2="25.5" y2="10" stroke={strokeAccent} strokeWidth="0.8" />

      {/* Structured Content Asset 1 (Document with Metadata Tag) */}
      <g transform="translate(7, 13)">
        <rect
          x="0"
          y="0"
          width="8.5"
          height="11"
          rx="1"
          fill={fillAsset}
          stroke={strokeAccent}
          strokeWidth="1"
        />
        {/* Asset Content Rows */}
        <line x1="2" y1="3" x2="6.5" y2="3" stroke={strokeAccent} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="2" y1="5.5" x2="6.5" y2="5.5" stroke={strokeAccent} strokeWidth="0.9" strokeLinecap="round" />
        {/* Version Badge (v1/v2 indicator tag) */}
        <rect x="2" y="7.5" width="4.5" height="2" rx="0.5" fill={fillDeep} />
      </g>

      {/* Structured Content Asset 2 (Versioned / Rich Media Asset) */}
      <g transform="translate(17.5, 13)">
        <rect
          x="0"
          y="0"
          width="7.5"
          height="11"
          rx="1"
          fill={fillDeep}
          stroke={strokeEmerald}
          strokeWidth="1"
        />
        {/* Content thumbnail shape */}
        <rect x="1.5" y="2" width="4.5" height="4" rx="0.5" fill={fillFoundation} stroke={strokeEmerald} strokeWidth="0.7" />
        <line x1="1.5" y1="8" x2="6" y2="8" stroke={strokeAccent} strokeWidth="0.9" strokeLinecap="round" />
      </g>

      {/* Synchronized Repository Data Connector (Bottom Inset) */}
      <line x1="12" y1="27" x2="20" y2="27" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};
