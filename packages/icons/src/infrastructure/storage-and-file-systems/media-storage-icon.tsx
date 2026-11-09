import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const MediaStorageIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Media Storage",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeLavender = isColored ? "#C4B5FD" : "#A3A3A3";
  const fillDeep = isColored ? "#7C3AED" : "#262626";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const strokeAccent = isColored ? "#DDD6FE" : "#E5E5E5";
  const fillMedia = isColored ? "#6D28D9" : "#1F1F1F";

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
      {/* Outer Storage Server Chassis / Media Enclosure */}
      <rect
        x="4"
        y="5"
        width="24"
        height="22"
        rx="2.5"
        fill={fillFoundation}
        stroke={strokeLavender}
        strokeWidth="1.5"
      />

      {/* Media Film Strip Sprocket Perforations (Top Banner) */}
      <path
        d="M4 10H28"
        stroke={strokeLavender}
        strokeWidth="1.2"
        strokeOpacity={isColored ? 0.7 : 0.4}
      />
      <rect x="6.5" y="6.75" width="2" height="1.75" rx="0.5" fill={strokeAccent} />
      <rect x="11.5" y="6.75" width="2" height="1.75" rx="0.5" fill={strokeAccent} />
      <rect x="16.5" y="6.75" width="2" height="1.75" rx="0.5" fill={strokeAccent} />
      <rect x="21.5" y="6.75" width="2" height="1.75" rx="0.5" fill={strokeAccent} />

      {/* Main Media Asset Canvas / Screen (Video/Image/Audio Frame) */}
      <rect
        x="7"
        y="12.5"
        width="18"
        height="11.5"
        rx="1.5"
        fill={fillMedia}
        stroke={strokeAccent}
        strokeWidth="1.1"
      />

      {/* Clean Geometric Media Triangle (Play & Ingest Glyph) */}
      <path
        d="M14 15.5L19 18.25L14 21V15.5Z"
        fill={fillDeep}
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Sound / Resolution Waveform Indicator at Bottom */}
      <path
        d="M6 25H8M11 25H14M17 25H21M24 25H26"
        stroke={strokeLavender}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
