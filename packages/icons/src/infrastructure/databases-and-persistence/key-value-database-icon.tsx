import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const KeyValueDatabaseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Key-Value Database",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeAmber = isColored ? "#FBBF24" : "#A3A3A3";
  const fillFoundation = isColored ? "#451A03" : "#1A1A1A";
  const strokeOrange = isColored ? "#F59E0B" : "#737373";
  const fillPair = isColored ? "#78350F" : "#262626";
  const strokeAccent = isColored ? "#FDE68A" : "#D4D4D4";
  const fillDot = isColored ? "#FEF08A" : "#E5E5E5";

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
        stroke={strokeAmber}
        strokeWidth="1.5"
      />

      {/* Main Enclosure */}
      <path
        d="M5.5 6.5v17c0 1.77 4.7 3.2 10.5 3.2s10.5-1.43 10.5-3.2v-17"
        stroke={strokeAmber}
        strokeWidth="1.5"
      />

      {/* Stratum Ring */}
      <path
        d="M5.5 12c0 1.77 4.7 3.2 10.5 3.2s10.5-1.43 10.5-3.2"
        stroke={strokeOrange}
        strokeWidth="1.2"
      />

      {/* Key-Value Association Pair 1 */}
      {/* Key Block (Left) */}
      <rect
        x="8.5"
        y="14.5"
        width="6"
        height="4"
        rx="1"
        fill={fillPair}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      <circle cx="11.5" cy="16.5" r="0.75" fill={fillDot} />
      {/* Map Arrow */}
      <path d="M14.5 16.5h2.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      {/* Value Block (Right) */}
      <rect
        x="17"
        y="14.5"
        width="6.5"
        height="4"
        rx="1"
        fill={fillPair}
        stroke={strokeOrange}
        strokeWidth="1"
      />

      {/* Key-Value Association Pair 2 */}
      {/* Key Block (Left) */}
      <rect
        x="8.5"
        y="20.5"
        width="6"
        height="4"
        rx="1"
        fill={fillPair}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      <circle cx="11.5" cy="22.5" r="0.75" fill={fillDot} />
      {/* Map Arrow */}
      <path d="M14.5 22.5h2.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      {/* Value Block (Right) */}
      <rect
        x="17"
        y="20.5"
        width="6.5"
        height="4"
        rx="1"
        fill={fillPair}
        stroke={strokeOrange}
        strokeWidth="1"
      />
    </svg>
  );
};

