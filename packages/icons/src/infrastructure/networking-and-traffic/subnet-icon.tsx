import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SubnetIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Subnet",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeFrame = isColored ? "#60A5FA" : "#A3A3A3";
  const strokeSubnet = isColored ? "#38BDF8" : "#737373";
  const fillActive = isColored ? "#0284C7" : "#333333";
  const fillPassive = isColored ? "#0C4A6E" : "#1A1A1A";
  const fillAccent = isColored ? "#BAE6FD" : "#D4D4D4";

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
      {/* Outer Network Enclosure (Subnet Parent Perimeter) */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3"
        stroke={strokeFrame}
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />

      {/* 4 Segmented Subnet Blocks */}
      {/* Top Left: Active Highlighted Subnet */}
      <rect
        x="7"
        y="7"
        width="8"
        height="8"
        rx="2"
        fill={fillActive}
        stroke={strokeSubnet}
        strokeWidth="1.5"
      />
      <circle cx="11" cy="11" r="1.5" fill={fillAccent} />

      {/* Top Right: Passive Block */}
      <rect x="17" y="7" width="8" height="8" rx="2" fill={fillPassive} stroke={strokeFrame} strokeWidth="1" />

      {/* Bottom Left: Passive Block */}
      <rect x="7" y="17" width="8" height="8" rx="2" fill={fillPassive} stroke={strokeFrame} strokeWidth="1" />

      {/* Bottom Right: Passive Block */}
      <rect x="17" y="17" width="8" height="8" rx="2" fill={fillPassive} stroke={strokeFrame} strokeWidth="1" />

      {/* Gateway Cross Connector */}
      <path d="M15 11h2M11 15v2M21 15v2M15 21h2" stroke={strokeSubnet} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};

