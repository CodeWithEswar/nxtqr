import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CloudNetworkIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Cloud Network",
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
      {/* Cloud Virtual Network Enclosure (VPC Boundary) */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Internal Subnet Demarcation Line */}
      <line
        x1="4"
        y1="16"
        x2="28"
        y2="16"
        stroke={strokeColor}
        strokeWidth="1"
        strokeDasharray="2 1.5"
      />

      {/* Public Subnet Chamber (Top) */}
      <rect
        x="7.5"
        y="7"
        width="17"
        height="6.5"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="0.9"
      />
      <circle cx="11.5" cy="10.2" r="1.2" fill={strokeAccent} />
      <line x1="14.5" y1="10.2" x2="21.5" y2="10.2" stroke={strokeAccent} strokeWidth="1" strokeDasharray="1 1" />

      {/* Private Subnet Chamber (Bottom) */}
      <rect
        x="7.5"
        y="18.5"
        width="17"
        height="6.5"
        rx="1.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="0.9"
      />
      <circle cx="11.5" cy="21.7" r="1.2" fill={strokeAccent} />
      <line x1="14.5" y1="21.7" x2="21.5" y2="21.7" stroke={strokeAccent} strokeWidth="1" strokeDasharray="1 1" />

      {/* Central Inter-Subnet Router Gateway Node */}
      <circle cx="16" cy="16" r="2.2" fill={fillFoundation} stroke={strokeColor} strokeWidth="1.2" />
      <circle cx="16" cy="16" r="0.8" fill={strokeAccent} />
    </svg>
  );
};

