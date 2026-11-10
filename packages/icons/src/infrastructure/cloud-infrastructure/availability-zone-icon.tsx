import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const AvailabilityZoneIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Availability Zone",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#A78BFA" : "#A3A3A3";
  const strokeAccent = isColored ? "#DDD6FE" : "#D4D4D4";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const fillSurface = isColored ? "#4C1D95" : "#1F1F1F";

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
      {/* Zone Enclosure Vault (Rounded Hexagon / Shield Boundary) */}
      <rect
        x="4.5"
        y="4.5"
        width="23"
        height="23"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Internal Subnet / Failure Domain Isolation Dividers */}
      <line x1="4.5" y1="12" x2="27.5" y2="12" stroke={strokeColor} strokeWidth="1" strokeDasharray="1.5 1.5" />
      <line x1="16" y1="12" x2="16" y2="27.5" stroke={strokeColor} strokeWidth="1" strokeDasharray="1.5 1.5" />

      {/* Regional Gateway Port (Top Header) */}
      <rect x="12" y="3" width="8" height="3" rx="1" fill={fillSurface} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="16" cy="4.5" r="0.75" fill={strokeAccent} />

      {/* Zone Data Center Rack 1 (Bottom Left) */}
      <rect x="7.5" y="15" width="6" height="9.5" rx="1" fill={fillSurface} stroke={strokeAccent} strokeWidth="1" />
      <line x1="9" y1="17.5" x2="12" y2="17.5" stroke={strokeColor} strokeWidth="0.8" />
      <line x1="9" y1="20" x2="12" y2="20" stroke={strokeColor} strokeWidth="0.8" />
      <circle cx="10" cy="22.5" r="0.6" fill={strokeAccent} />

      {/* Zone Data Center Rack 2 (Bottom Right) */}
      <rect x="18.5" y="15" width="6" height="9.5" rx="1" fill={fillSurface} stroke={strokeAccent} strokeWidth="1" />
      <line x1="20" y1="17.5" x2="23" y2="17.5" stroke={strokeColor} strokeWidth="0.8" />
      <line x1="20" y1="20" x2="23" y2="20" stroke={strokeColor} strokeWidth="0.8" />
      <circle cx="21" cy="22.5" r="0.6" fill={strokeAccent} />

      {/* Isolation Status Indicator (Center Top) */}
      <circle cx="16" cy="8.5" r="1.5" fill={strokeAccent} />
    </svg>
  );
};
