import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const FeatureFlagServiceIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Feature Flag Service",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#C4B5FD" : "#A3A3A3";
  const strokeAccent = isColored ? "#E0E7FF" : "#D4D4D4";
  const fillFoundation = isColored ? "#1E1B4B" : "#141414";
  const fillSurface = isColored ? "#3730A3" : "#1F1F1F";

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
      {/* Primary Toggle Switch Track (Top) */}
      <rect
        x="6"
        y="5"
        width="20"
        height="10"
        rx="5"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />
      {/* Toggle Knob in Active Enabled Position */}
      <circle
        cx="20"
        cy="10"
        r="3.5"
        fill={fillSurface}
        stroke={strokeAccent}
        strokeWidth="1.2"
      />
      <circle cx="20" cy="10" r="1.2" fill={isColored ? "#34D399" : "#FFFFFF"} />

      {/* Flag Evaluation Split Tracks (Rollout Percentages: 20% vs 80%) */}
      {/* Ingress User Request Evaluation */}
      <line x1="16" y1="15" x2="16" y2="18" stroke={strokeColor} strokeWidth="1.3" strokeLinecap="round" />

      {/* Left Variation Path (Treatment / Variation A) */}
      <path
        d="M16 18C16 21 10 21 10 23V27"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="10" cy="27" r="2" fill={fillSurface} stroke={strokeColor} strokeWidth="1" />
      <circle cx="10" cy="27" r="0.8" fill={isColored ? "#C4B5FD" : "#D4D4D4"} />

      {/* Right Variation Path (Control / Variation B) */}
      <path
        d="M16 18C16 21 22 21 22 23V27"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="22" cy="27" r="2" fill={fillSurface} stroke={strokeAccent} strokeWidth="1" />
      <circle cx="22" cy="27" r="0.8" fill={isColored ? "#34D399" : "#D4D4D4"} />

      {/* Percentage Split Hash Indicators */}
      <line x1="8" y1="19.5" x2="12" y2="19.5" stroke={strokeColor} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="20" y1="19.5" x2="24" y2="19.5" stroke={strokeAccent} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
};

