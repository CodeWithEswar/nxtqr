import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DatabasePrimaryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Database Primary",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const fillFoundation = isColored ? "#064E3B" : "#1A1A1A";
  const strokeAccent = isColored ? "#6EE7B7" : "#D4D4D4";
  const strokeRole = isColored ? "#10B981" : "#737373";
  const fillCrown = isColored ? "#022C22" : "#262626";
  const fillLed = isColored ? "#A7F3D0" : "#E5E5E5";

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
      {/* Primary Write Authority Indicator (Crown / Master Peak) */}
      <path
        d="M11 3.5l2.5 3 2.5-3 2.5 3 2.5-3v3.5h-10V3.5z"
        fill={fillCrown}
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="3" r="0.8" fill={fillLed} />

      {/* Top Storage Cap */}
      <ellipse
        cx="16"
        cy="9.5"
        rx="10.5"
        ry="3.2"
        fill={fillFoundation}
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Main Database Enclosure */}
      <path
        d="M5.5 9.5v14c0 1.77 4.7 3.2 10.5 3.2s10.5-1.43 10.5-3.2v-14"
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Write Stratum 1 */}
      <path
        d="M5.5 14.5c0 1.77 4.7 3.2 10.5 3.2s10.5-1.43 10.5-3.2"
        stroke={strokeRole}
        strokeWidth="1.2"
      />

      {/* Write Stratum 2 */}
      <path
        d="M5.5 19.5c0 1.77 4.7 3.2 10.5 3.2s10.5-1.43 10.5-3.2"
        stroke={strokeRole}
        strokeWidth="1.2"
      />

      {/* Primary Write IO Status Indicator */}
      <circle cx="16" cy="21.5" r="1.5" fill={fillLed} />
    </svg>
  );
};

