import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ContainerRegistryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Container Registry",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#60A5FA" : "#A3A3A3";
  const strokeAccent = isColored ? "#BFDBFE" : "#D4D4D4";
  const fillFoundation = isColored ? "#172554" : "#141414";
  const fillSurface = isColored ? "#1E3A8A" : "#1F1F1F";

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
      {/* Registry Storage Enclosure */}
      <rect
        x="4"
        y="5"
        width="24"
        height="22"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Layered Container Cargo Cells (OCI Image Layers Stack) */}
      {/* Top Left Cell */}
      <rect x="7" y="8" width="5.5" height="4.5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      {/* Top Middle Cell */}
      <rect x="13.2" y="8" width="5.5" height="4.5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      {/* Top Right Cell */}
      <rect x="19.5" y="8" width="5.5" height="4.5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />

      {/* Second Row Cell Left */}
      <rect x="7" y="13.5" width="5.5" height="4.5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      {/* Second Row Cell Middle (Highlighted Active Tag) */}
      <rect x="13.2" y="13.5" width="5.5" height="4.5" rx="1" fill={strokeColor} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="16" cy="15.7" r="1" fill="#FFFFFF" />
      {/* Second Row Cell Right */}
      <rect x="19.5" y="13.5" width="5.5" height="4.5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />

      {/* Image Digest Hash / Manifest Bar (sha256 representation) */}
      <rect x="7" y="20" width="18" height="4.5" rx="1" fill={fillSurface} stroke={strokeAccent} strokeWidth="0.8" />
      <line x1="9.5" y1="22.2" x2="16" y2="22.2" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <circle cx="19" cy="22.2" r="0.8" fill={isColored ? "#38BDF8" : "#A3A3A3"} />
      <circle cx="21.5" cy="22.2" r="0.8" fill={isColored ? "#34D399" : "#D4D4D4"} />

      {/* Container Push / Pull Directional Flow Marker */}
      <path d="M16 2V5" stroke={strokeColor} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
};

