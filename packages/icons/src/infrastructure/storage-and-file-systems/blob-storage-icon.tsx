import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const BlobStorageIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Blob Storage",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeGreen = isColored ? "#34D399" : "#A3A3A3";
  const fillDeep = isColored ? "#059669" : "#262626";
  const fillFoundation = isColored ? "#022C22" : "#141414";
  const strokeAccent = isColored ? "#A7F3D0" : "#E5E5E5";
  const fillBlob = isColored ? "#047857" : "#1F1F1F";

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
      {/* Cylindrical / Vault Chamber Enclosure */}
      <path
        d="M6 9C6 6.5 10.5 4.5 16 4.5C21.5 4.5 26 6.5 26 9V23C26 25.5 21.5 27.5 16 27.5C10.5 27.5 6 25.5 6 23V9Z"
        fill={fillFoundation}
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Top Chamber Cap */}
      <ellipse
        cx="16"
        cy="9"
        rx="10"
        ry="4.5"
        fill={fillDeep}
        stroke={strokeGreen}
        strokeWidth="1.5"
      />

      {/* Internal Tier Partition Ribs */}
      <path
        d="M6 16C6 18.2 10.5 20 16 20C21.5 20 26 18.2 26 16"
        stroke={strokeGreen}
        strokeWidth="1.2"
        strokeDasharray="2 1.5"
        strokeOpacity={isColored ? 0.7 : 0.4}
      />

      {/* Binary Chunk / Blob Payload Representation (Organic Segmented Binary Capsule) */}
      <g transform="translate(16, 17)">
        {/* Blob Payload Shape */}
        <path
          d="M-5 -3C-5 -4.5 -2.5 -5.5 0 -5.5C2.5 -5.5 5 -4.5 5 -3C5 -1.5 3 0 4.5 2C6 4 3 6 0 6C-3 6 -6 4 -4.5 2C-3 0 -5 -1.5 -5 -3Z"
          fill={fillBlob}
          stroke={strokeAccent}
          strokeWidth="1.2"
        />

        {/* Binary Markers (0 and 1 dots and hashes) */}
        <text
          x="-3"
          y="2.5"
          fill={strokeAccent}
          fontSize="5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          01
        </text>
      </g>
    </svg>
  );
};
