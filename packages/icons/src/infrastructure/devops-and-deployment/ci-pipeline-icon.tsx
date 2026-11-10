import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const CiPipelineIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "CI Pipeline",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#38BDF8" : "#A3A3A3";
  const strokeAccent = isColored ? "#BAE6FD" : "#D4D4D4";
  const fillFoundation = isColored ? "#082F49" : "#141414";
  const fillSurface = isColored ? "#0C4A6E" : "#1F1F1F";

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
      {/* Pipeline Stage 1: Source / Lint Stage */}
      <circle cx="7" cy="16" r="4.5" fill={fillFoundation} stroke={strokeColor} strokeWidth="1.3" />
      <path d="M5.5 16H8.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 14.5V17.5" stroke={strokeAccent} strokeWidth="1.2" strokeLinecap="round" />

      {/* Connection Arrow 1 -> 2 */}
      <path d="M11.5 16H14.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13.5 14.5L15 16L13.5 17.5" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />

      {/* Pipeline Stage 2: Compilation / Build Stage */}
      <rect x="15" y="11.5" width="9" height="9" rx="2" fill={fillSurface} stroke={strokeColor} strokeWidth="1.3" />
      {/* Internal Worker Gears / Lines */}
      <line x1="17.5" y1="14.5" x2="21.5" y2="14.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />
      <line x1="17.5" y1="17.5" x2="20" y2="17.5" stroke={strokeAccent} strokeWidth="1" strokeLinecap="round" />

      {/* Connection Arrow 2 -> 3 */}
      <path d="M24 16H26.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />

      {/* Pipeline Stage 3: Verification / Test Passed Gate */}
      <circle cx="28" cy="16" r="3.5" fill={isColored ? "#064E3B" : "#1F1F1F"} stroke={isColored ? "#34D399" : "#A3A3A3"} strokeWidth="1.2" />
      <path d="M26.8 16L27.8 17.2L29.5 15" stroke={isColored ? "#34D399" : "#D4D4D4"} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />

      {/* Quality Gate Metrics Telemetry (Top & Bottom Track) */}
      <path d="M7 8H25" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2 1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M7 24H25" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2 1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
};

