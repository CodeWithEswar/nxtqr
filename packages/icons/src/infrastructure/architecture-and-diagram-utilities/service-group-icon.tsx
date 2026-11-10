import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ServiceGroupIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Service Group",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#A78BFA" : "#A3A3A3";
  const strokeAccent = isColored ? "#DDD6FE" : "#E5E5E5";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillPill = isColored ? "#4C1D95" : "#1F1F1F";

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
      {/* Outer Rounded Group Enclosure */}
      <rect
        x="3"
        y="4"
        width="26"
        height="24"
        rx="4"
        fill={fillFoundation}
        stroke={strokePrimary}
        strokeWidth="1.2"
      />

      {/* Group Header Tag */}
      <path
        d="M7 8H13"
        stroke={strokeAccent}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="15.5" cy="8" r="1" fill={strokePrimary} />

      {/* Member Service 1 */}
      <rect
        x="6"
        y="12"
        width="20"
        height="4"
        rx="2"
        fill={fillPill}
        stroke={strokePrimary}
        strokeWidth="0.8"
      />
      <circle cx="9" cy="14" r="1" fill={strokeAccent} />
      <path d="M12 14H22" stroke={strokeAccent} strokeWidth="0.8" strokeLinecap="round" />

      {/* Member Service 2 */}
      <rect
        x="6"
        y="18"
        width="20"
        height="4"
        rx="2"
        fill={fillPill}
        stroke={strokePrimary}
        strokeWidth="0.8"
      />
      <circle cx="9" cy="20" r="1" fill={strokeAccent} />
      <path d="M12 20H20" stroke={strokeAccent} strokeWidth="0.8" strokeLinecap="round" />

      {/* Member Service 3 */}
      <rect
        x="6"
        y="24"
        width="20"
        height="4"
        rx="2"
        fill={fillPill}
        stroke={strokePrimary}
        strokeWidth="0.8"
      />
      <circle cx="9" cy="26" r="1" fill={strokeAccent} />
      <path d="M12 26H18" stroke={strokeAccent} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
};
