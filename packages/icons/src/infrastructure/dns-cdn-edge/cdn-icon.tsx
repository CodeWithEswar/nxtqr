import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CdnIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Content Delivery Network",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeRing = isColored ? "#0284C7" : "#404040";
  const strokeCore = isColored ? "#38BDF8" : "#A3A3A3";
  const fillCore = isColored ? "#0C4A6E" : "#1A1A1A";
  const fillEdgePoP = isColored ? "#0369A1" : "#262626";
  const strokePoP = isColored ? "#7DD3FC" : "#737373";
  const fillPulse = isColored ? "#BAE6FD" : "#E5E5E5";
  const strokeRay = isColored ? "#0284C7" : "#525252";

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
      {/* Outer Distributed PoP Orbit Ring */}
      <circle cx="16" cy="16" r="11" stroke={strokeRing} strokeWidth="1" strokeDasharray="3 3" />

      {/* Distribution Rays from Origin Core to PoPs */}
      <line x1="16" y1="12" x2="16" y2="7.5" stroke={strokeRay} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="20" x2="16" y2="24.5" stroke={strokeRay} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="16" x2="7.5" y2="16" stroke={strokeRay} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="20" y1="16" x2="24.5" y2="16" stroke={strokeRay} strokeWidth="1.2" strokeLinecap="round" />

      {/* Central Content Origin Core */}
      <rect
        x="12"
        y="12"
        width="8"
        height="8"
        rx="2"
        fill={fillCore}
        stroke={strokeCore}
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="1.5" fill={fillPulse} />

      {/* Distributed Edge PoP Nodes */}
      {/* North Edge PoP */}
      <circle cx="16" cy="5" r="2.5" fill={fillEdgePoP} stroke={strokePoP} strokeWidth="1.2" />
      {/* South Edge PoP */}
      <circle cx="16" cy="27" r="2.5" fill={fillEdgePoP} stroke={strokePoP} strokeWidth="1.2" />
      {/* West Edge PoP */}
      <circle cx="5" cy="16" r="2.5" fill={fillEdgePoP} stroke={strokePoP} strokeWidth="1.2" />
      {/* East Edge PoP */}
      <circle cx="27" cy="16" r="2.5" fill={fillEdgePoP} stroke={strokePoP} strokeWidth="1.2" />
    </svg>
  );
};

