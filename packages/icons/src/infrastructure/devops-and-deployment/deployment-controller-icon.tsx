import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DeploymentControllerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Deployment Controller",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#2DD4BF" : "#A3A3A3";
  const strokeAccent = isColored ? "#99F6E4" : "#D4D4D4";
  const fillFoundation = isColored ? "#042F2E" : "#141414";
  const fillSurface = isColored ? "#134E4A" : "#1F1F1F";

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
      {/* Central Reconciliation Controller Loop */}
      {/* Outer Continuous Feedback Loop Track */}
      <circle
        cx="16"
        cy="16"
        r="11.5"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="4 2.5"
      />

      {/* Controller Reconciler Center Core */}
      <rect
        x="11"
        y="11"
        width="10"
        height="10"
        rx="2"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      <circle cx="16" cy="16" r="2" fill={strokeAccent} />

      {/* Managed Replica Set Workload Nodes (Managed Pods on Orbital Ring) */}
      {/* Top Desired State Pod */}
      <rect x="13.5" y="2.5" width="5" height="5" rx="1" fill={fillSurface} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="16" cy="5" r="0.8" fill={isColored ? "#2DD4BF" : "#FFFFFF"} />

      {/* Bottom Running Actual Workload Pod */}
      <rect x="13.5" y="24.5" width="5" height="5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      <circle cx="16" cy="27" r="0.8" fill={isColored ? "#34D399" : "#D4D4D4"} />

      {/* Left Canary Stage Pod */}
      <rect x="2.5" y="13.5" width="5" height="5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />

      {/* Right Rolling Upgrade Pod */}
      <rect x="24.5" y="13.5" width="5" height="5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />

      {/* Reconciliation Sync Tangent Arrows */}
      <path d="M19 3.5L21 4.5L19 5.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 28.5L11 27.5L13 26.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

