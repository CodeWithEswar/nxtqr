import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CdPipelineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "CD Pipeline",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#34D399" : "#A3A3A3";
  const strokeAccent = isColored ? "#A7F3D0" : "#D4D4D4";
  const fillFoundation = isColored ? "#064E3B" : "#141414";
  const fillSurface = isColored ? "#065F46" : "#1F1F1F";

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
      {/* Validated Inbound Artifact Box (Left) */}
      <rect
        x="3"
        y="11.5"
        width="8"
        height="9"
        rx="1.5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      <path d="M5.5 14H8.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <path d="M5.5 17H7.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Promotion Trajectory Arrow 1 */}
      <path d="M11 16H14M14 16L12.5 14.5M14 16L12.5 17.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Staging Environment Gate (Middle) */}
      <rect
        x="14"
        y="9"
        width="8"
        height="14"
        rx="2"
        fill={fillSurface}
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeDasharray="3 1.5"
      />
      <circle cx="18" cy="13" r="1.5" fill={strokeAccent} />
      <circle cx="18" cy="19" r="1.5" fill={isColored ? "#FBBF24" : "#A3A3A3"} />

      {/* Promotion Trajectory Arrow 2 */}
      <path d="M22 16H25M25 16L23.5 14.5M25 16L23.5 17.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Production Target Environment Node (Right) */}
      <circle
        cx="27.5"
        cy="16"
        r="4"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      <path d="M26 16L27.2 17.2L29 15" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Top Automated Rollback / Verification Loop Indicator */}
      <path
        d="M27.5 12C27.5 6 18 5 14 7"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeDasharray="2 1"
        strokeLinecap="round"
      />
    </svg>
  );
};

