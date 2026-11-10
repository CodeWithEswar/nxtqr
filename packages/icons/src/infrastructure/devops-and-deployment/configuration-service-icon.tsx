import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ConfigurationServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Configuration Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#38BDF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#7DD3FC" : "#D4D4D4";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const fillSurface = isColored ? "#0C4A6E" : "#1F1F1F";

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
      {/* Central Configuration Server Hub (Top) */}
      <rect
        x="11"
        y="4"
        width="10"
        height="8"
        rx="2"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Sliders / Key-Value Indicator on Hub */}
      <line x1="13.5" y1="7" x2="18.5" y2="7" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <circle cx="15" cy="7" r="0.8" fill={isColored ? "#38BDF8" : "#FFFFFF"} />
      <line x1="13.5" y1="9.5" x2="18.5" y2="9.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <circle cx="17" cy="9.5" r="0.8" fill={isColored ? "#38BDF8" : "#FFFFFF"} />

      {/* Hierarchical Dynamic Dispatch Bus */}
      <line x1="16" y1="12" x2="16" y2="17" stroke={strokeColor} strokeWidth="1.2" />
      <path d="M7 17H25" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />

      {/* Distributed Environment Property Leaf Nodes (Bottom) */}
      {/* Dev / Staging Scope (Left) */}
      <line x1="7" y1="17" x2="7" y2="21" stroke={strokeColor} strokeWidth="1.2" />
      <rect x="3" y="21" width="8" height="7" rx="1.5" fill={fillSurface} stroke={strokeColor} strokeWidth="1.1" />
      <line x1="5.5" y1="24.5" x2="8.5" y2="24.5" stroke={strokeAccent} strokeWidth="0.9" strokeLinecap="round" />

      {/* Global Common Scope (Center) */}
      <line x1="16" y1="17" x2="16" y2="21" stroke={strokeColor} strokeWidth="1.2" />
      <rect x="12" y="21" width="8" height="7" rx="1.5" fill={fillSurface} stroke={strokeColor} strokeWidth="1.1" />
      <circle cx="16" cy="24.5" r="1" fill={isColored ? "#34D399" : "#D4D4D4"} />

      {/* Production Scope (Right) */}
      <line x1="25" y1="17" x2="25" y2="21" stroke={strokeColor} strokeWidth="1.2" />
      <rect x="21" y="21" width="8" height="7" rx="1.5" fill={fillSurface} stroke={strokeColor} strokeWidth="1.1" />
      <line x1="23.5" y1="24.5" x2="26.5" y2="24.5" stroke={strokeAccent} strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
};

