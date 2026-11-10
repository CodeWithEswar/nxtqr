import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const SearchCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Search Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeOrange = isColored ? "#FB923C" : "#A3A3A3";
  const strokeAccent = isColored ? "#FED7AA" : "#E5E5E5";
  const fillFoundation = isColored ? "#431407" : "#141414";
  const fillVault = isColored ? "#7C2D12" : "#262626";

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
      {/* Outer Cache Block Structure */}
      <rect
        x="4.5"
        y="4.5"
        width="23"
        height="23"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokeOrange}
        strokeWidth="1.5"
      />

      {/* Internal Fast-Lookup Cache Shard Box */}
      <rect
        x="7.5"
        y="7.5"
        width="17"
        height="17"
        rx="2"
        fill={fillVault}
        stroke={strokeOrange}
        strokeWidth="1"
      />

      {/* Search Lens Inset Badge (Query-Aware Cache) */}
      <circle cx="13" cy="13" r="3.5" stroke={strokeAccent} strokeWidth="1.2" />
      <line x1="15.5" y1="15.5" x2="18" y2="18" stroke={strokeAccent} strokeWidth="1.4" strokeLinecap="round" />

      {/* Lightning Flash Fast Cache Hit Symbol */}
      <polygon
        points="17,10 13,17 17,17 15,22 21,14 17,14"
        fill={strokeOrange}
        stroke={strokeAccent}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Cache TTL Indicator Hashes */}
      <line x1="9.5" y1="21.5" x2="12.5" y2="21.5" stroke={strokeAccent} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
};
