import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DataLakeIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Data Lake",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#2DD4BF" : "#A3A3A3";
  const strokeAccent = isColored ? "#5EEAD4" : "#E5E5E5";
  const fillFoundation = isColored ? "#042F2E" : "#141414";
  const fillSurface = isColored ? "#0F766E" : "#262626";

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
      {/* 1. Multi-Format Floating Ingest Datasets (Raw Parquet, JSON, Tabular) */}
      <rect x="5" y="4" width="6" height="5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      <line x1="7" y1="6.5" x2="9" y2="6.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      <rect x="13" y="4" width="6" height="5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      <path d="M15 6.5H17M16 5.5V7.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      <rect x="21" y="4" width="6" height="5" rx="1" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      <circle cx="24" cy="6.5" r="1" fill={strokeAccent} />

      {/* Downward Stream Rills flowing into Lake Reservoir */}
      <path d="M8 9.5V12M16 9.5V12M24 9.5V12" stroke={strokeAccent} strokeWidth="1" strokeDasharray="1.5 1.5" strokeLinecap="round" />

      {/* 2. Layered Data Lake Reservoir Foundation */}
      <path
        d="M4 14C4 13.2 4.6 12.5 5.5 12.3L15.5 11.1C15.8 11.05 16.2 11.05 16.5 11.1L26.5 12.3C27.4 12.5 28 13.2 28 14V24C28 26.2 22.6 28 16 28C9.4 28 4 26.2 4 24V14Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Raw Zone Layer (Bottom tier ripple) */}
      <path
        d="M5 22C8 23 12 23.5 16 23.5C20 23.5 24 23 27 22"
        stroke={strokeColor}
        strokeWidth="1.1"
      />

      {/* Cleaned Zone Layer (Middle tier ripple) */}
      <path
        d="M5 18C8 19 12 19.5 16 19.5C20 19.5 24 19 27 18"
        stroke={strokeColor}
        strokeWidth="1.1"
      />

      {/* Curated Surface Wave Ring */}
      <ellipse
        cx="16"
        cy="14"
        rx="11.5"
        ry="2.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      {/* Wave Crest Ripple Accent */}
      <path
        d="M12 14.2C13.5 14.8 15 14.8 16 14.2C17 13.6 18.5 13.6 20 14.2"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};
