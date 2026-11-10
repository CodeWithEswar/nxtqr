import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DataLakehouseIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Data Lakehouse",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#60A5FA" : "#A3A3A3";
  const strokeAccent = isColored ? "#93C5FD" : "#E5E5E5";
  const fillFoundation = isColored ? "#172554" : "#141414";
  const fillStructured = isColored ? "#1E3A8A" : "#262626";

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
      {/* 1. Base Layer: Object Storage & Data Lake Reservoir Foundation */}
      <path
        d="M4 22C4 20.9 9.4 20 16 20C22.6 20 28 20.9 28 22V26C28 27.7 22.6 29 16 29C9.4 29 4 27.7 4 26V22Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <ellipse cx="16" cy="22" rx="12" ry="2" fill={fillStructured} stroke={strokeColor} strokeWidth="1.1" />

      {/* 2. Middle Layer: ACID Transaction Table Format (Iceberg / Delta Metadata Logs) */}
      <rect
        x="6"
        y="12"
        width="20"
        height="7.5"
        rx="1.5"
        fill={fillStructured}
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      {/* Columnar Grid Segments */}
      <line x1="12.5" y1="12" x2="12.5" y2="19.5" stroke={strokeColor} strokeWidth="1" />
      <line x1="19.5" y1="12" x2="19.5" y2="19.5" stroke={strokeColor} strokeWidth="1" />
      <line x1="6" y1="15.5" x2="26" y2="15.5" stroke={strokeColor} strokeWidth="1" />

      {/* ACID Transaction Metadata Key Badge in Center Cell */}
      <circle cx="16" cy="15.75" r="1.5" fill={strokeAccent} />

      {/* 3. Top Layer: Analytical Query Pediment / Lakehouse Canopy */}
      <path
        d="M16 3L27 9.5H5L16 3Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Query Engine Apex Beam */}
      <circle cx="16" cy="7" r="1.5" fill={strokeAccent} />
      <line x1="10" y1="9.5" x2="10" y2="12" stroke={strokeAccent} strokeWidth="1.2" />
      <line x1="16" y1="9.5" x2="16" y2="12" stroke={strokeAccent} strokeWidth="1.2" />
      <line x1="22" y1="9.5" x2="22" y2="12" stroke={strokeAccent} strokeWidth="1.2" />
    </svg>
  );
};
