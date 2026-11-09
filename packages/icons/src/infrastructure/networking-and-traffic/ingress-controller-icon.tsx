import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const IngressControllerIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Ingress Controller",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBoundary = isColored ? "#38BDF8" : "#A3A3A3";
  const fillCluster = isColored ? "#0C4A6E" : "#1A1A1A";
  const strokeIngress = isColored ? "#60A5FA" : "#737373";
  const strokePod = isColored ? "#34D399" : "#525252";
  const fillPod = isColored ? "#064E3B" : "#262626";
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
      {/* Cluster Perimeter (Dashed Hex / Enclosure) */}
      <rect
        x="5"
        y="8"
        width="22"
        height="19"
        rx="3.5"
        fill={fillCluster}
        stroke={strokeBoundary}
        strokeWidth="1.5"
      />

      {/* Ingress Gateway Opening at Top Border */}
      <path d="M12 8h8" stroke={fillCluster} strokeWidth="2.5" />
      <rect x="12" y="6" width="8" height="4" rx="1.5" fill={fillCluster} stroke={strokeIngress} strokeWidth="1" />

      {/* Outside Inbound Ingress Arrow */}
      <path d="M16 2v4M14 4.5l2 1.5 2-1.5" stroke={strokeIngress} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Internal Routing Core */}
      <circle cx="16" cy="14" r="2" fill={fillAccent} />

      {/* Internal Pod / Service Targets */}
      <path d="M16 16v3M14 15l-4 4M18 15l4 4" stroke={strokeBoundary} strokeWidth="1.2" strokeLinecap="round" />
      <rect x="8" y="19.5" width="4" height="4" rx="1" fill={fillPod} stroke={strokePod} strokeWidth="1" />
      <rect x="14" y="20.5" width="4" height="4" rx="1" fill={fillPod} stroke={strokePod} strokeWidth="1" />
      <rect x="20" y="19.5" width="4" height="4" rx="1" fill={fillPod} stroke={strokePod} strokeWidth="1" />
    </svg>
  );
};

