import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ComputeInstanceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Compute Instance",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#34D399" : "#A3A3A3";
  const strokeAccent = isColored ? "#A7F3D0" : "#D4D4D4";
  const fillFoundation = isColored ? "#064E3B" : "#141414";
  const fillSurface = isColored ? "#065F46" : "#1F1F1F";

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
      {/* Virtual Compute Server Enclosure */}
      <rect
        x="4"
        y="5"
        width="24"
        height="22"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Central CPU Die Package */}
      <rect
        x="10"
        y="10"
        width="12"
        height="12"
        rx="2"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* CPU Silicon Core Center */}
      <rect x="13" y="13" width="6" height="6" rx="1" fill={strokeColor} />

      {/* CPU Interconnect Pins (North, South, East, West) */}
      {/* Top pins */}
      <line x1="12" y1="7.5" x2="12" y2="10" stroke={strokeAccent} strokeWidth="1" />
      <line x1="16" y1="7.5" x2="16" y2="10" stroke={strokeAccent} strokeWidth="1" />
      <line x1="20" y1="7.5" x2="20" y2="10" stroke={strokeAccent} strokeWidth="1" />

      {/* Bottom pins */}
      <line x1="12" y1="22" x2="12" y2="24.5" stroke={strokeAccent} strokeWidth="1" />
      <line x1="16" y1="22" x2="16" y2="24.5" stroke={strokeAccent} strokeWidth="1" />
      <line x1="20" y1="22" x2="20" y2="24.5" stroke={strokeAccent} strokeWidth="1" />

      {/* Virtual NIC indicators (Left & Right) */}
      <circle cx="6.5" cy="16" r="1" fill={strokeAccent} />
      <circle cx="25.5" cy="16" r="1" fill={strokeAccent} />
    </svg>
  );
};
