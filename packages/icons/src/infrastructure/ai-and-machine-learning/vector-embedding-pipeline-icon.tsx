import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const VectorEmbeddingPipelineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Vector Embedding Pipeline",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#6366F1" : "#A3A3A3";
  const strokeAccent = isColored ? "#818CF8" : "#E5E5E5";
  const fillDoc = isColored ? "#1E1B4B" : "#141414";
  const fillMatrix = isColored ? "#312E81" : "#262626";
  const accentPoint = isColored ? "#38BDF8" : "#FFFFFF";

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
      {/* 1. Unstructured Document Chunks (Left) */}
      <rect
        x="3"
        y="6"
        width="8"
        height="10"
        rx="1.5"
        fill={fillDoc}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <line x1="5.5" y1="9" x2="8.5" y2="9" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <line x1="5.5" y1="12" x2="8.5" y2="12" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      <rect
        x="5"
        y="16"
        width="8"
        height="10"
        rx="1.5"
        fill={fillDoc}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <line x1="7.5" y1="19" x2="10.5" y2="19" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <line x1="7.5" y1="22" x2="10.5" y2="22" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* 2. Pipeline Projection Tunnel / Funnel */}
      <path
        d="M13 11L18 14V18L13 21"
        fill={fillMatrix}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />
      <path d="M15 16H18" stroke={accentPoint} strokeWidth="1.2" strokeLinecap="round" />

      {/* 3. High-Dimensional Vector Space / Coordinate Grid (Right) */}
      <rect
        x="19"
        y="5"
        width="10"
        height="22"
        rx="2"
        fill={fillDoc}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      {/* Bracket / Coordinate Axes */}
      <path d="M21 8H20V24H21" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M27 8H28V24H27" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />

      {/* Embedded Vector Points in Space */}
      <circle cx="23" cy="11" r="1.2" fill={accentPoint} />
      <circle cx="25.5" cy="14" r="1.2" fill={strokeAccent} />
      <circle cx="22.5" cy="18" r="1.2" fill={accentPoint} />
      <circle cx="25" cy="21" r="1.2" fill={strokeAccent} />

      {/* Vector Direction Lines */}
      <line x1="23" y1="11" x2="25.5" y2="14" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="1 1" />
      <line x1="22.5" y1="18" x2="25" y2="21" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="1 1" />
    </svg>
  );
};
