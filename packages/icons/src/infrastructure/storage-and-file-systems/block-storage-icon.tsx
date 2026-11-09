import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const BlockStorageIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Block Storage",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeIndigo = isColored ? "#818CF8" : "#A3A3A3";
  const fillFoundation = isColored ? "#1E1B4B" : "#141414";
  const strokeAccent = isColored ? "#C7D2FE" : "#E5E5E5";
  const fillBlockActive = isColored ? "#4338CA" : "#262626";
  const fillBlockSecondary = isColored ? "#312E81" : "#1F1F1F";

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
      {/* Outer Block Storage Chassis / Controller Frame */}
      <rect
        x="4"
        y="6"
        width="24"
        height="20"
        rx="2.5"
        fill={fillFoundation}
        stroke={strokeIndigo}
        strokeWidth="1.5"
      />

      {/* Controller Bus Header Strip */}
      <path
        d="M4 11H28"
        stroke={strokeIndigo}
        strokeWidth="1.2"
        strokeOpacity={isColored ? 0.7 : 0.4}
      />

      {/* High-Speed IOPS Status Indicators */}
      <circle cx="7.5" cy="8.5" r="1" fill={strokeAccent} />
      <circle cx="11" cy="8.5" r="1" fill={strokeIndigo} />
      <path
        d="M23 8.5H25.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* 2x3 Addressable Fixed-Size Storage Blocks / Sectors */}
      {/* Block (0, 0) */}
      <rect
        x="6.5"
        y="13"
        width="5.5"
        height="5"
        rx="1"
        fill={fillBlockActive}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      {/* Block (0, 1) */}
      <rect
        x="13.25"
        y="13"
        width="5.5"
        height="5"
        rx="1"
        fill={fillBlockSecondary}
        stroke={strokeIndigo}
        strokeWidth="1"
      />
      {/* Block (0, 2) */}
      <rect
        x="20"
        y="13"
        width="5.5"
        height="5"
        rx="1"
        fill={fillBlockActive}
        stroke={strokeAccent}
        strokeWidth="1"
      />

      {/* Block (1, 0) */}
      <rect
        x="6.5"
        y="19.5"
        width="5.5"
        height="4.5"
        rx="1"
        fill={fillBlockSecondary}
        stroke={strokeIndigo}
        strokeWidth="1"
      />
      {/* Block (1, 1) */}
      <rect
        x="13.25"
        y="19.5"
        width="5.5"
        height="4.5"
        rx="1"
        fill={fillBlockActive}
        stroke={strokeAccent}
        strokeWidth="1"
      />
      {/* Block (1, 2) */}
      <rect
        x="20"
        y="19.5"
        width="5.5"
        height="4.5"
        rx="1"
        fill={fillBlockSecondary}
        stroke={strokeIndigo}
        strokeWidth="1"
      />

      {/* Storage Attachment Bus Teeth (Bottom Connector) */}
      <path
        d="M10 26V28.5M14 26V28.5M18 26V28.5M22 26V28.5"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
