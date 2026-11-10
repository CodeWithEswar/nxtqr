import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const GpuClusterIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "GPU Cluster",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#10B981" : "#A3A3A3";
  const strokeAccent = isColored ? "#34D399" : "#E5E5E5";
  const fillChassis = isColored ? "#064E3B" : "#141414";
  const fillDie = isColored ? "#047857" : "#262626";
  const accentMesh = isColored ? "#6EE7B7" : "#E5E5E5";

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
      {/* Rack / Blade Enclosure */}
      <rect
        x="2"
        y="3"
        width="28"
        height="26"
        rx="2.5"
        fill={fillChassis}
        stroke={strokeColor}
        strokeWidth="1.2"
      />

      {/* GPU Die 1 (Top-Left) */}
      <rect x="5" y="6" width="9" height="8" rx="1.5" fill={fillDie} stroke={strokeAccent} strokeWidth="1" />
      <rect x="7" y="8" width="5" height="4" rx="0.5" fill={accentMesh} />

      {/* GPU Die 2 (Top-Right) */}
      <rect x="18" y="6" width="9" height="8" rx="1.5" fill={fillDie} stroke={strokeAccent} strokeWidth="1" />
      <rect x="20" y="8" width="5" height="4" rx="0.5" fill={accentMesh} />

      {/* GPU Die 3 (Bottom-Left) */}
      <rect x="5" y="18" width="9" height="8" rx="1.5" fill={fillDie} stroke={strokeAccent} strokeWidth="1" />
      <rect x="7" y="20" width="5" height="4" rx="0.5" fill={accentMesh} />

      {/* GPU Die 4 (Bottom-Right) */}
      <rect x="18" y="18" width="9" height="8" rx="1.5" fill={fillDie} stroke={strokeAccent} strokeWidth="1" />
      <rect x="20" y="20" width="5" height="4" rx="0.5" fill={accentMesh} />

      {/* NVLink / InfiniBand High-Speed Crossbar Fabric */}
      <line x1="14" y1="10" x2="18" y2="10" stroke={accentMesh} strokeWidth="1.3" />
      <line x1="14" y1="22" x2="18" y2="22" stroke={accentMesh} strokeWidth="1.3" />
      <line x1="9.5" y1="14" x2="9.5" y2="18" stroke={accentMesh} strokeWidth="1.3" />
      <line x1="22.5" y1="14" x2="22.5" y2="18" stroke={accentMesh} strokeWidth="1.3" />

      {/* Central Fabric Switch Hub */}
      <circle cx="16" cy="16" r="2.2" fill={fillChassis} stroke={accentMesh} strokeWidth="1.2" />
      <line x1="14.5" y1="14.5" x2="12" y2="12" stroke={accentMesh} strokeWidth="0.8" />
      <line x1="17.5" y1="14.5" x2="20" y2="12" stroke={accentMesh} strokeWidth="0.8" />
      <line x1="14.5" y1="17.5" x2="12" y2="20" stroke={accentMesh} strokeWidth="0.8" />
      <line x1="17.5" y1="17.5" x2="20" y2="20" stroke={accentMesh} strokeWidth="0.8" />
    </svg>
  );
};

