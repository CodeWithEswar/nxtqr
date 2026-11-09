import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const AnycastNetworkIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Anycast Network",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeRing = isColored ? "#0284C7" : "#404040";
  const strokeCore = isColored ? "#38BDF8" : "#A3A3A3";
  const fillCore = isColored ? "#0C4A6E" : "#1A1A1A";
  const strokeBroadcast = isColored ? "#60A5FA" : "#525252";
  const fillAnycastNode = isColored ? "#0369A1" : "#262626";
  const strokeNode = isColored ? "#7DD3FC" : "#737373";
  const fillIpDot = isColored ? "#BAE6FD" : "#E5E5E5";

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
      {/* Symmetrical Anycast Broadcast Mesh */}
      <circle cx="16" cy="16" r="10" stroke={strokeRing} strokeWidth="1" strokeDasharray="2 2" />

      {/* Symmetrical Radiating Broadcast Paths to Identical PoPs */}
      <line x1="16" y1="12" x2="16" y2="7.5" stroke={strokeBroadcast} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="20" x2="16" y2="24.5" stroke={strokeBroadcast} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="16" x2="7.5" y2="16" stroke={strokeBroadcast} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="20" y1="16" x2="24.5" y2="16" stroke={strokeBroadcast} strokeWidth="1.2" strokeLinecap="round" />

      {/* Identical Shared Anycast Edge PoPs (Same Address announced from all) */}
      <circle cx="16" cy="6" r="2.5" fill={fillAnycastNode} stroke={strokeNode} strokeWidth="1.2" />
      <circle cx="16" cy="26" r="2.5" fill={fillAnycastNode} stroke={strokeNode} strokeWidth="1.2" />
      <circle cx="6" cy="16" r="2.5" fill={fillAnycastNode} stroke={strokeNode} strokeWidth="1.2" />
      <circle cx="26" cy="16" r="2.5" fill={fillAnycastNode} stroke={strokeNode} strokeWidth="1.2" />

      {/* Central Logical Service Identity IP Core */}
      <rect
        x="11.5"
        y="11.5"
        width="9"
        height="9"
        rx="2"
        fill={fillCore}
        stroke={strokeCore}
        strokeWidth="1.5"
      />
      {/* Single Shared IP Address Pin Motif (BGP Announced Identity) */}
      <circle cx="16" cy="16" r="1.5" fill={fillIpDot} />
    </svg>
  );
};

