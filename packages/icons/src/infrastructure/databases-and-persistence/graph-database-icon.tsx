import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const GraphDatabaseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Graph Database",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeViolet = isColored ? "#A78BFA" : "#A3A3A3";
  const fillFoundation = isColored ? "#2E1065" : "#1A1A1A";
  const strokeEdge = isColored ? "#818CF8" : "#737373";
  const fillNode = isColored ? "#581C87" : "#262626";
  const strokeAccent = isColored ? "#DDD6FE" : "#D4D4D4";
  const fillDot = isColored ? "#C4B5FD" : "#E5E5E5";

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
      {/* Top Database Disk Ellipse */}
      <ellipse
        cx="16"
        cy="6"
        rx="10"
        ry="3.2"
        fill={fillFoundation}
        stroke={strokeViolet}
        strokeWidth="1.5"
      />

      {/* Database Outer Walls */}
      <path
        d="M6 6v18c0 1.77 4.48 3.2 10 3.2s10-1.43 10-3.2v-18"
        stroke={strokeViolet}
        strokeWidth="1.5"
      />

      {/* Internal Stratum Ring */}
      <path
        d="M6 11.5c0 1.77 4.48 3.2 10 3.2s10-1.43 10-3.2"
        stroke={strokeEdge}
        strokeWidth="1.2"
      />

      {/* Graph Topology Edges Linking Entities */}
      <path
        d="M16 14.5l-4.5 4.5M16 14.5l4.5 4.5M11.5 19h9M11.5 19l4.5 4.5M20.5 19l-4.5 4.5"
        stroke={strokeEdge}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Graph Node Entities */}
      {/* Top Center Node */}
      <circle cx="16" cy="14.5" r="2.2" fill={fillNode} stroke={strokeAccent} strokeWidth="1.2" />
      <circle cx="16" cy="14.5" r="0.8" fill={fillDot} />

      {/* Middle Left Node */}
      <circle cx="11.5" cy="19" r="2.2" fill={fillNode} stroke={strokeAccent} strokeWidth="1.2" />
      <circle cx="11.5" cy="19" r="0.8" fill={fillDot} />

      {/* Middle Right Node */}
      <circle cx="20.5" cy="19" r="2.2" fill={fillNode} stroke={strokeAccent} strokeWidth="1.2" />
      <circle cx="20.5" cy="19" r="0.8" fill={fillDot} />

      {/* Bottom Center Node */}
      <circle cx="16" cy="23.5" r="2.2" fill={fillNode} stroke={strokeAccent} strokeWidth="1.2" />
      <circle cx="16" cy="23.5" r="0.8" fill={fillDot} />
    </svg>
  );
};

