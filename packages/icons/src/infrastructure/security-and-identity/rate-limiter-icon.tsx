import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const RateLimiterIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Rate Limiter",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeTeal = isColored ? "#2DD4BF" : "#A3A3A3";
  const fillDeep = isColored ? "#134E4A" : "#262626";
  const fillFoundation = isColored ? "#042F2E" : "#141414";
  const strokeAccent = isColored ? "#99F6E4" : "#E5E5E5";
  const fillGauge = isColored ? "#0F766E" : "#1F1F1F";

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
      {/* Rate Limiting Tachometer / Meter Outer Chamber */}
      <circle cx="16" cy="16" r="12" fill={fillFoundation} stroke={strokeTeal} strokeWidth="1.5" />

      {/* Internal Quota Meter Arc Gauge */}
      <path
        d="M8.5 21.5C6.5 18 6.8 13.5 9.5 10C12.5 6.5 17.5 5.5 21.5 7.5C24.5 9.5 26 13 25.5 17C25 20 23 22.5 20.5 24"
        stroke={strokeTeal}
        strokeWidth="1.2"
        strokeDasharray="3 2"
      />

      {/* Speedometer Hub & Quota Needle (Token Refill / Throttling Needle) */}
      <circle cx="16" cy="18" r="3.5" fill={fillDeep} stroke={strokeAccent} strokeWidth="1.2" />
      <line x1="16" y1="18" x2="22" y2="10.5" stroke={strokeAccent} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="18" r="1.2" fill={strokeAccent} />

      {/* Meter Calibration Threshold Ticks */}
      <line x1="10" y1="13" x2="11.5" y2="14" stroke={strokeTeal} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="7.5" x2="16" y2="9.5" stroke={strokeAccent} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="22" y1="13" x2="20.5" y2="14" stroke={strokeTeal} strokeWidth="1.2" strokeLinecap="round" />

      {/* Controlled Burst Gate / Shutter Base */}
      <rect
        x="11"
        y="23"
        width="10"
        height="4"
        rx="1"
        fill={fillGauge}
        stroke={strokeTeal}
        strokeWidth="1.1"
      />
      <circle cx="16" cy="25" r="0.8" fill={strokeAccent} />
    </svg>
  );
};
