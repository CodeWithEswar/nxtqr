import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WideColumnDatabaseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Wide-Column Database",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeTeal = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillFoundation = isColored ? "#042F2E" : "#1A1A1A";
  const strokeCol = isColored ? "#14B8A6" : "#737373";
  const fillCol = isColored ? "#115E59" : "#262626";
  const strokeAccent = isColored ? "#5EEAD4" : "#D4D4D4";
  const fillDot = isColored ? "#CCFBF1" : "#E5E5E5";

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
      {/* Top Database Disk Cap */}
      <ellipse
        cx="16"
        cy="6.5"
        rx="10.5"
        ry="3.2"
        fill={fillFoundation}
        stroke={strokeTeal}
        strokeWidth="1.5"
      />

      {/* Main Database Enclosure */}
      <path
        d="M5.5 6.5v17c0 1.77 4.7 3.2 10.5 3.2s10.5-1.43 10.5-3.2v-17"
        stroke={strokeTeal}
        strokeWidth="1.5"
      />

      {/* Internal Tier Strata */}
      <path
        d="M5.5 12c0 1.77 4.7 3.2 10.5 3.2s10.5-1.43 10.5-3.2"
        stroke={strokeCol}
        strokeWidth="1.2"
      />

      {/* 3 Vertically Structured Column-Families */}
      {/* Column Family 1 */}
      <rect
        x="8.5"
        y="14.5"
        width="4"
        height="10.5"
        rx="1"
        fill={fillCol}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <circle cx="10.5" cy="16.5" r="0.75" fill={fillDot} />
      <path d="M10.5 19v4.5" stroke={strokeTeal} strokeWidth="1" strokeLinecap="round" />

      {/* Column Family 2 */}
      <rect
        x="14"
        y="14.5"
        width="4"
        height="10.5"
        rx="1"
        fill={fillCol}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <circle cx="16" cy="16.5" r="0.75" fill={fillDot} />
      <path d="M16 19v4.5" stroke={strokeTeal} strokeWidth="1" strokeLinecap="round" />

      {/* Column Family 3 */}
      <rect
        x="19.5"
        y="14.5"
        width="4"
        height="10.5"
        rx="1"
        fill={fillCol}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <circle cx="21.5" cy="16.5" r="0.75" fill={fillDot} />
      <path d="M21.5 19v4.5" stroke={strokeTeal} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};

