import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MediaCdnIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Media CDN",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#2DD4BF" : "#A3A3A3";
  const strokeAccent = isColored ? "#5EEAD4" : "#D4D4D4";
  const fillFoundation = isColored ? "#042F2E" : "#141414";
  const fillSurface = isColored ? "#134E4A" : "#1F1F1F";

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
      {/* Central Media Origin Storage Hub */}
      <circle
        cx="16"
        cy="16"
        r="5.5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Play / Media Symbol in Origin */}
      <polygon points="15,14 18,16 15,18" fill={strokeAccent} />

      {/* Geographically Distributed Edge PoP Caches */}
      {/* Top Edge PoP */}
      <circle cx="16" cy="5" r="3" fill={fillSurface} stroke={strokeColor} strokeWidth="1.1" />
      <circle cx="16" cy="5" r="1" fill={strokeAccent} />

      {/* Bottom-Left Edge PoP */}
      <circle cx="6" cy="24" r="3" fill={fillSurface} stroke={strokeColor} strokeWidth="1.1" />
      <circle cx="6" cy="24" r="1" fill={strokeAccent} />

      {/* Bottom-Right Edge PoP */}
      <circle cx="26" cy="24" r="3" fill={fillSurface} stroke={strokeColor} strokeWidth="1.1" />
      <circle cx="26" cy="24" r="1" fill={strokeAccent} />

      {/* Interconnect Distribution Delivery Vectors */}
      <path
        d="M16 10.5V8"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2 1"
        strokeLinecap="round"
      />
      <path
        d="M11.5 19.5L8.5 21.5"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2 1"
        strokeLinecap="round"
      />
      <path
        d="M20.5 19.5L23.5 21.5"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="2 1"
        strokeLinecap="round"
      />

      {/* Segment Cache Waves (Edge Delivery to Viewers) */}
      <path d="M13 2C15 1.2 17 1.2 19 2" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <path d="M2 21C2.5 19 4 18 5 18" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <path d="M27 18C28 18 29.5 19 30 21" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};

