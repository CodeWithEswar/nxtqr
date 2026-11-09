import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const WriteThroughCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Write-Through Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeOrange = isColored ? "#FB923C" : "#A3A3A3";
  const fillFoundation = isColored ? "#7C2D12" : "#1A1A1A";
  const strokeAccent = isColored ? "#FED7AA" : "#E5E5E5";
  const strokeSubtle = isColored ? "#EA580C" : "#737373";
  const fillStore = isColored ? "#431407" : "#262626";

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
      {/* Fronting Cache Memory Layer (Top) */}
      <rect
        x="6"
        y="5"
        width="20"
        height="8.5"
        rx="1.5"
        fill={fillFoundation}
        stroke={strokeOrange}
        strokeWidth="1.4"
      />
      <line x1="8.5" y1="9.25" x2="13.5" y2="9.25" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />

      {/* Backing Persistent Data Store (Bottom Database Cylinder) */}
      <ellipse cx="16" cy="20" rx="9" ry="2.75" fill={fillStore} stroke={strokeOrange} strokeWidth="1.3" />
      <path
        d="M7 20v5c0 1.52 4.03 2.75 9 2.75s9-1.23 9-2.75v-5"
        stroke={strokeOrange}
        strokeWidth="1.3"
      />

      {/* Synchronous Write Pipeline (Dual Solid Down Arrows) */}
      <line x1="13.5" y1="13.5" x2="13.5" y2="19.5" stroke={strokeSubtle} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11.5 17.5l2 2 2-2" stroke={strokeSubtle} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

      <line x1="18.5" y1="13.5" x2="18.5" y2="19.5" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16.5 17.5l2 2 2-2" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Synchronous Lockstep Confirmation Pin / Padlock Glyph */}
      <circle cx="23.5" cy="14" r="3" fill={fillFoundation} stroke={strokeOrange} strokeWidth="1.1" />
      <path
        d="M22.5 14v-0.8c0-0.55 0.45-1 1-1s1 0.45 1 1v0.8"
        stroke={strokeAccent}
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <rect x="22" y="14" width="3" height="2" rx="0.5" fill={strokeAccent} />
    </svg>
  );
};
