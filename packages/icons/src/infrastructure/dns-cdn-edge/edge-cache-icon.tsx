import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const EdgeCacheIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Edge Cache",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#FBBF24" : "#A3A3A3";
  const fillPlate = isColored ? "#451A03" : "#1A1A1A";
  const fillSlot = isColored ? "#D97706" : "#262626";
  const strokeSlot = isColored ? "#FDE68A" : "#737373";
  const fillHitFlash = isColored ? "#FBBF24" : "#E5E5E5";
  const strokeLine = isColored ? "#B45309" : "#404040";

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
      {/* Top Memory Tier Bank */}
      <rect
        x="6"
        y="5"
        width="20"
        height="8"
        rx="2"
        fill={fillPlate}
        stroke={strokePrimary}
        strokeWidth="1.5"
      />
      {/* Fast Cache Blocks in Top Bank */}
      <rect x="8.5" y="7.5" width="3" height="3" rx="0.5" fill={fillSlot} stroke={strokeSlot} strokeWidth="0.8" />
      <rect x="13" y="7.5" width="3" height="3" rx="0.5" fill={fillSlot} stroke={strokeSlot} strokeWidth="0.8" />
      <rect x="17.5" y="7.5" width="3" height="3" rx="0.5" fill={fillSlot} stroke={strokeSlot} strokeWidth="0.8" />
      <line x1="22" y1="9" x2="24" y2="9" stroke={strokeSlot} strokeWidth="1" strokeLinecap="round" />

      {/* Inter-tier Bus Interconnect */}
      <line x1="10" y1="13" x2="10" y2="17" stroke={strokeLine} strokeWidth="1.2" />
      <line x1="22" y1="13" x2="22" y2="17" stroke={strokeLine} strokeWidth="1.2" />

      {/* Bottom Storage Tier Bank */}
      <rect
        x="6"
        y="17"
        width="20"
        height="10"
        rx="2"
        fill={fillPlate}
        stroke={strokePrimary}
        strokeWidth="1.5"
      />
      {/* Storage Striping */}
      <rect x="8.5" y="20" width="15" height="2" rx="0.5" fill={fillSlot} />
      <rect x="8.5" y="23.5" width="9" height="2" rx="0.5" fill={fillSlot} />

      {/* Ultra-Fast Cache Hit / Lightning Accent (Center Edge) */}
      <path
        d="M20 12l-3 4h3l-2 5 5-6h-3l2-3h-2z"
        fill={fillHitFlash}
        stroke="#080808"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
};

