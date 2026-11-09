import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const KubernetesServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Kubernetes Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBlue = isColored ? "#60A5FA" : "#A3A3A3";
  const fillVip = isColored ? "#1E3A8A" : "#1A1A1A";
  const strokeBranch = isColored ? "#38BDF8" : "#737373";
  const fillPod = isColored ? "#0284C7" : "#262626";
  const strokePod = isColored ? "#93C5FD" : "#525252";
  const fillAccent = isColored ? "#DBEAFE" : "#D4D4D4";

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
      {/* Top Stable Virtual IP (ClusterIP) Service Gateway */}
      <rect
        x="9.5"
        y="4"
        width="13"
        height="9"
        rx="2"
        fill={fillVip}
        stroke={strokeBlue}
        strokeWidth="1.5"
      />
      <circle cx="16" cy="8.5" r="2" fill={fillAccent} />

      {/* Internal Routing Multiplexer / Selector Fanout Paths */}
      <path
        d="M16 13v4M16 17L8.5 21M16 17l7.5 4"
        stroke={strokeBranch}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3 Destination Matching Pod Endpoints */}
      {/* Left Pod Endpoint */}
      <circle cx="8" cy="24" r="3.5" fill={fillPod} stroke={strokePod} strokeWidth="1.2" />
      <circle cx="8" cy="24" r="1.2" fill={fillAccent} />

      {/* Center Pod Endpoint */}
      <circle cx="16" cy="25.5" r="3.5" fill={fillPod} stroke={strokePod} strokeWidth="1.2" />
      <circle cx="16" cy="25.5" r="1.2" fill={fillAccent} />

      {/* Right Pod Endpoint */}
      <circle cx="24" cy="24" r="3.5" fill={fillPod} stroke={strokePod} strokeWidth="1.2" />
      <circle cx="24" cy="24" r="1.2" fill={fillAccent} />
    </svg>
  );
};

