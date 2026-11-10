import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CloudStorageBucketIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Cloud Storage Bucket",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#2DD4BF" : "#A3A3A3";
  const strokeAccent = isColored ? "#99F6E4" : "#D4D4D4";
  const fillFoundation = isColored ? "#042F2E" : "#141414";
  const fillSurface = isColored ? "#115E59" : "#1F1F1F";

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
      {/* Cloud Object Storage Bucket Enclosure */}
      {/* Bucket Body (Tapered Cylinder) */}
      <path
        d="M6 10L8 24C8.2 25.5 11.5 27 16 27C20.5 27 23.8 25.5 24 24L26 10H6Z"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Bucket Rim (Top Opening) */}
      <ellipse
        cx="16"
        cy="10"
        rx="10"
        ry="3.5"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Structured Object Blocks (Stacked inside bucket) */}
      {/* Lower Object */}
      <rect
        x="12"
        y="17"
        width="8"
        height="5"
        rx="1"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1"
      />

      {/* Upper Object */}
      <rect
        x="13.5"
        y="13"
        width="5"
        height="3.5"
        rx="0.75"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1"
      />

      {/* Bucket Handle Arc */}
      <path
        d="M6 10C6 4.5 26 4.5 26 10"
        stroke={strokeAccent}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeDasharray="2.5 1.5"
      />
    </svg>
  );
};

