import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const FileStorageIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "File Storage",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeBlue = isColored ? "#60A5FA" : "#A3A3A3";
  const fillDeep = isColored ? "#1D4ED8" : "#262626";
  const fillFoundation = isColored ? "#172554" : "#141414";
  const strokeAccent = isColored ? "#BFDBFE" : "#E5E5E5";
  const fillFile = isColored ? "#2563EB" : "#1F1F1F";

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
      {/* Background Tab / Primary Root Directory Enclosure */}
      <path
        d="M4 8C4 6.9 4.9 6 6 6H12L14.5 8.5H26C27.1 8.5 28 9.4 28 10.5V24C28 25.1 27.1 26 26 26H6C4.9 26 4 25.1 4 24V8Z"
        fill={fillFoundation}
        stroke={strokeBlue}
        strokeWidth="1.5"
      />

      {/* Directory Fold Flap Accent */}
      <path
        d="M4 12H28"
        stroke={strokeBlue}
        strokeWidth="1.2"
        strokeOpacity={isColored ? 0.6 : 0.4}
      />

      {/* Hierarchical Nested File Tree System */}
      {/* Directory Node 1 (Root node line) */}
      <path
        d="M9 15V22M9 18H13M9 22H13"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Nested File Document 1 */}
      <g transform="translate(14, 14.5)">
        <path
          d="M0 0H5L8 3V8H0V0Z"
          fill={fillFile}
          stroke={strokeAccent}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M5 0V3H8"
          stroke={strokeAccent}
          strokeWidth="0.9"
        />
        {/* Document Content Indicator */}
        <line x1="2" y1="4.5" x2="5" y2="4.5" stroke={strokeAccent} strokeWidth="0.8" />
        <line x1="2" y1="6" x2="6" y2="6" stroke={strokeAccent} strokeWidth="0.8" />
      </g>

      {/* Nested Sub-File Document 2 */}
      <g transform="translate(14, 19.5)">
        <path
          d="M0 0H7L10 3V6.5H0V0Z"
          fill={fillDeep}
          stroke={strokeBlue}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M7 0V3H10"
          stroke={strokeBlue}
          strokeWidth="0.9"
        />
        <line x1="2.5" y1="3.5" x2="6.5" y2="3.5" stroke={strokeBlue} strokeWidth="0.8" />
      </g>
    </svg>
  );
};
