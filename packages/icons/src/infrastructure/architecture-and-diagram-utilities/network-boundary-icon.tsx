import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const NetworkBoundaryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Network Boundary",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#60A5FA" : "#A3A3A3";
  const strokeAccent = isColored ? "#BFDBFE" : "#E5E5E5";
  const fillFoundation = isColored ? "#172554" : "#141414";
  const fillNode = isColored ? "#1E3A8A" : "#1F1F1F";

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
      {/* Network Segment Outer Boundary */}
      <rect
        x="3"
        y="4"
        width="26"
        height="24"
        rx="4"
        fill={fillFoundation}
        stroke={strokePrimary}
        strokeWidth="1.2"
        strokeDasharray="3 2"
      />

      {/* Gateway Ingress Portal at Top Edge */}
      <rect
        x="13"
        y="2.5"
        width="6"
        height="3"
        rx="1"
        fill={strokePrimary}
      />
      <path d="M16 4V7" stroke={strokeAccent} strokeWidth="1" />

      {/* Internal Network Mesh Nodes */}
      <circle cx="9" cy="13" r="2.5" fill={fillNode} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="23" cy="13" r="2.5" fill={fillNode} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="16" cy="22" r="3" fill={fillNode} stroke={strokePrimary} strokeWidth="1.2" />

      {/* Routed Connection Mesh Lines */}
      <path
        d="M10.5 14.5L14 20"
        stroke={strokePrimary}
        strokeWidth="1"
      />
      <path
        d="M21.5 14.5L18 20"
        stroke={strokePrimary}
        strokeWidth="1"
      />
      <path
        d="M11.5 13H20.5"
        stroke={strokeAccent}
        strokeWidth="0.8"
        strokeDasharray="1.5 1.5"
      />

      {/* Node Hub Centers */}
      <circle cx="9" cy="13" r="1" fill={strokeAccent} />
      <circle cx="23" cy="13" r="1" fill={strokeAccent} />
      <circle cx="16" cy="22" r="1.2" fill={strokeAccent} />
    </svg>
  );
};
