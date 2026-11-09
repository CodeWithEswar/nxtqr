import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ContainerClusterIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Container Cluster",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeTeal = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillBoundary = isColored ? "#042F2E" : "#141414";
  const strokeBox = isColored ? "#14B8A6" : "#737373";
  const fillBox = isColored ? "#115E59" : "#262626";
  const strokeBus = isColored ? "#5EEAD4" : "#525252";
  const fillAccent = isColored ? "#CCFBF1" : "#D4D4D4";

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
      {/* Cluster Orchestration Boundary (Managed Boundary) */}
      <rect
        x="3.5"
        y="3.5"
        width="25"
        height="25"
        rx="3.5"
        fill={fillBoundary}
        stroke={strokeTeal}
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />

      {/* Cluster Control Plane Interconnect Bus */}
      <path
        d="M10 16h12M16 10v12"
        stroke={strokeBus}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2" fill={fillAccent} />

      {/* 4 Managed Container Workloads (2x2 Grid) */}
      <rect
        x="6"
        y="6"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill={fillBox}
        stroke={strokeBox}
        strokeWidth="1.2"
      />
      <rect
        x="18.5"
        y="6"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill={fillBox}
        stroke={strokeBox}
        strokeWidth="1.2"
      />
      <rect
        x="6"
        y="18.5"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill={fillBox}
        stroke={strokeBox}
        strokeWidth="1.2"
      />
      <rect
        x="18.5"
        y="18.5"
        width="7.5"
        height="7.5"
        rx="1.5"
        fill={fillBox}
        stroke={strokeBox}
        strokeWidth="1.2"
      />
    </svg>
  );
};

