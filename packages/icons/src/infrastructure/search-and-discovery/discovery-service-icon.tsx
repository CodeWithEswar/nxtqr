import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DiscoveryServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Discovery Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeTeal = isColored ? "#2DD4BF" : "#A3A3A3";
  const strokeAccent = isColored ? "#5EEAD4" : "#E5E5E5";
  const fillFoundation = isColored ? "#134E4A" : "#141414";
  const fillHub = isColored ? "#0F766E" : "#262626";

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
      {/* Outer Radial Discovery Field Rings */}
      <circle
        cx="16"
        cy="16"
        r="11.5"
        stroke={strokeTeal}
        strokeWidth="1.1"
        strokeDasharray="3 2"
      />
      <circle
        cx="16"
        cy="16"
        r="7.5"
        stroke={strokeTeal}
        strokeWidth="1"
        strokeDasharray="2 1.5"
      />

      {/* Central Search Discovery Hub */}
      <circle
        cx="16"
        cy="16"
        r="4"
        fill={fillHub}
        stroke={strokeAccent}
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="1.5" fill={strokeAccent} />

      {/* Discovered Resource Node 1 (Top Left) */}
      <circle cx="7" cy="8" r="2.5" fill={fillFoundation} stroke={strokeTeal} strokeWidth="1.2" />
      <line x1="9" y1="10" x2="13" y2="13.5" stroke={strokeTeal} strokeWidth="1" strokeLinecap="round" />

      {/* Discovered Resource Node 2 (Top Right — Highlighted Match) */}
      <circle cx="25" cy="8" r="3" fill={fillHub} stroke={strokeAccent} strokeWidth="1.4" />
      <circle cx="25" cy="8" r="1" fill={strokeAccent} />
      <line x1="23" y1="10" x2="19" y2="13.5" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />

      {/* Discovered Resource Node 3 (Bottom Left) */}
      <circle cx="8" cy="24" r="2" fill={fillFoundation} stroke={strokeTeal} strokeWidth="1" />
      <line x1="10" y1="22" x2="13.5" y2="18.5" stroke={strokeTeal} strokeWidth="0.9" strokeLinecap="round" />

      {/* Discovered Resource Node 4 (Bottom Right) */}
      <circle cx="24" cy="24" r="2.5" fill={fillFoundation} stroke={strokeTeal} strokeWidth="1.2" />
      <line x1="22" y1="22" x2="18.5" y2="18.5" stroke={strokeTeal} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};
