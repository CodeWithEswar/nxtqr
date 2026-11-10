import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ConnectionJunctionIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Connection Junction",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#2DD4BF" : "#A3A3A3";
  const strokeAccent = isColored ? "#99F6E4" : "#E5E5E5";
  const fillFoundation = isColored ? "#134E4A" : "#141414";
  const fillCenter = isColored ? "#0F766E" : "#1F1F1F";

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
      {/* 4 Orthogonal Routing Ingress/Egress Arms */}
      {/* Horizontal Axis: West to East */}
      <path
        d="M3 16H29"
        stroke={strokePrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Vertical Axis: North to South */}
      <path
        d="M16 3V29"
        stroke={strokePrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* 4 Port Connection Terminals */}
      <circle cx="4" cy="16" r="1.8" fill={fillFoundation} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="28" cy="16" r="1.8" fill={fillFoundation} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="16" cy="4" r="1.8" fill={fillFoundation} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="16" cy="28" r="1.8" fill={fillFoundation} stroke={strokeAccent} strokeWidth="1" />

      {/* Central Junction Routing Node Housing */}
      <circle
        cx="16"
        cy="16"
        r="6.5"
        fill={fillFoundation}
        stroke={strokePrimary}
        strokeWidth="1.2"
      />

      {/* Central Intersecting Core Hub */}
      <circle
        cx="16"
        cy="16"
        r="4"
        fill={fillCenter}
        stroke={strokeAccent}
        strokeWidth="1"
      />

      {/* Concentric Node Junction Core */}
      <circle cx="16" cy="16" r="1.8" fill={strokeAccent} />
    </svg>
  );
};
