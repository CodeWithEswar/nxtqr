import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ReadThroughCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Read-Through Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBlue = isColored ? "#60A5FA" : "#A3A3A3";
  const fillFoundation = isColored ? "#1E3A8A" : "#1A1A1A";
  const strokeAccent = isColored ? "#BFDBFE" : "#E5E5E5";
  const strokeSubtle = isColored ? "#2563EB" : "#737373";
  const fillStore = isColored ? "#172554" : "#262626";

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
        stroke={strokeBlue}
        strokeWidth="1.4"
      />
      <line x1="8.5" y1="9.25" x2="14.5" y2="9.25" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />

      {/* Backing Persistent Data Store (Bottom Database Cylinder) */}
      <ellipse cx="16" cy="20" rx="9" ry="2.75" fill={fillStore} stroke={strokeBlue} strokeWidth="1.3" />
      <path
        d="M7 20v5c0 1.52 4.03 2.75 9 2.75s9-1.23 9-2.75v-5"
        stroke={strokeBlue}
        strokeWidth="1.3"
      />

      {/* Read-Through Directional Flow Arrow (Cache-Miss Transparent Fetch) */}
      <path
        d="M16 11v8.5"
        stroke={strokeAccent}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.5 17.5l2.5 2.5 2.5-2.5"
        stroke={strokeAccent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Side Return / Read Hit Bypass Loop */}
      <path
        d="M23 9.25h3.5v9.5H23"
        stroke={strokeSubtle}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeDasharray="2 1.5"
      />
      <polyline points="24 17.5 23 18.75 24 20" stroke={strokeSubtle} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

