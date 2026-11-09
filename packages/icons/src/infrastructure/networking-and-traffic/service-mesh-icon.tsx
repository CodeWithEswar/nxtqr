import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ServiceMeshIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Service Mesh",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeMesh = isColored ? "#818CF8" : "#A3A3A3";
  const strokeSidecar = isColored ? "#A78BFA" : "#737373";
  const strokeTls = isColored ? "#34D399" : "#525252";
  const fillNode = isColored ? "#312E81" : "#1A1A1A";
  const fillSidecar = isColored ? "#4C1D95" : "#262626";
  const fillAccent = isColored ? "#C7D2FE" : "#D4D4D4";

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
      {/* Bidirectional Mesh Interconnect Lines */}
      <polygon
        points="16,5 26,22 6,22"
        stroke={strokeMesh}
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      <circle cx="16" cy="14" r="1.5" fill={strokeTls} />

      {/* Node 1: Top Microservice & Sidecar Proxy */}
      <circle cx="16" cy="6" r="3" fill={fillNode} stroke={strokeMesh} strokeWidth="1.2" />
      <rect x="18" y="3" width="3" height="3" rx="0.75" fill={fillSidecar} stroke={strokeSidecar} strokeWidth="0.8" />
      <circle cx="16" cy="6" r="1" fill={fillAccent} />

      {/* Node 2: Bottom-Left Microservice & Sidecar Proxy */}
      <circle cx="7" cy="22" r="3" fill={fillNode} stroke={strokeMesh} strokeWidth="1.2" />
      <rect x="3.5" y="22" width="3" height="3" rx="0.75" fill={fillSidecar} stroke={strokeSidecar} strokeWidth="0.8" />
      <circle cx="7" cy="22" r="1" fill={fillAccent} />

      {/* Node 3: Bottom-Right Microservice & Sidecar Proxy */}
      <circle cx="25" cy="22" r="3" fill={fillNode} stroke={strokeMesh} strokeWidth="1.2" />
      <rect x="25.5" y="22" width="3" height="3" rx="0.75" fill={fillSidecar} stroke={strokeSidecar} strokeWidth="0.8" />
      <circle cx="25" cy="22" r="1" fill={fillAccent} />
    </svg>
  );
};

