import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ExternalDependencyIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "External Dependency",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#FB923C" : "#A3A3A3";
  const strokeAccent = isColored ? "#FED7AA" : "#E5E5E5";
  const fillFoundation = isColored ? "#431407" : "#141414";
  const fillSurface = isColored ? "#7C2D12" : "#1F1F1F";

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
      {/* Outer External Cloud / Third-Party World Boundary */}
      <path
        d="M3 16C3 10.4772 7.47715 6 13 6H21C25.4183 6 29 9.58172 29 14C29 18.4183 25.4183 22 21 22H11"
        stroke={strokePrimary}
        strokeWidth="1.2"
        strokeDasharray="3 2"
        strokeLinecap="round"
      />

      {/* External System Cube / Box */}
      <rect
        x="13"
        y="11"
        width="14"
        height="14"
        rx="2"
        fill={fillFoundation}
        stroke={strokePrimary}
        strokeWidth="1.2"
      />

      {/* Isometric Cube Top Face */}
      <path
        d="M13 15L20 12L27 15"
        stroke={strokeAccent}
        strokeWidth="0.8"
      />
      <path d="M20 12V25" stroke={strokeAccent} strokeWidth="0.8" />

      {/* Internal System Calling Origin Point */}
      <circle cx="6" cy="24" r="2.5" fill={fillSurface} stroke={strokePrimary} strokeWidth="1" />
      <circle cx="6" cy="24" r="1" fill={strokeAccent} />

      {/* Outbound Dependency Linkage Crossing Boundary */}
      <path
        d="M8.5 22L13 18"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M10 17.5L13 18L13.5 21"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
