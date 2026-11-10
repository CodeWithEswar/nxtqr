import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const GraphqlApiIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "GraphQL API",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#C084FC" : "#A3A3A3";
  const strokeAccent = isColored ? "#E9D5FF" : "#D4D4D4";
  const fillFoundation = isColored ? "#3B0764" : "#141414";
  const fillSurface = isColored ? "#581C87" : "#1F1F1F";
  const nodeFill = isColored ? "#C084FC" : "#E5E5E5";

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
      {/* Outer External Graph Boundary */}
      <polygon
        points="16,3 27,9.5 27,22.5 16,29 5,22.5 5,9.5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2.5 1.5"
      />

      {/* Internal Schema Graph Edges */}
      <path
        d="M16 8L23 13M23 13L23 21M23 21L16 25M16 25L9 21M9 21L9 13M9 13L16 8"
        stroke={strokeColor}
        strokeWidth="1.1"
      />
      <path
        d="M16 8L16 16.5M23 13L16 16.5M23 21L16 16.5M16 25L16 16.5M9 21L16 16.5M9 13L16 16.5"
        stroke={strokeAccent}
        strokeWidth="0.9"
        strokeDasharray="1.5 1.5"
      />

      {/* Central Query Hub Node */}
      <circle
        cx="16"
        cy="16.5"
        r="3"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />

      {/* Peripheral Data Field Nodes */}
      <circle cx="16" cy="8" r="1.5" fill={nodeFill} />
      <circle cx="23" cy="13" r="1.5" fill={nodeFill} />
      <circle cx="23" cy="21" r="1.5" fill={nodeFill} />
      <circle cx="16" cy="25" r="1.5" fill={nodeFill} />
      <circle cx="9" cy="21" r="1.5" fill={nodeFill} />
      <circle cx="9" cy="13" r="1.5" fill={nodeFill} />
    </svg>
  );
};

GraphqlApiIcon.displayName = "GraphqlApiIcon";

